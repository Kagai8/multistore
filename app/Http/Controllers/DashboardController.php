<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

// Models
use App\Models\Store;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\Stock;
use App\Models\Sale;
use App\Models\Invoice;
use App\Models\StockAdjustment;
use App\Models\Payment;
use App\Models\CustomerDebt;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $isGlobal = $user->isGlobal();
        $storeId = $user->store_id;

        $days = $request->input('days', 7);

        // 🟢 NOTIFICATIONS LOGIC (Kept as you requested)
        $notifications = $user->notifications()
            ->latest()
            ->take(15)
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id,
                    'title' => $n->data['title'] ?? 'System Alert',
                    'message' => $n->data['message'] ?? '',
                    'time' => $n->created_at->diffForHumans(),
                    'read' => !is_null($n->read_at),
                    'action_url' => $n->data['action_url'] ?? null,
                ];
            });

        return Inertia::render('dashboard', [ // Capitalized 'Dashboard' to match component usually
            'stats' => $this->buildStats($isGlobal, $storeId),
            'chartData' => $this->buildChartData($isGlobal, $storeId, $days),
            'topProducts' => $this->buildTopProducts($isGlobal, $storeId),
            'recentActivity' => $this->buildComprehensiveActivity($isGlobal, $storeId),
            'notifications' => $notifications,
            'filters' => ['days' => (int)$days],

            // 🟢 I ADDED THIS BLOCK BELOW
            // Your React Dashboard checks 'inventoryConfig'. Without this, the page stays on "Loading..."
            'inventoryConfig' => [
                'userContext' => [
                    'store_name' => $user->store->name ?? 'Head Office',
                    'roles' => $user->getRoleNames()->first() ?? 'Staff',
                    'is_global_user' => $isGlobal
                ]
            ]
        ]);
    }

    // ------------------------------------------------------------------
    // YOUR PRIVATE METHODS (UNTOUCHED)
    // ------------------------------------------------------------------

    private function buildStats(bool $isGlobal, ?int $storeId): array
    {
        $paymentQuery = Payment::query();
        $stockQuery = Stock::query();
        $transferQuery = StockTransfer::query();

        // DEBT QUERY FIX
        $debtQuery = CustomerDebt::where('status', 'active');

        if (!$isGlobal && $storeId) {
            $paymentQuery->where('store_id', $storeId);
            $stockQuery->where('store_id', $storeId);
            $transferQuery->where('destination_store_id', $storeId);

            // Filter Debt by the related Invoice's Store ID
            $debtQuery->whereHasMorph('source', [Invoice::class], function ($q) use ($storeId) {
                $q->where('store_id', $storeId);
            });
        }

        return [
            'total_stores' => $isGlobal ? Store::count() : 1,
            'active_products' => Product::where('is_active', true)->count(),
            'pending_transfers' => $transferQuery->where('status', 'sent')->count(),
            'low_stock_items' => $stockQuery->whereColumn('current_stock', '<=', 'reorder_level')->count(),
            'today_revenue' => $paymentQuery->whereDate('payment_date', Carbon::today())->sum('amount'),
            'total_debt' => $debtQuery->sum('balance'),
        ];
    }

    private function buildChartData(bool $isGlobal, ?int $storeId, int $days): array
    {
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $query = Sale::whereNotIn('status', ['void', 'cancelled'])
            ->whereBetween('created_at', [$startDate, $endDate]);

        if (!$isGlobal && $storeId) {
            $query->where('store_id', $storeId);
        }

        $rawData = $query
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        $period = CarbonPeriod::create($startDate, $endDate);
        $chartData = [];

        foreach ($period as $date) {
            $dateString = $date->format('Y-m-d');
            $chartData[] = [
                'date' => $date->format('D, M j'),
                'total' => (float) ($rawData[$dateString] ?? 0),
            ];
        }

        return $chartData;
    }

    private function buildTopProducts(bool $isGlobal, ?int $storeId): array
    {
        $query = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->whereNotIn('sales.status', ['void', 'cancelled'])
            ->select(
                'products.name',
                'products.sku',
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw('SUM(sale_items.total_price) as revenue')
            )
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderByDesc('qty')
            ->limit(5);

        if (!$isGlobal && $storeId) {
            $query->where('sales.store_id', $storeId);
        }

        return $query->get()->map(function ($item) {
            return [
                'name' => $item->name ?? 'Unknown Item',
                'sku' => $item->sku ?? '-',
                'qty' => (int) $item->qty,
                'revenue' => (float) $item->revenue,
            ];
        })->toArray();
    }

    private function buildComprehensiveActivity(bool $isGlobal, ?int $storeId): array
    {
        $limit = 5;
        $collection = collect();

        // 1. Transfers
        $transfers = StockTransfer::with(['sourceStore', 'destinationStore'])->latest()->take($limit);
        if (!$isGlobal && $storeId) {
            $transfers->where(fn($q) => $q->where('source_store_id', $storeId)->orWhere('destination_store_id', $storeId));
        }
        foreach ($transfers->get() as $t) {
            $collection->push([
                'timestamp' => $t->created_at,
                'action' => 'Transfer ' . $t->status,
                'target' => $t->reference ?? 'TR-#',
                'store' => $t->destinationStore->name ?? 'Unknown',
                'type' => 'transfer'
            ]);
        }

        // 2. Invoices
        $invoices = Invoice::latest()->take($limit);
        if (!$isGlobal && $storeId) $invoices->where('store_id', $storeId);
        foreach ($invoices->get() as $i) {
            $collection->push([
                'timestamp' => $i->created_at,
                'action' => 'Invoice Created',
                'target' => $i->invoice_number,
                'store' => $i->store->name ?? 'Unknown',
                'type' => 'invoice'
            ]);
        }

        // 3. Stock Adjustments
        $adjustments = StockAdjustment::with('product')->latest()->take($limit);
        if (!$isGlobal && $storeId) $adjustments->where('store_id', $storeId);
        foreach ($adjustments->get() as $adj) {
            $reason = 'Manual Adjustment';
            try {
                if ($adj->adjustment_reason_id && $adj->reason) {
                    $reason = $adj->reason->name;
                }
            } catch (\Exception $e) {}

            $collection->push([
                'timestamp' => $adj->created_at,
                'action' => 'Stock Adj (' . $reason . ')',
                'target' => ($adj->product->name ?? 'Item') . " ({$adj->quantity})",
                'store' => $adj->store->name ?? 'Unknown',
                'type' => 'adjustment'
            ]);
        }

        // 4. Sales
        $sales = Sale::whereNotIn('status', ['void', 'cancelled'])->latest()->take($limit);
        if (!$isGlobal && $storeId) $sales->where('store_id', $storeId);
        foreach ($sales->get() as $s) {
            $collection->push([
                'timestamp' => $s->created_at,
                'action' => 'Sale Completed',
                'target' => $s->reference_no,
                'store' => $s->store->name ?? 'Unknown',
                'type' => 'sale'
            ]);
        }

        return $collection->sortByDesc('timestamp')->take(8)->map(function ($item) {
            return [
                'action' => $item['action'],
                'target' => $item['target'],
                'store' => $item['store'],
                'time' => $item['timestamp']->diffForHumans(),
                'type' => $item['type']
            ];
        })->values()->toArray();
    }
}
