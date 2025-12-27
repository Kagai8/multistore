<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Store;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Validation\Rule;

class StoreController extends Controller
{
    // Helper to generate a sequential and unique store code
    protected function generateUniqueStoreCode()
    {
        // Find the highest existing ID to get the next sequential number
        $latestStore = Store::latest('id')->first();
        $nextId = $latestStore ? $latestStore->id + 1 : 1;
        // Format: STR-0001, STR-0010, STR-0100, STR-1000
        return 'STR-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        $query = Store::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Apply Date Range Filter
        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;
            if ($start && $end) {
                 $query->whereBetween('created_at', [$start, $end]);
            } elseif ($start) {
                $query->where('created_at', '>=', $start);
            } elseif ($end) {
                $query->where('created_at', '<=', $end);
            }
        }

        $totalCount = Store::count();
        $filteredCount = $query->count();

        $transformer = function (Store $store) {
            return [
                'id' => $store->id,
                'name' => $store->name,
                'type' => $store->type,
                'code' => $store->code,
                'phone' => $store->phone,
                'email' => $store->email,
                'address' => $store->address,
                'created_at' => $store->created_at ? $store->created_at->format('d M Y') : null,
            ];
        };

        if ($perPage === -1) {
            $all = $query->latest()->get()->map($transformer);
            $stores = ['data' => $all, 'total' => $filteredCount, 'per_page' => $perPage, 'from' => $all->count() ? 1 : 0, 'to' => $all->count(), 'links' => []];
        } else {
            $paginator = $query->latest()->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transformer);
            $stores = $paginator;
        }

        return Inertia::render('stores/index', [
            'stores' => $stores,
            'filters' => $request->only(['search', 'perPage','dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:stores,name',
            'type' => ['required', Rule::in(['warehouse', 'retail'])],
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:stores,email',
            'address' => 'nullable|string',
        ]);

        // 🔑 SYSTEM GENERATED: Inject the unique code before creation
        $validated['code'] = $this->generateUniqueStoreCode();

        Store::create($validated);

        return redirect()->route('stores.index')->with('flash.success', 'Store created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Store $store)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('stores')->ignore($store->id)],
            'type' => ['required', Rule::in(['warehouse', 'retail'])],
            'phone' => 'nullable|string|max:20',
            // Allow null email, but if present, it must be unique and ignore the current store's ID
            'email' => ['nullable', 'email', 'max:255', Rule::unique('stores')->ignore($store->id)],
            'address' => 'nullable|string',
        ]);

        // 🔑 SYSTEM GENERATED: Ensure 'code' is never updated by user input
        $data = $request->except('code');

        $store->update($data);

        return back()->with('success', 'Store updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Store $store)
    {
        $store->delete();
        return redirect()->back()->with('success', 'Store deleted successfully');
    }

    // ----------------------------------------------------------------------
    // 📦 ACTIONS: Bulk Delete and Export
    // ----------------------------------------------------------------------

    /**
     * Remove multiple stores.
     */
    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back()->with('error', 'No stores selected.');
        Store::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' store(s) deleted successfully.');
    }

    /**
     * Export selected stores to PDF.
     */
    public function bulkExportPDF(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $stores = Store::whereIn('id', $ids)->get();
        if ($stores->isEmpty()) return back()->with('error', 'No stores selected for export.');

        // NOTE: Uses 'stores.store-bulk-pdf' view
        $pdf = Pdf::loadView('stores.store-bulk-pdf', compact('stores'))->setPaper('a4', 'portrait');
        return $pdf->download('stores_export.pdf');
    }

    /**
     * Export selected stores to Excel.
     */
    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $stores = Store::whereIn('id', $ids)->get();
        if ($stores->isEmpty()) return back()->with('error', 'No stores selected for export.');

        return Excel::download(
            new class($stores) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $stores;
                public function __construct($stores) { $this->stores = $stores; }
                public function collection()
                {
                    return $this->stores->map(fn ($store) => [
                        'ID' => $store->id,
                        'Name' => $store->name,
                        'Code' => $store->code,
                        'Phone' => $store->phone,
                        'Email' => $store->email,
                        'Address' => $store->address,
                        'Created Date' => optional($store->created_at)->format('d M Y'),
                    ]);
                }
                public function headings(): array
                {
                    return ['ID', 'Name', 'Code', 'Phone', 'Email', 'Address', 'Created Date'];
                }
            },
            'stores_export.xlsx'
        );
    }

    /**
     * Export a single store to PDF.
     */
    public function exportSinglePdf(Store $store)
    {
        // NOTE: Uses 'stores.store-single' view
        $pdf = Pdf::loadView('stores.store-single', compact('store'))->setPaper('a4', 'portrait');
        return $pdf->download("store_{$store->id}.pdf");
    }

    /**
     * Export a single store to Excel.
     */
    public function exportSingleExcel(Store $store)
    {
        return Excel::download(
            new class($store) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $store;
                public function __construct($store) { $this->store = $store; }

                public function collection()
                {
                    return collect([[
                        'ID' => $this->store->id,
                        'Name' => $this->store->name,
                        'Type' => $this->store->type,
                        'Code' => $this->store->code,
                        'Phone' => $this->store->phone,
                        'Email' => $this->store->email,
                        'Address' => $this->store->address,
                        'Created Date' => optional($this->store->created_at)->format('d M Y'),
                    ]]);
                }

                public function headings(): array
                {
                    return ['ID', 'Name', 'Code', 'Phone', 'Email', 'Address', 'Created Date'];
                }
            },
            "store_{$store->id}.xlsx"
        );
    }

    // ----------------------------------------------------------------------
    // 📥 IMPORT ACTIONS: Template & Import
    // ----------------------------------------------------------------------

    // NOTE: Import is disabled for Stores to prevent code collision/manual entry,
    // but the template generation is included for consistency.

    /**
     * Download Excel Template.
     */
    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setCellValue('A1', 'name');
        // 🟢 ADDED: New column header for 'type'
        $sheet->setCellValue('B1', 'type (warehouse or retail)');
        $sheet->setCellValue('C1', 'phone');
        $sheet->setCellValue('D1', 'email');
        $sheet->setCellValue('E1', 'address');

        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        $writer = new Xlsx($spreadsheet);
        $filename = 'stores_template.xlsx';
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }

    /**
     * Import Stores (File reading logic is omitted due to system-generated 'code')
     */
    public function import(Request $request)
    {
        return back()->with('error', 'Store records must be created manually to ensure unique system-generated codes.');
    }
}
