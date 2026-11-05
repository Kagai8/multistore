<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportFilterRequest;
use App\Models\AdjustmentReason;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockAdjustment;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ValuationReportController extends Controller
{
    public function index(ReportFilterRequest $request)
    {
        $validated = $request->validated();
        $tab = $validated['tab'] ?? 'valuation';

        // 🟢 Robust Pagination Fix: Ensure it's never 0 or null on first load
        $perPage = (isset($validated['perPage']) && (int) $validated['perPage'] > 0) ? (int) $validated['perPage'] : ((isset($validated['perPage']) && (int) $validated['perPage'] === -1) ? -1 : 10);

        if ($tab === 'movement' && isset($validated['reference'])) {
            Log::info('Movement Reference Filter Applied', ['ref' => $validated['reference']]);
        }

        switch ($tab) {
            case 'movement':
                $query = StockTransferItem::query()
                    ->join('products', 'stock_transfer_items.product_id', '=', 'products.id')
                    ->join('stock_transfers', 'stock_transfer_items.stock_transfer_id', '=', 'stock_transfers.id')
                    ->join('stores as source', 'stock_transfers.source_store_id', '=', 'source.id')
                    ->join('stores as dest', 'stock_transfers.destination_store_id', '=', 'dest.id')
                    ->leftJoin('users as initiator', 'stock_transfers.user_id', '=', 'initiator.id')
                    ->select(
                        'stock_transfer_items.*',
                        'products.name as product_name',
                        'stock_transfers.status as status',
                        'stock_transfers.reference as reference_number',
                        'stock_transfers.delivery_type',
                        'stock_transfers.carrier_name',
                        'source.name as source_name',
                        'dest.name as destination_name',
                        'initiator.name as user_name'
                    )
                    ->with(['product.brand', 'product.category']);
                $sortCol = 'stock_transfer_items.created_at';
                break;

            case 'adjustments':
                $query = StockAdjustment::query()
                    ->join('products', 'stock_adjustments.product_id', '=', 'products.id')
                    ->join('stores', 'stock_adjustments.store_id', '=', 'stores.id')
                    ->leftJoin('adjustment_reasons', 'stock_adjustments.adjustment_reason_id', '=', 'adjustment_reasons.id')
                    ->select(
                        'stock_adjustments.*',
                        'products.name as product_name',
                        'stores.name as store_name',
                        'adjustment_reasons.name as reason_name',
                        'stock_adjustments.quantity as adjusted_qty',
                        DB::raw('("stock_adjustments"."quantity" * "products"."buying_price") as value_impact')
                    )
                    ->with(['product.brand', 'product.category', 'user']);
                $sortCol = 'stock_adjustments.created_at';
                break;

            case 'valuation':
            default:
                $query = Stock::query()
                    ->join('products', 'stocks.product_id', '=', 'products.id')
                    ->select(
                        'stocks.*',
                        'products.name as product_name',
                        'products.buying_price',
                        'products.retail_price',
                        DB::raw('(stocks.current_stock * products.buying_price) as asset_value')
                    )
                    ->with(['product.brand', 'product.category', 'store']);
                $sortCol = 'stocks.created_at';
                break;
        }

        $this->applyCompoundFilters($query, $validated, $tab);

        if ($perPage === -1) {
            $allData = $query->orderBy($sortCol, 'desc')->get();
            $reportData = [
                'data' => $allData,
                'total' => $allData->count(),
                'from' => 1,
                'to' => $allData->count(),
                'current_page' => 1,
                'per_page' => $allData->count(),
                'last_page' => 1,
                'links' => [],
            ];
        } else {
            $reportData = $query->orderBy($sortCol, 'desc')->paginate($perPage)->withQueryString();
        }

        return Inertia::render('valuation-reports/index', [
            'reportData' => $reportData,
            'stats' => $this->calculateGlobalStats($validated),
            'lookups' => $this->getLookups(),
            'filters' => $validated,
        ]);
    }

    private function applyCompoundFilters($query, array $data, string $tab)
    {
        $productsTable = 'products';
        $transfersTable = 'stock_transfers';
        $adjustmentTable = 'stock_adjustments';

        // 1. Generic Product Filters (Brand, Category, Product)
        if (! empty($data['brand_id'])) {
            $query->where("$productsTable.brand_id", $data['brand_id']);
        }
        if (! empty($data['category_id'])) {
            $query->where("$productsTable.category_id", $data['category_id']);
        }
        if (! empty($data['product_id'])) {
            $query->where("$productsTable.id", $data['product_id']);
        }

        // 2. Search Logic
        if (! empty($data['search'])) {
            $query->where(function ($q) use ($data, $productsTable) {
                $q->where("$productsTable.name", 'like', "%{$data['search']}%")
                    ->orWhere("$productsTable.sku", 'like', "%{$data['search']}%");
            });
        }

        // 3. Consolidated Date Range Filter (Determines correct table per tab)
        $dateColumn = match ($tab) {
            'movement' => "$transfersTable.created_at",
            'adjustments' => "$adjustmentTable.created_at",
            default => 'stocks.created_at', // stocks table for valuation
        };

        if (! empty($data['start_date'])) {
            $query->whereDate($dateColumn, '>=', $data['start_date']);
        }
        if (! empty($data['end_date'])) {
            $query->whereDate($dateColumn, '<=', $data['end_date']);
        }

        // 4. Tab-Specific Filters
        if ($tab === 'adjustments' && ! empty($data['adjustment_reason_id'])) {
            $query->where("$adjustmentTable.adjustment_reason_id", $data['adjustment_reason_id']);
        }

        if ($tab === 'movement' && ! empty($data['reference']) && $data['reference'] !== 'undefined') {
            $query->where("$transfersTable.id", $data['reference']);
        }

        // 5. Store Logic (Handles Source/Dest for Transfers)
        if (isset($data['store_id']) && $data['store_id'] !== 'all' && $data['store_id'] !== '') {
            if ($tab === 'movement') {
                $query->where(function ($q) use ($data, $transfersTable) {
                    $q->where("$transfersTable.source_store_id", $data['store_id'])
                        ->orWhere("$transfersTable.destination_store_id", $data['store_id']);
                });
            } elseif ($tab === 'adjustments') {
                $query->where("$adjustmentTable.store_id", $data['store_id']);
            } else {
                $query->where('stocks.store_id', $data['store_id']);
            }
        }

        // 6. User (Staff) Filter
        if (! empty($data['user_id']) && $tab !== 'valuation') {
            $userCol = ($tab === 'movement') ? "$transfersTable.user_id" : "$adjustmentTable.user_id";
            $query->where($userCol, $data['user_id']);
        }

        // 7. Numerical Range Filters (Price / Stock / Qty)
        if ($tab === 'valuation') {
            if (isset($data['min_price']) && $data['min_price'] !== '') {
                $query->where("$productsTable.buying_price", '>=', (float) $data['min_price']);
            }
            if (isset($data['max_price']) && $data['max_price'] !== '') {
                $query->where("$productsTable.buying_price", '<=', (float) $data['max_price']);
            }
            if (isset($data['stock_min']) && $data['stock_min'] !== '') {
                $query->where('stocks.current_stock', '>=', (int) $data['stock_min']);
            }
            if (isset($data['stock_max']) && $data['stock_max'] !== '') {
                $query->where('stocks.current_stock', '<=', (int) $data['stock_max']);
            }
        }

        if ($tab === 'adjustments') {
            if (isset($data['stock_min']) && $data['stock_min'] !== '') {
                $query->where("$adjustmentTable.quantity", '>=', (int) $data['stock_min']);
            }
            if (isset($data['stock_max']) && $data['stock_max'] !== '') {
                $query->where("$adjustmentTable.quantity", '<=', (int) $data['stock_max']);
            }
        }
    }

    private function calculateGlobalStats(array $filters)
    {
        $tab = $filters['tab'] ?? 'valuation';
        if ($tab === 'movement') {
            $query = StockTransferItem::query()
                ->join('stock_transfers', 'stock_transfer_items.stock_transfer_id', '=', 'stock_transfers.id')
                ->join('products', 'stock_transfer_items.product_id', '=', 'products.id');
            $this->applyCompoundFilters($query, $filters, 'movement');

            return [
                'total_transfers' => (int) $query->distinct('stock_transfer_id')->count(),
                'units_moved' => (int) $query->sum('quantity'),
                'pending_receipts' => (int) (clone $query)->where('stock_transfers.status', 'pending')->count(),
                'completed_transfers' => (int) (clone $query)->where('stock_transfers.status', 'received')->count(),
            ];
        }
        if ($tab === 'adjustments') {
            $query = StockAdjustment::query()->join('products', 'stock_adjustments.product_id', '=', 'products.id');
            $this->applyCompoundFilters($query, $filters, 'adjustments');

            return [
                'total_adjustments' => (int) $query->count(),
                'net_value_impact' => (float) $query->sum(DB::raw('"stock_adjustments"."quantity" * "products"."buying_price"')),
                'items_affected' => (int) $query->sum('quantity'),
            ];
        }
        $query = Stock::query()->join('products', 'stocks.product_id', '=', 'products.id');
        $this->applyCompoundFilters($query, $filters, 'valuation');

        return [
            'total_asset_value' => (float) $query->sum(DB::raw('stocks.current_stock * products.buying_price')),
            'potential_revenue' => (float) $query->sum(DB::raw('stocks.current_stock * products.retail_price')),
            'total_units' => (int) $query->sum('stocks.current_stock'),
            'low_stock_count' => (int) $query->where('stocks.current_stock', '<=', 5)->count(),
        ];
    }

    private function getLookups()
    {
        return [
            'brands' => Brand::all(['id', 'name']),
            'categories' => Category::all(['id', 'name']),
            'stores' => Store::all(['id', 'name']),
            'suppliers' => Supplier::all(['id', 'name']),
            'users' => User::all(['id', 'name']),
            'products' => Product::select('id', 'name', 'sku')->get(),
            'adjustment_reasons' => AdjustmentReason::where('is_active', true)->get(['id', 'name']),
            'references' => StockTransfer::select('id', 'reference as name')
                ->whereNotNull('reference')
                ->where('reference', '!=', '')
                ->orderBy('reference', 'asc')
                ->get(),
        ];
    }

    public function export(ReportFilterRequest $request, $format)
    {
        $validated = $request->validated();
        $tab = $validated['tab'] ?? 'valuation';

        // Get Company info (assuming a Company model or Settings table)
        // We filter for 'is_default' as per your fillable hint
        $company = \App\Models\CompanySetting::where('is_default', true)->first();
        $currentStore = Auth::user()->store;

        switch ($tab) {
            case 'movement':
                $query = StockTransferItem::query()
                    ->join('products', 'stock_transfer_items.product_id', '=', 'products.id')
                    ->join('stock_transfers', 'stock_transfer_items.stock_transfer_id', '=', 'stock_transfers.id')
                    ->join('stores as source', 'stock_transfers.source_store_id', '=', 'source.id')
                    ->join('stores as dest', 'stock_transfers.destination_store_id', '=', 'dest.id')
                    ->select(
                        'stock_transfer_items.*',
                        'products.name as product_name',
                        'stock_transfers.reference as reference_number',
                        'source.name as source_name',
                        'dest.name as destination_name'
                    );
                $view = 'reports.movement';
                $filename = 'inventory-movement-report';
                break;

            case 'adjustments':
                $query = StockAdjustment::query()
                    ->join('products', 'stock_adjustments.product_id', '=', 'products.id')
                    ->join('stores', 'stock_adjustments.store_id', '=', 'stores.id')
                    ->leftJoin('adjustment_reasons', 'stock_adjustments.adjustment_reason_id', '=', 'adjustment_reasons.id')
                    ->select(
                        'stock_adjustments.*',
                        'products.name as product_name',
                        'stores.name as store_name',
                        'adjustment_reasons.name as reason_name',
                        'stock_adjustments.quantity as adjusted_qty',
                        DB::raw('("stock_adjustments"."quantity" * "products"."buying_price") as value_impact')
                    );
                $view = 'reports.adjustments';
                $filename = 'stock-adjustments-report';
                break;

            case 'valuation':
            default:
                $query = Stock::query()
                    ->join('products', 'stocks.product_id', '=', 'products.id')
                    ->join('stores', 'stocks.store_id', '=', 'stores.id') // Added join for store name
                    ->select(
                        'stocks.*',
                        'products.name as product_name',
                        'products.buying_price',
                        'products.retail_price',
                        'stores.name as store_name',
                        DB::raw('(stocks.current_stock * products.buying_price) as asset_value')
                    );
                $view = 'reports.valuation';
                $filename = 'valuation-report';
                break;
        }

        $this->applyCompoundFilters($query, $validated, $tab);
        $data = $query->orderBy('created_at', 'desc')->get();
        $stats = $this->calculateGlobalStats($validated);

        if ($format === 'pdf') {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, [
                'data' => $data,
                'stats' => $stats,
                'company' => $company,
                'store' => $currentStore,
                'filters' => $validated,
            ])->setPaper('a4', 'landscape');

            return $pdf->download($filename.'_'.now()->format('Ymd').'.pdf');
        }

        // 🟢 Excel Export implementation
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\ValuationReportExport($data, $stats, $tab, $company),
            $filename.'.xlsx'
        );
    }
}
