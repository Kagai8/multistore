<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportFilterRequest;
use App\Models\Stock;
use App\Models\StockTransferItem; // 🟢 Using Transfer Items instead of Movement
use App\Models\StockAdjustment;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Store;
use App\Models\User;
use App\Models\Supplier;
use App\Models\Product; // 🟢 Added for searchable dropdown
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf; // Ensure barryvdh/laravel-dompdf is installed

class ValuationReportController extends Controller
{
public function index(ReportFilterRequest $request)
{
    $validated = $request->validated();
    $tab = $validated['tab'] ?? 'valuation';
    $perPage = isset($validated['perPage']) ? (int)$validated['perPage'] : 10;

    $triggerFilters = collect($validated)->except(['tab', 'perPage'])->filter(fn($v) => !is_null($v) && $v !== '')->toArray();

    if (empty($triggerFilters)) {
        return Inertia::render('valuation-reports/index', [
            'reportData' => null,
            'stats'      => $this->getZeroStats(),
            'lookups'    => $this->getLookups(),
            'filters'    => $validated
        ]);
    }

    // Perspective Switcher with Tab-Specific Eager Loading
    switch ($tab) {
        case 'movement':
            $query = StockTransferItem::query()
                ->join('products', 'stock_transfer_items.product_id', '=', 'products.id')
                ->join('stock_transfers', 'stock_transfer_items.stock_transfer_id', '=', 'stock_transfers.id')
                ->select('stock_transfer_items.*', 'products.name as product_name')
                // 🟢 Load the stores through the transfer relationship
                ->with(['product.brand', 'product.category', 'stockTransfer.sourceStore', 'stockTransfer.destinationStore', 'stockTransfer.user']);
            break;

        case 'adjustments':
            $query = StockAdjustment::query()
                ->join('products', 'stock_adjustments.product_id', '=', 'products.id')
                ->select('stock_adjustments.*', 'products.name as product_name')
                ->with(['product.brand', 'product.category', 'store', 'user']);
            break;

        case 'valuation':
        default:
            $query = Stock::query()
                ->join('products', 'stocks.product_id', '=', 'products.id')
                ->select('stocks.*', 'products.name as product_name', 'products.buying_price', 'products.retail_price')
                ->with(['product.brand', 'product.category', 'store']);
            break;
    }

    $this->applyCompoundFilters($query, $validated, $tab);

    $totalCount = $query->count();

    if ($perPage === -1) {
        $data = $query->latest($query->getModel()->getTable() . '.created_at')->get();
        $reportData = [
            'data'  => $data,
            'total' => $totalCount,
            'from'  => $data->count() ? 1 : 0,
            'to'    => $data->count(),
            'links' => [],
        ];
    } else {
        $reportData = $query->latest($query->getModel()->getTable() . '.created_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    return Inertia::render('valuation-reports/index', [
        'reportData' => $reportData,
        'stats'      => $this->calculateGlobalStats($validated),
        'lookups'    => $this->getLookups(),
        'filters'    => $validated
    ]);
}

        /**
         * PDF Export Logic
         */
        public function exportPdf(ReportFilterRequest $request)
        {
            $validated = $request->validated();
            $tab = $validated['tab'] ?? 'valuation';

            // Replicate logic to get the right dataset
            $query = Stock::query()
                ->join('products', 'stocks.product_id', '=', 'products.id')
                ->select('stocks.*', 'products.name as product_name', 'products.buying_price')
                ->with(['store']);

            $this->applyCompoundFilters($query, $validated, $tab);
            $data = $query->get();
            $stats = $this->calculateGlobalStats($validated);

            $pdf = Pdf::loadView('reports.valuation-pdf', compact('data', 'stats', 'validated'))
                    ->setPaper('a4', 'landscape');

            return $pdf->download('valuation-report-' . now()->format('Y-m-d') . '.pdf');
        }

        /**
         * Excel Export Stub
         */
        public function exportExcel(ReportFilterRequest $request)
        {
            // Placeholder for Maatwebsite Excel logic
            return response()->json(['message' => 'Excel export logic goes here']);
        }

    private function calculateGlobalStats(array $filters) {
        $query = Stock::query()->join('products', 'stocks.product_id', '=', 'products.id');
        $this->applyCompoundFilters($query, $filters, 'valuation');
        return [
            'total_asset_value' => (float) $query->sum(DB::raw('stocks.current_stock * products.buying_price')),
            'potential_revenue' => (float) $query->sum(DB::raw('stocks.current_stock * products.retail_price')),
            'total_units'       => (int) $query->sum('stocks.current_stock'),
            'low_stock_count'   => (int) $query->where('stocks.current_stock', '<=', 5)->count(),
        ];
    }

   private function applyCompoundFilters($query, array $data, string $tab)
    {
        $table = $query->getModel()->getTable();

        $query->where(function($q) use ($data, $table) {
            if (!empty($data['brand_id']))    $q->where('products.brand_id', $data['brand_id']);
            if (!empty($data['category_id'])) $q->where('products.category_id', $data['category_id']);

            // 🟢 FORCE INT CAST: URLs send strings, DB wants IDs.
            if (!empty($data['product_id'])) {
                $q->where('products.id', (int) $data['product_id']);
            }

            if (!empty($data['store_id'])) {
                if ($table === 'stock_transfer_items') {
                    $q->where(function($sq) use ($data) {
                        $sq->where('stock_transfers.from_store_id', (int)$data['store_id'])
                          ->orWhere('stock_transfers.to_store_id', (int)$data['store_id']);
                    });
                } else {
                    $q->where($table . '.store_id', (int)$data['store_id']);
                }
            }

            if (!empty($data['search'])) {
                $q->where(function($sq) use ($data) {
                    $sq->where('products.name', 'like', "%{$data['search']}%")
                      ->orWhere('products.sku', 'like', "%{$data['search']}%");
                });
            }
        });

        if ($tab === 'valuation') {
            if (!empty($data['min_price'])) $query->where('products.buying_price', '>=', $data['min_price']);
            if (!empty($data['max_price'])) $query->where('products.buying_price', '<=', $data['max_price']);
            if (!empty($data['stock_min'])) $query->where('stocks.current_stock', '>=', $data['stock_min']);
            if (!empty($data['stock_max'])) $query->where('stocks.current_stock', '<=', $data['stock_max']);
        }
    }

    private function getLookups()
    {
        return [
            'brands'     => Brand::all(['id', 'name']),
            'categories' => Category::all(['id', 'name']),
            'stores'     => Store::all(['id', 'name']),
            'suppliers'  => Supplier::all(['id', 'name']),
            'users'      => User::all(['id', 'name']),
            'products'   => Product::select('id', 'name', 'sku')->get(), // 🟢 Added for dropdown
        ];
    }

    private function getZeroStats()
    {
        return [
            'total_asset_value' => 0,
            'potential_revenue' => 0,
            'total_units'       => 0,
            'low_stock_count'   => 0,
        ];
    }
}
