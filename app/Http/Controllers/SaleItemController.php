<?php

namespace App\Http\Controllers;

use App\Models\SaleItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class SaleItemController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        // Eager load deep relationships
        $query = SaleItem::with([
            'product:id,name,sku',
            'sale' => function($q) {
                $q->select('id', 'reference_no', 'created_at', 'store_id', 'customer_id', 'source_type')
                  ->with(['store:id,name', 'customer:id,name']);
            }
        ]);

        // Search Filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                // Product Search
                $q->whereHas('product', fn($sq) => $sq->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"))
                  // Price Category
                  ->orWhere('price_category', 'like', "%{$search}%")
                  // Sale Reference, Store, Customer
                  ->orWhereHas('sale', function($sq) use ($search) {
                      $sq->where('reference_no', 'like', "%{$search}%")
                         ->orWhereHas('store', fn($ssq) => $ssq->where('name', 'like', "%{$search}%"))
                         ->orWhereHas('customer', fn($csq) => $csq->where('name', 'like', "%{$search}%"));
                  });
            });
        }

        // Date Filter (Using parent Sale date)
        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

            $query->whereHas('sale', function($q) use ($start, $end) {
                if ($start && $end) $q->whereBetween('created_at', [$start, $end]);
                elseif ($start) $q->where('created_at', '>=', $start);
                elseif ($end) $q->where('created_at', '<=', $end);
            });
        }

        // Stats
        $stats = [
            'total_items_sold' => SaleItem::sum('quantity'),
            'total_revenue' => SaleItem::sum('total_price'),
            'avg_ticket_item' => SaleItem::avg('total_price'),
        ];

        $totalCount = SaleItem::count();
        $filteredCount = $query->count();

        // Transform Data
        $transform = function (SaleItem $item) {
            $sourceLabel = 'Direct';
            if ($item->sale && str_contains($item->sale->source_type, 'Pos')) $sourceLabel = 'POS';
            elseif ($item->sale && str_contains($item->sale->source_type, 'Invoice')) $sourceLabel = 'Invoice';

            return [
                'id' => $item->id,
                'created_at' => $item->sale->created_at->format('Y-m-d H:i'),
                'product_name' => $item->product->name ?? 'Unknown',
                'sku' => $item->product->sku ?? '-',
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'total_price' => (float) $item->total_price,
                'price_category' => ucfirst($item->price_category), // Retail, Wholesale...
                'reference_no' => $item->sale->reference_no ?? '-',
                'customer_name' => $item->sale->customer->name ?? 'Walk-in',
                'store_name' => $item->sale->store->name ?? 'N/A',
                'source_type' => $sourceLabel,
            ];
        };

        // Pagination "All" Fix
        if ($perPage === -1) {
            $all = $query->latest()->get()->map($transform);
            $items = [
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
            $items = $paginator;
        }

        return Inertia::render('sale-items/index', [
            'items' => $items,
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'stats' => $stats,
        ]);
    }

    // --- Exports ---

    public function exportPdf(SaleItem $item)
    {
        $item->load(['sale.store', 'sale.customer', 'product']);
        $pdf = Pdf::loadView('sale-items.single-pdf', compact('item'))->setPaper('a6', 'portrait');
        return $pdf->stream("Item_{$item->id}.pdf");
    }

    public function exportExcel(SaleItem $item)
    {
        return $this->bulkExportExcel($item->id);
    }

    public function bulkExportPDF($ids)
    {
        $idArray = array_filter(explode(',', $ids));
        if (empty($idArray)) return back()->with('error', 'No items selected.');

        $items = SaleItem::whereIn('id', $idArray)
            ->with(['sale.store', 'sale.customer', 'product'])
            ->latest()
            ->get();

        $pdf = Pdf::loadView('sale-items.bulk-pdf', compact('items'))->setPaper('a4', 'landscape');
        return $pdf->download('Sales_Items_Report.pdf');
    }

    public function bulkExportExcel($ids)
    {
        $idArray = array_filter(explode(',', $ids));
        if (empty($idArray)) return back()->with('error', 'No items selected.');

        $items = SaleItem::whereIn('id', $idArray)
            ->with(['sale.store', 'sale.customer', 'product'])
            ->latest()
            ->get();

        return Excel::download(new class($items) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
            protected $items;
            public function __construct($items) { $this->items = $items; }
            public function collection() {
                return $this->items->map(fn ($i) => [
                    $i->sale->created_at->format('Y-m-d H:i'),
                    $i->product->name ?? 'Unknown',
                    $i->product->sku ?? '-',
                    $i->quantity,
                    ucfirst($i->price_category),
                    $i->unit_price,
                    $i->total_price,
                    $i->sale->reference_no ?? '-',
                    $i->sale->store->name ?? 'N/A',
                ]);
            }
            public function headings(): array {
                return ['Date', 'Product', 'SKU', 'Qty', 'Price Type', 'Unit Price', 'Total', 'Reference', 'Store'];
            }
        }, 'Sales_Items_Report.xlsx');
    }
}
