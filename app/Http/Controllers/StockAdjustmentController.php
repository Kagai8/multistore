<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Stock;
use App\Models\StockAdjustment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf; // Import PDF
use Maatwebsite\Excel\Facades\Excel; // Import Excel

class StockAdjustmentController extends Controller
{
    /**
     * Display a listing of Stock Adjustment history (Audit Trail).
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));

        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        // 🟢 1. GET TYPE INPUT ('in' or 'out')
        $type = $request->input('type');

        // Base query with relationships
        $query = StockAdjustment::with(['product', 'store', 'user', 'adjustmentReason']);

        // Date Filtering Logic
        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        // 🟢 2. APPLY TYPE FILTERING LOGIC
        // This makes the "Only IN" and "Only OUT" buttons work
        if ($type) {
            $query->where('type', $type);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                ->orWhereHas('store', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                ->orWhereHas('user', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                ->orWhereHas('adjustmentReason', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        $paginator = $query->latest()->paginate($perPage)->withQueryString();

        $paginator->getCollection()->transform(fn (StockAdjustment $adjustment) => [
            'id' => $adjustment->id,
            'type' => $adjustment->type,
            'quantity' => $adjustment->quantity,
            'old_stock' => $adjustment->old_stock,
            'new_stock' => $adjustment->new_stock,
            'notes' => $adjustment->notes,
            'reason' => $adjustment->adjustmentReason->name ?? 'N/A', // Added null safety
            'product_name' => $adjustment->product->name ?? 'N/A',
            'store_name' => $adjustment->store->name ?? 'N/A',
            'adjusted_by' => $adjustment->user->name ?? 'N/A',
            'created_at' => optional($adjustment->created_at)->toDateTimeString(),
        ]);

        return Inertia::render('stockadjustments/index', [
            'adjustments' => $paginator,
            // 🟢 3. INCLUDE 'type' IN RETURNED FILTERS
            // This ensures the button stays highlighted (active) after the page reloads
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo', 'type']),
        ]);
    }


    /**
     * Creates a new StockAdjustment record and updates the Stock level atomically.
     */
    public function store(Request $request)
    {
        // 1. Validation
        $validated = $request->validate([
            'stock_id' => 'required|exists:stocks,id',
            'type' => ['required', 'string', Rule::in(['in', 'out'])],
            'adjustment_reason_id' => 'required|exists:adjustment_reasons,id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:500',
        ]);

        // 2. Fetch the target Stock record (with product relation for error message)
        $stock = Stock::with('product', 'store')->findOrFail($validated['stock_id']);

        // 3. Begin Transaction
        DB::beginTransaction();

        try {
            $oldStock = $stock->current_stock;
            $adjustmentQuantity = $validated['quantity'];
            $newStock = $oldStock;

            // 4. Calculate New Stock
            if ($validated['type'] === 'in') {
                $newStock = $oldStock + $adjustmentQuantity;
            } elseif ($validated['type'] === 'out') {
                // Safeguard against negative stock
                if ($oldStock < $adjustmentQuantity) {
                     DB::rollBack();
                     return back()->with('error', 'Adjustment OUT quantity (' . $adjustmentQuantity . ') exceeds current stock (' . $oldStock . '). Transaction aborted.')->withInput();
                }
                $newStock = $oldStock - $adjustmentQuantity;
            }

            // 5. Create the Stock Adjustment Log Entry
            StockAdjustment::create([
                'product_id' => $stock->product_id,
                'store_id' => $stock->store_id,
                'user_id' => Auth::id(),
                'type' => $validated['type'],
                'adjustment_reason_id' => $validated['adjustment_reason_id'],
                'quantity' => $adjustmentQuantity,
                'old_stock' => $oldStock,
                'new_stock' => $newStock,
                'notes' => $validated['notes'],
            ]);

            // 6. Update the Stock Model
            $stock->update(['current_stock' => $newStock]);

            // 7. Commit Transaction
            DB::commit();

            $action = $validated['type'] === 'in' ? 'increased' : 'decreased';
            $message = "Stock successfully {$action} by {$adjustmentQuantity} units. New stock is {$newStock} for {$stock->product->name} at {$stock->store->name}.";

            return redirect()
                ->route('stocks.index')
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Stock adjustment failed due to a database error: ' . $e->getMessage())->withInput();
        }
    }

