<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Customer;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        $query = Customer::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('number', 'like', "%{$search}%")
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

        $totalCount = Customer::count();
        $filteredCount = $query->count();

        $transformer = function (Customer $customer) {
            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'number' => $customer->number,
                'email' => $customer->email,
                'credit_limit' => $customer->credit_limit,
                'created_at' => $customer->created_at ? $customer->created_at->format('d M Y') : null,
            ];
        };

        if ($perPage === -1) {
            $all = $query->latest()->get()->map($transformer);
            $customers = ['data' => $all, 'total' => $filteredCount, 'per_page' => $perPage, 'from' => $all->count() ? 1 : 0, 'to' => $all->count(), 'links' => []];
        } else {
            $paginator = $query->latest()->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transformer);
            $customers = $paginator;
        }

        return Inertia::render('customers/index', [
            'customers' => $customers,
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
            'name' => 'required|string|max:255|unique:customers,name',
            'number' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:customers,email',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        Customer::create($validated);

        return redirect()->route('customers.index')->with('flash.success', 'Customer created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('customers')->ignore($customer->id)],
            'number' => 'nullable|string|max:20',
            'email' => ['nullable', 'email', 'max:255', Rule::unique('customers')->ignore($customer->id)],
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $customer->update($validated);

        return back()->with('success', 'Customer updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        $customer->delete();
        return redirect()->back()->with('success', 'Customer deleted successfully');
    }

    // --- Export/Import Logic (Simplified from UnitController) ---

    public function exportSinglePdf(Customer $customer)
    {
        // NOTE: You'll need to create 'customers.customer-single' view
        $pdf = Pdf::loadView('customers.customer-single', compact('customer'))->setPaper('a4', 'portrait');
        return $pdf->download("customer_{$customer->id}.pdf");
    }

    /**
     * Export a single customer to Excel.
     */
    public function exportSingleExcel(Customer $customer)
    {
        return Excel::download(
            new class($customer) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $customer;
                public function __construct($customer) { $this->customer = $customer; }

                public function collection()
                {
                    return collect([[
                        'ID' => $this->customer->id,
                        'Name' => $this->customer->name,
                        'Number' => $this->customer->number,
                        'Email' => $this->customer->email,
                        'Credit Limit' => $this->customer->credit_limit,
                        'Created Date' => optional($this->customer->created_at)->format('d M Y'),
                    ]]);
                }

                public function headings(): array
                {
                    return ['ID', 'Name', 'Number', 'Email', 'Credit Limit', 'Created Date'];
                }
            },
            "customer_{$customer->id}.xlsx"
        );
    }

    // ----------------------------------------------------------------------
    // 📦 BULK ACTIONS: Delete, Export PDF & Excel
    // ----------------------------------------------------------------------

    /**
     * Remove multiple customers.
     */
    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back()->with('error', 'No customers selected.');
        Customer::whereIn('id', $ids)->delete();
        return back()->with('success', count($ids) . ' customer(s) deleted successfully.');
    }

    /**
     * Export selected customers to PDF.
     */
    public function bulkExportPDF(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $customers = Customer::whereIn('id', $ids)->get();
        if ($customers->isEmpty()) return back()->with('error', 'No customers selected for export.');

        // NOTE: You'll need to create 'customers.customer-bulk-pdf' view
        $pdf = Pdf::loadView('customers.customer-bulk-pdf', compact('customers'))->setPaper('a4', 'portrait');
        return $pdf->download('customers_export.pdf');
    }

    /**
     * Export selected customers to Excel.
     */
    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $customers = Customer::whereIn('id', $ids)->get();
        if ($customers->isEmpty()) return back()->with('error', 'No customers selected for export.');

        return Excel::download(
            new class($customers) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $customers;
                public function __construct($customers) { $this->customers = $customers; }
                public function collection()
                {
                    return $this->customers->map(fn ($customer) => [
                        'ID' => $customer->id,
                        'Name' => $customer->name,
                        'Number' => $customer->number,
                        'Email' => $customer->email,
                        'Credit Limit' => $customer->credit_limit,
                        'Created Date' => optional($customer->created_at)->format('d M Y'),
                    ]);
                }
                public function headings(): array
                {
                    return ['ID', 'Name', 'Number', 'Email', 'Credit Limit', 'Created Date'];
                }
            },
            'customers_export.xlsx'
        );
    }

    // ----------------------------------------------------------------------
    // 📥 IMPORT ACTIONS: Template & Import
    // ----------------------------------------------------------------------

    /**
     * Download Excel Template.
     */
    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setCellValue('A1', 'name');
        $sheet->setCellValue('B1', 'number');
        $sheet->setCellValue('C1', 'email');
        $sheet->setCellValue('D1', 'credit_limit');

        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        $writer = new Xlsx($spreadsheet);
        $filename = 'customers_template.xlsx';
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }

    /**
     * Import Customers (Excel or CSV).
     */
   public function import(Request $request)
    {
        $request->validate(['file' => 'required|mimes:xlsx,csv,txt|max:4096']);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $rows = [];

        try {
            // Use Excel package to read both XLSX and CSV
            $sheets = Excel::toArray([], $file);
            $rows = $sheets[0] ?? [];

            if (empty($rows)) {
                return back()->with('error', 'The file appears to be empty or improperly formatted.');
            }

            // Extract header and map data
            $header = array_map('strtolower', array_map('trim', $rows[0]));
            unset($rows[0]); // Remove header row from data

            // Check if mandatory fields (name) are present
            if (!in_array('name', $header)) {
                return back()->with('error', 'The file must contain a "name" column.');
            }

            $rows = array_map(function($row) use ($header) {
                if (count($header) !== count($row)) return [];
                // Combine header with row data
                return array_combine($header, array_map('trim', $row));
            }, $rows);

        } catch (\Exception $e) {
            // Handle file reading errors
            return back()->with('error', 'Error reading the file: ' . $e->getMessage());
        }

        $imported = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            // Skip empty rows created by failed array_combine due to mismatched columns
            if (empty($row) || empty($row['name'])) continue;

            $name = $row['name'];
            $email = $row['email'] ?? null;
            $number = $row['number'] ?? null;
            $creditLimit = $row['credit_limit'] ?? 0.00;

            // --- Validation and Existence Check ---
            try {
                // 1. Check for existing customer by name
                $existingByName = Customer::where('name', $name)->first();
                if ($existingByName) {
                    $errors[] = "Row " . ($index + 2) . ": Customer with name '{$name}' already exists.";
                    continue;
                }

                // 2. Check for existing customer by email (if provided)
                if ($email && Customer::where('email', $email)->exists()) {
                    $errors[] = "Row " . ($index + 2) . ": Customer with email '{$email}' already exists.";
                    continue;
                }

                // --- Insertion ---
                Customer::create([
                    'name' => $name,
                    'number' => $number,
                    'email' => $email,
                    // Ensure credit limit is numeric
                    'credit_limit' => is_numeric($creditLimit) ? $creditLimit : 0.00,
                ]);

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($index + 2) . ": Failed to create customer ({$e->getMessage()}).";
            }
        }

        // --- Final Response ---
        $message = "{$imported} customer(s) imported successfully.";

        if (!empty($errors)) {
            // If there are errors, return them with the success message
            $errorDetail = implode("\n- ", array_slice($errors, 0, 5)); // Show up to 5 errors
            $message .= " However, " . count($errors) . " row(s) failed to import. Examples:\n- " . $errorDetail;
            return back()->with('flash.warning', $message);
        }

        return back()->with('flash.success', $message);
    }
}
