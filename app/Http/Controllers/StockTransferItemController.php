<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\StockTransferItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class StockTransferItemController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        $query = StockTransferItem::with(['product', 'stockTransfer.sourceStore', 'stockTransfer.destinationStore']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('product', fn($sq) => $sq->where('name', 'like', "%{$search}%")->orWhere('sku', 'like', "%{$search}%"))
                  ->orWhereHas('stockTransfer', fn($sq) => $sq->where('reference', 'like', "%{$search}%"));
            });
        }

        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;
            $query->whereHas('stockTransfer', function ($q) use ($start, $end) {
                if ($start && $end) $q->whereBetween('transfer_date', [$start, $end]);
                elseif ($start) $q->whereDate('transfer_date', '>=', $start);
                elseif ($end) $q->whereDate('transfer_date', '<=', $end);
            });
        }

        $totalCount = $query->count();

        $transform = function ($item) {
            return [
                'id' => $item->id,
                'transfer_reference' => $item->stockTransfer->reference ?? 'N/A',
                'transfer_status' => $item->stockTransfer->status ?? 'unknown',
                // 🟢 FIX: Use ?-> before format() to prevent crashing on null dates
        'transfer_date'      => $item->stockTransfer?->transfer_date?->format('d M Y') ?? 'N/A',
                'source_store' => $item->stockTransfer->sourceStore->name ?? 'N/A',
                'destination_store' => $item->stockTransfer->destinationStore->name ?? 'N/A',
                'product_name' => $item->product->name ?? 'Deleted Product',
                'product_sku' => $item->product->sku ?? 'N/A',
                'quantity' => $item->quantity,
            ];
        };

        if ($perPage === -1) {
            $items = $query->latest()->get()->map($transform);
            $result = ['data' => $items, 'total' => $totalCount, 'per_page' => $perPage, 'from' => 1, 'to' => $totalCount, 'links' => []];
        } else {
            $result = $query->latest()->paginate($perPage)->withQueryString();
            $result->getCollection()->transform($transform);
        }

        return Inertia::render('stock-transfer-items/index', [
            'items' => $result,
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
        ]);
    }

    // 🟢 BULK PDF EXPORT
    public function bulkExportPdf(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $items = StockTransferItem::whereIn('id', $ids)
            ->with(['product', 'stockTransfer.sourceStore', 'stockTransfer.destinationStore'])
            ->latest()
            ->get();

        if ($items->isEmpty()) return back()->with('error', 'No items selected.');

        $pdf = Pdf::loadView('stock-transfer-items.bulk-pdf', ['items' => $items, 'date_from' => null, 'date_to' => null])
            ->setPaper('a4', 'landscape');

        return $pdf->download('stock_movement_selection.pdf');
    }

    // 🟢 BULK EXCEL EXPORT
    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $items = StockTransferItem::whereIn('id', $ids)
            ->with(['product', 'stockTransfer.sourceStore', 'stockTransfer.destinationStore'])
            ->latest()
            ->get();

        if ($items->isEmpty()) return back()->with('error', 'No items selected.');

        return Excel::download(new class($items) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\ShouldAutoSize {
            protected $items;
            public function __construct($items) { $this->items = $items; }
            public function collection() {
                return $this->items->map(fn ($item) => [
                    'Date' => $item->stockTransfer->transfer_date?->format('Y-m-d'),
                    'Ref' => $item->stockTransfer->reference ?? '-',
                    'Status' => strtoupper($item->stockTransfer->status ?? ''),
                    'Product' => $item->product->name ?? '-',
                    'SKU' => $item->product->sku ?? '-',
                    'From' => $item->stockTransfer->sourceStore->name ?? '-',
                    'To' => $item->stockTransfer->destinationStore->name ?? '-',
                    'Qty' => $item->quantity,
                ]);
            }
            public function headings(): array { return ['Date', 'Reference', 'Status', 'Product', 'SKU', 'From', 'To', 'Qty']; }
        }, 'stock_movement_selection.xlsx');
    }
}
