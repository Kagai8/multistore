<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Stock;
use App\Models\Store;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Models\StockAdjustment;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\AdjustmentReason;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;

class StockController extends Controller
{
    /**
     * Display a listing of the resource (The Inventory Report).
     */
    public function index(Request $request)
{
    // 1. Filtering Parameters
    $search = $request->input('search');
    $perPage = (int) ($request->input('perPage', 10));
    $dateFrom = $request->input('dateFrom');
    $dateTo = $request->input('dateTo');

    // 2. Base Query with Relationships
    // Stocks are loaded with their related product and store to display names/SKUs.
    $query = Stock::with(['product', 'store']);

    // 3. Apply Search Filter
    if ($search) {
        $query->where(function ($q) use ($search) {
            // Search by Product name or SKU
            $q->orWhereHas('product', fn($sq) => $sq->where('name', 'like', "%{$search}%")
                                                 ->orWhere('sku', 'like', "%{$search}%"));
            // Search by Store name or code
            $q->orWhereHas('store', fn($sq) => $sq->where('name', 'like', "%{$search}%")
                                               ->orWhere('code', 'like', "%{$search}%"));
        });
    }

    // 4. Apply Date Range Filter (Filter by the Stock record's last update time)
    if ($dateFrom || $dateTo) {
        // Ensure Carbon is imported if it's not already
        $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
        $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

        if ($start && $end) {
             $query->whereBetween('stocks.updated_at', [$start, $end]);
        } elseif ($start) {
            $query->where('stocks.updated_at', '>=', $start);
        } elseif ($end) {
            $query->where('stocks.updated_at', '<=', $end);
        }
    }

    // 🛑 FIX: Fetch all necessary lookup data for the Stock Correction modal
    $stores = Store::all(['id', 'name']);
    // Fetch products, combining name and SKU for better search/selection in the frontend
    $products = Product::all(['id', 'name', 'sku'])->map(function ($product) {
        $product->name = "{$product->name} ({$product->sku})"; // Format: Product Name (SKU)
        return $product;
    });
    $adjustmentReasons = AdjustmentReason::all(['id', 'name']);


    // 5. Counts
    $totalCount = Stock::count();
    $filteredCount = $query->count();

    // 6. Transformation Logic
    $transform = function (Stock $stock) {
        // Check if stock is below the reorder level to flag it
        $needsReorder = $stock->reorder_level > 0 && $stock->current_stock <= $stock->reorder_level;

        return [
            'id' => $stock->id,
            'product_id' => $stock->product_id,
            'store_id' => $stock->store_id,
            'current_stock' => $stock->current_stock,
            'reorder_level' => $stock->reorder_level,
            'reorder_quantity' => $stock->reorder_quantity,
            'needs_reorder' => $needsReorder,

            // Relationships for display in the ComplexTable
            'product' => [
                'id' => $stock->product->id,
                'name' => $stock->product->name,
                'sku' => $stock->product->sku,
            ],
            'store' => [
                'id' => $stock->store->id,
                'name' => $stock->store->name,
                'code' => $stock->store->code,
            ],
            'updated_at' => optional($stock->updated_at)->format('d M Y H:i'),
        ];
    };

    // 7. Pagination
    if ($perPage === -1) {
        $all = $query->latest('updated_at')->get()->map($transform);
        $stocks = [
            'data' => $all,
            'total' => $filteredCount,
            'per_page' => $perPage,
            'from' => $all->count() ? 1 : 0,
            'to' => $all->count(),
            'links' => [],
        ];
    } else {
        $paginator = $query->latest('updated_at')->paginate($perPage)->withQueryString();
        $paginator->getCollection()->transform($transform);
        $stocks = $paginator;
    }

    // 8. Render Inertia Page
    return Inertia::render('stocks/index', [
        'stocks' => $stocks,
        'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
        'totalCount' => $totalCount,
        'filteredCount' => $filteredCount,
        // 🛑 FIX: Pass the lookup data to the frontend under the 'lookupData' key
        'lookupData' => compact('stores', 'products', 'adjustmentReasons'),
    ]);
}

