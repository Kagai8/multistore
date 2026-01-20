<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Inertia\Inertia;
use App\Models\Stock;
use App\Models\Payment;
use App\Models\PosSale;
use App\Models\Product;
use App\Models\Category;
use App\Models\Customer;
use App\Models\SaleItem;
use App\Models\PosSession;
use App\Models\PosSaleItem;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\CompanySetting;
use App\Models\CardTransaction;
use App\Models\StockAdjustment;
use App\Models\AdjustmentReason;
use App\Models\ManualTransaction;
use App\Models\PaymentToCustomer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\CustomerDebt; // 🟢 ADDED MISSING IMPORT

class PosController extends Controller
{
    public function index(Request $request)
    {
        $activeSession = PosSession::where('user_id', Auth::id())
            ->where('store_id', Auth::user()->store_id)
            ->where('status', 'open')
            ->first();

        $categories = Category::select('id', 'name')->orderBy('name')->get();

        $products = Product::with(['category', 'stocks' => function($q) {
                $q->where('store_id', Auth::user()->store_id);
            }])
            ->select('id', 'category_id', 'name', 'sku', 'retail_price', 'wholesale_price', 'special_price', 'main_image')
            ->get()
            ->map(function($product) {
                $stock = $product->stocks->first()?->current_stock ?? 0;
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'retail_price' => (float) $product->retail_price,
                    'wholesale_price' => (float) $product->wholesale_price,
                    'special_price' => (float) $product->special_price,
                    'stock' => (int) $stock,
                    'category_id' => $product->category_id,
                    'main_image' => $product->main_image ? asset('storage/' . $product->main_image) : null,
                    'initials' => strtoupper(substr($product->name, 0, 2)),
                    'color' => $this->getProductColor($product->id),
                ];
            });

