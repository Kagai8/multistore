<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Supplier; // 🟢 Use the correct Model
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        // base query
        $query = Supplier::query(); // 🟢 Use Supplier Model

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  // 🟢 Include new searchable fields
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Apply Date Range Filter (Logic remains the same)
        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

            if ($start && !$end) {
                $query->where('created_at', '>=', $start);
            }
            elseif (!$start && $end) {
                $query->where('created_at', '<=', $end);
            }
            elseif ($start && $end) {
                 $query->whereBetween('created_at', [$start, $end]);
            }
        }

        // counts for UI
        $totalCount = Supplier::count(); // 🟢 Use Supplier Model
        $filteredCount = $query->count();

        // If perPage === -1, return all results as an array (no paginator links)
        if ($perPage === -1) {
            $all = $query->latest()->get()->map(function (Supplier $supplier) { // 🟢 Use Supplier Model
                return [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'slug' => $supplier->slug,
                    'contact_person' => $supplier->contact_person, // 🟢 New Field
                    'phone' => $supplier->phone,                   // 🟢 New Field
                    'email' => $supplier->email,                   // 🟢 New Field
                    'address' => $supplier->address,               // 🟢 New Field
                    'is_active' => $supplier->is_active,
                    'created_at' => $supplier->created_at ? $supplier->created_at->format('d M Y') : null,
                ];
            });

            $suppliers = [ // 🟢 Rename variable
                'data' => $all,
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => $all->count() ? 1 : 0,
                'to' => $all->count(),
                'links' => [],
            ];
        } else {
            // Normal pagination path
            $paginator = $query->latest()->paginate($perPage)->withQueryString();

            // transform items to match frontend shape
            $paginator->getCollection()->transform(function (Supplier $supplier) { // 🟢 Use Supplier Model
                return [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'slug' => $supplier->slug,
                    'contact_person' => $supplier->contact_person, // 🟢 New Field
                    'phone' => $supplier->phone,                   // 🟢 New Field
                    'email' => $supplier->email,                   // 🟢 New Field
                    'address' => $supplier->address,               // 🟢 New Field
                    'is_active' => $supplier->is_active,
                    'created_at' => $supplier->created_at ? $supplier->created_at->format('d M Y') : null,
                ];
            });

            $suppliers = $paginator; // 🟢 Rename variable
        }

        return Inertia::render('suppliers/index', [ // 🟢 Correct Inertia path
            'suppliers' => $suppliers, // 🟢 Rename variable
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
        // ✅ 1. Validate input
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:suppliers,name',
            'contact_person' => 'nullable|string|max:255', // 🟢 New Field
            'phone' => 'nullable|string|max:50',         // 🟢 New Field
            'email' => 'nullable|email|unique:suppliers,email', // 🟢 New Field + Unique
            'address' => 'nullable|string',                 // 🟢 New Field
            'is_active' => 'boolean',                       // 🟢 New Field
        ]);

        // ✅ 2. Generate slug automatically
        $validated['slug'] = \Str::slug($validated['name']);

        // ❌ Removed Logo Handling (Steps 3 & 4)

        // ✅ 3. Create supplier record
        Supplier::create($validated); // 🟢 Use Supplier Model

        // ✅ 4. Return back with flash success (Inertia expects this)
        return redirect()
            ->route('suppliers.index') // 🟢 Correct route
            ->with('flash.success', 'Supplier created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Supplier $supplier) // 🟢 Use Supplier Model
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Supplier $supplier) // 🟢 Use Supplier Model
    {
        // 🟢 FIX: Add unique rule, ignoring the current supplier's ID
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:suppliers,name,' . $supplier->id,
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|unique:suppliers,email,' . $supplier->id, // 🟢 Correct Unique check
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // 🟢 FIX: Generate the new slug from the validated name
        $validated['slug'] = Str::slug($validated['name']);

        // ❌ Removed Logo Handling

        $supplier->update($validated); // 🟢 Use Supplier Model

        return back()->with('success', 'Supplier updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier) // 🟢 Use Supplier Model
    {
        // ❌ Removed Logo Deletion

        $supplier->delete(); // 🟢 Use Supplier Model

        return redirect()->back()->with('success', 'Supplier deleted successfully');
    }
    public function exportSinglePdf(Supplier $supplier) // 🟢 Use Supplier Model
    {
        

        $pdf = Pdf::loadView('suppliers.supplier-single', compact('supplier')) // 🟢 Correct view
            ->setPaper('a4', 'portrait');

        return $pdf->download("supplier_{$supplier->id}.pdf"); // 🟢 Correct file name
    }

    public function exportSingleExcel(Supplier $supplier) // 🟢 Use Supplier Model
        {
            return Excel::download(
                new class($supplier) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                    protected $supplier;
                    public function __construct($supplier) { $this->supplier = $supplier; }

                    public function collection()
                    {
                        return collect([[
                            'ID' => $this->supplier->id,
                            'Name' => $this->supplier->name,
                            'Slug' => $this->supplier->slug,
                            'Contact Person' => $this->supplier->contact_person, // 🟢 New Field
                            'Email' => $this->supplier->email,                   // 🟢 New Field
                            'Phone' => $this->supplier->phone,                   // 🟢 New Field
                            'Address' => $this->supplier->address,               // 🟢 New Field
                            'Active' => $this->supplier->is_active ? 'Yes' : 'No',
                            'Created Date' => $this->supplier->created_at->format('d M Y'),
                        ]]);
                    }

                    public function headings(): array
                    {
                        return ['ID', 'Name', 'Slug', 'Contact Person', 'Email', 'Phone', 'Address', 'Active', 'Created Date'];
                    }
                },
                "supplier_{$supplier->id}.xlsx" // 🟢 Correct file name
            );
        }
    public function bulkDelete(Request $request)
        {
            $ids = $request->input('ids', []);

            if (empty($ids)) {
                return back()->with('error', 'No suppliers selected.'); // 🟢 Correct message
            }

            // ❌ Removed Brand fetching/deletion loop

            // 🟢 FIX: Use static destroy method for efficient bulk deletion
            $deletedCount = Supplier::destroy($ids);

            return back()->with('success', $deletedCount . ' supplier(s) deleted successfully.'); // 🟢 Correct message
        }

    public function bulkExportPDF(Request $request)
        {
            $ids = explode(',', $request->input('ids', ''));
            $suppliers = Supplier::whereIn('id', $ids)->get(); // 🟢 Use Supplier Model

            if ($suppliers->isEmpty()) {
                return back()->with('error', 'No suppliers selected for export.'); // 🟢 Correct message
            }

            $pdf = Pdf::loadView('suppliers.supplier-bulk-pdf', compact('suppliers')) // 🟢 Correct view
                ->setPaper('a4', 'portrait');

            return $pdf->download('suppliers_export.pdf'); // 🟢 Correct file name
        }

    public function bulkExportExcel(Request $request)
        {
            $ids = explode(',', $request->input('ids', ''));
            $suppliers = Supplier::whereIn('id', $ids)->get(); // 🟢 Use Supplier Model

            if ($suppliers->isEmpty()) {
                return back()->with('error', 'No suppliers selected for export.'); // 🟢 Correct message
            }

            return Excel::download(
                new class($suppliers) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                    protected $suppliers;
                    public function __construct($suppliers) { $this->suppliers = $suppliers; }

                    public function collection()
                    {
                        return $this->suppliers->map(fn ($supplier) => [ // 🟢 Correct variable name
                            'ID' => $supplier->id,
                            'Name' => $supplier->name,
                            'Slug' => $supplier->slug,
                            'Contact Person' => $supplier->contact_person,
                            'Email' => $supplier->email,
                            'Phone' => $supplier->phone,
                            'Address' => $supplier->address,
                            'Active' => $supplier->is_active ? 'Yes' : 'No',
                            'Created Date' => optional($supplier->created_at)->format('d M Y'),
                        ]);
                    }

                    public function headings(): array
                    {
                        return ['ID', 'Name', 'Slug', 'Contact Person', 'Email', 'Phone', 'Address', 'Active', 'Created Date'];
                    }
                },
                'suppliers_export.xlsx' // 🟢 Correct file name
            );
        }

    // 🧾 Download Excel Template
    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $sheet->setCellValue('A1', 'name');
        $sheet->setCellValue('B1', 'contact_person'); // 🟢 New Field
        $sheet->setCellValue('C1', 'phone');
        $sheet->setCellValue('D1', 'email');
        $sheet->setCellValue('E1', 'address');

        // Example Row
        $sheet->setCellValue('A2', 'Sample Supplier Co');
        $sheet->setCellValue('B2', 'John Smith');
        $sheet->setCellValue('C2', '555-1234');
        $sheet->setCellValue('D2', 'contact@supplier.com');
        $sheet->setCellValue('E2', '123 Main St, City');


        // Auto-size columns
        foreach (range('A', 'E') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Output file
        $writer = new Xlsx($spreadsheet);
        $filename = 'suppliers_template.xlsx'; // 🟢 Correct file name

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }

    // 📥 Import Suppliers (Excel or CSV)
    public function import(Request $request)
    {
        // ... (file handling remains the same) ...
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,txt|max:4096',
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $rows = [];

        if ($extension === 'csv' || $extension === 'txt') {
            if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
                $header = fgetcsv($handle, 1000, ',');
                while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                    $rows[] = array_combine($header, $data);
                }
                fclose($handle);
            }
        } else {
            $sheets = Excel::toArray([], $file);
            $rows = $sheets[0] ?? [];
            $header = array_map('strtolower', $rows[0]);
            unset($rows[0]);
            $rows = array_map(fn($r) => array_combine($header, $r), $rows);
        }

        $imported = 0;

        foreach ($rows as $row) {
            $name = trim($row['name'] ?? '');
            $email = trim($row['email'] ?? ''); // 🟢 Get Email

            // Requires name and either phone or email
            if (empty($name)) continue;

            $baseSlug = Str::slug($name);
            $slug = $baseSlug;

            // Check existence by name, slug, or email
            $exists = Supplier::where('slug', $slug)
                ->orWhere('name', $name)
                ->orWhere('email', $email)
                ->exists();

            if ($exists) {
                // If the name already exists, append (duplicate)
                $name .= ' (duplicate)';
                $slug .= '-duplicate';
            }

            Supplier::create([ // 🟢 Use Supplier Model
                'name' => $name,
                'slug' => $slug,
                'contact_person' => $row['contact_person'] ?? null, // 🟢 New Field
                'phone' => $row['phone'] ?? null,                     // 🟢 New Field
                'email' => $email,                                  // 🟢 New Field
                'address' => $row['address'] ?? null,               // 🟢 New Field
                'is_active' => true,
                'created_at' => Carbon::now(),
            ]);

            $imported++;
        }

        return back()->with('success', "$imported supplier(s) imported successfully."); // 🟢 Correct message
    }
}