    // =========================================================
    // ✅ EXPORT METHODS (Auditing Focus)
    // =========================================================

    /**
     * Handle single PDF export.
     */
    public function exportSinglePdf(StockAdjustment $adjustment)
    {
        $adjustment->load(['product', 'store', 'user', 'adjustmentReason']);

        $pdf = Pdf::loadView('stock_adjustments.single-adjustment', compact('adjustment'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("adjustment_record_{$adjustment->id}.pdf");
    }

    /**
     * Handle single Excel export.
     */
    public function exportSingleExcel(StockAdjustment $adjustment)
    {
        $adjustment->load(['product', 'store', 'user', 'adjustmentReason']);

        return Excel::download(
            new class($adjustment) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $adjustment;
                public function __construct($adjustment) { $this->adjustment = $adjustment; }

                public function collection()
                {
                    return collect([[
                        'ID' => $this->adjustment->id,
                        'Date' => optional($this->adjustment->created_at)->format('d M Y H:i'),
                        'Product' => $this->adjustment->product->name ?? 'N/A',
                        'Store' => $this->adjustment->store->name ?? 'N/A',
                        'Type' => strtoupper($this->adjustment->type),
                        'Reason' => $this->adjustment->adjustmentReason->name ?? 'N/A',
                        'Quantity' => $this->adjustment->quantity,
                        'Old Stock' => $this->adjustment->old_stock,
                        'New Stock' => $this->adjustment->new_stock,
                        'Adjusted By' => $this->adjustment->user->name ?? 'System',
                        'Notes' => $this->adjustment->notes ?? 'N/A',
                    ]]);
                }

                public function headings(): array
                {
                    return ['ID', 'Date', 'Product', 'Store', 'Type', 'Reason', 'Quantity', 'Old Stock', 'New Stock', 'Adjusted By', 'Notes'];
                }
            },
            "adjustment_record_{$adjustment->id}.xlsx"
        );
    }

    /**
     * Handle bulk PDF export.
     */
    public function bulkExportPDF(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $adjustments = StockAdjustment::whereIn('id', $ids)->with(['product', 'store', 'user', 'adjustmentReason'])->get();

        if ($adjustments->isEmpty()) {
            return back()->with('error', 'No adjustment records selected for export.');
        }

        $pdf = Pdf::loadView('stock_adjustments.bulk-adjustment-pdf', compact('adjustments'))
            ->setPaper('a4', 'portrait');

        return $pdf->download('stock_adjustment_audit.pdf');
    }

    /**
     * Handle bulk Excel export.
     */
    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $adjustments = StockAdjustment::whereIn('id', $ids)->with(['product', 'store', 'user', 'adjustmentReason'])->get();

        if ($adjustments->isEmpty()) {
            return back()->with('error', 'No adjustment records selected for export.');
        }

        return Excel::download(
            new class($adjustments) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $adjustments;
                public function __construct($adjustments) { $this->adjustments = $adjustments; }

                public function collection()
                {
                    return $this->adjustments->map(fn ($adjustment) => [
                        'ID' => $adjustment->id,
                        'Date' => optional($adjustment->created_at)->format('d M Y H:i'),
                        'Product' => $adjustment->product->name ?? 'N/A',
                        'Store' => $adjustment->store->name ?? 'N/A',
                        'Type' => strtoupper($adjustment->type),
                        'Reason' => $adjustment->adjustmentReason->name ?? 'N/A',
                        'Quantity' => $adjustment->quantity,
                        'Old Stock' => $adjustment->old_stock,
                        'New Stock' => $adjustment->new_stock,
                        'Adjusted By' => $adjustment->user->name ?? 'System',
                        'Notes' => $adjustment->notes ?? 'N/A',
                    ]);
                }

                public function headings(): array
                {
                    return ['ID', 'Date', 'Product', 'Store', 'Type', 'Reason', 'Quantity', 'Old Stock', 'New Stock', 'Adjusted By', 'Notes'];
                }
            },
            'stock_adjustment_audit.xlsx'
        );
    }
}
