<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\PosSession;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class PosSessionController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        $query = PosSession::with(['user', 'store']);

        // 🟢 SEARCH LOGIC
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('store', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;
            if ($start && $end) $query->whereBetween('start_time', [$start, $end]);
            elseif ($start) $query->whereDate('start_time', '>=', $start);
            elseif ($end) $query->whereDate('start_time', '<=', $end);
        }

        // 🟢 STATS
        $stats = [
            'total_sessions' => PosSession::count(),
            'open_sessions' => PosSession::where('status', 'open')->count(),
            'total_discrepancy' => PosSession::sum('cash_difference'), // Net difference
            'shortage_count' => PosSession::where('cash_difference', '<', 0)->count(),
        ];

        $totalCount = PosSession::count();
        $filteredCount = $query->count();

        $transform = function (PosSession $session) {
            return [
                'id' => $session->id,
                'user_name' => $session->user->name ?? 'Unknown',
                'store_name' => $session->store->name ?? 'N/A',
                'start_time' => $session->start_time->format('Y-m-d H:i'),
                'end_time' => $session->end_time ? $session->end_time->format('Y-m-d H:i') : 'Active',
                'opening_cash' => (float) $session->opening_cash,
                'closing_cash' => (float) $session->closing_cash,
                'cash_difference' => (float) $session->cash_difference,
                'status' => $session->status,
                'notes' => $session->notes ?? '-',
            ];
        };

        if ($perPage === -1) {
            $all = $query->latest('start_time')->get()->map($transform);
            $sessions = [
                'data' => $all,
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => $all->count() ? 1 : 0,
                'to' => $all->count(),
                'links' => []
            ];
        } else {
            $paginator = $query->latest('start_time')->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transform);
            $sessions = $paginator;
        }

        return Inertia::render('pos-sessions/index', [
            'sessions' => $sessions,
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'stats' => $stats,
        ]);
    }

    // --- EXPORTS ---

    public function exportPdf(PosSession $posSession) {
        $posSession->load(['user', 'store', 'sales.payments']);
        $company = CompanySetting::first();

        // Calculate Breakdown for PDF
        $sales = $posSession->sales()->where('status', 'completed')->get();
        $paymentBreakdown = ['cash' => 0, 'mpesa' => 0, 'card' => 0, 'credit' => 0, 'other' => 0];

        foreach ($sales as $sale) {
            foreach ($sale->payments as $p) {
                $m = $p->method;
                if (isset($paymentBreakdown[$m])) $paymentBreakdown[$m] += $p->amount;
                else $paymentBreakdown['other'] += $p->amount;
            }
            if ($sale->change_amount > 0) $paymentBreakdown['cash'] -= $sale->change_amount;
        }
        $expectedCash = $posSession->opening_cash + $paymentBreakdown['cash'];

        $pdf = Pdf::loadView('pos-sessions.single-pdf', compact('posSession', 'company', 'paymentBreakdown', 'expectedCash'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("Z-Report_Session_{$posSession->id}.pdf");
    }

    public function exportExcel(PosSession $posSession) {
        return Excel::download(new class($posSession) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
            protected $s;
            public function __construct($s) { $this->s = $s; }
            public function collection() {
                return collect([[
                    $this->s->id,
                    $this->s->user->name,
                    $this->s->store->name,
                    $this->s->start_time->format('Y-m-d H:i'),
                    $this->s->end_time ? $this->s->end_time->format('Y-m-d H:i') : 'Active',
                    $this->s->opening_cash,
                    $this->s->closing_cash,
                    $this->s->cash_difference,
                    ucfirst($this->s->status)
                ]]);
            }
            public function headings(): array { return ['ID', 'Cashier', 'Store', 'Start', 'End', 'Opening', 'Closing', 'Difference', 'Status']; }
        }, "Session_{$posSession->id}.xlsx");
    }

    public function bulkExportPDF($ids) {
        $idArray = array_filter(explode(',', $ids));
        if (empty($idArray)) return back()->with('error', 'No records.');

        $sessions = PosSession::whereIn('id', $idArray)
            ->with(['user', 'store'])
            ->latest('start_time')
            ->get();

        $company = CompanySetting::first();

        $pdf = Pdf::loadView('pos-sessions.bulk-pdf', compact('sessions', 'company'))->setPaper('a4', 'landscape');
        return $pdf->download('Sessions_Audit_Log.pdf');
    }

    public function bulkExportExcel($ids) {
        $idArray = array_filter(explode(',', $ids));
        if (empty($idArray)) return back()->with('error', 'No records.');

        $sessions = PosSession::whereIn('id', $idArray)
            ->with(['user', 'store'])
            ->latest('start_time')
            ->get();

        return Excel::download(new class($sessions) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
            protected $sessions;
            public function __construct($sessions) { $this->sessions = $sessions; }
            public function collection() {
                return $this->sessions->map(fn ($s) => [
                    $s->id,
                    $s->user->name ?? 'Unknown',
                    $s->store->name ?? 'N/A',
                    $s->start_time->format('Y-m-d H:i'),
                    $s->end_time ? $s->end_time->format('Y-m-d H:i') : 'Active',
                    $s->opening_cash,
                    $s->closing_cash,
                    $s->cash_difference,
                    ucfirst($s->status)
                ]);
            }
            public function headings(): array { return ['ID', 'Cashier', 'Store', 'Opened At', 'Closed At', 'Opening Float', 'Closing Count', 'Difference', 'Status']; }
        }, 'Sessions_Register.xlsx');
    }
}
