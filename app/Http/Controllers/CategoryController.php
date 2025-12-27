<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CategoryController extends Controller
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
        $query = Category::query();

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
        $totalCount = Category::count();
        $filteredCount = $query->count();

        // If perPage === -1, return all results as an array (no paginator links)
        if ($perPage === -1) {
            $all = $query->latest()->get()->map(function (Category $category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    // return publicly accessible URL if stored (assumes disk=public)
                    'logo' => $category->logo ? Storage::url($category->logo) : null,
                    'created_at' => $category->created_at ? $category->created_at->format('d M Y') : null,
                ];
            });

            $categories = [
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
            $paginator->getCollection()->transform(function (Category $category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'logo' => $category->logo ? Storage::url($category->logo) : null,
                    'created_at' => $category->created_at ? $category->created_at->format('d M Y') : null,
                ];
            });

            $categories = $paginator;
        }

        return Inertia::render('categories/index', [
            'categories' => $categories,
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
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // ✅ 2. Generate slug automatically
        $validated['slug'] = \Str::slug($validated['name']);

        // ✅ 3. Handle logo upload
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('categories', 'public');
            $validated['logo'] = $path;
        }

        // ✅ 4. Create category record
        Category::create($validated);

        // ✅ 5. Return back with flash success (Inertia expects this)
        return redirect()
            ->route('categories.index')
            ->with('flash.success', 'Category created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Category $category)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            // delete old if exists
            if ($category->logo && Storage::disk('public')->exists($category->logo)) {
                Storage::disk('public')->delete($category->logo);
            }

            $validated['logo'] = $request->file('logo')->store('categories', 'public');
        }

        $category->update($validated);

        return back()->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category)
    {
        // Optional: delete the logo file if it exists
        if ($category->logo && Storage::disk('public')->exists($category->logo)) {
            Storage::disk('public')->delete($category->logo);
        }

        $category->delete();

        return redirect()->back()->with('success', 'Category deleted successfully');
    }
    public function exportSinglePdf(Category $category)
    {
        $pdf = Pdf::loadView('categories.category-single', compact('category'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("category_{$category->id}.pdf");
    }

    public function exportSingleExcel(Category $category)
        {
            return Excel::download(
                new class($category) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                    protected $category;
                    public function __construct($category) { $this->category = $category; }

                    public function collection()
                    {
                        return collect([[
                            'ID' => $this->category->id,
                            'Name' => $this->category->name,
                            'Slug' => $this->category->slug,
                            'Description' => $this->category->description,
                            'Created Date' => $this->category->created_at->format('d M Y'),
                        ]]);
                    }

                    public function headings(): array
                    {
                        return ['ID', 'Name', 'Slug', 'Description', 'Created Date'];
                    }
                },
                "category_{$category->id}.xlsx"
            );
        }
    public function bulkDelete(Request $request)
        {
            $ids = $request->input('ids', []);

            if (empty($ids)) {
                return back()->with('error', 'No categories selected.');
            }

            $categories = Category::whereIn('id', $ids)->get();

            foreach ($categories as $category) {
                if ($category->logo && Storage::disk('public')->exists($category->logo)) {
                    Storage::disk('public')->delete($category->logo);
                }
                $category->delete();
            }

            return back()->with('success', count($ids) . ' category(s) deleted successfully.');
        }

    public function bulkExportPDF(Request $request)
        {
            $ids = explode(',', $request->input('ids', ''));
            $categories = Category::whereIn('id', $ids)->get();

            if ($categories->isEmpty()) {
                return back()->with('error', 'No categories selected for export.');
            }

            $pdf = Pdf::loadView('categories.category-bulk-pdf', compact('categories'))
                ->setPaper('a4', 'portrait');

            return $pdf->download('categories_export.pdf');
        }

    public function bulkExportExcel(Request $request)
        {
            $ids = explode(',', $request->input('ids', ''));
            $categories = Category::whereIn('id', $ids)->get();

            if ($categories->isEmpty()) {
                return back()->with('error', 'No categories selected for export.');
            }

            return Excel::download(
                new class($categories) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                    protected $categories;
                    public function __construct($categories) { $this->categories = $categories; }

                    public function collection()
                    {
                        return $this->categories->map(fn ($category) => [
                            'ID' => $category->id,
                            'Name' => $category->name,
                            'Slug' => $category->slug,
                            'Description' => $category->description,
                            'Created Date' => optional($category->created_at)->format('d M Y'),
                        ]);
                    }

                    public function headings(): array
                    {
                        return ['ID', 'Name', 'Slug', 'Description', 'Created Date'];
                    }
                },
                'categories_export.xlsx'
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
        $sheet->setCellValue('A2', 'Sample Category');
        $sheet->setCellValue('B2', 'Optional description');

        // Auto-size columns
        foreach (range('A', 'B') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Output file
        $writer = new Xlsx($spreadsheet);
        $filename = 'categories_template.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }

    // 📥 Import Categories (Excel or CSV)
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

            $exists = Category::where('slug', $slug)
                ->orWhere('name', $name)
                ->exists();

            if ($exists) {
                $name .= ' (duplicate)';
                $slug .= '-duplicate';
            }

            Category::create([
                'name' => $name,
                'slug' => $slug,
                'description' => $row['description'] ?? 'No description provided',
                'created_at' => Carbon::now(),
            ]);

            $imported++;
        }

        return back()->with('success', "$imported category(s) imported successfully.");
    }
}