        $customers = Customer::select('id', 'name', 'number', 'credit_limit', 'loyalty_points')
            ->withSum(['debts' => function($q) {
                $q->where('status', 'active');
            }], 'balance')
            ->orderBy('name')
            ->get()
            ->map(function($c) {
                $limit = $c->credit_limit ?? 0;
                $debt = $c->debts_sum_balance ?? 0;
                $available = max(0, $limit - $debt);
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'phone' => $c->number,
                    'credit_limit' => $limit,
                    'current_debt' => $debt,
                    'available_credit' => $available,
                    'loyalty_points' => $c->loyalty_points ?? 0,
                ];
            });

        $parkedSales = PosSale::where('store_id', Auth::user()->store_id)
            ->where('status', 'parked')
            ->with([
                'customer:id,name',
                'items.product.stocks'
            ])
            ->latest()
            ->get();

        $walkInCustomer = Customer::where('name', 'Walk-In Customer')->first();
        if (!$walkInCustomer) {
            $walkInCustomer = Customer::create([
                'name' => 'Walk-In Customer', 'number' => '000000000', 'credit_limit' => 0, 'store_id' => Auth::user()->store_id
            ]);
            $walkInCustomer->available_credit = 0;
            $walkInCustomer->phone = '000000000';
        } else {
             $debt = $walkInCustomer->debts()->where('status', 'active')->sum('balance');
             $walkInCustomer->available_credit = max(0, ($walkInCustomer->credit_limit ?? 0) - $debt);
             $walkInCustomer->phone = $walkInCustomer->number;
        }

        $company = CompanySetting::where('is_default', true)->first() ?? CompanySetting::first();

        return Inertia::render('pos/index', [
            'initialProducts' => $products,
            'categories' => $categories,
            'customers' => $customers,
            'activeSession' => $activeSession,
            'defaultCustomer' => $walkInCustomer,
            'parkedSales' => $parkedSales,
            'company' => $company,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'cart' => 'required|array|min:1',
            'cart.*.id' => 'required|exists:products,id',
            'cart.*.qty' => 'required|integer|min:1',
            'cart.*.price' => 'required|numeric|min:0',
            'cart.*.priceType' => 'nullable|string',
            'payments' => 'required_if:status,completed|array',
            'status' => 'required|in:completed,parked',
        ]);

        DB::beginTransaction();
        try {
            $user = Auth::user();

            $session = PosSession::firstOrCreate(
                ['user_id' => $user->id, 'store_id' => $user->store_id, 'status' => 'open'],
                ['opening_cash' => 0, 'start_time' => now()]
            );

            $reason = AdjustmentReason::firstOrCreate(['name' => 'POS'], ['name' => 'POS', 'type' => 'out']);

            $subTotal = 0;
            foreach ($validated['cart'] as $item) {
                $subTotal += ($item['price'] * $item['qty']);
            }

            $tendered = !empty($validated['payments']) ? collect($validated['payments'])->sum('amount') : 0;

            $sale = PosSale::create([
                'store_id' => $user->store_id,
                'user_id' => $user->id,
                'customer_id' => $validated['customer_id'],
                'pos_session_id' => $session->id,
                'receipt_number' => 'RCP-' . strtoupper(Str::random(8)),
                'total_amount' => $subTotal,
                'status' => $validated['status'],
                'tendered_amount' => $tendered,
                'change_amount' => 0,
            ]);

            foreach ($validated['cart'] as $item) {
                PosSaleItem::create([
                    'pos_sale_id' => $sale->id,
                    'product_id' => $item['id'],
                    'quantity' => $item['qty'],
                    'unit_price' => $item['price'],
                    'sub_total' => $item['price'] * $item['qty'],
                ]);

                $stock = Stock::where('store_id', $user->store_id)->where('product_id', $item['id'])->lockForUpdate()->first();
                if ($stock) {
                    StockAdjustment::create([
                        'product_id' => $item['id'], 'store_id' => $user->store_id, 'type' => 'out',
                        'quantity' => $item['qty'], 'old_stock' => $stock->current_stock, 'new_stock' => $stock->current_stock - $item['qty'],
                        'notes' => "POS Sale: {$sale->receipt_number}", 'adjustment_reason_id' => $reason->id, 'user_id' => $user->id,
                    ]);
                    $stock->decrement('current_stock', $item['qty']);
                }
            }

            if ($validated['status'] === 'completed') {
                $this->processPayments($sale, $validated['payments']);

                $ledger = Sale::create([
                    'store_id' => $user->store_id, 'user_id' => $user->id, 'customer_id' => $validated['customer_id'],
                    'source_type' => PosSale::class, 'source_id' => $sale->id, 'reference_no' => $sale->receipt_number,
                    'total_amount' => $sale->total_amount, 'paid_amount' => $sale->tendered_amount, 'payment_status' => 'paid', 'status' => 'completed',
                ]);

                foreach ($sale->items as $posItem) {
                    SaleItem::create([
                        'sale_id' => $ledger->id, 'product_id' => $posItem->product_id, 'source_item_id' => $posItem->id,
                        'source_item_type' => PosSaleItem::class, 'quantity' => $posItem->quantity,
                        'unit_price' => $posItem->unit_price, 'total_price' => $posItem->sub_total, 'price_category' => 'retail',
                    ]);
                }
            }

            DB::commit();

            // 🟢 NOTIFICATION TRIGGER
            // Now links to the Sales Index page
            if ($validated['status'] === 'completed') {
                $this->notifyStore(
                    $user->store_id,
                    "New POS Sale",
                    "Receipt #{$sale->receipt_number} generated by {$user->name} (" . number_format($sale->total_amount) . ")",
                    route('sales.index') // 👈 Links to your Sales History list
                );
            }

            return back()->with([
                'success' => $validated['status'] === 'parked' ? 'Sale Parked Successfully' : 'Sale Completed Successfully',
                'receipt_data' => $validated['status'] === 'completed' ? [
                    'id' => $sale->id,
                    'number' => $sale->receipt_number,
                    'change' => $sale->change_amount,
                    'customer' => $sale->customer->name
                ] : null
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("POS Error: " . $e->getMessage());
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    private function processPayments(PosSale $sale, array $paymentsData)
    {
        $groupId = 'POS-' . strtoupper(Str::random(8));
        $totalTendered = 0;

        foreach ($paymentsData as $line) {
            $amount = $line['amount'];
            $method = $line['method'];
            $ref = $line['transaction_ref'] ?? null;
            $totalTendered += $amount;
            $childModel = null;

            // 🟢 FIX START: Handle Credit Limit Logic
            if ($method === 'credit_limit') {
                CustomerDebt::create([
                    'store_id' => $sale->store_id,
                    'user_id' => $sale->user_id,
                    'customer_id' => $sale->customer_id,
                    'source_type' => PosSale::class, // Link to this specific sale
                    'source_id' => $sale->id,
                    'principal_amount' => $amount,
                    'balance' => $amount, // Start fully unpaid
                    'status' => 'active',
                    'due_date' => now()->addDays(30), // Default credit term (can be customized)
                    'notes' => 'POS Credit Sale'
                ]);

                // We SKIP creating a "Payment" record because no money was received yet.
                // We just continue to the next payment line.
                continue;
            }
            // 🟢 FIX END

            if (in_array($method, ['cash', 'mpesa'])) {
                $category = ($method === 'mpesa') ? 'mpesa_manual' : 'cash';
                $childModel = ManualTransaction::create([
                    'method_category' => $category, 'reference_no' => $ref, 'amount_tendered' => $amount, 'notes' => "POS Sale"
                ]);
            } elseif ($method === 'card') {
                $childModel = CardTransaction::create([
                    'card_type' => 'visa', 'auth_code' => $ref, 'last_four' => null
                ]);
            }

            if ($childModel) {
                Payment::create([
                    'store_id' => $sale->store_id, 'user_id' => $sale->user_id, 'payment_group_id' => $groupId,
                    'payable_type' => PosSale::class, 'payable_id' => $sale->id, 'method_type' => get_class($childModel),
                    'method_id' => $childModel->id, 'method' => $method, 'amount' => $amount, 'status' => 'completed', 'payment_date' => now(),
                ]);
            }
        }

        $change = $totalTendered - $sale->total_amount;
        if ($change > 0) {
            PaymentToCustomer::create([
                'store_id' => $sale->store_id, 'user_id' => $sale->user_id, 'customer_id' => $sale->customer_id,
                'pos_sale_id' => $sale->id, 'amount' => $change, 'type' => 'change', 'method' => 'cash',
                'notes' => "Change for POS Receipt #{$sale->receipt_number}", 'payment_date' => now()
            ]);
            $sale->update(['change_amount' => $change]);
        }
    }

    private function getProductColor($id)
    {
        $colors = ['bg-red-100 text-red-600', 'bg-orange-100 text-orange-600', 'bg-amber-100 text-amber-600', 'bg-green-100 text-green-600', 'bg-emerald-100 text-emerald-600', 'bg-teal-100 text-teal-600', 'bg-cyan-100 text-cyan-600', 'bg-sky-100 text-sky-600', 'bg-blue-100 text-blue-600', 'bg-indigo-100 text-indigo-600', 'bg-violet-100 text-violet-600', 'bg-purple-100 text-purple-600', 'bg-fuchsia-100 text-fuchsia-600', 'bg-pink-100 text-pink-600', 'bg-rose-100 text-rose-600'];
        return $colors[$id % count($colors)];
    }

    public function openSession(Request $request) {
        $validated = $request->validate(['opening_cash' => 'required|numeric|min:0']);
        $user = Auth::user();

        if (PosSession::where('user_id', $user->id)->where('store_id', $user->store_id)->where('status', 'open')->exists()) {
            return back()->with('error', 'You already have an open session.');
        }

        PosSession::create([
            'store_id' => $user->store_id,
            'user_id' => $user->id,
            'start_time' => now(),
            'opening_cash' => $validated['opening_cash'],
            'status' => 'open'
        ]);

        // 🟢 NOTIFY STORE (Shift Started)
        $this->notifyStore(
            $user->store_id,
            "Register Opened",
            "{$user->name} opened a new shift. Opening Float: " . number_format($validated['opening_cash']),
            null // No specific link needed, or link to POS
        );

        return back()->with('success', 'Register Opened Successfully.');
    }

    public function closeSession(Request $request)
    {
        $validated = $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        $user = Auth::user();

        // Find the open session
        $session = PosSession::where('user_id', $user->id)
            ->where('store_id', $user->store_id)
            ->where('status', 'open')
            ->first();

        if (!$session) {
            return back()->with('error', 'No open session found to close.');
        }

        // Calculate expected cash
        $cashSales = $session->sales()
            ->where('status', 'completed')
            ->with(['payments' => fn($q) => $q->where('method', 'cash')])
            ->get()
            ->sum(fn($sale) => $sale->payments->sum('amount') - $sale->change_amount);

        $expectedCash = $session->opening_cash + $cashSales;
        $difference = $validated['closing_cash'] - $expectedCash;

        $session->update([
            'end_time' => now(),
            'closing_cash' => $validated['closing_cash'],
            'cash_difference' => $difference,
            'status' => 'closed',
            'notes' => $validated['notes']
        ]);

        // 🟢 NOTIFY STORE (Shift Ended - Important for Managers)
        // We include the difference so managers spot theft/errors immediately
        $diffString = $difference > 0 ? "+".number_format($difference) : number_format($difference);

        $this->notifyStore(
            $user->store_id,
            "Register Closed",
            "{$user->name} closed shift. Count: " . number_format($validated['closing_cash']) . ". Diff: {$diffString}",
            route('sales.index') // Link to sales to review performance
        );

        return back()->with('success', 'Register Closed Successfully. Shift Ended.');
    }

    public function destroy(PosSale $posSale)
    {
        DB::transaction(function () use ($posSale) {
            foreach ($posSale->items as $item) {
                $stock = Stock::where('store_id', $posSale->store_id)
                    ->where('product_id', $item->product_id)
                    ->first();

                if ($stock) {
                    $stock->increment('current_stock', $item->quantity);
                    StockAdjustment::create([
                        'product_id' => $item->product_id,
                        'store_id' => $posSale->store_id,
                        'type' => 'in',
                        'quantity' => $item->quantity,
                        'old_stock' => $stock->current_stock - $item->quantity,
                        'new_stock' => $stock->current_stock,
                        'notes' => "Resumed POS Sale: {$posSale->receipt_number}",
                        'user_id' => Auth::id(),
                    ]);
                }
            }
            $posSale->items()->delete();
            $posSale->delete();
        });

        return back()->with('success', 'Sale Resumed');
    }
}
