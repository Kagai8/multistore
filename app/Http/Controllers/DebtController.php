<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Customer;
use App\Models\CustomerDebt;
use App\Models\DebtRepayment;
use App\Models\Payment;
use App\Models\PaymentToCustomer;
use App\Models\ManualTransaction;
use App\Models\CardTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class DebtController extends Controller
{
    /**
     * LEVEL 1: DEBTORS LIST (Aggregated View)
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));

        // 🟢 1. STATS LOGIC (Using CustomerDebt Model)
        // Total amount owed across all active debt records
        $totalOutstanding = \App\Models\CustomerDebt::where('status', 'active')->sum('balance');

        // Count unique customers who actually owe money
        $debtorsCount = \App\Models\Customer::whereHas('debts', function($q) {
            $q->where('status', 'active')->where('balance', '>', 0);
        })->count();

        // Average Debt
        $avgDebt = $debtorsCount > 0 ? $totalOutstanding / $debtorsCount : 0;

        $stats = [
            'total_outstanding' => $totalOutstanding,
            'debtors_count' => $debtorsCount,
            'avg_debt' => $avgDebt,
        ];
        // 🟢 END STATS

        $query = \App\Models\Customer::query()
            ->withSum(['debts as total_debt' => function($q) {
                $q->where('status', 'active');
            }], 'balance')
            ->whereHas('debts', function($q) {
                $q->where('status', 'active')
                  ->where('balance', '>', 0);
            });

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%"); // Assuming 'phone' or 'number'
            });
        }

        $query->orderByDesc('total_debt');

        $totalCount = \App\Models\Customer::count();
        $filteredCount = $query->count();

        $debtors = $query->paginate($perPage)->withQueryString()->through(function ($customer) {
            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone ?? 'N/A',
                'credit_limit' => $customer->credit_limit,
                'total_debt' => $customer->total_debt ?? 0,
                'usage_percent' => $customer->credit_limit > 0
                    ? round(($customer->total_debt / $customer->credit_limit) * 100, 1)
                    : ($customer->total_debt > 0 ? 100 : 0),
            ];
        });

        return Inertia::render('debts/index', [
            'debtors' => $debtors,
            'filters' => $request->only(['search', 'perPage']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'stats' => $stats, // 🟢 PASS STATS
        ]);
    }

    /**
     * LEVEL 2: CUSTOMER STATEMENT (Drill Down)
     */
    public function show(Customer $customer)
    {
        $debts = $customer->debts()
            ->where('status', 'active')
            ->with('source')
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(function ($debt) {
                return [
                    'id' => $debt->id,
                    'date' => $debt->created_at->format('Y-m-d'),
                    'due_date' => $debt->due_date ? $debt->due_date->format('Y-m-d') : '-',
                    'source_ref' => $debt->source ? ($debt->source->invoice_number ?? $debt->source->receipt_number ?? 'Manual') : 'Opening Bal',
                    'original_amount' => $debt->principal_amount,
                    'balance' => $debt->balance,
                    'days_overdue' => Carbon::now()->diffInDays($debt->due_date, false) * -1,
                ];
            });

        return Inertia::render('debts/show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->number,
                'credit_limit' => $customer->credit_limit,
                'total_debt' => $debts->sum('balance')
            ],
            'debts' => $debts
        ]);
    }

    /**
     * LEVEL 3: REPAYMENT ACTION
     */
    public function store(Request $request)
    {
        Log::info("DebtRepayment: Request received", $request->all());

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'amount' => 'required|numeric|min:1',
            'payment_date' => 'required|date',
            'method' => 'required|string',
            'transaction_ref' => 'nullable|string',
            'selected_debt_ids' => 'nullable|array',
            'notes' => 'nullable|string'
        ]);

        Log::info("DebtRepayment: Validation passed.");

        DB::beginTransaction();
        try {
            $user = Auth::user();
            $amountPaid = $validated['amount'];

            // 1. Create Container
            Log::info("DebtRepayment: Creating DebtRepayment record...");
            $repayment = DebtRepayment::create([
                'store_id' => $user->store_id,
                'user_id' => $user->id,
                'customer_id' => $validated['customer_id'],
                'receipt_number' => 'RPY-' . strtoupper(Str::random(8)),
                'amount_paid' => $amountPaid,
                'payment_date' => $validated['payment_date'],
                'notes' => $validated['notes'],
            ]);
            Log::info("DebtRepayment: Created ID: " . $repayment->id);

            // 2. Log Incoming Money
            Log::info("DebtRepayment: Creating Payment Transaction...");
            $this->createPaymentRecord($repayment, $validated);

            // 3. Allocation Logic
            $remainingMoney = $amountPaid;

            Log::info("DebtRepayment: Fetching Debts to pay. Strategy: " . (!empty($validated['selected_debt_ids']) ? "Selected IDs" : "FIFO"));

            $query = CustomerDebt::where('customer_id', $validated['customer_id'])
                ->where('status', 'active')
                ->where('balance', '>', 0);

            if (!empty($validated['selected_debt_ids'])) {
                $query->whereIn('id', $validated['selected_debt_ids']);
            } else {
                $query->orderBy('due_date', 'asc');
            }

            $targets = $query->get();
            Log::info("DebtRepayment: Found " . $targets->count() . " target debts.");

            foreach ($targets as $debt) {
                if ($remainingMoney <= 0) break;

                $paymentForThisDebt = min($remainingMoney, $debt->balance);
                Log::info("DebtRepayment: Paying Debt ID {$debt->id}. Bal: {$debt->balance}. Paying: {$paymentForThisDebt}");

                $debt->balance -= $paymentForThisDebt;
                if ($debt->balance <= 0) {
                    $debt->balance = 0;
                    $debt->status = 'cleared';
                }
                $debt->save();

                $remainingMoney -= $paymentForThisDebt;
            }

            // 4. Handle Overpayment (Change)
            if ($remainingMoney > 0) {
                Log::info("DebtRepayment: Overpayment detected. Creating Change record for: " . $remainingMoney);
                PaymentToCustomer::create([
                    'store_id' => $user->store_id,
                    'user_id' => $user->id,
                    'customer_id' => $validated['customer_id'],
                    'amount' => $remainingMoney,
                    'type' => 'change',
                    'method' => 'cash',
                    'notes' => "Change from Debt Repayment #{$repayment->receipt_number}",
                    'payment_date' => now(),
                ]);
            }

            DB::commit();
            Log::info("DebtRepayment: Transaction Committed Successfully.");
            // 🟢 NOTIFY STORE (Debt Cleared/Paid)
            $customerName = \App\Models\Customer::find($validated['customer_id'])->name ?? 'Customer';

            $this->notifyStore(
                $user->store_id,
                "Debt Repayment Received",
                "{$customerName} paid " . number_format($validated['amount']) . " towards their debt.",
                route('debts.show', $validated['customer_id']) // Link to the customer statement
            );

            $msg = $remainingMoney > 0
                ? 'Repayment Recorded. Change Due: ' . number_format($remainingMoney, 2)
                : 'Repayment Recorded Successfully.';

            return back()->with('success', $msg);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Debt Repayment CRITICAL FAILURE: " . $e->getMessage());
            Log::error($e->getTraceAsString());

            return back()->with('error', 'System Error: ' . $e->getMessage());
        }
    }

    private function createPaymentRecord(DebtRepayment $repayment, $data)
    {
        $groupId = 'GRP-' . strtoupper(Str::random(8));
        $method = $data['method'];
        $childModel = null;

        if (in_array($method, ['cash', 'mpesa', 'bank_transfer'])) {
            $cat = match($method) { 'mpesa' => 'mpesa_manual', 'bank_transfer' => 'bank_transfer', default => 'cash' };
            $childModel = ManualTransaction::create([
                'method_category' => $cat,
                'reference_no' => $data['transaction_ref'] ?? null,
                'amount_tendered' => $data['amount'],
                'notes' => "Debt Repayment"
            ]);
        } elseif ($method === 'card') {
            $childModel = CardTransaction::create([
                'card_type' => 'visa',
                'auth_code' => $data['transaction_ref'] ?? null,
                'last_four' => null
            ]);
        }

        if ($childModel) {
            Payment::create([
                'store_id' => $repayment->store_id,
                'user_id' => $repayment->user_id,
                'payment_group_id' => $groupId,
                'payable_type' => DebtRepayment::class,
                'payable_id' => $repayment->id,
                'method_type' => get_class($childModel),
                'method_id' => $childModel->id,
                'method' => $method,
                'amount' => $data['amount'],
                'status' => 'completed',
                'payment_date' => $data['payment_date'],
            ]);
        }
    }

    // --- EXPORTS ---

   public function exportDebtorsPdf($ids)
    {
        $idArray = array_filter(explode(',', $ids));
        if (empty($idArray)) return back()->with('error', 'No records selected.');

        // 1. Context
        $company = \App\Models\CompanySetting::where('is_default', true)->first();
        $store = \Illuminate\Support\Facades\Auth::user()->store ?? \App\Models\Store::first();

        // 2. Data with Eager Loading
        $debtors = \App\Models\Customer::whereIn('id', $idArray)
            ->with('store:id,name') // 🟢 LOAD STORE RELATIONSHIP
            ->withSum(['debts' => fn($q) => $q->where('status', 'active')], 'balance')
            ->whereHas('debts', function($q) {
                $q->where('status', 'active')->where('balance', '>', 0);
            })
            ->get()
            ->sortByDesc('debts_sum_balance');

        // 3. Stats
        $totalOutstanding = $debtors->sum('debts_sum_balance');
        $debtorsCount = $debtors->count();
        $avgDebt = $debtorsCount > 0 ? $totalOutstanding / $debtorsCount : 0;

        $stats = [
            'total_outstanding' => $totalOutstanding,
            'debtors_count' => $debtorsCount,
            'avg_debt' => $avgDebt,
        ];

        $pdf = Pdf::loadView('debts.list-pdf', compact('debtors', 'store', 'company', 'stats'))
            ->setPaper('a4', 'portrait');

        return $pdf->download('Debtors_List.pdf');
    }

    public function exportDebtorsExcel($ids)
    {
        // 🟢 1. FILTER IDS
        $idArray = array_filter(explode(',', $ids));

        if (empty($idArray)) {
            return back()->with('error', 'No records selected.');
        }

        $debtors = \App\Models\Customer::whereIn('id', $idArray) // <--- FILTER HERE
            ->withSum(['debts' => fn($q) => $q->where('status', 'active')], 'balance')
            ->whereHas('debts', function($q) {
                $q->where('status', 'active')->where('balance', '>', 0);
            })
            ->get()
            ->sortByDesc('debts_sum_balance');

        return Excel::download(new class($debtors) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
            protected $debtors;
            public function __construct($debtors) { $this->debtors = $debtors; }
            public function collection() {
                return $this->debtors->map(fn ($c) => [
                    $c->name,
                    $c->phone ?? $c->number ?? '-',
                    $c->store->name ?? 'Global',
                    (float) $c->credit_limit,
                    (float) $c->debts_sum_balance,
                    $c->credit_limit > 0
                        ? round(($c->debts_sum_balance / $c->credit_limit) * 100, 1) . '%'
                        : 'N/A'
                ]);
            }
            public function headings(): array { return ['Customer Name', 'Phone', 'Store/Group', 'Credit Limit', 'Total Outstanding', 'Limit Usage']; }
        }, 'Debtors_List.xlsx');
    }

    public function exportStatementPdf(Customer $customer)
    {
        // 🟢 1. FETCH STORE CONTEXT (For the PDF Header)
        // Uses the logged-in user's store, or the first store in DB as fallback
        $store = Auth::user()->store ?? \App\Models\Store::first();

        // 🟢 2. FETCH DEBTS
        // We get all debts (Active & Settled) to show full history,
        // or you can add ->where('status', 'active') if you only want outstanding ones.
        $debts = $customer->debts()
            ->with('source') // Loads the Invoice or Opening Balance source
            ->orderBy('created_at', 'asc')
            ->get();

        // 🟢 3. CALCULATE SUMMARY
        $totalInvoiced = $debts->sum('amount');
        $totalPaid = $debts->sum('paid'); // Assuming 'paid' or derived from amount - balance
        $totalDue = $debts->sum('balance');

        $summary = [
            'invoiced' => $totalInvoiced,
            'paid' => $totalInvoiced - $totalDue, // Derived paid amount
            'due' => $totalDue
        ];

        $pdf = Pdf::loadView('debts.statement-pdf', compact('customer', 'debts', 'store', 'summary'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("Statement_{$customer->name}_{{ now()->format('Ymd') }}.pdf");
    }


}
