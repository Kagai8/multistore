<?php

namespace App\Http\Controllers;

use App\Models\PaymentToCustomer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class PaymentToCustomerController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        $query = PaymentToCustomer::with(['customer', 'store', 'user', 'invoice', 'posSale']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('type', 'like', "%{$search}%")
                  ->orWhere('method', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('store', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('user', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
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
            'total_outgoing' => PaymentToCustomer::sum('amount'),
            'refunds_total' => PaymentToCustomer::where('type', 'refund')->sum('amount'),
            'change_total' => PaymentToCustomer::where('type', 'change')->sum('amount'),
        ];

        $totalCount = PaymentToCustomer::count();
        $filteredCount = $query->count();

        $transform = function (PaymentToCustomer $payment) {
            $sourceLabel = 'Direct';
            if ($payment->invoice_id) $sourceLabel = "Inv #{$payment->invoice->invoice_number}";
            elseif ($payment->pos_sale_id) $sourceLabel = "POS #{$payment->pos_sale->receipt_number}";

            return [
                'id' => $payment->id,
                'payment_date' => $payment->payment_date->format('Y-m-d'),
                'amount' => (float) $payment->amount,
                'type' => ucfirst($payment->type),
                'method' => ucfirst($payment->method),
                'notes' => $payment->notes,
                'customer_name' => $payment->customer->name ?? 'Walk-in',
                'store_name' => $payment->store->name ?? 'N/A',
                'user_name' => $payment->user->name ?? 'System',
                'source_label' => $sourceLabel,
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
                'links' => [], // Fixed missing links
            ];
        } else {
            $paginator = $query->latest()->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transform);
            $payments = $paginator;
        }

        return Inertia::render('payments-to-customers/index', [
            'payments' => $payments,
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'stats' => $stats,
        ]);
    }

    // --- EXPORTS ---

    public function exportPdf(PaymentToCustomer $payment)
    {
        $payment->load(['customer', 'store', 'user', 'invoice', 'posSale']);
        $pdf = Pdf::loadView('payments-to-customers.single-pdf', compact('payment'))
            ->setPaper('a5', 'landscape');

        return $pdf->download("Voucher_{$payment->id}.pdf");
    }

    public function exportExcel(PaymentToCustomer $payment)
    {
        return Excel::download(new class($payment) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            protected $p;
            public function __construct($p) { $this->p = $p; }
            public function collection() {
                return collect([[
                    $this->p->payment_date->format('Y-m-d'),
                    $this->p->type,
                    $this->p->customer->name ?? 'Walk-in',
                    $this->p->amount,
                    $this->p->method,
                    $this->p->notes
                ]]);
            }
            public function headings(): array { return ['Date', 'Type', 'Customer', 'Amount', 'Method', 'Notes']; }
        }, "Voucher_{$payment->id}.xlsx");
    }

    public function bulkExportPDF($ids)
    {
        $idArray = array_filter(explode(',', $ids));
        if (empty($idArray)) return back()->with('error', 'No records selected.');

        $payments = PaymentToCustomer::whereIn('id', $idArray)
            ->with(['customer', 'store', 'user'])
            ->latest()
            ->get();

        $pdf = Pdf::loadView('payments-to-customers.bulk-pdf', compact('payments'))
            ->setPaper('a4', 'landscape');

        return $pdf->download('Outgoing_Payments_Register.pdf');
    }

    public function bulkExportExcel($ids)
    {
        $idArray = array_filter(explode(',', $ids));
        if (empty($idArray)) return back()->with('error', 'No records selected.');

        $payments = PaymentToCustomer::whereIn('id', $idArray)
            ->with(['customer', 'store', 'user'])
            ->latest()
            ->get();

        return Excel::download(new class($payments) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
            protected $payments;
            public function __construct($payments) { $this->payments = $payments; }
            public function collection() {
                return $this->payments->map(fn ($p) => [
                    $p->payment_date->format('Y-m-d'),
                    ucfirst($p->type),
                    $p->store->name ?? 'N/A',
                    $p->customer->name ?? 'Walk-in',
                    (float) $p->amount,
                    ucfirst($p->method),
                    $p->user->name ?? 'System',
                    $p->notes
                ]);
            }
            public function headings(): array { return ['Date', 'Type', 'Store', 'Paid To', 'Amount', 'Method', 'Approved By', 'Notes']; }
        }, 'Outgoing_Payments_Register.xlsx');
    }
}
