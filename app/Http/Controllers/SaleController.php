<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Sale;
use App\Models\PosSale;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        $query = Sale::with([
            'customer:id,name',
            'user:id,name',
            'store:id,name',
            'items.product:id,name'
        ]);

        // 🟢 UPDATED SEARCH LOGIC
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhere('payment_status', 'like', "%{$search}%")
                  // Search Relations
                  ->orWhereHas('customer', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('store', fn($sq) => $sq->where('name', 'like', "%{$search}%")) // 🟢 Store Search
                  ->orWhereHas('user', fn($sq) => $sq->where('name', 'like', "%{$search}%")); // 🟢 User Search

                // 🟢 Source Search (Map "POS" or "Invoice" text to Class Names)
                if (stripos('POS', $search) !== false || stripos($search, 'pos') !== false) {
                    $q->orWhere('source_type', 'App\\Models\\PosSale');
                }
                if (stripos('Invoice', $search) !== false || stripos($search, 'inv') !== false) {
                    $q->orWhere('source_type', 'App\\Models\\Invoice');
                }
            });
        }

        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;
            if ($start && $end) $query->whereBetween('created_at', [$start, $end]);
            elseif ($start) $query->whereDate('created_at', '>=', $start);
            elseif ($end) $query->whereDate('created_at', '<=', $end);
        }

        // Stats Logic
        $stats = [
            'total_transactions' => Sale::count(),
            'total_revenue' => Sale::sum('total_amount'),
            'total_collected' => Sale::where('payment_status', 'paid')->sum('total_amount'),
        ];

        $totalCount = Sale::count();
        $filteredCount = $query->count();

        $transform = function (Sale $sale) {
            $sourceLabel = 'Unknown';
            if ($sale->source_type === \App\Models\PosSale::class) $sourceLabel = 'POS';
            elseif ($sale->source_type === \App\Models\Invoice::class) $sourceLabel = 'Invoice';

            // Derived Paid Amount Logic
            $derivedPaidAmount = $sale->payment_status === 'paid' ? (float) $sale->total_amount : 0.00;

            return [
                'id' => $sale->id,
                'reference_no' => $sale->reference_no,
                'created_at' => $sale->created_at->format('Y-m-d H:i'),
                'created_at_formatted' => $sale->created_at->format('d M Y, h:i A'),
                'customer_name' => $sale->customer->name ?? 'Unknown',
                'store_name' => $sale->store->name ?? 'N/A', // 🟢 This will be used in the table
                'user_name' => $sale->user->name ?? 'System',
                'source_type_label' => $sourceLabel,

                'total_amount' => (float) $sale->total_amount,
                'paid_amount' => $derivedPaidAmount,

                'payment_status' => $sale->payment_status,
                'status' => $sale->status,
                'items' => $sale->items->map(fn($item) => [
                    'product_name' => $item->product->name ?? 'Item #' . $item->product_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total_price' => $item->total_price,
                ]),
            ];
        };

        if ($perPage === -1) {
            $all = $query->latest()->get()->map($transform);
            $sales = [
                'data' => $all,
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => $all->count() ? 1 : 0,
                'to' => $all->count(),
                'links' => [],
            ];
        } else {
            $paginator = $query->latest()->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transform);
            $sales = $paginator;
        }

        return Inertia::render('sales/index', [
            'sales' => $sales,
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'stats' => $stats,
        ]);
    }

    public function show(Sale $sale)
    {
        // Not typically used if we use the Modal View in Index,
        // but can be implemented similarly to Index transform if needed.
        return redirect()->route('sales.index');
    }

    // --- EXPORTS ---

    /**
     * Single PDF: Sale Receipt/Record
     */
    public function exportPdf(Sale $sale)
    {
        $sale->load(['customer', 'store', 'user', 'items.product']);

        $pdf = Pdf::loadView('sales.single-pdf', compact('sale'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("Sale_{$sale->reference_no}.pdf");
    }

    /**
     * Bulk PDF: Sales Register (Landscape)
     */
    public function bulkExportPDF($ids)
    {
        // 🟢 Fix: Filter empty strings to prevent SQL error
        $idArray = array_filter(explode(',', $ids));

        if (empty($idArray)) {
            return back()->with('error', 'No records selected.');
        }

        $sales = Sale::whereIn('id', $idArray)
            ->with(['customer', 'store', 'user']) // 🟢 Loading Store and User
            ->latest()
            ->get();

        $pdf = Pdf::loadView('sales.bulk-pdf', compact('sales'))
            ->setPaper('a4', 'landscape'); // Landscape for better column fit

        return $pdf->download('Sales_Register.pdf');
    }

    /**
     * Bulk Excel: Export with Store & User
     */
    public function bulkExportExcel($ids)
    {
        // Fix: Filter empty strings
        $idArray = array_filter(explode(',', $ids));

        if (empty($idArray)) {
            return back()->with('error', 'No records selected.');
        }

        $sales = Sale::whereIn('id', $idArray)
            ->with(['customer', 'store', 'user'])
            ->latest()
            ->get();

        return Excel::download(new class($sales) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
            protected $sales;
            public function __construct($sales) { $this->sales = $sales; }

            public function collection() {
                return $this->sales->map(function ($s) {
                    // 🟢 1. Logic for Source Label
                    $source = 'Direct';
                    if (str_contains($s->source_type, 'PosSale')) $source = 'POS';
                    elseif (str_contains($s->source_type, 'Invoice')) $source = 'Invoice';

                    // 🟢 2. Logic for Paid Amount
                    // If status is 'paid', force total_amount.
                    // If 'partial', use paid_amount (if > 0, else 0).
                    // If 'unpaid', use 0.
                    $paidAmount = 0;
                    if ($s->payment_status === 'paid') {
                        $paidAmount = $s->total_amount;
                    } elseif ($s->payment_status === 'partial') {
                        $paidAmount = $s->paid_amount > 0 ? $s->paid_amount : 0;
                    }

                    return [
                        $s->created_at->format('Y-m-d'),
                        $s->reference_no,
                        $s->store->name ?? 'N/A',
                        $s->customer->name ?? 'Walk-in',
                        $s->user->name ?? 'System',
                        $source, // 🟢 Added Source Column
                        (float) $s->total_amount,
                        (float) $paidAmount, // 🟢 Use derived logic
                        strtoupper($s->payment_status),
                    ];
                });
            }

            public function headings(): array {
                // 🟢 Added 'Source' to headers
                return ['Date', 'Reference', 'Store', 'Customer', 'Cashier', 'Source', 'Total Amount', 'Paid Amount', 'Status'];
            }
        }, 'Sales_Register.xlsx');
    }
}