    /**
     * Update the Reorder Policy for a specific Stock record.
     */
    public function update(Request $request, Stock $stock)
    {
        // 1. Validation
        // Only reorder fields are allowed to be updated directly
        $validated = $request->validate([
            'reorder_level' => 'required|integer|min:0',
            'reorder_quantity' => 'required|integer|min:0',
        ]);

        // 2. Update the Stock model
        $stock->update([
            'reorder_level' => $validated['reorder_level'],
            'reorder_quantity' => $validated['reorder_quantity'],
        ]);

        return back()->with('success', 'Reorder policy updated successfully.');
    }

    /**
     * Delete is NOT implemented for Stock records. They are deleted automatically
     * when the linked Product or Store is deleted (cascade).
     * destroy() and bulkDelete() are omitted intentionally.
     */


    // --- Export Methods (Mimicking ProductController) ---

    /**
     * Handle single PDF export.
     */
    public function adjustStoreStock(Request $request)
{
    // 1. Validation
    $validated = $request->validate([
        'store_id' => 'required|exists:stores,id',
        'product_id' => 'required|exists:products,id',
        'adjustment_reason_id' => 'required|exists:adjustment_reasons,id',
        'quantity' => 'required|numeric|not_in:0', // Must be a non-zero number
        'notes' => 'nullable|string|max:500',
    ]);

    $user = Auth::user();

    // Determine the direction and log quantity (always positive absolute value)
    $quantityInput = $validated['quantity'];
    $quantityAdjusted = abs($quantityInput);
    $isPositiveAdjustment = $quantityInput > 0;
    $type = $isPositiveAdjustment ? 'in' : 'out';

    DB::beginTransaction();
    try {
        // 2. Find/Create Stock Record
        $stock = Stock::firstOrCreate(
            ['store_id' => $validated['store_id'], 'product_id' => $validated['product_id']],
            [
                'current_stock' => 0,
                'reorder_level' => 0,
                'reorder_quantity' => 0
            ]
        );

        $oldStock = $stock->current_stock;
        $newStock = $isPositiveAdjustment
            ? $oldStock + $quantityAdjusted
            : $oldStock - $quantityAdjusted;

        // 3. Insufficient Stock Check (Only for negative/OUT adjustments)
        if (!$isPositiveAdjustment && $oldStock < $quantityAdjusted) {
            DB::rollBack();
            // Return back with a specific error message
            return redirect()->back()->withErrors([
                'quantity' => 'Insufficient stock for this OUT adjustment. Current stock: ' . $oldStock,
            ]);
        }

        // 4. Log the Stock Adjustment (Audit Trail)
        StockAdjustment::create([
            'product_id' => $validated['product_id'],
            'store_id' => $validated['store_id'],
            'user_id' => $user->id,
            'type' => $type, // 'in' or 'out'
            'adjustment_reason_id' => $validated['adjustment_reason_id'],
            'quantity' => $quantityAdjusted, // Always the absolute value
            'old_stock' => $oldStock,
            'new_stock' => $newStock,
            'notes' => $validated['notes'],
            'related_transfer_id' => null, // Explicitly null for manual adjustment
        ]);

        // 5. Update the Live Stock
        if ($isPositiveAdjustment) {
            $stock->increment('current_stock', $quantityAdjusted);
        } else {
            $stock->decrement('current_stock', $quantityAdjusted);
        }

        DB::commit();

        // 🛑 CRITICAL FIX: Return a redirect back with a success flash message for Inertia
        return redirect()->back()
            ->with('success', 'Stock successfully adjusted and inventory levels updated.');

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error("Manual Stock Adjustment Failed: " . $e->getMessage());

        // 🛑 CRITICAL FIX: Return a redirect back with a generic error flash message
        return redirect()->back()
            ->with('error', 'Failed to process stock adjustment. Check logs for details.');
    }
}

