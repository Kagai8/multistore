<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class QuotationController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        $query = Quotation::with([
            'customer:id,name',
            'user:id,name',
            'store:id,name',
            'items.product:id,name'
        ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('quotation_number', 'like', "%{$search}%")
                  ->orWhere('status', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;
            if ($start && $end) $query->whereBetween('quotation_date', [$start, $end]);
            elseif ($start) $query->whereDate('quotation_date', '>=', $start);
            elseif ($end) $query->whereDate('quotation_date', '<=', $end);
        }

        // 🟢 NEW: Calculate KPI Stats (Global or Filtered can be discussed, let's do Global for now)
        // 1. DRAFT COUNT
        $draftCount = Quotation::where('status', 'draft')->count();

        // 2. VALUE WON (Changed from 'Sent' to 'Accepted')
        // This calculates the total money from quotes you have successfully closed.
        $acceptedValue = Quotation::where('status', 'accepted')->sum('total_amount');

        // 3. CONVERSION RATE
        $acceptedCount = Quotation::where('status', 'accepted')->count();
        $totalQuotes = Quotation::count();
        // Avoid division by zero
        $conversionRate = $totalQuotes > 0 ? round(($acceptedCount / $totalQuotes) * 100, 1) : 0;

        $stats = [
            'draft_count' => $draftCount,
            'accepted_value' => $acceptedValue, // <--- Renamed key
            'conversion_rate' => $conversionRate,
        ];

        // Lookup Data
        $customers = Customer::select('id', 'name')->orderBy('name')->get();
        $products = Product::select('id', 'name', 'sku', 'retail_price', 'wholesale_price', 'special_price')->get();
        $productStocks = Stock::select('product_id', 'store_id', 'current_stock')
            ->get()
            ->groupBy('product_id')
            ->map(fn($stocks) => $stocks->keyBy('store_id')->map(fn($stock) => (int)$stock->current_stock));

        $totalCount = Quotation::count();
        $filteredCount = $query->count();

        $transform = function (Quotation $quote) {
            return [
                'id' => $quote->id,
                'quotation_number' => $quote->quotation_number,
                'quotation_date' => $quote->quotation_date->format('Y-m-d'),
                'valid_until' => $quote->valid_until ? $quote->valid_until->format('Y-m-d') : null,
                'customer_name' => $quote->customer->name ?? 'Unknown',
                'customer_id' => $quote->customer_id,
                'user_name' => $quote->user->name ?? 'System',
                'store_name' => $quote->store->name ?? 'N/A',
                'total_amount' => $quote->total_amount,
                'status' => $quote->status,
                'notes' => $quote->notes,
                'items' => $quote->items->map(fn($item) => [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name ?? 'N/A',
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'sub_total' => $item->sub_total,
                    'price_category' => $item->price_category,
                ]),
            ];
        };

        // 🟢 FIX IS HERE
        if ($perPage === -1) {
            $all = $query->latest('created_at')->get()->map($transform);
            $quotations = [
                'data' => $all,
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => $all->count() ? 1 : 0,
                'to' => $all->count(),
                'links' => [], // 🟢 ADDED: Prevents "undefined map" error
            ];
        } else {
            $paginator = $query->latest('created_at')->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transform);
            $quotations = $paginator;
        }

        return Inertia::render('quotations/index', [
            'quotations' => $quotations,
            'filters' => $request->only(['search', 'perPage', 'dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'lookupData' => [
                'customers' => $customers,
                'products' => $products,
                'productStocks' => $productStocks->toArray(),
            ],
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'quotation_date' => 'required|date',
            'valid_until' => 'nullable|date|after_or_equal:quotation_date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.price_category' => 'required|in:retail,wholesale,special,manual',
        ]);

        DB::beginTransaction();
        try {
            $count = Quotation::count() + 1;
            $quoteNumber = 'QT-' . date('Y') . '-' . str_pad($count, 6, '0', STR_PAD_LEFT);

            $subTotal = 0;
            $itemsToCreate = [];

            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $subTotal += $lineTotal;

                $itemsToCreate[] = new QuotationItem([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'price_category' => $item['price_category'],
                    'sub_total' => $lineTotal,
                ]);
            }

            $quote = Quotation::create([
                'customer_id' => $validated['customer_id'],
                'quotation_number' => $quoteNumber,
                'quotation_date' => $validated['quotation_date'],
                'valid_until' => $validated['valid_until'],
                'notes' => $validated['notes'],
                'sub_total' => $subTotal,
                'total_amount' => $subTotal, // Quotations typically don't track tax/discount in this simplified model yet, but field exists
                'status' => 'draft',
            ]);

            $quote->items()->saveMany($itemsToCreate);

            DB::commit();
            $this->notifyStore(
                Auth::user()->store_id, // Assuming current user's store
                "New Quotation",
                "Quotation #{$quoteNumber} created by " . Auth::user()->name . ". Status: Draft.",
                route('quotations.index')
            );
            return redirect()->route('quotations.index')->with('success', 'Quotation created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Quotation Create Failed: " . $e->getMessage());
            return back()->with('error', 'Failed: ' . $e->getMessage());
        }
    }

    public function update(Request $request, Quotation $quotation)
    {
        if ($quotation->status === 'accepted') {
            return back()->with('error', "Cannot edit an accepted quotation.");
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'quotation_date' => 'required|date',
            'valid_until' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.price_category' => 'required|in:retail,wholesale,special,manual',
        ]);

        DB::beginTransaction();
        try {
            $subTotal = 0;
            $itemsToCreate = [];

            foreach ($validated['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $subTotal += $lineTotal;

                $itemsToCreate[] = new QuotationItem([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'price_category' => $item['price_category'],
                    'sub_total' => $lineTotal,
                ]);
            }

            $quotation->update([
                'customer_id' => $validated['customer_id'],
                'quotation_date' => $validated['quotation_date'],
                'valid_until' => $validated['valid_until'],
                'notes' => $validated['notes'],
                'sub_total' => $subTotal,
                'total_amount' => $subTotal,
            ]);

            $quotation->items()->delete();
            $quotation->items()->saveMany($itemsToCreate);

            DB::commit();
            return back()->with('success', 'Quotation updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Quotation Update Failed: " . $e->getMessage());
            return back()->with('error', 'Failed: ' . $e->getMessage());
        }
    }

    public function convert(Quotation $quotation)
    {
        if ($quotation->status === 'accepted') {
            return back()->with('error', 'This quotation has already been converted.');
        }

        DB::beginTransaction();
        try {
            $count = Invoice::count() + 1;
            $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad($count, 6, '0', STR_PAD_LEFT);

            $invoice = Invoice::create([
                'store_id' => $quotation->store_id,
                'user_id' => Auth::id(),
                'customer_id' => $quotation->customer_id,
                'quotation_id' => $quotation->id,
                'invoice_number' => $invoiceNumber,
                'invoice_date' => now(),
                'due_date' => now()->addDays(30),
                'payment_arrangement' => 'full',
                'notes' => "Converted from Quote #{$quotation->quotation_number}. " . $quotation->notes,
                'sub_total' => $quotation->sub_total,
                'total_amount' => $quotation->total_amount,
                'status' => 'draft',
                'payment_status' => 'unpaid',
            ]);

            foreach ($quotation->items as $qItem) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $qItem->product_id,
                    'quantity' => $qItem->quantity,
                    'unit_price' => $qItem->unit_price,
                    'price_category' => $qItem->price_category,
                    'sub_total' => $qItem->sub_total,
                ]);
            }

            $quotation->update(['status' => 'accepted']);

            DB::commit();

            // 🟢 NOTIFY STORE (Deal Won!)
            $this->notifyStore(
                $quotation->store_id,
                "Deal Closed!",
                "Quotation #{$quotation->quotation_number} accepted and converted to Invoice #{$invoice->invoice_number}.",
                route('invoices.index') // Link to Invoices to see the new bill
            );

            return redirect()->route('invoices.index')->with('success', "Converted to Invoice #{$invoice->invoice_number}");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Conversion Failed: " . $e->getMessage());
            return back()->with('error', 'Conversion Failed: ' . $e->getMessage());
        }
    }

    public function markSent(Quotation $quotation)
    {
        if ($quotation->status === 'draft') {
            $quotation->update(['status' => 'sent']);
            // 🟢 NOTIFY STORE
            $this->notifyStore(
                $quotation->store_id,
                "Quotation Sent",
                "Quotation #{$quotation->quotation_number} marked as sent to customer.",
                route('quotations.index')
            );
            return back()->with('success', 'Marked as Sent.');
        }
        return back()->with('error', 'Only drafts can be marked as sent.');
    }

    public function markRejected(Quotation $quotation)
    {
        if (in_array($quotation->status, ['draft', 'sent'])) {
            $quotation->update(['status' => 'rejected']);
            // 🟢 NOTIFY STORE (Deal Lost)
            $this->notifyStore(
                $quotation->store_id,
                "Quotation Rejected",
                "Quotation #{$quotation->quotation_number} was rejected by the customer.",
                route('quotations.index')
            );
            return back()->with('success', 'Marked as Rejected.');
        }
        return back()->with('error', 'Cannot reject an accepted quote.');
    }

    public function destroy(Quotation $quotation)
    {
        if ($quotation->status === 'accepted') {
            return back()->with('error', "Cannot delete an accepted quotation.");
        }
        $quotation->items()->delete();
        $quotation->delete();
        return back()->with('success', 'Quotation deleted.');
    }

    // --- EXPORTS (Robust & Matching InvoiceController) ---

    /**
     * Single PDF Export
     */
    public function exportPdf(Quotation $quotation) {
        $quotation->load(['customer', 'store', 'user', 'items.product']);
        $pdf = Pdf::loadView('quotations.single-pdf', compact('quotation'))
            ->setPaper('a4', 'portrait');
        return $pdf->download("Quotation_{$quotation->quotation_number}.pdf");
    }

    /**
     * Bulk PDF Export
     */
    public function bulkExportPDF($ids) {
        $idArray = explode(',', $ids);
        $quotations = Quotation::whereIn('id', $idArray)
            ->with(['customer', 'store', 'user', 'items'])
            ->latest()
            ->get();

        if ($quotations->isEmpty()) return back()->with('error', 'No quotations selected.');

        $pdf = Pdf::loadView('quotations.bulk-pdf', compact('quotations'))
            ->setPaper('a4', 'portrait');

        return $pdf->download('quotations_register.pdf');
    }

    /**
     * Bulk Excel Export (Using Anonymous Class Pattern)
     */
    public function bulkExportExcel($ids) {
        $idArray = explode(',', $ids);
        $quotations = Quotation::whereIn('id', $idArray)
            ->with(['customer', 'store', 'user'])
            ->withCount('items')
            ->latest()
            ->get();

        if ($quotations->isEmpty()) return back()->with('error', 'No quotations selected.');

        return Excel::download(new class($quotations) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            protected $quotations;
            public function __construct($quotations) { $this->quotations = $quotations; }
            public function collection() {
                return $this->quotations->map(fn ($q) => [
                    $q->id,
                    $q->quotation_number,
                    $q->customer->name,
                    $q->store->name,
                    $q->total_amount,
                    Str::upper($q->status),
                    $q->quotation_date->format('Y-m-d'),
                    $q->valid_until ? $q->valid_until->format('Y-m-d') : '-',
                    $q->user->name
                ]);
            }
            public function headings(): array {
                return ['ID', 'Quote #', 'Customer', 'Store', 'Total Amount', 'Status', 'Date', 'Valid Until', 'Created By'];
            }
        }, 'quotations_register.xlsx');
    }
}
