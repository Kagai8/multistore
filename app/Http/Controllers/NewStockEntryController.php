<?php

namespace App\Http\Controllers;

use App\Models\NewStockEntry;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Store;
use App\Models\Stock;
use App\Models\StockAdjustment;
use App\Models\AdjustmentReason;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf; // For PDF export
use Maatwebsite\Excel\Facades\Excel; // For Excel export
use Illuminate\Support\Str;

class NewStockEntryController extends Controller
{
    /**
     * Display a listing of the resource (Index and Lookup Data).
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));

        $query = NewStockEntry::with(['product', 'supplier', 'store', 'user']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('product', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('supplier', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        $products = Product::all(['id', 'name', 'sku']);
        $suppliers = Supplier::all(['id', 'name']);
        $warehouseStore = Store::where('type', 'warehouse')->first(['id', 'name']);

        $totalCount = NewStockEntry::count();
        $filteredCount = $query->count();

        $transform = function (NewStockEntry $entry) {
            return [
                'id' => $entry->id,
                'invoice_number' => $entry->invoice_number,
                'quantity_received' => $entry->quantity_received,
                'quantity_transferred' => $entry->quantity_transferred,
                'available_to_transfer' => $entry->available_to_transfer,
                'status' => $entry->status,
                'product_name' => $entry->product->name ?? 'N/A',
                'product_id' => $entry->product_id,
                'supplier_name' => $entry->supplier->name ?? 'N/A',
                'supplier_id' => $entry->supplier_id,
                'store_name' => $entry->store->name ?? 'N/A',
                'store_id' => $entry->store_id,
                'user_name' => $entry->user->name ?? 'N/A',
                'created_at' => $entry->created_at?->format('d M Y H:i'),
            ];
        };

        $entries = $query->latest()->paginate($perPage)->withQueryString();
        $entries->getCollection()->transform($transform);

        return Inertia::render('newstockentries/index', [
            'entries' => $entries,
            'filters' => $request->only(['search', 'perPage']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'lookupData' => compact('products', 'suppliers', 'warehouseStore'),
        ]);
    }

    /**
     * Store a newly created resource in storage (Flow 2: Record Arrival).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'store_id' => 'required|exists:stores,id',
            'quantity_received' => 'required|integer|min:1',
            'invoice_number' => 'nullable|string|max:100|unique:new_stock_entries,invoice_number',
        ]);

        NewStockEntry::create([
            'product_id' => $validated['product_id'],
            'supplier_id' => $validated['supplier_id'],
            'store_id' => $validated['store_id'],
            'quantity_received' => $validated['quantity_received'],
            'invoice_number' => $validated['invoice_number'],
            'user_id' => $request->user()->id,
            'status' => NewStockEntry::STATUS_PENDING,
            'quantity_transferred' => 0,
        ]);

        return redirect()->back()->with('flash.success', 'New stock entry recorded successfully. Status: PENDING.');
    }

    /**
     * Update the specified resource in storage.
     * ONLY allowed if status is PENDING.
     */
    public function update(Request $request, NewStockEntry $newStockEntry)
    {
        if ($newStockEntry->status !== NewStockEntry::STATUS_PENDING) {
            return back()->with('flash.error', 'Cannot edit. Stock processing or transfer has already begun.');
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'store_id' => 'required|exists:stores,id',
            'quantity_received' => 'required|integer|min:1',
            'invoice_number' => ['nullable', 'string', 'max:100', Rule::unique('new_stock_entries')->ignore($newStockEntry->id)],
        ]);

        $newStockEntry->update($validated);

