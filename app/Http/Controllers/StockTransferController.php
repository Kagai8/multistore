<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Store;
use App\Models\Product;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\StockTransfer;
use App\Models\StockAdjustment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\Rule;
use App\Models\AdjustmentReason;
use App\Models\StockTransferItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\Stock; // Assuming Stock model exists for live stock updates


class StockTransferController extends Controller
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

        $query = StockTransfer::with([
            'sourceStore',
            'destinationStore',
            'user',
            'items.product',
            'approvedBy',
            'receivedBy',
            'assignedToUser',
        ]);

        // Apply Search Filter (unchanged)
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                ->orWhere('status', 'like', "%{$search}%")
                ->orWhereHas('sourceStore', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                ->orWhereHas('destinationStore', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        // Apply Date Range Filter (unchanged)
        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

            if ($start && $end) {
                $query->whereBetween('transfer_date', [$start, $end]);
            } elseif ($start) {
                $query->whereDate('transfer_date', '>=', $start);
            } elseif ($end) {
                $query->whereDate('transfer_date', '<=', $end);
            }
        }

        // 🔑 EXISTING LOOKUP DATA (unchanged)
        $stores = Store::withoutGlobalScopes()->get(['id', 'name']);
        $products = Product::all(['id', 'name', 'sku']);
        $productStocks = Stock::select('product_id', 'store_id', 'current_stock')
            ->get()
            ->groupBy('product_id')
            ->map(fn($stocks) => $stocks->keyBy('store_id')->map(fn($stock) => (int)$stock->current_stock));
        $productStocksArray = $productStocks->toArray();

        // 🔑 NEW: Delivery Lookup Data
        $deliveryUsers = \App\Models\User::whereHas('roles', function ($query) {
        $query->where('name', 'delivery');
        })->get(['id', 'name']);
        $deliveryTypes = [
            ['id' => 'internal', 'name' => 'Internal Delivery (Our Vehicle)'],
            ['id' => 'external', 'name' => 'External Carrier (e.g., Uber, DHL)'],
        ];

        $totalCount = StockTransfer::count();
        $filteredCount = $query->count();

        // 🔑 TRANSFORM (unchanged)
        $transform = function (StockTransfer $transfer) {
            return [
                'id' => $transfer->id,
                'source_store' => $transfer->sourceStore?->name ?? 'N/A',
                'destination_store' => $transfer->destinationStore?->name ?? 'N/A',
                'source_store_id' => $transfer->source_store_id,
                'destination_store_id' => $transfer->destination_store_id,
                'reference' => $transfer->reference,
                'status' => $transfer->status,
                'user_name' => $transfer->user?->name ?? 'N/A',
                'transfer_date' => $transfer->transfer_date?->format('Y-m-d'),
                'created_at' => $transfer->created_at?->format('d M Y H:i'),
                'approved_status' => $transfer->approved_status ?? 'pending',
                'approved_by' => $transfer->approvedBy?->name,
                'approved_at' => $transfer->approved_at?->format('Y-m-d'),
                'received_by' => $transfer->receivedBy?->name,
                'received_at' => $transfer->received_at?->format('Y-m-d'),
                'delivery_type' => $transfer->delivery_type,
                'assigned_to_user_name' => $transfer->assignedToUser?->name,
                'assigned_to_user_id' => $transfer->assigned_to_user_id,
                'carrier_name' => $transfer->carrier_name,
                'contact_number' => $transfer->contact_number,
                'tracking_reference' => $transfer->tracking_reference,
                'delivery_time' => $transfer->delivery_time?->format('Y-m-d'),
                'items' => $transfer->items->map(fn($item) => [
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'product_name' => $item->product?->name ?? 'Deleted Product',
                    'product_sku' => $item->product?->sku ?? 'N/A',
                ])->toArray(),
            ];
        };

        // 🔑 FETCH DATA (unchanged)
        if ($perPage === -1) {
            $all = $query->latest('created_at')->get()->map($transform);
            $transfers = [
                'data' => $all,
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => $all->count() ? 1 : 0,
                'to' => $all->count(),
                'links' => []
            ];
        } else {
            $paginator = $query->latest('created_at')->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transform);
            $transfers = $paginator;
        }

        // 🔑 DEBUG LOG (unchanged)
        if (!empty($transfers['data'] ?? $transfers->items())) {
            $firstTransfer = ($perPage === -1)
                ? ($transfers['data'][0] ?? null)
                : ($transfers->items()[0] ?? null);

            if ($firstTransfer) {
                \Log::info('✅ TRANSFER AUDIT DATA SENT TO FRONTEND (First Record)', [
                    'id' => $firstTransfer['id'],
                    'reference' => $firstTransfer['reference'],
                    'status' => $firstTransfer['status'],
                    'approved_status' => $firstTransfer['approved_status'],
                    'approved_by' => $firstTransfer['approved_by'] ?? 'NULL',
                    'approved_at' => $firstTransfer['approved_at'] ?? 'NULL',
                    'received_by' => $firstTransfer['received_by'] ?? 'NULL',
                    'received_at' => $firstTransfer['received_at'] ?? 'NULL',
                    'user_name' => $firstTransfer['user_name'],
                ]);
            }
        }

        return Inertia::render('stocktransfers/index', [
            'transfers' => $transfers,
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'lookupData' => compact(
                'stores',
                'products',
                'productStocksArray',
                'deliveryUsers',   // 🔑 NEW
                'deliveryTypes'    // 🔑 NEW
            ),
        ]);
    }

    /**
     * Store a newly created resource in storage (Status: Draft, Approved: Pending).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'source_store_id' => 'required|exists:stores,id|different:destination_store_id',
            'destination_store_id' => 'required|exists:stores,id',
            'transfer_date' => 'required|date',
            //'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            $nextId = StockTransfer::max('id') + 1;
            $reference = 'TR-' . str_pad($nextId, 6, '0', STR_PAD_LEFT);

            $transfer = StockTransfer::create([
                'source_store_id' => $validated['source_store_id'],
                'destination_store_id' => $validated['destination_store_id'],
                'transfer_date' => $validated['transfer_date'],
                'reference' => $reference,
                'notes' => $validated['notes'],
                'user_id' => Auth::id(),
                'status' => 'draft',             // Primary Status
                'approved_status' => 'pending',  // Secondary Status
            ]);

            $itemsToAttach = [];
            foreach ($validated['items'] as $item) {
                $itemsToAttach[] = new StockTransferItem($item);
            }
            $transfer->items()->saveMany($itemsToAttach);

            DB::commit();
            Log::info("Transfer #{$transfer->id} created in DRAFT state.", ['user_id' => Auth::id()]);
            return redirect()->route('stock-transfers.index')->with('flash.success', 'Stock Transfer request created in DRAFT status.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Stock Transfer Creation Failed: " . $e->getMessage());
            return back()->with('flash.error', 'Failed to create transfer: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, StockTransfer $stockTransfer)
    {
        // 🛑 FIX: Only DRAFT transfers can be updated.
        if ($stockTransfer->status !== 'draft') {
            return back()->with('flash.error', "Cannot update a transfer in the {$stockTransfer->status} status. Only DRAFT transfers are editable.");
        }

        $validated = $request->validate([
            'source_store_id' => ['required', 'exists:stores,id', Rule::notIn([$request->destination_store_id])],
            'destination_store_id' => 'required|exists:stores,id',
            'transfer_date' => 'required|date',
            //'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            // Status remains DRAFT, but reset approval status on edit
            $stockTransfer->update(array_merge($validated, [
                'approved_status' => 'pending',
                'reference' => $stockTransfer->reference, // ✅ Keep original
            ]));
            $stockTransfer->items()->delete();

            $itemsToAttach = [];
            foreach ($validated['items'] as $item) {
                $itemsToAttach[] = new StockTransferItem($item);
            }
            $stockTransfer->items()->saveMany($itemsToAttach);

            DB::commit();
            return back()->with('flash.success', 'Stock Transfer updated successfully. Approval status reset to pending.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Stock Transfer Update Failed: " . $e->getMessage());
            return back()->with('flash.error', 'Failed to update transfer: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StockTransfer $stockTransfer)
    {
        // 🛑 FIX: Cannot delete if SENT or RECEIVED (irrespective of approval status)
        if (in_array($stockTransfer->status, ['sent', 'received'])) {
            return back()->with('flash.error', "Cannot delete a transfer in the {$stockTransfer->status} status.");
        }

        $stockTransfer->delete();

        return back()->with('flash.success', 'Stock Transfer deleted successfully.');
    }

    // --- 🟢 NEW WORKFLOW ACTIONS ---

    /**
     * API endpoint to change the transfer status from DRAFT to INITIATED.
     * Locks the transfer for review.
     */
    public final function initiate(StockTransfer $stockTransfer)
    {
        Log::info('--- Transfer INITIATE Attempt ---', ['transfer_id' => $stockTransfer->id, 'current_status' => $stockTransfer->status, 'user_id' => Auth::id()]);

        if ($stockTransfer->status !== 'draft') {
            Log::warning('Initiate Rejected: Status is not DRAFT.', ['transfer_id' => $stockTransfer->id]);
            return back()->with('flash.error', 'Only DRAFT transfers can be initiated for review.');
        }

        DB::beginTransaction();
        try {
            // Primary status goes from 'draft' to 'initiated', approved_status remains 'pending'
            $stockTransfer->update(['status' => 'initiated']);

            DB::commit();
            Log::info("Transfer #{$stockTransfer->id} successfully initiated for review.", ['user_id' => Auth::id()]);
            return back()->with('flash.success', "Transfer #{$stockTransfer->id} submitted for review (Status: INITIATED).");

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Stock Transfer Initiate Failed: " . $e->getMessage(), ['file' => $e->getFile(), 'line' => $e->getLine()]);
            return back()->with('flash.error', 'Failed to initiate transfer: ' . $e->getMessage());
        }
    }


    /**
     * API endpoint to ACCEPT/APPROVE the transfer.
     */
    public final function approve(StockTransfer $stockTransfer)
    {
        Log::info('--- Transfer APPROVE/ACCEPT Attempt ---', [
            'transfer_id' => $stockTransfer->id,
            'current_status' => $stockTransfer->status,
            'current_approved_status' => $stockTransfer->approved_status,
            'user_id' => Auth::id()
        ]);

        // 🛑 FIX: Must be INITIATED and PENDING
        if ($stockTransfer->status !== 'initiated' || $stockTransfer->approved_status !== 'pending') {
            Log::warning('Approve Rejected: Not in INITIATED/PENDING state.', ['transfer_id' => $stockTransfer->id]);
            return back()->with('flash.error', 'This transfer cannot be approved in its current state. It must be INITIATED and PENDING.');
        }

        DB::beginTransaction();
        try {
            $stockTransfer->update([
                'status' => 'accepted',        // 🟢 PRIMARY: Flow control moves to ACCEPTED (ready for send)
                'approved_status' => 'approved', // 🟢 SECONDARY: Audit control is APPROVED
                'approved_by_id' => Auth::id(),
                'approved_at' => now(),
            ]);

            DB::commit();
            Log::info("Transfer #{$stockTransfer->id} accepted/approved. Ready to send.", ['user_id' => Auth::id()]);
            return back()->with('flash.success', "Transfer #{$stockTransfer->id} accepted successfully! Ready for dispatch.");

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Stock Transfer Acceptance/Approval Failed: " . $e->getMessage(), ['file' => $e->getFile(), 'line' => $e->getLine()]);
            return back()->with('flash.error', 'Failed to accept transfer: ' . $e->getMessage());
        }
    }

    /**
     * API endpoint to DENY/REJECT the transfer.
     */
    public final function reject(StockTransfer $stockTransfer)
    {
        Log::info('--- Transfer REJECT/DENY Attempt ---', [
            'transfer_id' => $stockTransfer->id,
            'current_status' => $stockTransfer->status,
            'current_approved_status' => $stockTransfer->approved_status,
            'user_id' => Auth::id()
        ]);

        // 🛑 FIX: Must be INITIATED and PENDING
        if ($stockTransfer->status !== 'initiated' || $stockTransfer->approved_status !== 'pending') {
            Log::warning('Reject Rejected: Not in INITIATED/PENDING state.', ['transfer_id' => $stockTransfer->id]);
            return back()->with('flash.error', 'This transfer cannot be denied in its current state. It must be INITIATED and PENDING.');
        }

        DB::beginTransaction();
        try {
            $stockTransfer->update([
                'status' => 'denied',        // 🟢 PRIMARY: Flow control moves to DENIED (terminal state)
                'approved_status' => 'rejected', // 🟢 SECONDARY: Audit control is REJECTED
                'approved_by_id' => Auth::id(),
                'approved_at' => now(),
                // No need to revert to draft, DENIED is a final state unless cloned
            ]);

            DB::commit();
            Log::info("Transfer #{$stockTransfer->id} denied/rejected. Flow stopped.", ['user_id' => Auth::id()]);
            return back()->with('flash.success', "Transfer #{$stockTransfer->id} denied. Transfer flow stopped.");

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Stock Transfer Denial/Rejection Failed: " . $e->getMessage(), ['file' => $e->getFile(), 'line' => $e->getLine()]);
            return back()->with('flash.error', 'Failed to deny transfer: ' . $e->getMessage());
        }
    }


    /**
     * API endpoint to change the transfer status to 'sent' and commit stock OUT from source.
     */
    /**
 * API endpoint to change the transfer status to 'sent', commit stock OUT from source,
 * and record delivery information.
 */
