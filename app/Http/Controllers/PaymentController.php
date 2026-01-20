<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Payment;
use App\Models\PosSale;
use App\Models\Invoice;
use App\Models\DebtRepayment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        // Eager Load Polymorphic Relation + Store + User
        $query = Payment::with([
            'payable',
            'store:id,name',
            'user:id,name'
        ]);

        // 🟢 SEARCH LOGIC
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('transaction_ref', 'like', "%{$search}%")
                  ->orWhere('method', 'like', "%{$search}%")
                  ->orWhere('payment_group_id', 'like', "%{$search}%")
                  // Search Relations
                  ->orWhereHas('store', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('user', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  // Polymorphic Search (Customer via Payable)
                  ->orWhereHasMorph('payable', [Invoice::class, PosSale::class], function ($q) use ($search) {
                      $q->whereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%"))
                        ->orWhere('invoice_number', 'like', "%{$search}%") // Invoice
                        ->orWhere('receipt_number', 'like', "%{$search}%"); // POS
                  });
            });
        }

        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;
            if ($start && $end) $query->whereBetween('payment_date', [$start, $end]);
            elseif ($start) $query->whereDate('payment_date', '>=', $start);
            elseif ($end) $query->whereDate('payment_date', '<=', $end);
        }

        // 🟢 STATS
        $stats = [
            'total_collected' => Payment::sum('amount'),
            'mpesa_total' => Payment::where('method', 'like', '%mpesa%')->sum('amount'),
            'cash_total' => Payment::where('method', 'like', '%cash%')->sum('amount'),
        ];

        $totalCount = Payment::count();
        $filteredCount = $query->count();

        $transform = function (Payment $payment) {
            $customerName = 'Walk-In / Unknown';
            $payableLabel = 'Unknown Source';

            if ($payment->payable) {
                if (method_exists($payment->payable, 'customer')) {
                    $customerName = $payment->payable->customer->name ?? 'Unknown';
                }

                if ($payment->payable_type === Invoice::class) {
                    $payableLabel = "Invoice #" . ($payment->payable->invoice_number ?? 'N/A');
                } elseif ($payment->payable_type === PosSale::class) {
                    $payableLabel = "POS #" . ($payment->payable->receipt_number ?? 'N/A');
                } elseif ($payment->payable_type === DebtRepayment::class) {
                    $payableLabel = "Debt Repayment";
                }
            }

            return [
                'id' => $payment->id,
                'transaction_ref' => $payment->transaction_ref ?? $payment->payment_group_id ?? '-',
                'payment_date' => $payment->payment_date ? $payment->payment_date->format('Y-m-d') : '-',
                'amount' => (float) $payment->amount,
                'method' => ucfirst($payment->method),
                'status' => $payment->status,
                'customer_name' => $customerName,
                'store_name' => $payment->store->name ?? 'N/A',
                'user_name' => $payment->user->name ?? 'System',
                'payable_type_label' => $payableLabel,
            ];
        };

        // 🟢 FIX PAGINATION 'ALL'
        if ($perPage === -1) {
            $all = $query->latest()->get()->map($transform);
            $payments = [
                'data' => $all,
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => $all->count() ? 1 : 0,
                'to' => $all->count(),
                'links' => []
            ];
        } else {
            $paginator = $query->latest()->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transform);
            $payments = $paginator;
        }

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'stats' => $stats,
        ]);
    }

    // --- EXPORTS ---

    public function exportPdf(Payment $payment) {
        $payment->load(['payable.customer', 'store', 'user']);
        $pdf = Pdf::loadView('payments.single-pdf', compact('payment'))->setPaper('a5', 'landscape');
        return $pdf->download("Receipt_{$payment->transaction_ref}.pdf");
    }

    public function exportExcel(Payment $payment) {
        return Excel::download(new class($payment) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
            protected $p;
            public function __construct($p) { $this->p = $p; }
            public function collection() {
                $customer = $this->p->payable->customer->name ?? 'Walk-in';
                return collect([[
                    $this->p->transaction_ref,
                    $this->p->payment_date->format('Y-m-d'),
                    $this->p->store->name ?? 'N/A',
                    $customer,
                    ucfirst($this->p->method),
                    $this->p->amount
                ]]);
            }
            public function headings(): array { return ['Ref', 'Date', 'Store', 'Customer', 'Method', 'Amount']; }
        }, "Payment_{$payment->id}.xlsx");
    }

    public function bulkExportPDF($ids) {
        $idArray = array_filter(explode(',', $ids));
        if (empty($idArray)) return back()->with('error', 'No records.');

        $payments = Payment::whereIn('id', $idArray)
            ->with(['payable.customer', 'store', 'user'])
            ->latest()
            ->get();

        $pdf = Pdf::loadView('payments.bulk-pdf', compact('payments'))->setPaper('a4', 'landscape');
        return $pdf->download('Payments_Register.pdf');
    }

    public function bulkExportExcel($ids) {
        $idArray = array_filter(explode(',', $ids));
        if (empty($idArray)) return back()->with('error', 'No records.');

        $payments = Payment::whereIn('id', $idArray)
            ->with(['payable.customer', 'store', 'user'])
            ->latest()
            ->get();

        return Excel::download(new class($payments) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
            protected $payments;
            public function __construct($payments) { $this->payments = $payments; }
            public function collection() {
                return $this->payments->map(fn ($p) => [
                    $p->payment_date ? $p->payment_date->format('Y-m-d') : '-',
                    $p->transaction_ref,
                    $p->store->name ?? 'N/A',
                    $p->payable->customer->name ?? 'Walk-in',
                    ucfirst($p->method),
                    $p->amount,
                    $p->user->name ?? 'System'
                ]);
            }
            public function headings(): array { return ['Date', 'Ref', 'Store', 'Customer', 'Method', 'Amount', 'Received By']; }
        }, 'Payments_Register.xlsx');
    }
}
