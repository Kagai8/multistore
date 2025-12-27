<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Brand;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class BrandController extends Controller
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
        $query = Brand::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // 🟢 NEW: Apply Date Range Filter (Using 'created_at' column)
        if ($dateFrom || $dateTo) {
            // Parse dates, setting time to start/end of day for accurate range query
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

            // If only start date is provided, filter from that day onwards
            if ($start && !$end) {
                $query->where('created_at', '>=', $start);
            }
            // If only end date is provided, filter up to that day
            elseif (!$start && $end) {
                $query->where('created_at', '<=', $end);
            }
            // If both are provided, use whereBetween
            elseif ($start && $end) {
                 $query->whereBetween('created_at', [$start, $end]);
            }
        }
        // END NEW DATE FILTER LOGIC

        // counts for UI
        $totalCount = Brand::count();
        $filteredCount = $query->count();

        // If perPage === -1, return all results as an array (no paginator links)
        if ($perPage === -1) {
            $all = $query->latest()->get()->map(function (Brand $brand) {
                return [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                    'description' => $brand->description,
                    // return publicly accessible URL if stored (assumes disk=public)
                    'logo' => $brand->logo ? Storage::url($brand->logo) : null,
                    'created_at' => $brand->created_at ? $brand->created_at->format('d M Y') : null,
                ];
            });

            $brands = [
                'data' => $all,
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => $all->count() ? 1 : 0,
                'to' => $all->count(),
                'links' => [], // frontend expects links (empty when showing all)
            ];
        } else {
            // Normal pagination path
            $paginator = $query->latest()->paginate($perPage)->withQueryString();

            // transform items to match frontend shape (format dates, logo url...):
            $paginator->getCollection()->transform(function (Brand $brand) {
                return [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                    'description' => $brand->description,
                    'logo' => $brand->logo ? Storage::url($brand->logo) : null,
                    'created_at' => $brand->created_at ? $brand->created_at->format('d M Y') : null,
                ];
            });

            $brands = $paginator;
        }

        return Inertia::render('brands/index', [
            'brands' => $brands,
            'filters' => $request->only(['search', 'perPage','dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // ✅ 1. Validate input
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // ✅ 2. Generate slug automatically
        $validated['slug'] = \Str::slug($validated['name']);

        // ✅ 3. Handle logo upload
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('brands', 'public');
            $validated['logo'] = $path;
        }

        // ✅ 4. Create brand record
        Brand::create($validated);

        // ✅ 5. Return back with flash success (Inertia expects this)
        return redirect()
            ->route('brands.index')
            ->with('flash.success', 'Brand created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Brand $brand)
    {
        //
    }

    

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Brand $brand)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            // delete old if exists
            if ($brand->logo && Storage::disk('public')->exists($brand->logo)) {
                Storage::disk('public')->delete($brand->logo);
            }

            $validated['logo'] = $request->file('logo')->store('brands', 'public');
        }

        $brand->update($validated);

        return back()->with('success', 'Brand updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Brand $brand)
    {
        // Optional: delete the logo file if it exists
        if ($brand->logo && Storage::disk('public')->exists($brand->logo)) {
            Storage::disk('public')->delete($brand->logo);
        }

        $brand->delete();

        return redirect()->back()->with('success', 'Brand deleted successfully');
    }
    public function exportSinglePdf(Brand $brand)
    {
        $pdf = Pdf::loadView('brands.brand-single', compact('brand'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("brand_{$brand->id}.pdf");
    }

    public function exportSingleExcel(Brand $brand)
        {
            return Excel::download(
                new class($brand) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                    protected $brand;
                    public function __construct($brand) { $this->brand = $brand; }

                    public function collection()
                    {
                        return collect([[
                            'ID' => $this->brand->id,
                            'Name' => $this->brand->name,
                            'Slug' => $this->brand->slug,
                            'Description' => $this->brand->description,
                            'Created Date' => $this->brand->created_at->format('d M Y'),
                        ]]);
                    }

                    public function headings(): array
                    {
                        return ['ID', 'Name', 'Slug', 'Description', 'Created Date'];
                    }
                },
                "brand_{$brand->id}.xlsx"
            );
        }
    public function bulkDelete(Request $request)
        {
            $ids = $request->input('ids', []);

            if (empty($ids)) {
                return back()->with('error', 'No brands selected.');
            }

            $brands = Brand::whereIn('id', $ids)->get();

            foreach ($brands as $brand) {
                if ($brand->logo && Storage::disk('public')->exists($brand->logo)) {
                    Storage::disk('public')->delete($brand->logo);
                }
                $brand->delete();
            }

            return back()->with('success', count($ids) . ' brand(s) deleted successfully.');
        }

    public function bulkExportPDF(Request $request)
        {
            $ids = explode(',', $request->input('ids', ''));
            $brands = Brand::whereIn('id', $ids)->get();

            if ($brands->isEmpty()) {
                return back()->with('error', 'No brands selected for export.');
            }

            $pdf = Pdf::loadView('brands.brand-bulk-pdf', compact('brands'))
                ->setPaper('a4', 'portrait');

            return $pdf->download('brands_export.pdf');
        }

    public function bulkExportExcel(Request $request)
        {
            $ids = explode(',', $request->input('ids', ''));
            $brands = Brand::whereIn('id', $ids)->get();

            if ($brands->isEmpty()) {
                return back()->with('error', 'No brands selected for export.');
            }

            return Excel::download(
                new class($brands) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                    protected $brands;
                    public function __construct($brands) { $this->brands = $brands; }

                    public function collection()
                    {
                        return $this->brands->map(fn ($brand) => [
                            'ID' => $brand->id,
                            'Name' => $brand->name,
                            'Slug' => $brand->slug,
                            'Description' => $brand->description,
                            'Created Date' => optional($brand->created_at)->format('d M Y'),
                        ]);
                    }

                    public function headings(): array
                    {
                        return ['ID', 'Name', 'Slug', 'Description', 'Created Date'];
                    }
                },
                'brands_export.xlsx'
            );
        }

    // 🧾 Download Excel Template
    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $sheet->setCellValue('A1', 'name');
        $sheet->setCellValue('B1', 'description');

        // Example Row
        $sheet->setCellValue('A2', 'Sample Brand');
        $sheet->setCellValue('B2', 'Optional description');

        // Auto-size columns
        foreach (range('A', 'B') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Output file
        $writer = new Xlsx($spreadsheet);
        $filename = 'brands_template.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }

    // 📥 Import Brands (Excel or CSV)
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,txt|max:4096',
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $rows = [];

        if ($extension === 'csv' || $extension === 'txt') {
            // Handle CSV manually
            if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
                $header = fgetcsv($handle, 1000, ',');
                while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                    $rows[] = array_combine($header, $data);
                }
                fclose($handle);
            }
        } else {
            // Handle Excel file
            $sheets = Excel::toArray([], $file);
            $rows = $sheets[0] ?? [];
            $header = array_map('strtolower', $rows[0]);
            unset($rows[0]);
            $rows = array_map(fn($r) => array_combine($header, $r), $rows);
        }

        $imported = 0;

        foreach ($rows as $row) {
            $name = trim($row['name'] ?? '');
            if (empty($name)) continue;

            $baseSlug = Str::slug($name);
            $slug = $baseSlug;

            $exists = Brand::where('slug', $slug)
                ->orWhere('name', $name)
                ->exists();

            if ($exists) {
                $name .= ' (duplicate)';
                $slug .= '-duplicate';
            }

            Brand::create([
                'name' => $name,
                'slug' => $slug,
                'description' => $row['description'] ?? 'No description provided',
                'created_at' => Carbon::now(),
            ]);

            $imported++;
        }

        return back()->with('success', "$imported brand(s) imported successfully.");
    }
}


