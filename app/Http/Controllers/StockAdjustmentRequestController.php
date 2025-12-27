<?php

namespace App\Http\Controllers;

use App\Models\StockAdjustment;
use App\Models\StockAdjustmentRequest;
use App\Models\Stock;
use App\Models\AdjustmentReason;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Str;


class StockAdjustmentRequestController extends Controller
{
    /**
     * Display a listing of the Stock Adjustment Requests.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $requests = StockAdjustmentRequest::with([
            'product:id,name,sku',
            'store:id,name',
            'requester:id,name',
            'approver:id,name',
            'reason:id,name'
        ])
            ->latest()
            ->paginate($request->get('perPage', 10));

        $requests->through(function ($request) use ($user) {
            return [
                'id' => $request->id,
                'status' => $request->status,
                'type' => $request->type,
                'quantity' => $request->quantity,
                'notes' => $request->notes,
                'requested_at' => $request->created_at?->format('Y-m-d H:i:s'),
                'approved_at' => $request->approved_at?->format('Y-m-d H:i:s'),

                'product' => [
                    'id' => $request->product->id,
                    'name' => $request->product->name,
                    'sku' => $request->product->sku,
                ],
                'store' => [
                    'id' => $request->store->id,
                    'name' => $request->store->name,
                ],
                'requester' => [
                    'name' => $request->requester->name,
                ],
                'approver' => [
                    'name' => $request->approver->name ?? 'N/A',
                ],
                'reason' => [
                    'id' => $request->reason->id,
                    'name' => $request->reason->name,
                ],

                // 🔑 Critical for frontend action conditions
                'is_requester' => $request->requested_by_id === $user->id,
            ];
        });
        $stockQuery = Stock::query();

        if (!$user->is_global_user) {
            $stockQuery->where('store_id', $user->store_id);
        }

        $productStocks = $stockQuery->select('product_id', 'store_id', 'current_stock')
            ->get()
            ->groupBy('product_id')
            ->map(function ($items) {
                return $items->pluck('current_stock', 'store_id');
            });

        return Inertia::render('stocks/stock-adjustment-request', [
            'requests' => $requests,
            'filters' => $request->only(['search', 'perPage']),
            'lookupData' => [
                'stores' => $user->is_global_user
                    ? \App\Models\Store::all(['id', 'name'])
                    : \App\Models\Store::where('id', $user->store_id)->get(['id', 'name']),
                'products' => \App\Models\Product::select('id', 'name', 'sku')->get(),
                'adjustmentReasons' => AdjustmentReason::where('is_active', true)->get(['id', 'name']),
                'productStocksArray' => $productStocks->toArray(),
            ]
        ]);

    }

    /**
     * Save as DRAFT (not submitted for approval yet).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'store_id' => 'required|exists:stores,id',
            'product_id' => 'required|exists:products,id',
            'adjustment_reason_id' => 'required|exists:adjustment_reasons,id',
            'quantity' => 'required|numeric|not_in:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        $quantityInput = $validated['quantity'];
        if ($quantityInput < 0) {
            $currentStock = Stock::where('store_id', $validated['store_id'])
                ->where('product_id', $validated['product_id'])
                ->value('current_stock') ?? 0;

            $deduction = abs($quantityInput);

            if ($deduction > $currentStock) {
                return redirect()->back()->withErrors([
                    'quantity' => "Failed: Cannot deduct {$deduction}. Current stock is only {$currentStock}."
                ]);
            }
        }
        $quantityAdjusted = abs($quantityInput);
        $type = $quantityInput > 0 ? 'in' : 'out';

        try {
            StockAdjustmentRequest::create([
                'store_id' => $validated['store_id'],
                'product_id' => $validated['product_id'],
                'requested_by_id' => $user->id,
                'status' => 'draft', // ✅ Now saved as draft
                'type' => $type,
                'quantity' => $quantityAdjusted,
                'adjustment_reason_id' => $validated['adjustment_reason_id'],
                'notes' => $validated['notes'],
            ]);

            return redirect()->back()->with('success', 'Adjustment request saved as draft.');

        } catch (\Exception $e) {
            Log::error("Stock Adjustment Draft Save Failed: " . $e->getMessage(), [
                'user_id' => $user->id,
                'input' => $request->all()
            ]);
            return redirect()->back()->with('error', 'Failed to save draft.');
        }
    }

    /**
     * Submit a DRAFT for approval.
     */
    public function submit(StockAdjustmentRequest $request)
    {
        if ($request->status !== 'draft') {
            return back()->with('error', 'Only draft requests can be submitted.');
        }

        if ($request->requested_by_id !== Auth::id()) {
            return back()->with('error', 'You can only submit your own draft requests.');
        }

        try {
            $request->update(['status' => 'pending_approval']);
            return back()->with('success', 'Request submitted for approval.');
        } catch (\Exception $e) {
            Log::error("Failed to submit request for approval: " . $e->getMessage());
            return back()->with('error', 'Failed to submit request.');
        }
    }

