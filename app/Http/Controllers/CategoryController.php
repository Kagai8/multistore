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

        // 🟢 FIX 1: Add withCount('products') for Smart Delete
        $query = Category::query()->withCount('products');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

            if ($start && !$end) {
                $query->where('created_at', '>=', $start);
            } elseif (!$start && $end) {
                $query->where('created_at', '<=', $end);
            } elseif ($start && $end) {
                 $query->whereBetween('created_at', [$start, $end]);
            }
        }

        $totalCount = Category::count();
        $filteredCount = $query->count();

        if ($perPage === -1) {
            $all = $query->latest()->get()->map(function (Category $category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'logo' => $category->logo ? Storage::url($category->logo) : null,
                    'created_at' => $category->created_at ? $category->created_at->format('d M Y') : null,
                    'products_count' => $category->products_count, // 🟢 Return count
                ];
            });

            $categories = [
                'data' => $all,
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => $all->count() ? 1 : 0,
                'to' => $all->count(),
                'links' => [],
            ];
        } else {
            $paginator = $query->latest()->paginate($perPage)->withQueryString();

            $paginator->getCollection()->transform(function (Category $category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'logo' => $category->logo ? Storage::url($category->logo) : null,
                    'created_at' => $category->created_at ? $category->created_at->format('d M Y') : null,
                    'products_count' => $category->products_count, // 🟢 Return count
                ];
            });

            $categories = $paginator;
        }

        // 🟢 NOTE: Ensure your React Page is expecting 'categories' prop, not 'brands'
        return Inertia::render('categories/index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'perPage','dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
        ]);
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $validated['slug'] = \Str::slug($validated['name']);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('categories', 'public');
            $validated['logo'] = $path;
        }

        Category::create($validated);

        return redirect()
            ->route('categories.index')
            ->with('success', 'Category created successfully.');
    }

    public function show(Category $category)
    {
        //
    }

    public function edit(Category $category)
    {
        //
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        // 🟢 FIX 2: Prevent overwriting logo with null
        unset($validated['logo']);

        if ($request->hasFile('logo')) {
            if ($category->logo && Storage::disk('public')->exists($category->logo)) {
                Storage::disk('public')->delete($category->logo);
            }
            $validated['logo'] = $request->file('logo')->store('categories', 'public');
        }

        $category->update($validated);

        return back()->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        if ($category->logo && Storage::disk('public')->exists($category->logo)) {
            Storage::disk('public')->delete($category->logo);
        }

        $category->delete();

        return redirect()->back()->with('success', 'Category deleted successfully');
    }

    // ... Export methods (unchanged) ...
    public function exportSinglePdf(Category $category)
    {
        $pdf = Pdf::loadView('categories.category-single', compact('category'))->setPaper('a4', 'portrait');
        return $pdf->download("category_{$category->id}.pdf");
    }

    public function exportSingleExcel(Category $category)
    {
        return Excel::download(new class($category) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            protected $category;
            public function __construct($category) { $this->category = $category; }
            public function collection() { return collect([['ID' => $this->category->id, 'Name' => $this->category->name, 'Slug' => $this->category->slug, 'Description' => $this->category->description, 'Created Date' => $this->category->created_at->format('d M Y')]]); }
            public function headings(): array { return ['ID', 'Name', 'Slug', 'Description', 'Created Date']; }
        }, "category_{$category->id}.xlsx");
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return back()->with('error', 'No categories selected.');

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
        if ($categories->isEmpty()) return back()->with('error', 'No categories selected.');
        $pdf = Pdf::loadView('categories.category-bulk-pdf', compact('categories'))->setPaper('a4', 'portrait');
        return $pdf->download('categories_export.pdf');
    }

    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $categories = Category::whereIn('id', $ids)->get();
        if ($categories->isEmpty()) return back()->with('error', 'No categories selected.');

        return Excel::download(new class($categories) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            protected $categories;
            public function __construct($categories) { $this->categories = $categories; }
            public function collection() { return $this->categories->map(fn ($category) => ['ID' => $category->id, 'Name' => $category->name, 'Slug' => $category->slug, 'Description' => $category->description, 'Created Date' => optional($category->created_at)->format('d M Y')]); }
            public function headings(): array { return ['ID', 'Name', 'Slug', 'Description', 'Created Date']; }
        }, 'categories_export.xlsx');
    }

    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setCellValue('A1', 'name');
        $sheet->setCellValue('B1', 'description');
        $sheet->setCellValue('A2', 'Sample Category');
        $sheet->setCellValue('B2', 'Optional description');
        foreach (range('A', 'B') as $col) $sheet->getColumnDimension($col)->setAutoSize(true);
        $writer = new Xlsx($spreadsheet);
        return response()->streamDownload(fn () => $writer->save('php://output'), 'categories_template.xlsx');
    }

    // 🟢 FIX 3: Import Logic with Loop
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,txt|max:4096',
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $rows = [];

        // Parse File
        if ($extension === 'csv' || $extension === 'txt') {
            if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
                $header = fgetcsv($handle, 1000, ',');
                $header = array_map('strtolower', $header);
                while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                    if (count($header) === count($data)) $rows[] = array_combine($header, $data);
                }
                fclose($handle);
            }
        } else {
            $sheets = \Maatwebsite\Excel\Facades\Excel::toArray([], $file);
            $rawRows = $sheets[0] ?? [];
            if (count($rawRows) > 0) {
                $header = array_map('strtolower', $rawRows[0]);
                unset($rawRows[0]);
                $rows = array_map(function($r) use ($header) {
                    return count($header) === count($r) ? array_combine($header, $r) : [];
                }, $rawRows);
            }
        }

        $imported = 0;

        foreach ($rows as $row) {
            if (empty($row)) continue;
            $originalName = trim($row['name'] ?? '');
            if (empty($originalName)) continue;

            $name = $originalName;
            $slug = \Illuminate\Support\Str::slug($name);

            // Loop to find unique name
            $counter = 1;
            while (Category::where('name', $name)->orWhere('slug', $slug)->exists()) {
                $name = "{$originalName} (duplicate {$counter})";
                $slug = \Illuminate\Support\Str::slug($name);
                $counter++;
            }

            Category::create([
                'name' => $name,
                'slug' => $slug,
                'description' => $row['description'] ?? 'Imported via CSV',
                'created_at' => Carbon::now(),
            ]);

            $imported++;
        }

        return back()->with('success', "$imported category(s) imported successfully.");
    }
}
