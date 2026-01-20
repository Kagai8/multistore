<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockAdjustment;
use App\Models\AdjustmentReason;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Payment;
use App\Models\PaymentToCustomer; // 🟢 NEW MODEL
use App\Models\ManualTransaction;
use App\Models\CardTransaction;
use App\Models\CreditTransaction;
use App\Models\CustomerDebt;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class InvoiceController extends Controller
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

        // ... (Query building remains the same) ...
        $query = Invoice::with([
            'customer' => function($q) {
                $q->select('id', 'name', 'credit_limit')
                  ->withSum(['debts' => function($d) {
                      $d->where('status', 'active');
                  }], 'balance');
            },
            'user', 'store', 'items.product', 'voidApprover', 'refunder'
        ]);

        if ($search) {
             // ... (Search logic remains same) ...
             $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($dateFrom || $dateTo) {
            // ... (Date logic remains same) ...
             $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

            if ($start && $end) {
                $query->whereBetween('invoice_date', [$start, $end]);
            } elseif ($start) {
                $query->whereDate('invoice_date', '>=', $start);
            } elseif ($end) {
                $query->whereDate('invoice_date', '<=', $end);
            }
        }
        // 1. DRAFTS: Invoices waiting to be posted
        $draftCount = Invoice::where('status', 'draft')->count();

        // 2. OUTSTANDING: Money owed to us (Posted invoices not yet fully paid)
        // We calculate (Total - Paid) for all 'posted' invoices
        $outstanding = Invoice::where('status', 'posted')
            ->sum(DB::raw('total_amount - paid_amount'));

        // 3. COLLECTED: Actual cash in hand (Sum of paid_amount for valid invoices)
        // Exclude drafts and voided invoices
        $collected = Invoice::whereNotIn('status', ['draft', 'void'])
            ->sum('paid_amount');

        $stats = [
            'draft_count' => $draftCount,
            'outstanding' => $outstanding,
            'collected' => $collected,
        ];
        // 🟢 END NEW STATS

        // ... (Lookup data logic remains same) ...
         $customers = Customer::select('id', 'name', 'credit_limit')
            ->withSum(['debts' => function($q) {
                $q->where('status', 'active');
            }], 'balance')
            ->get()
            ->map(function($c) {
                $limit = $c->credit_limit ?? 0;
                $debt = $c->debts_sum_balance ?? 0;
                $available = max(0, $limit - $debt);
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'credit_limit' => $limit,
                    'available_credit' => $available
                ];
            });

        $products = Product::select('id', 'name', 'sku', 'retail_price', 'wholesale_price', 'special_price')->get();
        $productStocks = Stock::select('product_id', 'store_id', 'current_stock')
            ->get()
            ->groupBy('product_id')
            ->map(fn($stocks) => $stocks->keyBy('store_id')->map(fn($stock) => (int)$stock->current_stock));

        $totalCount = Invoice::count();
        $filteredCount = $query->count();

        $transform = function (Invoice $invoice) {
             // ... (Transform logic remains same) ...
             $custLimit = $invoice->customer->credit_limit ?? 0;
            $custDebt = $invoice->customer->debts_sum_balance ?? 0;
            $custAvailable = max(0, $custLimit - $custDebt);

            return [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'invoice_date' => $invoice->invoice_date->format('Y-m-d'),
                'due_date' => $invoice->due_date ? $invoice->due_date->format('Y-m-d') : null,
                'customer_name' => $invoice->customer->name ?? 'Unknown',
                'customer_id' => $invoice->customer_id,
                'customer_credit_limit' => $custLimit,
                'customer_available_credit' => $custAvailable,
                'user_name' => $invoice->user->name ?? 'System',
                'store_name' => $invoice->store->name ?? 'N/A',
                'total_amount' => $invoice->total_amount,
                'paid_amount' => $invoice->paid_amount,
                'balance_due' => $invoice->total_amount - $invoice->paid_amount,
                'status' => $invoice->status,
                'payment_status' => $invoice->payment_status,
                'payment_arrangement' => $invoice->payment_arrangement,
                'notes' => $invoice->notes,
                'voided_at' => $invoice->voided_at ? $invoice->voided_at->format('Y-m-d H:i') : null,
                'voided_by_name' => $invoice->voidApprover->name ?? null,
                'void_reason' => $invoice->void_reason,
                'refunded_at' => $invoice->refunded_at ? $invoice->refunded_at->format('Y-m-d H:i') : null,
                'refunded_by_name' => $invoice->refunder->name ?? null,
                'items' => $invoice->items->map(fn($item) => [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name ?? 'N/A',
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'price_category' => $item->price_category,
                    'sub_total' => $item->sub_total,
                ]),
            ];
        };

        // 🟢 FIX IS HERE
        if ($perPage === -1) {
            $all = $query->latest('created_at')->get()->map($transform);
            $invoices = [
                'data' => $all,
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => $all->count() ? 1 : 0,
                'to' => $all->count(),
                'links' => [], // 🟢 ADDED: Empty array so .map() doesn't crash
            ];
        } else {
            $paginator = $query->latest('created_at')->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transform);
            $invoices = $paginator;
        }

        return Inertia::render('invoices/index', [
            'invoices' => $invoices,
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'lookupData' => [
                'customers' => $customers,
                'products' => $products,
                'productStocks' => $productStocks->toArray(),
            ],
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:invoice_date',
            'payment_arrangement' => 'required|in:full,partial',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.price_category' => 'required|in:retail,wholesale,special,manual',
        ]);

        DB::beginTransaction();
        try {
            $count = Invoice::count() + 1;
            $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad($count, 6, '0', STR_PAD_LEFT);

            $subTotal = 0;
            $itemsToCreate = [];

            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $subTotal += $lineTotal;

                $itemsToCreate[] = new InvoiceItem([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'price_category' => $item['price_category'],
                    'sub_total' => $lineTotal,
                ]);
            }

            $invoice = Invoice::create([
                'customer_id' => $validated['customer_id'],
                'invoice_number' => $invoiceNumber,
                'invoice_date' => $validated['invoice_date'],
                'due_date' => $validated['due_date'],
                'payment_arrangement' => $validated['payment_arrangement'],
                'notes' => $validated['notes'],
                'sub_total' => $subTotal,
                'total_amount' => $subTotal,
                'status' => 'draft',
                'payment_status' => 'unpaid',
            ]);

            $invoice->items()->saveMany($itemsToCreate);

            DB::commit();
            // 🟢 NOTIFY STORE
            $this->notifyStore(
                $invoice->store_id,
                "Draft Invoice Created",
                "Invoice #{$invoiceNumber} created by " . Auth::user()->name . ". Status: Draft.",
                route('invoices.index')
            );
            return redirect()->route('invoices.index')->with('success', 'Draft Invoice created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Invoice Creation Failed: " . $e->getMessage());
            return back()->with('error', 'Failed to create invoice: ' . $e->getMessage());
        }
    }

    public function update(Request $request, Invoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return back()->with('error', "Only DRAFTS can be edited.");
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date',
            'payment_arrangement' => 'required|in:full,partial',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.price_category' => 'required|in:retail,wholesale,special,manual',
        ]);

        DB::beginTransaction();
        try {
            $subTotal = 0;
            $itemsToCreate = [];

            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $subTotal += $lineTotal;

                $itemsToCreate[] = new InvoiceItem([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'price_category' => $item['price_category'],
                    'sub_total' => $lineTotal,
                ]);
            }

            $invoice->update([
                'customer_id' => $validated['customer_id'],
                'invoice_date' => $validated['invoice_date'],
                'due_date' => $validated['due_date'],
                'payment_arrangement' => $validated['payment_arrangement'],
                'notes' => $validated['notes'],
                'sub_total' => $subTotal,
                'total_amount' => $subTotal,
            ]);

            $invoice->items()->delete();
            $invoice->items()->saveMany($itemsToCreate);

            DB::commit();
            return back()->with('success', 'Draft Invoice updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Invoice Update Failed: " . $e->getMessage());
            return back()->with('error', 'Failed to update invoice: ' . $e->getMessage());
        }
    }

    public function destroy(Invoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return back()->with('error', "Only DRAFTS can be deleted.");
        }

        $invoice->items()->delete();
        $invoice->delete();

        return back()->with('success', 'Draft invoice deleted.');
    }

    /**
     * POST ACTION: Finalize Invoice, Deduct Stock, Set as Unpaid.
     */
    public function post(Invoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return back()->with('error', 'Invoice is already posted.');
        }

        if ($invoice->customer_id == 1 && $invoice->payment_arrangement !== 'full') {
            return back()->with('error', 'Walk-in customers cannot have Partial arrangements.');
        }

        $reason = AdjustmentReason::firstOrCreate(
            ['name' => 'Invoice'],
            ['name' => 'Invoice', 'type' => 'out']
        );

        DB::beginTransaction();
        try {
            $invoice->load('items.product');

            // 1. DEDUCT STOCK
            foreach ($invoice->items as $item) {
                $stock = Stock::where('store_id', $invoice->store_id)
                    ->where('product_id', $item->product_id)
                    ->lockForUpdate()
                    ->first();

                if (!$stock || $stock->current_stock < $item->quantity) {
                    throw new \Exception("Insufficient stock for: " . ($item->product->name ?? 'Unknown'));
                }

                StockAdjustment::create([
                    'product_id' => $item->product_id,
                    'store_id' => $invoice->store_id,
                    'type' => 'out',
                    'quantity' => $item->quantity,
                    'old_stock' => $stock->current_stock,
                    'new_stock' => $stock->current_stock - $item->quantity,
                    'notes' => "Invoice Posted: {$invoice->invoice_number}",
                    'adjustment_reason_id' => $reason->id,
                    'user_id' => Auth::id(),
                ]);

                $stock->decrement('current_stock', $item->quantity);
            }

            // 🟢 UPDATE INVOICE ONLY (Do not create Sale yet)
            // Invoice table typically allows 'unpaid'.
            // We do NOT create the Sale record here to avoid the "Sales Table Check Constraint" error.
            $invoice->update([
                'status' => 'posted',
                'payment_status' => 'unpaid'
            ]);

            DB::commit();
            // 🟢 NOTIFY STORE
            $this->notifyStore(
                $invoice->store_id,
                "Invoice Posted",
                "Invoice #{$invoice->invoice_number} is now live. Stock deducted.",
                route('invoices.index')
            );

            return back()->with('success', 'Invoice Posted. Ready for Payment.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Invoice Posting Failed: " . $e->getMessage());
            return back()->with('error', "Error Posting: " . $e->getMessage());
        }
    }

    /**
     * VOID ACTION: Reverse Invoice and Stock.
     */
    public function void(Invoice $invoice)
    {
        if ($invoice->status !== 'posted') {
            return back()->with('error', 'Only POSTED invoices can be voided.');
        }

        $reason = AdjustmentReason::firstOrCreate(
            ['name' => 'Void Invoice'],
            ['name' => 'Void Invoice', 'type' => 'in']
        );

        DB::beginTransaction();
        try {
            $invoice->load('items');

            // 1. REVERSE STOCK
            foreach ($invoice->items as $item) {
                $stock = Stock::where('store_id', $invoice->store_id)
                    ->where('product_id', $item->product_id)
                    ->lockForUpdate()
                    ->first();

                if (!$stock) {
                     $stock = Stock::create([
                        'store_id' => $invoice->store_id,
                        'product_id' => $item->product_id,
                        'current_stock' => 0
                     ]);
                }

                StockAdjustment::create([
                    'product_id' => $item->product_id,
                    'store_id' => $invoice->store_id,
                    'type' => 'in',
                    'quantity' => $item->quantity,
                    'old_stock' => $stock->current_stock,
                    'new_stock' => $stock->current_stock + $item->quantity,
                    'notes' => "Invoice Voided: {$invoice->invoice_number}",
                    'adjustment_reason_id' => $reason->id,
                    'user_id' => Auth::id(),
                ]);

                $stock->increment('current_stock', $item->quantity);
            }

            // 2. CANCEL LEDGER (Sale) - Only if it exists!
            $sale = Sale::where('source_id', $invoice->id)
                        ->where('source_type', Invoice::class)
                        ->first();

            if ($sale) {
                $sale->update(['status' => 'cancelled']);
            }

            // 3. UPDATE INVOICE
            $invoice->update([
                'status' => 'void',
                'voided_at' => now(),
                'voided_by' => Auth::id(),
                'void_reason' => 'Manual Void'
            ]);

            DB::commit();
            // 🟢 NOTIFY STORE
            $this->notifyStore(
                $invoice->store_id,
                "Invoice Voided",
                "Invoice #{$invoice->invoice_number} was VOIDED by " . Auth::user()->name . ". Stock returned.",
                route('invoices.index')
            );
            return back()->with('success', 'Invoice Voided successfully. Stock returned.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Invoice Void Failed: " . $e->getMessage());
            return back()->with('error', 'Failed to void invoice: ' . $e->getMessage());
        }
    }

    /**
     * PAYMENT ACTION: Receive Money & Create/Update Sales Ledger
     */
    public function addPayment(Request $request, Invoice $invoice)
    {
        Log::info("💰 Payment Started | Invoice: {$invoice->invoice_number}", $request->all());

        if ($invoice->status !== 'posted') {
            return back()->with('error', 'Invoice must be POSTED before adding payments.');
        }

        $balanceDue = $invoice->total_amount - $invoice->paid_amount;

        $validated = $request->validate([
            'payments' => 'required|array|min:1',
            'payments.*.amount' => 'required|numeric|min:0.01',
            'payments.*.method' => 'required|string',
            'payments.*.transaction_ref' => 'nullable|string',
            'payments.*.mpesaMode' => 'nullable|string',
            'payments.*.payment_date' => 'required|date',
        ]);

        // 🟢 1. CHECK OVERPAYMENT & CALCULATE CHANGE
        $incomingTotal = collect($validated['payments'])->sum('amount');
        $change = 0;

        // If paying more than needed, the excess is change.
        if ($incomingTotal > $balanceDue) {
            $change = $incomingTotal - $balanceDue;
        }

        DB::beginTransaction();
        try {
            $groupId = 'GRP-' . strtoupper(Str::random(8));
            $totalProcessed = 0;

            foreach ($validated['payments'] as $line) {
                $method = $line['method'];
                $amount = $line['amount'];
                $date = $line['payment_date'];
                $ref = $line['transaction_ref'] ?? null;
                $mpesaMode = $line['mpesaMode'] ?? null;

                $childModel = null;

                // --- Payment Creation Logic ---
                if ($method === 'mpesa' && $mpesaMode === 'stk') {
                    $childModel = \App\Models\MpesaTransaction::where('checkout_request_id', $ref)->first();
                    if (!$childModel) {
                        $childModel = ManualTransaction::create([
                            'method_category' => 'mpesa_manual', 'reference_no' => $ref, 'amount_tendered' => $amount, 'notes' => "M-Pesa STK (Orphan)"
                        ]);
                    }
                } elseif (in_array($method, ['cash', 'bank_transfer', 'other']) || ($method === 'mpesa')) {
                    $category = match($method) { 'cash' => 'cash', 'bank_transfer' => 'bank_transfer', 'mpesa' => 'mpesa_manual', default => 'other' };
                    $childModel = ManualTransaction::create([
                        'method_category' => $category, 'reference_no' => $ref, 'amount_tendered' => $amount, 'notes' => $method === 'mpesa' ? "Manual M-Pesa" : null,
                    ]);
                } elseif ($method === 'card') {
                    $childModel = CardTransaction::create([ 'card_type' => 'visa', 'auth_code' => $ref, 'last_four' => null ]);
                } elseif ($method === 'credit_limit') {
                    $customer = $invoice->customer;
                    $currentDebt = CustomerDebt::where('customer_id', $customer->id)->where('status', 'active')->sum('balance');
                    if (($currentDebt + $amount) > $customer->credit_limit) throw new \Exception("Credit limit exceeded.");
                    $debt = CustomerDebt::create([
                        'customer_id' => $customer->id, 'source_type' => Invoice::class, 'source_id' => $invoice->id, 'principal_amount' => $amount, 'balance' => $amount, 'due_date' => Carbon::now()->addDays(30), 'status' => 'active'
                    ]);
                    $childModel = CreditTransaction::create([
                        'customer_id' => $customer->id, 'customer_debt_id' => $debt->id, 'amount' => $amount, 'running_balance' => $currentDebt + $amount
                    ]);
                }

                if ($childModel) {
                    Payment::create([
                        'store_id' => $invoice->store_id, 'user_id' => Auth::id(), 'payment_group_id' => $groupId, 'payable_type' => Invoice::class, 'payable_id' => $invoice->id, 'invoice_id' => $invoice->id, 'method_type' => get_class($childModel), 'method_id' => $childModel->id, 'method' => $method, 'transaction_ref' => $ref, 'amount' => $amount, 'status' => 'completed', 'payment_date' => $date,
                    ]);
                    $totalProcessed += $amount;
                }
            }

            // 🟢 2. RECORD CHANGE (If Any)
            if ($change > 0) {
                PaymentToCustomer::create([
                    'store_id' => $invoice->store_id,
                    'user_id' => Auth::id(),
                    'customer_id' => $invoice->customer_id,
                    'invoice_id' => $invoice->id,
                    'amount' => $change,
                    'type' => 'change',
                    'method' => 'cash',
                    'notes' => "Change for invoice {$invoice->invoice_number}",
                    'payment_date' => now()
                ]);
            }

            // 🟢 UPDATE INVOICE
            $newPaidAmount = $invoice->paid_amount + $totalProcessed;

            // If overpayment occurred, we consider it FULLY paid (change was given back)
            // or if exact match.
            $isFullyPaid = ($invoice->total_amount - $newPaidAmount) <= 0.01 || $change > 0;
            $invStatus = $isFullyPaid ? 'paid' : 'partial';

            $invoice->update([
                'paid_amount' => $newPaidAmount, // We record total tendered on invoice for history
                'payment_status' => $invStatus,
            ]);

            // 🟢 CREATE OR UPDATE SALE (Lazy Load)
            $sale = Sale::where('source_id', $invoice->id)->where('source_type', Invoice::class)->first();

            if (!$sale) {
                // FIRST PAYMENT: Create the Sale Record
                // Use 'partial' or 'paid'. Avoid 'unpaid' to satisfy DB Constraint.
                $sale = Sale::create([
                    'store_id' => $invoice->store_id,
                    'user_id' => Auth::id(),
                    'customer_id' => $invoice->customer_id,
                    'source_id' => $invoice->id,
                    'source_type' => Invoice::class,
                    'reference_no' => $invoice->invoice_number,
                    'total_amount' => $invoice->total_amount,
                    'paid_amount' => $newPaidAmount,
                    'payment_status' => $invStatus, // 🟢 Guaranteed valid status
                    'status' => 'completed',
                ]);

                foreach ($invoice->items as $item) {
                    SaleItem::create([
                        'sale_id' => $sale->id, 'product_id' => $item->product_id, 'source_item_id' => $item->id, 'source_item_type' => InvoiceItem::class, 'price_category' => $item->price_category, 'quantity' => $item->quantity, 'unit_price' => $item->unit_price, 'total_price' => $item->sub_total,
                    ]);
                }
            } else {
                // UPDATE EXISTING SALE
                $sale->update([
                    'payment_status' => $invStatus,
                    'paid_amount' => $newPaidAmount,
                ]);
            }

            DB::commit();

            // 🟢 NOTIFY STORE
            $paymentMessage = "Payment of " . number_format($totalProcessed) . " received for Invoice #{$invoice->invoice_number}.";
            if ($change > 0) $paymentMessage .= " Change given: " . number_format($change);

            $this->notifyStore(
                $invoice->store_id,
                "Payment Received",
                $paymentMessage,
                route('invoices.index')
            );

            // Helpful message
            $msg = $change > 0
                ? "Payment Recorded. Change Due: KSh " . number_format($change, 2)
                : "Payment Recorded Successfully.";

            return back()->with('success', $msg);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Payment Error: " . $e->getMessage());
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    public function refund(Invoice $invoice)
    {
        // 1. Checks
        if ($invoice->status !== 'posted') {
            return back()->with('error', 'Only POSTED invoices can be refunded.');
        }

        if ($invoice->paid_amount <= 0) {
            return back()->with('error', 'No payments found to refund. Use VOID instead.');
        }

        $reason = AdjustmentReason::firstOrCreate(
            ['name' => 'Refunded Invoice'],
            ['name' => 'Refunded Invoice', 'type' => 'in']
        );

        DB::beginTransaction();
        try {
            $invoice->load(['items', 'customer']);

            // ---------------------------------------------------------
            // A. RETURN STOCK (Inventory)
            // ---------------------------------------------------------
            foreach ($invoice->items as $item) {
                $stock = Stock::where('store_id', $invoice->store_id)
                    ->where('product_id', $item->product_id)
                    ->lockForUpdate()
                    ->first();

                if (!$stock) {
                    $stock = Stock::create([
                        'store_id' => $invoice->store_id,
                        'product_id' => $item->product_id,
                        'current_stock' => 0
                    ]);
                }

                StockAdjustment::create([
                    'product_id' => $item->product_id,
                    'store_id' => $invoice->store_id,
                    'type' => 'in',
                    'quantity' => $item->quantity,
                    'old_stock' => $stock->current_stock,
                    'new_stock' => $stock->current_stock + $item->quantity,
                    'notes' => "Refunded: {$invoice->invoice_number}",
                    'adjustment_reason_id' => $reason->id,
                    'user_id' => Auth::id(),
                ]);

                $stock->increment('current_stock', $item->quantity);
            }

            // ---------------------------------------------------------
            // B. LOG MONEY OUT (Cash Flow)
            // ---------------------------------------------------------
            PaymentToCustomer::create([
                'store_id' => $invoice->store_id,
                'user_id' => Auth::id(),
                'customer_id' => $invoice->customer_id,
                'invoice_id' => $invoice->id,
                'amount' => $invoice->paid_amount,
                'type' => 'refund',
                'method' => 'cash',
                'notes' => "Full refund for Invoice #{$invoice->invoice_number}",
                'payment_date' => now()
            ]);

            // ---------------------------------------------------------
            // C. UPDATE LEDGER (Sales Table)
            // ---------------------------------------------------------
            // 🟢 Direct Query is safer here
            $sale = Sale::where('source_id', $invoice->id)
                        ->where('source_type', Invoice::class)
                        ->first();

            if ($sale) {
                $sale->update([
                    'status' => 'returned', // Ensure 'status' is in $fillable in Sale model
                ]);
                Log::info("✅ Sale #{$sale->id} marked as returned.");
            } else {
                Log::warning("⚠️ No Sale record found for Invoice #{$invoice->id} during refund.");
            }

            // ---------------------------------------------------------
            // D. UPDATE INVOICE STATUS
            // ---------------------------------------------------------
            $invoice->update([
                'status' => 'refunded',
                'refunded_at' => now(),
                'refunded_by' => Auth::id(),
                // We leave payment_status as it was (likely 'paid') because the money WAS received previously.
                // The 'status' => 'refunded' overrides visually in the UI.
            ]);

            DB::commit();
            // 🟢 NOTIFY STORE
            $this->notifyStore(
                $invoice->store_id,
                "Invoice Refunded",
                "Full refund processed for Invoice #{$invoice->invoice_number} by " . Auth::user()->name,
                route('invoices.index')
            );
            
            return back()->with('success', 'Refund Processed. Stock returned & Cash logged.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Refund Failed: " . $e->getMessage());
            return back()->with('error', 'Refund failed: ' . $e->getMessage());
        }
    }

    public function printReceipt(Invoice $invoice)
    {
        // Ensure we have the payment history loaded
        $invoice->load(['customer', 'store', 'user', 'items.product', 'payments']);

        $pdf = Pdf::loadView('invoices.receipt-pdf', compact('invoice'))
            ->setPaper('a5', 'portrait'); // A5 is standard for professional receipts (half A4)

        // Stream allows them to print immediately from browser
        return $pdf->stream("Receipt_{$invoice->invoice_number}.pdf");
    }

    public function exportSinglePdf(Invoice $invoice) {
        // 🟢 LOAD EVERYTHING: Context, Items, Payments, and Audit Users
        $invoice->load([
            'customer',
            'store',
            'user',
            'items.product',
            'payments.user', // Load who took the payment
            'voidApprover',
            'refunder'
        ]);

        $pdf = Pdf::loadView('invoices.single-pdf', compact('invoice'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("Invoice_{$invoice->invoice_number}.pdf");
    }

    public function exportSingleExcel(Invoice $invoice) {
        $invoice->load(['customer', 'store', 'user', 'items.product']);
        return Excel::download(new class($invoice) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            protected $invoice;
            public function __construct($invoice) { $this->invoice = $invoice; }
            public function collection() {
                $rows = collect([]);
                foreach($this->invoice->items as $item) {
                    $rows->push([$this->invoice->invoice_number, $this->invoice->invoice_date->format('Y-m-d'), $this->invoice->customer->name, Str::upper($this->invoice->status), $item->product->name, $item->quantity, $item->unit_price, $item->sub_total]);
                }
                return $rows;
            }
            public function headings(): array { return ['Invoice #', 'Date', 'Customer', 'Status', 'Product', 'Qty', 'Unit Price', 'Total']; }
        }, "invoice_{$invoice->invoice_number}.xlsx");
    }

    public function bulkExportPDF($ids) {
        $idArray = explode(',', $ids);
        $invoices = Invoice::whereIn('id', $idArray)->with(['customer', 'store', 'user'])->withCount('items')->latest()->get();
        if ($invoices->isEmpty()) return back()->with('error', 'No invoices selected.');
        $pdf = Pdf::loadView('invoices.bulk-pdf', compact('invoices'))->setPaper('a4', 'portrait');
        return $pdf->download('invoices_register.pdf');
    }

    public function bulkExportExcel($ids) {
        $idArray = explode(',', $ids);
        $invoices = Invoice::whereIn('id', $idArray)->with(['customer', 'store', 'user'])->withCount('items')->latest()->get();
        if ($invoices->isEmpty()) return back()->with('error', 'No invoices selected.');
        return Excel::download(new class($invoices) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            protected $invoices;
            public function __construct($invoices) { $this->invoices = $invoices; }
            public function collection() {
                return $this->invoices->map(fn ($inv) => [$inv->id, $inv->invoice_number, $inv->customer->name, $inv->store->name, $inv->total_amount, $inv->paid_amount, Str::upper($inv->status), $inv->invoice_date->format('Y-m-d'), $inv->user->name]);
            }
            public function headings(): array { return ['ID', 'Invoice #', 'Customer', 'Store', 'Total', 'Paid', 'Status', 'Date', 'Created By']; }
        }, 'invoices_register.xlsx');
    }
}