    /**
     * Update a DRAFT request.
     */
    public function update(Request $request, StockAdjustmentRequest $adjustmentRequest)
    {
        if ($adjustmentRequest->status !== 'draft') {
            return back()->with('error', 'Only draft requests can be edited.');
        }

        if ($adjustmentRequest->requested_by_id !== Auth::id()) {
            return back()->with('error', 'You can only edit your own draft requests.');
        }

        $validated = $request->validate([
            'store_id' => 'required|exists:stores,id',
            'product_id' => 'required|exists:products,id',
            'adjustment_reason_id' => 'required|exists:adjustment_reasons,id',
            'quantity' => 'required|numeric|not_in:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $quantityInput = $validated['quantity'];
        $quantityAdjusted = abs($quantityInput);
        $type = $quantityInput > 0 ? 'in' : 'out';

        try {
            $adjustmentRequest->update([
                'store_id' => $validated['store_id'],
                'product_id' => $validated['product_id'],
                'type' => $type,
                'quantity' => $quantityAdjusted,
                'adjustment_reason_id' => $validated['adjustment_reason_id'],
                'notes' => $validated['notes'],
            ]);

            return back()->with('success', 'Draft updated successfully.');

        } catch (\Exception $e) {
            Log::error("Failed to update draft: " . $e->getMessage());
            return back()->with('error', 'Failed to update draft.');
        }
    }

    /**
     * Delete a DRAFT request.
     */
    public function destroy($id) // 🟢 Change argument to $id
    {
        // 1. Explicitly find the record or fail (404)
        $adjustmentRequest = StockAdjustmentRequest::findOrFail($id);

        // 2. Status Check
        if ($adjustmentRequest->status !== 'draft') {
            return back()->with('error', 'Only draft requests can be deleted.');
        }

        // 3. Ownership Check
        if ($adjustmentRequest->requested_by_id !== Auth::id()) {
            return back()->with('error', 'You can only delete your own draft requests.');
        }

        try {
            // 4. Perform Delete
            $adjustmentRequest->delete();

            return back()->with('success', 'Draft deleted successfully.');

        } catch (\Exception $e) {
            Log::error("Failed to delete draft: " . $e->getMessage());
            return back()->with('error', 'Failed to delete draft.');
        }
    }

    /**
     * Approve a pending request (existing logic preserved).
     */
    public function approve(StockAdjustmentRequest $request)
    {
        if ($request->status !== 'pending_approval') {
            return back()->with('error', 'Only pending requests can be approved.');
        }

        // 🛑 Add authorization check here later (e.g., policy)
        // $this->authorize('approve', $request);

        DB::beginTransaction();
        try {
            $this->applyAdjustmentAndAudit($request, Auth::id());

            $request->update([
                'status' => 'approved',
                'approved_by_id' => Auth::id(),
                'approved_at' => Carbon::now(),
            ]);

            DB::commit();
            return back()->with('success', 'Stock Adjustment Request approved and stock levels updated.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Stock Adjustment Approval Failed: " . $e->getMessage(), [
                'request_id' => $request->id,
            ]);

            if (str_contains($e->getMessage(), 'Insufficient stock')) {
                $request->update(['status' => 'rejected', 'approved_by_id' => Auth::id(), 'approved_at' => Carbon::now()]);
                return back()->with('error', $e->getMessage());
            }

            return back()->with('error', 'Failed to approve adjustment request.');
        }
    }

    /**
     * Reject a pending request (existing logic preserved).
     */
    public function reject(StockAdjustmentRequest $request)
    {
        if ($request->status !== 'pending_approval') {
            return back()->with('error', 'Only pending requests can be rejected.');
        }

        // 🛑 Add authorization check here later
        // $this->authorize('reject', $request);

        try {
            $request->update([
                'status' => 'rejected',
                'approved_by_id' => Auth::id(),
                'approved_at' => Carbon::now(),
            ]);

            return back()->with('success', 'Stock Adjustment Request rejected.');

        } catch (\Exception $e) {
            Log::error("Stock Adjustment Rejection Failed: " . $e->getMessage());
            return back()->with('error', 'Failed to reject adjustment request.');
        }
    }

    /**
     * Apply stock change and audit (existing logic preserved).
     */
    private function applyAdjustmentAndAudit(StockAdjustmentRequest $adjustmentRequest, int $approverId)
    {
        $stock = Stock::firstOrNew(
            ['store_id' => $adjustmentRequest->store_id, 'product_id' => $adjustmentRequest->product_id],
            ['current_stock' => 0, 'reorder_level' => 0, 'reorder_quantity' => 0]
        );

        $oldStock = $stock->current_stock;
        $quantityAdjusted = $adjustmentRequest->quantity;
        $isPositiveAdjustment = $adjustmentRequest->type === 'in';
        $newStock = $isPositiveAdjustment ? $oldStock + $quantityAdjusted : $oldStock - $quantityAdjusted;

        if (!$isPositiveAdjustment && $oldStock < $quantityAdjusted) {
            throw new \Exception('Insufficient stock for this OUT adjustment. Current stock: ' . $oldStock);
        }

        StockAdjustment::create([
            'product_id' => $adjustmentRequest->product_id,
            'store_id' => $adjustmentRequest->store_id,
            'user_id' => $approverId,
            'type' => $adjustmentRequest->type,
            'adjustment_reason_id' => $adjustmentRequest->adjustment_reason_id,
            'quantity' => $quantityAdjusted,
            'old_stock' => $oldStock,
            'new_stock' => $newStock,
            'notes' => 'Approved Request ID ' . $adjustmentRequest->id . ': ' . $adjustmentRequest->notes,
            'related_transfer_id' => null,
        ]);

        if ($isPositiveAdjustment) {
            $stock->increment('current_stock', $quantityAdjusted);
        } else {
            $stock->decrement('current_stock', $quantityAdjusted);
        }
    }




    public function exportSinglePdf($id)
    {
        $adjustmentRequest = StockAdjustmentRequest::findOrFail($id);
        // Eager load relationships
        $adjustmentRequest->load(['product', 'store', 'requester', 'approver', 'reason']);

        $pdf = Pdf::loadView('stock-adjustment-requests.single-pdf', compact('adjustmentRequest'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("adjustment_request_{$adjustmentRequest->id}.pdf");
    }


    public function exportSingleExcel($id)
    {
        $adjustmentRequest = StockAdjustmentRequest::findOrFail($id);
        $adjustmentRequest->load(['product', 'store', 'requester', 'approver', 'reason']);

        return Excel::download(
            new class($adjustmentRequest) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $req;
                public function __construct($req) { $this->req = $req; }

                public function collection()
                {
                    return collect([[
                        'ID' => $this->req->id,
                        'Store' => $this->req->store->name ?? 'N/A',
                        'Product' => $this->req->product->name ?? 'N/A',
                        'Type' => Str::upper($this->req->type),
                        'Quantity' => $this->req->quantity,
                        'Reason' => $this->req->reason->name ?? 'N/A',
                        'Status' => Str::title(str_replace('_', ' ', $this->req->status)),
                        'Requested By' => $this->req->requester->name ?? 'N/A',
                        'Date Requested' => $this->req->created_at->format('d M Y H:i'),
                        'Approver' => $this->req->approver->name ?? '—',
                        'Date Approved' => $this->req->approved_at ? $this->req->approved_at->format('d M Y H:i') : '—',
                        'Notes' => $this->req->notes,
                    ]]);
                }

                public function headings(): array
                {
                    return ['ID', 'Store', 'Product', 'Type', 'Quantity', 'Reason', 'Status', 'Requested By', 'Date Requested', 'Approver', 'Date Approved', 'Notes'];
                }
            },
            "adjustment_request_{$adjustmentRequest->id}.xlsx"
        );
    }

    /**
     * Export Bulk Requests to PDF
     */
    public function bulkExportPDF(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $requests = StockAdjustmentRequest::whereIn('id', $ids)
            ->with(['product', 'store', 'requester', 'approver', 'reason'])
            ->latest()
            ->get();

        if ($requests->isEmpty()) {
            return back()->with('error', 'No requests selected for export.');
        }

        $pdf = Pdf::loadView('stock-adjustment-requests.bulk-pdf', compact('requests'))
            ->setPaper('a4', 'portrait');

        return $pdf->download('stock_adjustment_export.pdf');
    }

    /**
     * Export Bulk Requests to Excel
     */
    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $requests = StockAdjustmentRequest::whereIn('id', $ids)
            ->with(['product', 'store', 'requester', 'approver', 'reason'])
            ->latest()
            ->get();

        if ($requests->isEmpty()) {
            return back()->with('error', 'No requests selected for export.');
        }

        return Excel::download(
            new class($requests) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $requests;
                public function __construct($requests) { $this->requests = $requests; }

                public function collection()
                {
                    return $this->requests->map(fn ($req) => [
                        'ID' => $req->id,
                        'Store' => $req->store->name ?? 'N/A',
                        'Product' => $req->product->name ?? 'N/A',
                        'Type' => Str::upper($req->type),
                        'Quantity' => $req->quantity,
                        'Reason' => $req->reason->name ?? 'N/A',
                        'Status' => Str::title(str_replace('_', ' ', $req->status)),
                        'Requested By' => $req->requester->name ?? 'N/A',
                        'Date Requested' => $req->created_at->format('d M Y H:i'),
                        'Approver' => $req->approver->name ?? '—',
                    ]);
                }

                public function headings(): array
                {
                    return ['ID', 'Store', 'Product', 'Type', 'Quantity', 'Reason', 'Status', 'Requested By', 'Date Requested', 'Approver'];
                }
            },
            'stock_adjustment_export.xlsx'
        );
    }
}
