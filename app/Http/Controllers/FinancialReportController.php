<?php

namespace App\Http\Controllers;

use App\Exports\FinancialReportExport;
use App\Http\Requests\ReportFilterRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\CompanySetting;
use App\Models\Customer;
use App\Models\CustomerDebt;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Product;
use App\Models\SaleItem;
use App\Models\Store;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
// For change calculation
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class FinancialReportController extends Controller
{
    public function index(ReportFilterRequest $request)
    {
        Log::info('Financial Hub Access', ['user' => Auth::id(), 'params' => $request->all()]);

        $validated = $request->validated();
        $tab = $validated['tab'] ?? 'profit_loss';
        // perPage may legitimately be -1, which the UI uses to mean "all rows".
        $perPage = isset($validated['perPage']) ? (int) $validated['perPage'] : 10;
        if ($perPage === 0) {
            $perPage = 10;
        }

        try {
            [$query, $sortCol] = $this->buildReportQuery($tab);

            $this->applyFinancialFilters($query, $validated, $tab);

            $reportData = ($perPage === -1)
                ? $query->orderBy($sortCol, 'desc')->get()
                : $query->orderBy($sortCol, 'desc')->paginate($perPage)->withQueryString();

            return Inertia::render('financial-reports/index', [
                'reportData' => $reportData,
                'stats' => $this->calculateFinancialStats($validated),
                'lookups' => $this->getFinancialLookups(),
                'filters' => $validated,
            ]);

        } catch (\Exception $e) {
            Log::error('Financial Report Error', ['msg' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return back()->withErrors(['error' => 'Failed to load report data.']);
        }
    }

    /**
     * Build the base query and sort column for a report tab.
     *
     * @return array{0: \Illuminate\Database\Eloquent\Builder, 1: string}
     */
    private function buildReportQuery(string $tab): array
    {
        switch ($tab) {
            case 'performance':
                $query = SaleItem::query()
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->join('products', 'sale_items.product_id', '=', 'products.id')
                    ->select(
                        'products.name as product_name',
                        'products.sku',
                        DB::raw('SUM(sale_items.quantity) as total_qty_sold'),
                        DB::raw('SUM(sale_items.total_price) as total_revenue'),
                        DB::raw('SUM((sale_items.unit_price - products.buying_price) * sale_items.quantity) as total_profit'),
                        DB::raw('AVG((sale_items.unit_price - products.buying_price) / NULLIF(sale_items.unit_price, 0) * 100) as avg_margin')
                    )
                    ->groupBy('products.id', 'products.name', 'products.sku');
                $sortCol = 'total_qty_sold';
                break;

            case 'tax_summary':
                $query = Invoice::query()
                    ->join('customers', 'invoices.customer_id', '=', 'customers.id')
                    ->select('invoices.*', 'customers.name as customer_name');
                $sortCol = 'invoice_date';
                break;

            case 'payments':
                // Net amount is tendered minus the change refunded for the same invoice.
                // The change rows live in payment_to_customers and are keyed by invoice,
                // not by payment, so a correlated subquery avoids fan-out on the join.
                $query = Payment::query()
                    ->join('users', 'payments.user_id', '=', 'users.id')
                    ->select(
                        'payments.method as payment_method',
                        'users.name as user_name',
                        'payments.amount as amount_tendered',
                        DB::raw("COALESCE((SELECT SUM(ptc.amount) FROM payment_to_customers ptc WHERE ptc.invoice_id = payments.invoice_id AND ptc.type = 'change'), 0) as change_given"),
                        DB::raw("payments.amount - COALESCE((SELECT SUM(ptc.amount) FROM payment_to_customers ptc WHERE ptc.invoice_id = payments.invoice_id AND ptc.type = 'change'), 0) as net_amount"),
                        'payments.created_at'
                    );
                $sortCol = 'payments.created_at';
                break;

            case 'debt_aging':
                $query = CustomerDebt::query()
                    ->join('customers', 'customer_debts.customer_id', '=', 'customers.id')
                    ->select(
                        'customer_debts.*',
                        'customers.name as customer_name',
                        DB::raw('EXTRACT(DAY FROM (NOW() - customer_debts.created_at))::int as days_overdue')
                    );
                $sortCol = 'customer_debts.created_at';
                break;

            case 'refunds_voids':
                $query = Invoice::query()
                    ->join('users', 'invoices.user_id', '=', 'users.id')
                    ->whereNotNull('invoices.voided_at') // Identifying voids
                    ->select(
                        'invoices.invoice_number as reference_no',
                        'users.name as staff_name',
                        'invoices.total_amount as amount',
                        'invoices.void_reason as reason_note',
                        'invoices.voided_at as created_at',
                        DB::raw("'Void' as void_type")
                    );
                $sortCol = 'invoices.voided_at';
                break;

            case 'profit_loss':
            default:
                $query = SaleItem::query()
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                    ->join('products', 'sale_items.product_id', '=', 'products.id')
                    ->join('stores', 'sales.store_id', '=', 'stores.id')
                    ->select(
                        'sale_items.*',
                        'products.name as product_name',
                        'products.buying_price as unit_cost',
                        'stores.name as store_name',
                        'sales.reference_no',
                        'sale_items.price_category',
                        DB::raw('(sale_items.unit_price - products.buying_price) * sale_items.quantity as gross_profit')
                    );
                $sortCol = 'sale_items.created_at';
                break;
        }

        return [$query, $sortCol];
    }

    /**
     * Stream the current tab as a downloadable report.
     */
    public function export(ReportFilterRequest $request, string $format)
    {
        $validated = $request->validated();
        $tab = $validated['tab'] ?? 'profit_loss';

        try {
            [$query, $sortCol] = $this->buildReportQuery($tab);
            $this->applyFinancialFilters($query, $validated, $tab);

            $rows = $query->orderBy($sortCol, 'desc')->limit(5000)->get();
            $filename = 'financial-'.$tab.'-report-'.now()->format('Ymd');

            if ($format === 'pdf') {
                $pdf = Pdf::loadView('reports.financial', [
                    'rows' => $rows,
                    'tab' => $tab,
                    'filters' => $validated,
                    'company' => CompanySetting::where('is_default', true)->first(),
                ])->setPaper('a4', 'landscape');

                return $pdf->download($filename.'.pdf');
            }

            return Excel::download(new FinancialReportExport($rows, $tab), $filename.'.xlsx');

        } catch (\Exception $e) {
            Log::error('Financial Report Export Error', ['msg' => $e->getMessage(), 'tab' => $tab]);

            return back()->with('error', 'Could not export this report: '.$e->getMessage());
        }
    }

    private function applyFinancialFilters($query, array $data, string $tab)
    {
        $table = $query->getModel()->getTable();

        // 🟢 Store Filter (Sales vs Invoices vs Payments)
        // Every report joins a different base table, so only filter on a column that
        // the current tab actually selects; otherwise the query fails at the DB.
        if (! empty($data['store_id']) && $data['store_id'] !== 'all') {
            if (in_array($tab, ['profit_loss', 'performance'], true)) {
                $query->where('sales.store_id', $data['store_id']);
            } elseif (Schema::hasColumn($table, 'store_id')) {
                $query->where($table.'.store_id', $data['store_id']);
            }
        }

        // 🟢 Date Range
        $dateField = ($tab === 'tax_summary') ? 'invoice_date' : 'created_at';
        if (Schema::hasColumn($table, $dateField)) {
            if (! empty($data['start_date'])) {
                $query->whereDate($table.'.'.$dateField, '>=', $data['start_date']);
            }
            if (! empty($data['end_date'])) {
                $query->whereDate($table.'.'.$dateField, '<=', $data['end_date']);
            }
        }

        // 🟢 Specific Lookups
        if (! empty($data['product_id']) && Schema::hasColumn($table, 'product_id')) {
            $query->where($table.'.product_id', $data['product_id']);
        }
        if (! empty($data['customer_id']) && Schema::hasColumn($table, 'customer_id')) {
            $query->where($table.'.customer_id', $data['customer_id']);
        }
        if (! empty($data['payment_method']) && Schema::hasColumn($table, 'method')) {
            $query->where($table.'.method', $data['payment_method']);
        }
        if (! empty($data['brand_id']) && method_exists($query->getModel(), 'product')) {
            $query->whereHas('product', fn ($q) => $q->where('brand_id', $data['brand_id']));
        }
    }

    private function calculateFinancialStats(array $filters)
    {
        $tab = $filters['tab'] ?? 'profit_loss';

        // Basic Stats for P&L and Performance
        if (in_array($tab, ['profit_loss', 'performance'])) {
            $q = SaleItem::query()->join('products', 'sale_items.product_id', '=', 'products.id');
            // Store join for filtering
            $q->join('sales', 'sale_items.sale_id', '=', 'sales.id');
            $this->applyFinancialFilters($q, $filters, $tab);

            return [
                'total_revenue' => (float) $q->sum('sale_items.total_price'),
                'total_cost' => (float) $q->sum(DB::raw('products.buying_price * sale_items.quantity')),
                'gross_profit' => (float) $q->sum(DB::raw('(sale_items.unit_price - products.buying_price) * sale_items.quantity')),
                'manual_price_sales' => (int) (clone $q)->where('sale_items.price_category', 'manual')->count(),
            ];
        }

        return [];
    }

    private function getFinancialLookups()
    {
        return [
            'stores' => Store::all(['id', 'name']),
            'customers' => Customer::all(['id', 'name']),
            'users' => User::all(['id', 'name']),
            'brands' => Brand::all(['id', 'name']),
            'categories' => Category::all(['id', 'name']),
            'products' => Product::select('id', 'name', 'sku')->get(),

            // 🟢 These fix the TypeScript 'options' error
            'report_limits' => [
                ['id' => '10', 'name' => 'Top 10'],
                ['id' => '50', 'name' => 'Top 50'],
                ['id' => 'all', 'name' => 'All Products'],
            ],
            'tax_statuses' => [
                ['id' => 'taxable', 'name' => 'Taxable'],
                ['id' => 'exempt', 'name' => 'Exempt'],
            ],
            'payment_methods' => [
                ['id' => 'cash', 'name' => 'Cash'],
                ['id' => 'mpesa', 'name' => 'M-Pesa'],
                ['id' => 'bank', 'name' => 'Bank/Card'],
            ],
            'aging_buckets' => [
                ['id' => 'current', 'name' => '0-30 Days'],
                ['id' => 'overdue', 'name' => '31-60 Days'],
                ['id' => 'critical', 'name' => '60+ Days'],
            ],
            'void_types' => [
                ['id' => 'void', 'name' => 'Voided Invoice'],
                ['id' => 'refund', 'name' => 'Product Refund'],
            ],
        ];
    }
}