    public function exportSinglePdf(Stock $stock)
    {
        $stock->load(['product', 'store']);

        $pdf = Pdf::loadView('stocks.stock-single-policy', compact('stock'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("stock_card_{$stock->product->sku}.pdf");
    }

    /**
     * Single Excel
     */
    public function exportSingleExcel(Stock $stock)
    {
        $stock->load(['product', 'store']);

        return Excel::download(
            new class($stock) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $stock;
                public function __construct($stock) { $this->stock = $stock; }

                public function collection()
                {
                    $status = ($this->stock->reorder_level > 0 && $this->stock->current_stock <= $this->stock->reorder_level)
                        ? 'LOW STOCK' : 'OK';

                    return collect([[
                        'ID' => $this->stock->id,
                        'Store' => $this->stock->store->name ?? 'N/A',
                        'Product' => $this->stock->product->name ?? 'N/A',
                        'SKU' => $this->stock->product->sku ?? 'N/A',
                        'Current Stock' => $this->stock->current_stock,
                        'Reorder Level' => $this->stock->reorder_level,
                        'Reorder Qty' => $this->stock->reorder_quantity,
                        'Status' => $status,
                        'Last Updated' => optional($this->stock->updated_at)->format('d M Y H:i'),
                    ]]);
                }

                public function headings(): array
                {
                    return ['ID', 'Store', 'Product', 'SKU', 'Current Stock', 'Reorder Level', 'Reorder Qty', 'Status', 'Last Updated'];
                }
            },
            "stock_card_{$stock->id}.xlsx"
        );
    }

    /**
     * Bulk PDF: Inventory Report
     */
    // 🟢 FIX: Accept $ids argument directly
    public function bulkExportPDF(Request $request)
    {
        // 🟢 FIX: Retrieve IDs from the query string request
        $ids = $request->input('ids');

        if (!$ids) {
            return back()->with('error', 'No inventory records selected.');
        }

        $idArray = explode(',', $ids);

        $stocks = Stock::whereIn('id', $idArray)
            ->with(['product', 'store'])
            ->get();

        if ($stocks->isEmpty()) {
            return back()->with('error', 'Records not found.');
        }

        $pdf = Pdf::loadView('stocks.stocks-bulk-pdf', compact('stocks'))
            ->setPaper('a4', 'portrait');

        return $pdf->download('inventory_report.pdf');
    }

    /**
     * Bulk Excel: Inventory Report
     */
    // 🟢 FIX: Change ($ids) back to (Request $request)
    public function bulkExportExcel(Request $request)
    {
        // 🟢 FIX: Retrieve IDs from the query string request
        $ids = $request->input('ids');

        if (!$ids) {
            return back()->with('error', 'No inventory records selected.');
        }

        $idArray = explode(',', $ids);

        $stocks = Stock::whereIn('id', $idArray)
            ->with(['product', 'store'])
            ->get();

        if ($stocks->isEmpty()) {
            return back()->with('error', 'Records not found.');
        }

        return Excel::download(
            new class($stocks) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $stocks;
                public function __construct($stocks) { $this->stocks = $stocks; }

                public function collection()
                {
                    return $this->stocks->map(fn ($stock) => [
                        'ID' => $stock->id,
                        'Store' => $stock->store->name ?? 'N/A',
                        'Product' => $stock->product->name ?? 'N/A',
                        'SKU' => $stock->product->sku ?? 'N/A',
                        'Current Stock' => $stock->current_stock,
                        'Reorder Level' => $stock->reorder_level,
                        'Reorder Qty' => $stock->reorder_quantity,
                        'Status' => ($stock->reorder_level > 0 && $stock->current_stock <= $stock->reorder_level) ? 'LOW STOCK' : 'OK',
                        'Last Updated' => optional($stock->updated_at)->format('d M Y H:i'),
                    ]);
                }

                public function headings(): array
                {
                    return ['ID', 'Store', 'Product', 'SKU', 'Current Stock', 'Reorder Level', 'Reorder Qty', 'Status', 'Last Updated'];
                }
            },
            'inventory_report.xlsx'
        );
    }

    // Import/Template methods are not applicable to the Stock table.
}