public final function send(Request $request, StockTransfer $stockTransfer)
{
    Log::info('--- Stock Transfer SEND Attempt ---', [
        'transfer_id' => $stockTransfer->id,
        'current_status' => $stockTransfer->status,
        'user_id' => Auth::id(),
    ]);

    // Pre-checks (Unchanged)
    if ($stockTransfer->status !== 'accepted') {
        Log::warning('Send Rejected: Primary status is not ACCEPTED.', ['transfer_id' => $stockTransfer->id]);
        return back()->with('flash.error', 'This transfer must be ACCEPTED before it can be sent.');
    }
    if ($stockTransfer->approved_status !== 'approved') {
        Log::warning('Send Rejected: Secondary status is not APPROVED.', ['transfer_id' => $stockTransfer->id]);
        return back()->with('flash.error', 'Internal error: Transfer flow status ACCEPTED but audit status not APPROVED.');
    }

    // 🟢 NEW: Validate and extract delivery data
    $deliveryType = $request->input('delivery_type');
    $assignedToUserId = $request->input('assigned_to_user_id');
    $carrierName = $request->input('carrier_name');
    $contactNumber = $request->input('contact_number');
    $trackingReference = $request->input('tracking_reference');
    $deliveryTime = $request->input('delivery_time');

    // 🟢 Validation: delivery_type is required
    if (!in_array($deliveryType, ['internal', 'external'])) {
        Log::warning('Send Rejected: Invalid delivery type.', ['transfer_id' => $stockTransfer->id, 'delivery_type' => $deliveryType]);
        return back()->with('flash.error', 'Please select a valid delivery method.');
    }

    // 🟢 Validation: Internal requires assigned driver
    if ($deliveryType === 'internal' && empty($assignedToUserId)) {
        Log::warning('Send Rejected: Internal delivery missing driver.', ['transfer_id' => $stockTransfer->id]);
        return back()->with('flash.error', 'Please assign a delivery staff member for internal delivery.');
    }

    // 🟢 Validation: External requires carrier name
    if ($deliveryType === 'external' && empty($carrierName)) {
        Log::warning('Send Rejected: External delivery missing carrier.', ['transfer_id' => $stockTransfer->id]);
        return back()->with('flash.error', 'Please enter the carrier name for external delivery.');
    }

    // 🟢 Optional: Validate assigned user exists and has delivery role (optional but recommended)
    if ($deliveryType === 'internal' && $assignedToUserId) {
        $deliveryUser = \App\Models\User::find($assignedToUserId);
        if (!$deliveryUser || !$deliveryUser->hasRole('delivery')) {
            Log::warning('Send Rejected: Invalid or unauthorized delivery user.', [
                'transfer_id' => $stockTransfer->id,
                'user_id' => $assignedToUserId,
            ]);
            return back()->with('flash.error', 'Selected driver is not authorized for deliveries.');
        }
    }

    $stockTransfer->load('items.product');
    $user = Auth::user();

    $transferReason = \App\Models\AdjustmentReason::firstWhere('name', 'Transfer');
    $adjustmentReasonId = $transferReason?->id;

    if (!$adjustmentReasonId) {
        Log::error('Transfer reason "Transfer" not found.');
        return back()->with('flash.error', 'Critical: Stock Adjustment Reason "Transfer" not found. Cannot proceed.');
    }

    DB::beginTransaction();
    try {
        Log::debug('Checkpoint 2: Entering DB Transaction.');

        // 1. Commit Stock Adjustment OUT for the Source Store and Update Stock
        foreach ($stockTransfer->items as $item) {
            $sourceStock = \App\Models\Stock::where('store_id', $stockTransfer->source_store_id)
                ->where('product_id', $item->product_id)
                ->first();

            if (!$sourceStock) {
                Log::warning('Stock Row Missing at Source', [
                    'product_id' => $item->product_id,
                    'store_id' => $stockTransfer->source_store_id
                ]);
                $sourceStock = new \App\Models\Stock(['current_stock' => 0]);
            }

            Log::debug('Stock Check', [
                'product_id' => $item->product_id,
                'source_store' => $stockTransfer->source_store_id,
                'available' => $sourceStock->current_stock,
                'requested' => $item->quantity,
            ]);

            if ($sourceStock->current_stock < $item->quantity) {
                DB::rollBack();
                Log::error('Send Failed: Insufficient stock (Rolled Back).', [
                    'product_id' => $item->product_id,
                    'available' => $sourceStock->current_stock,
                ]);
                return back()->with('flash.error', "Insufficient stock for product {$item->product->sku} ({$item->product->name}) at source store. Transfer cancelled.");
            }

            \App\Models\StockAdjustment::create([
                'product_id' => $item->product_id,
                'store_id' => $stockTransfer->source_store_id,
                'type' => 'out',
                'quantity' => $item->quantity,
                'old_stock' => $sourceStock->current_stock,
                'new_stock' => $sourceStock->current_stock - $item->quantity,
                'notes' => "Stock Transfer OUT (Reference: {$stockTransfer->reference})",
                'adjustment_reason_id' => $adjustmentReasonId,
                'user_id' => $user->id,
                'related_transfer_id' => $stockTransfer->id,
            ]);

            $sourceStock->decrement('current_stock', $item->quantity);
        }

        // 2. 🟢 UPDATE TRANSFER WITH DELIVERY INFO AND STATUS
        $stockTransfer->update([
            'status' => 'sent',
            'delivery_type' => $deliveryType,
            'assigned_to_user_id' => $deliveryType === 'internal' ? $assignedToUserId : null,
            'carrier_name' => $deliveryType === 'external' ? $carrierName : null,
            'contact_number' => $deliveryType === 'external' ? $contactNumber : null,
            'tracking_reference' => $deliveryType === 'external' ? $trackingReference : null,
            'delivery_time' => $deliveryTime ? \Carbon\Carbon::parse($deliveryTime) : null,
        ]);

        DB::commit();
        Log::info('Transfer SENT successfully with delivery info.', [
            'transfer_id' => $stockTransfer->id,
            'delivery_type' => $deliveryType,
            'user_id' => Auth::id(),
        ]);
        return back()->with('flash.success', "Transfer #{$stockTransfer->id} marked as SENT. Stock has been deducted from the source store.");

    } catch (\Throwable $e) {
        DB::rollBack();
        Log::error("Stock Transfer Send Failed: " . $e->getMessage(), [
            'transfer_id' => $stockTransfer->id,
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);
        return back()->with('flash.error', 'Failed to mark transfer as sent: ' . $e->getMessage());
    }
}


    /**
 * API endpoint to change the transfer status to 'received' and commit stock IN to destination.
 */
    public final function receive(StockTransfer $stockTransfer)
    {
        // --- Logging Start ---
        Log::info('--- Stock Transfer RECEIVE Attempt ---', [
            'transfer_id' => $stockTransfer->id,
            'current_status' => $stockTransfer->status,
            'current_approved_status' => $stockTransfer->approved_status,
            'user_id' => Auth::id(),
        ]);

        // --- Pre-checks ---
        if ($stockTransfer->status !== 'sent') {
            Log::warning('Receive Rejected: Status is not SENT.', ['transfer_id' => $stockTransfer->id]);
            return back()->with('flash.error', 'Only SENT transfers can be marked as RECEIVED.');
        }

        if ($stockTransfer->approved_status !== 'approved') {
            Log::warning('Receive Rejected: Transfer was not APPROVED.', ['transfer_id' => $stockTransfer->id]);
            return back()->with('flash.error', 'Cannot receive a transfer that was not approved by management.');
        }

        $stockTransfer->load('items.product');
        $user = Auth::user();

        $transferReason = \App\Models\AdjustmentReason::firstWhere('name', 'Transfer');
        $adjustmentReasonId = $transferReason?->id;

        if (!$adjustmentReasonId) {
            Log::warning('Adjustment Reason "Transfer" not found.');
            return back()->with('flash.error', 'Critical: Stock Adjustment Reason "Transfer" not found. Cannot process IN transaction.');
        }

        Log::debug('Checkpoint 1: Adjustment Reason ID found: ' . $adjustmentReasonId);

        // --- Transaction Start ---
        DB::beginTransaction();
        try {
            Log::debug('Checkpoint 2: Entering DB Transaction.');

            // 1. Commit Stock Adjustment IN for the Destination Store and Update Stock
            foreach ($stockTransfer->items as $item) {
                // Find or create the stock record for the destination store
                $destinationStock = \App\Models\Stock::firstOrNew(
                    [
                        'store_id' => $stockTransfer->destination_store_id,
                        'product_id' => $item->product_id,
                    ],
                    [
                        'current_stock' => 0,
                        'reorder_level' => 0,
                        'reorder_quantity' => 0,
                    ]
                );

                $oldStock = $destinationStock->current_stock;
                $quantityIn = $item->quantity;
                $newStock = $oldStock + $quantityIn;

                Log::debug('Receive: Updating stock.', [
                    'product_id' => $item->product_id,
                    'destination_store' => $stockTransfer->destination_store_id,
                    'old_stock' => $oldStock,
                    'quantity_in' => $quantityIn,
                    'new_stock' => $newStock,
                    'stock_record_exists' => $destinationStock->exists,
                ]);

                // Create Stock Adjustment (Audit Log)
                \App\Models\StockAdjustment::create([
                    'product_id' => $item->product_id,
                    'store_id' => $stockTransfer->destination_store_id,
                    'type' => 'in',
                    'quantity' => $quantityIn,
                    'old_stock' => $oldStock,
                    'new_stock' => $newStock,
                    'notes' => "Stock Transfer IN (Reference: {$stockTransfer->reference})",
                    'adjustment_reason_id' => $adjustmentReasonId,
                    'user_id' => $user->id,
                    'related_transfer_id' => $stockTransfer->id,
                ]);

                // ✅ Save the stock record (handles both new and existing)
                $destinationStock->current_stock = $newStock;
                $destinationStock->save(); // This ensures INSERT or UPDATE
            }

            // 2. Update Transfer Status (Finalizing the transfer)
            $stockTransfer->update([
                'status' => 'received',
                'received_by_id' => Auth::id(),
                'received_at' => now(),
            ]);

            DB::commit();
            Log::info('Transfer RECEIVED successfully. Stock updated at destination.', [
                'transfer_id' => $stockTransfer->id,
                'destination_store_id' => $stockTransfer->destination_store_id,
                'user_id' => Auth::id(),
            ]);
            return back()->with('flash.success', "Transfer #{$stockTransfer->id} marked as RECEIVED. Stock has been added to the destination store.");

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Stock Transfer Receive Failed: " . $e->getMessage(), [
                'transfer_id' => $stockTransfer->id,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->with('flash.error', 'Failed to mark transfer as received: ' . $e->getMessage());
        }
    }

    // ... Export methods remain the same ...


    public function exportSinglePdf(StockTransfer $stockTransfer)
    {
        // Load relationships including Product details for the item list
        $stockTransfer->load(['sourceStore', 'destinationStore', 'user', 'items.product']);

        $pdf = Pdf::loadView('stock-transfers.single-pdf', compact('stockTransfer'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("transfer_note_{$stockTransfer->reference}.pdf");
    }

    /**
     * Single Excel: Detailed Item List
     */
    public function exportSingleExcel(StockTransfer $stockTransfer)
    {
        $stockTransfer->load(['sourceStore', 'destinationStore', 'user', 'items.product']);

        return Excel::download(
            new class($stockTransfer) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $transfer;
                public function __construct($transfer) { $this->transfer = $transfer; }

                public function collection()
                {
                    // Flatten: One row per ITEM, not per transfer
                    $rows = collect([]);
                    foreach($this->transfer->items as $item) {
                        $rows->push([
                            'Reference' => $this->transfer->reference,
                            'Date' => $this->transfer->transfer_date?->format('Y-m-d'),
                            'Source' => $this->transfer->sourceStore->name ?? 'N/A',
                            'Destination' => $this->transfer->destinationStore->name ?? 'N/A',
                            'Status' => Str::upper($this->transfer->status),
                            'Product Name' => $item->product->name ?? 'Unknown',
                            'Product SKU' => $item->product->sku ?? '—',
                            'Quantity' => $item->quantity,
                            'Notes' => $this->transfer->notes,
                            'Initiated By' => $this->transfer->user->name ?? 'N/A',
                        ]);
                    }
                    return $rows;
                }

                public function headings(): array
                {
                    return ['Reference', 'Date', 'Source', 'Destination', 'Status', 'Product Name', 'Product SKU', 'Quantity', 'Notes', 'Initiated By'];
                }
            },
            "transfer_{$stockTransfer->reference}.xlsx"
        );
    }

    /**
     * Bulk PDF: Register Log
     */
    public function bulkExportPDF($ids)
    {
            // $ids is now passed directly from the URL (e.g., "1,2,3")
        $idArray = explode(',', $ids);

        $transfers = StockTransfer::whereIn('id', $idArray) // 🟢 Use $idArray here
            ->with(['sourceStore', 'destinationStore', 'user'])
            ->withCount('items')
            ->latest()
            ->get();

        if ($transfers->isEmpty()) {
            return back()->with('flash.error', 'No transfers selected for export.');
        }

        $pdf = Pdf::loadView('stock-transfers.bulk-pdf', compact('transfers'))
            ->setPaper('a4', 'portrait');

        return $pdf->download('stock_transfers_register.pdf');
    }

        /**
         * Bulk Excel: Register Log
         */
        // 🟢 FIX: Remove (Request $request) and replace with ($ids)

    public function bulkExportExcel($ids)
    {
        // $ids is now passed directly from the URL
        $idArray = explode(',', $ids);

        $transfers = StockTransfer::whereIn('id', $idArray) // 🟢 Use $idArray here
            ->with(['sourceStore', 'destinationStore', 'user'])
            ->withCount('items')
            ->latest()
            ->get();

        if ($transfers->isEmpty()) {
            return back()->with('flash.error', 'No transfers selected for export.');
        }

        return Excel::download(
            new class($transfers) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $transfers;
                public function __construct($transfers) { $this->transfers = $transfers; }

                public function collection()
                {
                    return $this->transfers->map(fn ($t) => [
                        'ID' => $t->id,
                        'Reference' => $t->reference ?? 'N/A',
                        'Source' => $t->sourceStore->name ?? 'N/A',
                        'Destination' => $t->destinationStore->name ?? 'N/A',
                        'Status' => Str::title($t->status),
                        'Transfer Date' => $t->transfer_date?->format('Y-m-d'),
                        'Items Count' => $t->items_count,
                        'Initiated By' => $t->user->name ?? 'N/A',
                        'Created At' => optional($t->created_at)->format('d M Y'),
                    ]);
                }

                public function headings(): array
                {
                    return ['ID', 'Reference', 'Source', 'Destination', 'Status', 'Transfer Date', 'Items Count', 'Initiated By', 'Created At'];
                }
            },
            'stock_transfers_register.xlsx'
        );
    }
}
