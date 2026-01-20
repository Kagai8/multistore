<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\PurchaseOrderItem;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Str;

class PurchaseOrderItemController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        // Eager load everything needed for the list
        $query = PurchaseOrderItem::query()
            ->with(['purchaseOrder.supplier', 'purchaseOrder.store', 'product'])
            ->join('purchase_orders', 'purchase_order_items.purchase_order_id', '=', 'purchase_orders.id')
            ->select('purchase_order_items.*'); // Avoid ID collisions

        // 🟢 SEARCH (Across Product, PO Number, Supplier, Store)
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', fn($sq) => $sq->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"))
                  ->orWhereHas('purchaseOrder', fn($sq) => $sq->where('po_number', 'like', "%{$search}%")
                      ->orWhereHas('supplier', fn($ssq) => $ssq->where('name', 'like', "%{$search}%"))
                      ->orWhereHas('store', fn($ssq) => $ssq->where('name', 'like', "%{$search}%"))
                  );
            });
        }

        // 🟢 DATE FILTER (Based on PO Date)
        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

            if ($start && $end) {
                $query->whereBetween('purchase_orders.order_date', [$start, $end]);
            } elseif ($start) {
                $query->where('purchase_orders.order_date', '>=', $start);
            } elseif ($end) {
                $query->where('purchase_orders.order_date', '<=', $end);
            }
        }

        // 🟢 STATS (Aggregated Item Data)
        $stats = [
            // Count of items in Draft POs
            'draft_items' => PurchaseOrderItem::whereHas('purchaseOrder', fn($q) => $q->where('status', 'draft'))->count(),

            // Value of items currently On Order
            'pending_value' => PurchaseOrderItem::whereHas('purchaseOrder', fn($q) => $q->whereIn('status', ['ordered', 'partial']))->sum('total_cost'),

            // Count of items successfully received
            'received_items' => PurchaseOrderItem::whereHas('purchaseOrder', fn($q) => $q->where('status', 'received'))->count(),
        ];

        $totalCount = PurchaseOrderItem::count();
        $filteredCount = $query->count();

        // TRANSFORM
        $transform = function ($item) {
            return [
                'id' => $item->id,
                'po_date' => $item->purchaseOrder->order_date->format('Y-m-d'),
                'po_number' => $item->purchaseOrder->po_number,
                'status' => $item->purchaseOrder->status,
                'supplier' => $item->purchaseOrder->supplier->name ?? 'Unknown',
                'store' => $item->purchaseOrder->store->name ?? 'N/A',
                'product_name' => $item->product->name ?? 'Deleted',
                'sku' => $item->product->sku ?? '-',
                'quantity' => $item->quantity_ordered,
                'unit_cost' => (float) $item->unit_cost,
                'total_cost' => (float) $item->total_cost,
            ];
        };

        if ($perPage === -1) {
            $items = [
                'data' => $query->latest('purchase_orders.order_date')->get()->map($transform),
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => 1,
                'to' => $filteredCount,
                'links' => []
            ];
        } else {
            $paginator = $query->latest('purchase_orders.order_date')->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transform);
            $items = $paginator;
        }

        return Inertia::render('purchase-order-items/index', [
            'items' => $items,
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
            'stats' => $stats,
        ]);
    }

    public function bulkExportPDF(Request $request)
    {
        $ids = explode(',', $request->query('ids', ''));
        if (empty($ids)) return back()->with('flash.error', 'No items selected');

        $items = PurchaseOrderItem::with(['purchaseOrder.supplier', 'purchaseOrder.store', 'product'])
            ->whereIn('id', $ids)
            ->get();

        $company = CompanySetting::first();
        $pdf = Pdf::loadView('purchase-order-items.bulk-pdf', compact('items', 'company'))->setPaper('a4', 'landscape');

        return $pdf->download('PO_Items_Report.pdf');
    }

    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->query('ids', ''));
        if (empty($ids)) return back()->with('flash.error', 'No items selected');

        $items = PurchaseOrderItem::with(['purchaseOrder.supplier', 'purchaseOrder.store', 'product'])
            ->whereIn('id', $ids)
            ->get();

        return Excel::download(
            new class($items) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $items;
                public function __construct($items) { $this->items = $items; }
                public function collection() {
                    return $this->items->map(fn($item) => [
                        'Date' => $item->purchaseOrder->order_date->format('Y-m-d'),
                        'PO Number' => $item->purchaseOrder->po_number,
                        'Status' => Str::upper($item->purchaseOrder->status),
                        'Supplier' => $item->purchaseOrder->supplier->name ?? 'N/A',
                        'Store' => $item->purchaseOrder->store->name ?? 'N/A',
                        'Product' => $item->product->name,
                        'SKU' => $item->product->sku,
                        'Qty' => $item->quantity_ordered,
                        'Unit Cost' => $item->unit_cost,
                        'Total Cost' => $item->total_cost,
                    ]);
                }
                public function headings(): array { return ['Date', 'PO Number', 'Status', 'Supplier', 'Store', 'Product', 'SKU', 'Qty', 'Unit Cost', 'Total Cost']; }
            },
            'PO_Items_Report.xlsx'
        );
    }
}
