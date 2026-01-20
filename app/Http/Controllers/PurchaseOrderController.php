<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Store;
use App\Models\CompanySetting;
use App\Models\Stock;
use App\Models\StockAdjustment;
use App\Models\AdjustmentReason;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        $query = PurchaseOrder::with([
            'supplier:id,name,email',
            'store:id,name',
            'user:id,name',
            'items.product',
            'approvedBy:id,name',
            'receivedBy:id,name'
        ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%")
                  ->orWhereHas('supplier', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('store', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('user', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

            if ($start && $end) {
                $query->whereBetween('order_date', [$start, $end]);
            } elseif ($start) {
                $query->whereDate('order_date', '>=', $start);
            } elseif ($end) {
                $query->whereDate('order_date', '<=', $end);
            }
        }

        $stats = [
            'draft_count' => PurchaseOrder::where('status', 'draft')->count(),
            'pending_value' => PurchaseOrder::whereIn('status', ['ordered', 'partial'])->sum('total_amount'),
            'received_count' => PurchaseOrder::where('status', 'received')->count(),
        ];

        $suppliers = Supplier::select('id', 'name')->orderBy('name')->get();
        $stores = Store::withoutGlobalScopes()->select('id', 'name')->get();
        $products = Product::select('id', 'name', 'sku', 'buying_price')->orderBy('name')->get();

        $totalCount = PurchaseOrder::count();
        $filteredCount = $query->count();

        $transform = function (PurchaseOrder $po) {
            return [
                'id' => $po->id,
                'po_number' => $po->po_number,
                'supplier_name' => $po->supplier->name ?? 'Unknown',
                'store_name' => $po->store->name ?? 'N/A',
                'store_id' => $po->store_id,
                'status' => $po->status,
                'total_amount' => (float) $po->total_amount,
                'order_date' => $po->order_date->format('Y-m-d'),
                'expected_date' => $po->expected_delivery_date ? $po->expected_delivery_date->format('Y-m-d') : '-',
                'created_by' => $po->user->name ?? 'System',
                'approved_by' => $po->approvedBy->name ?? null,
                'received_by' => $po->receivedBy->name ?? null,
                'items_count' => $po->items->count(),
                'items' => $po->items->map(fn($item) => [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name ?? 'Deleted',
                    'sku' => $item->product->sku ?? '-',
                    'qty' => $item->quantity_ordered,
                    'cost' => $item->unit_cost,
                    'total' => $item->total_cost
                ]),
            ];
        };

        if ($perPage === -1) {
            $all = $query->latest('created_at')->get()->map($transform);
            $purchaseOrders = [
                'data' => $all, 'total' => $filteredCount, 'per_page' => $perPage, 'from' => 1, 'to' => $all->count(), 'links' => []
            ];
        } else {
            $paginator = $query->latest('created_at')->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transform);
            $purchaseOrders = $paginator;
        }

        return Inertia::render('purchase-orders/index', [
            'purchaseOrders' => $purchaseOrders,
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'stats' => $stats,
            'lookupData' => compact('suppliers', 'stores', 'products'),
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'supplier_id' => 'required|exists:suppliers,id',
                'store_id' => 'required|exists:stores,id',
                'order_date' => 'required|date',
                'expected_delivery_date' => 'nullable|date|after_or_equal:order_date',
                'notes' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.cost' => 'required|numeric|min:0',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        }

        DB::beginTransaction();
        try {
            $year = date('Y');
            $count = PurchaseOrder::whereYear('created_at', $year)->count() + 1;
            $poNumber = 'PO-' . $year . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);

            $grandTotal = 0;
            $itemsToCreate = [];

            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['cost'];
                $grandTotal += $lineTotal;

                $itemsToCreate[] = new PurchaseOrderItem([
                    'product_id' => $item['product_id'],
                    'quantity_ordered' => $item['quantity'],
                    'quantity_received' => 0,
                    'unit_cost' => $item['cost'],
                    'total_cost' => $lineTotal,
                ]);
            }

            // 🟢 CRITICAL: Bypassing Global Scope to avoid "Undefined Column" error
            $po = PurchaseOrder::withoutGlobalScope(\App\Models\Scopes\StoreScope::class)->create([
                'po_number' => $poNumber,
                'supplier_id' => $validated['supplier_id'],
                'store_id' => $validated['store_id'],
                'user_id' => Auth::id(), // Ensure this exists in migration
                'requested_by_id' => Auth::id(),
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'],
                'total_amount' => $grandTotal,
                'status' => 'draft',
                'notes' => $validated['notes'],
            ]);

            $po->items()->saveMany($itemsToCreate);

            DB::commit();

            try {
                $this->notifyStore(
                    $po->store_id,
                    "New PO Request",
                    "PO #{$poNumber} created by " . Auth::user()->name . ". Status: Draft.",
                    route('purchase-orders.index')
                );
            } catch (\Exception $e) {
                // Ignore notification failure
            }

            return redirect()->back()->with('flash.success', "Purchase Order {$poNumber} created (Draft).");

        } catch (\Exception $e) {
            DB::rollBack();
            // 🛑 NUCLEAR OPTION: FORCE DISPLAY OF ERROR
            //die("<h1>FATAL DATABASE ERROR</h1><pre>" . $e->getMessage() . "</pre>");
        }
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'draft') {
            return back()->with('flash.error', 'Only draft purchase orders can be edited.');
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'store_id' => 'required|exists:stores,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.cost' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $grandTotal = 0;
            $itemsToCreate = [];

            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['cost'];
                $grandTotal += $lineTotal;

                $itemsToCreate[] = new PurchaseOrderItem([
                    'product_id' => $item['product_id'],
                    'quantity_ordered' => $item['quantity'],
                    'quantity_received' => 0,
                    'unit_cost' => $item['cost'],
                    'total_cost' => $lineTotal,
                ]);
            }

            $purchaseOrder->update([
                'supplier_id' => $validated['supplier_id'],
                'store_id' => $validated['store_id'],
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'],
                'total_amount' => $grandTotal,
                'notes' => $validated['notes'],
            ]);

            $purchaseOrder->items()->delete();
            $purchaseOrder->items()->saveMany($itemsToCreate);

            DB::commit();
            return back()->with('flash.success', 'Purchase Order updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('flash.error', 'Failed to update PO: ' . $e->getMessage());
        }
    }

    public function markOrdered(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'draft') {
            return back()->with('flash.error', 'Only drafts can be marked as ordered.');
        }

        try {
            $purchaseOrder->update([
                'status' => 'ordered',
                'approved_by_id' => Auth::id(),
                'approved_at' => now(),
            ]);

            $this->notifyStore(
                $purchaseOrder->store_id,
                "PO Sent to Supplier",
                "PO #{$purchaseOrder->po_number} is now Ordered.",
                route('purchase-orders.index')
            );

            return back()->with('flash.success', 'PO marked as Ordered.');
        } catch (\Exception $e) {
            return back()->with('flash.error', 'Action failed: ' . $e->getMessage());
        }
    }

    public function markReceived(PurchaseOrder $purchaseOrder)
    {
        if (!in_array($purchaseOrder->status, ['ordered', 'partial'])) {
            return back()->with('flash.error', 'Only ordered POs can be received.');
        }

        $reason = AdjustmentReason::firstOrCreate(['name' => 'PO Receive'], ['name' => 'PO Receive', 'type' => 'in']);

        DB::beginTransaction();
        try {
            $purchaseOrder->load('items');

            foreach ($purchaseOrder->items as $item) {
                if ($item->quantity_received >= $item->quantity_ordered) continue;

                $qtyToReceive = $item->quantity_ordered - $item->quantity_received;

                $stock = Stock::firstOrNew(
                    ['store_id' => $purchaseOrder->store_id, 'product_id' => $item->product_id],
                    ['current_stock' => 0]
                );

                $oldStock = $stock->current_stock;
                $stock->current_stock += $qtyToReceive;
                $stock->save();

                StockAdjustment::create([
                    'product_id' => $item->product_id,
                    'store_id' => $purchaseOrder->store_id,
                    'type' => 'in',
                    'quantity' => $qtyToReceive,
                    'old_stock' => $oldStock,
                    'new_stock' => $stock->current_stock,
                    'notes' => "PO Receive #{$purchaseOrder->po_number}",
                    'adjustment_reason_id' => $reason->id,
                    'user_id' => Auth::id(),
                ]);

                $item->update(['quantity_received' => $item->quantity_ordered]);
            }

            $purchaseOrder->update([
                'status' => 'received',
                'received_by_id' => Auth::id(),
                'received_at' => now(),
            ]);

            DB::commit();

            $this->notifyStore(
                $purchaseOrder->store_id,
                "Stock Received",
                "PO #{$purchaseOrder->po_number} received in full.",
                route('stocks.index')
            );

            return back()->with('flash.success', 'Goods received.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('flash.error', 'Failed to receive goods: ' . $e->getMessage());
        }
    }

    public function cancel(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status === 'received') {
            return back()->with('flash.error', 'Cannot cancel a received order.');
        }

        $purchaseOrder->update([
            'status' => 'cancelled',
            'cancelled_by_id' => Auth::id(),
            'cancelled_at' => now(),
        ]);

        $this->notifyStore(
            $purchaseOrder->store_id,
            "PO Cancelled",
            "PO #{$purchaseOrder->po_number} was cancelled.",
            route('purchase-orders.index')
        );

        return back()->with('flash.success', 'Purchase Order cancelled.');
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'draft') {
            return back()->with('flash.error', 'Only drafts can be deleted.');
        }

        $purchaseOrder->items()->delete();
        $purchaseOrder->delete();

        return back()->with('flash.success', 'Draft PO deleted.');
    }

    public function exportSinglePdf(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['supplier', 'store', 'user', 'items.product', 'approvedBy', 'receivedBy']);
        $company = CompanySetting::where('is_default', true)->first() ?? CompanySetting::first();
        $pdf = Pdf::loadView('purchase-orders.single-pdf', compact('purchaseOrder', 'company'))->setPaper('a4', 'portrait');
        return $pdf->download("PO_{$purchaseOrder->po_number}.pdf");
    }

    public function exportSingleExcel(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['items.product']);
        return Excel::download(
            new class($purchaseOrder) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
                protected $po;
                public function __construct($po) { $this->po = $po; }
                public function collection() {
                    return $this->po->items->map(fn($item) => [
                        'PO Number' => $this->po->po_number,
                        'Product' => $item->product->name,
                        'SKU' => $item->product->sku,
                        'Quantity' => $item->quantity_ordered,
                        'Unit Cost' => $item->unit_cost,
                        'Line Total' => $item->total_cost,
                    ]);
                }
                public function headings(): array { return ['PO Number', 'Product', 'SKU', 'Quantity', 'Unit Cost', 'Total']; }
            },
            "PO_{$purchaseOrder->po_number}.xlsx"
        );
    }

    public function bulkExportPDF($ids)
    {
        $idArray = explode(',', $ids);
        $purchaseOrders = PurchaseOrder::whereIn('id', $idArray)->with(['supplier', 'store'])->latest('order_date')->get();
        if ($purchaseOrders->isEmpty()) return back()->with('flash.error', 'No records selected.');
        $company = CompanySetting::first();
        $pdf = Pdf::loadView('purchase-orders.bulk-pdf', compact('purchaseOrders', 'company'))->setPaper('a4', 'landscape');
        return $pdf->download('Purchase_Orders_Log.pdf');
    }

    public function bulkExportExcel($ids)
    {
        $idArray = explode(',', $ids);
        $purchaseOrders = PurchaseOrder::whereIn('id', $idArray)->with(['supplier', 'store', 'user'])->latest('order_date')->get();
        if ($purchaseOrders->isEmpty()) return back()->with('flash.error', 'No records selected.');
        return Excel::download(
            new class($purchaseOrders) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $pos;
                public function __construct($pos) { $this->pos = $pos; }
                public function collection() {
                    return $this->pos->map(fn($po) => [
                        'PO Number' => $po->po_number,
                        'Date' => $po->order_date->format('Y-m-d'),
                        'Supplier' => $po->supplier->name ?? 'N/A',
                        'Store' => $po->store->name ?? 'N/A',
                        'Total Amount' => $po->total_amount,
                        'Status' => Str::title($po->status),
                        'Created By' => $po->user->name,
                    ]);
                }
                public function headings(): array { return ['PO Number', 'Date', 'Supplier', 'Store', 'Total Amount', 'Status', 'Created By']; }
            },
            'Purchase_Orders_Log.xlsx'
        );
    }
}