        return back()->with('flash.success', 'New Stock Entry updated successfully.');
    }

    /**
     * Custom method to handle the "Confirm Count & Post to Warehouse" action.
     */
    public function post(NewStockEntry $newStockEntry)
    {
        // Guard 1: Ensure only PENDING entries can be posted
    if ($newStockEntry->status !== NewStockEntry::STATUS_PENDING) {
        return redirect()->back()->with('flash.error', 'This stock entry has already been posted or processed.');
    }

    // 🔍 LOGGING CHECK START 🔍

    // 1. Attempt to find the reason ID
    $reasonId = AdjustmentReason::where('name', 'Goods Received')->value('id');

    // 2. Log the outcome of the lookup
    if ($reasonId === null) {
        \Illuminate\Support\Facades\Log::warning('AdjustmentReason "Goods Received" not found. Using fallback ID 1.');
        $reasonId = 1; // Apply the fallback *after* the log message
    } else {
        \Illuminate\Support\Facades\Log::info("AdjustmentReason found. Using ID: {$reasonId}");
    }
    // 🔍 LOGGING CHECK END 🔍

        try {
            DB::transaction(function () use ($newStockEntry, $reasonId) {
                $storeId = $newStockEntry->store_id;
                $quantity = $newStockEntry->quantity_received;

                // A. Update Live Stock (Stock Table)
                $stock = Stock::firstOrCreate(
                    ['product_id' => $newStockEntry->product_id, 'store_id' => $storeId],
                    ['current_stock' => 0]
                );

                $oldStock = $stock->current_stock;
                $newStock = $oldStock + $quantity;
                $stock->current_stock = $newStock;
                $stock->save();

                // B. Create Audit Trail (StockAdjustment Table)
                StockAdjustment::create([
                    'product_id' => $newStockEntry->product_id,
                    'store_id' => $storeId,
                    'type' => 'in',
                    'quantity' => $quantity,
                    'old_stock' => $oldStock,
                    'new_stock' => $newStock,
                    'adjustment_reason_id' => $reasonId,
                    'user_id' => auth()->id(),
                    'notes' => "Initial receipt posting from New Stock Entry #{$newStockEntry->id} (Invoice: {$newStockEntry->invoice_number})",
                ]);

                // C. Finalize GRN Status (NewStockEntry Table)
                // 🟢 FIX 1: Must set transferred quantity to 0 as nothing has moved yet.
                $newStockEntry->quantity_transferred = 0;

                // 🟢 FIX 2: Use STATUS_COMPLETED to signify it is now posted/live.
                $newStockEntry->status = NewStockEntry::STATUS_COMPLETED;
                $newStockEntry->save();
            });

            return redirect()->back()->with('flash.success', 'Stock successfully posted to live inventory and ready for transfer.');

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("New Stock Entry Post Error: " . $e->getMessage(), ['entry_id' => $newStockEntry->id]);
            return redirect()->back()->with('flash.error', 'Failed to post stock due to a system error. Check logs.');
        }
    }

    /**
     * Remove the specified resource from storage.
     * ONLY allowed if status is PENDING.
     */
    public function destroy(NewStockEntry $newStockEntry)
    {
        if ($newStockEntry->status !== NewStockEntry::STATUS_PENDING) {
            return back()->with('flash.error', 'Cannot delete. Stock processing or transfer has already begun.');
        }

        try {
            $newStockEntry->delete();
            return redirect()->back()->with('flash.success', 'New Stock Entry record deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('flash.error', 'Failed to delete record.');
        }
    }

    // =========================================================
    // ✅ EXPORT METHODS
    // =========================================================

    /**
     * Handle single PDF export.
     */
    public function exportSinglePdf(NewStockEntry $newStockEntry)
    {
        $newStockEntry->load(['product', 'supplier', 'store', 'user']);

        $pdf = Pdf::loadView('new-stock-entries.single-pdf', compact('newStockEntry'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("receipt_{$newStockEntry->invoice_number}_{$newStockEntry->id}.pdf");
    }

    /**
     * Handle single Excel export.
     */
    public function exportSingleExcel(NewStockEntry $newStockEntry)
    {
        $newStockEntry->load(['product', 'supplier', 'store', 'user']);

        return Excel::download(
            new class($newStockEntry) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $entry;
                public function __construct($entry) { $this->entry = $entry; }

                public function collection()
                {
                    return collect([[
                        'ID' => $this->entry->id,
                        'Invoice' => $this->entry->invoice_number ?? 'N/A',
                        'Product Name' => $this->entry->product->name ?? 'N/A',
                        'Supplier' => $this->entry->supplier->name ?? 'N/A',
                        'Store' => $this->entry->store->name ?? 'N/A',
                        'Quantity Received' => $this->entry->quantity_received,
                        'Status' => Str::title($this->entry->status),
                        'Recorded By' => $this->entry->user->name ?? 'System',
                        'Recorded Date' => $this->entry->created_at?->format('d M Y H:i'),
                    ]]);
                }

                public function headings(): array
                {
                    return ['ID', 'Invoice', 'Product Name', 'Supplier', 'Store', 'Quantity Received', 'Status', 'Recorded By', 'Recorded Date'];
                }
            },
            "receipt_{$newStockEntry->id}.xlsx"
        );
    }

    /**
     * Handle bulk PDF export.
     */
    public function bulkExportPDF(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $entries = NewStockEntry::whereIn('id', $ids)->with(['product', 'supplier', 'store', 'user'])->get();

        if ($entries->isEmpty()) {
            return back()->with('flash.error', 'No entries selected for export.');
        }

        $pdf = Pdf::loadView('new-stock-entries.bulk-pdf', compact('entries'))
            ->setPaper('a4', 'portrait');

        return $pdf->download('new_stock_receipts_export.pdf');
    }

    /**
     * Handle bulk Excel export.
     */
    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $entries = NewStockEntry::whereIn('id', $ids)->with(['product', 'supplier', 'store', 'user'])->get();

        if ($entries->isEmpty()) {
            return back()->with('flash.error', 'No entries selected for export.');
        }

        return Excel::download(
            new class($entries) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $entries;
                public function __construct($entries) { $this->entries = $entries; }

                public function collection()
                {
                    return $this->entries->map(fn ($entry) => [
                        'ID' => $entry->id,
                        'Invoice' => $entry->invoice_number ?? 'N/A',
                        'Product Name' => $entry->product->name ?? 'N/A',
                        'Supplier' => $entry->supplier->name ?? 'N/A',
                        'Store' => $entry->store->name ?? 'N/A',
                        'Quantity Received' => $entry->quantity_received,
                        'Qty Transferred' => $entry->quantity_transferred,
                        'Available' => $entry->available_to_transfer,
                        'Status' => Str::title($entry->status),
                        'Recorded Date' => $entry->created_at?->format('d M Y H:i'),
                    ]);
                }

                public function headings(): array
                {
                    return ['ID', 'Invoice', 'Product Name', 'Supplier', 'Store', 'Quantity Received', 'Qty Transferred', 'Available', 'Status', 'Recorded Date'];
                }
            },
            'new_stock_receipts_export.xlsx'
        );
    }
}
