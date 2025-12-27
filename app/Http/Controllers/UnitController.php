<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Unit;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class UnitController extends Controller
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
        $query = Unit::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
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
        $totalCount = Unit::count();
        $filteredCount = $query->count();

        // If perPage === -1, return all results as an array (no paginator links)
        if ($perPage === -1) {
            $all = $query->latest()->get()->map(function (Unit $unit) {
                return [
                    'id' => $unit->id,
                    'name' => $unit->name,
                    'slug' => $unit->slug,
                    'code' => $unit->code,
                    'created_at' => $unit->created_at ? $unit->created_at->format('d M Y') : null,
                ];
            });

            $units = [
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
            $paginator->getCollection()->transform(function (Unit $unit) {
                return [
                    'id' => $unit->id,
                    'name' => $unit->name,
                    'slug' => $unit->slug,
                    'code' => $unit->code,
                    'created_at' => $unit->created_at ? $unit->created_at->format('d M Y') : null,
                ];
            });

            $units = $paginator;
        }

        return Inertia::render('units/index', [
            'units' => $units,
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
            'name' => 'required|string|max:255|unique:units,name',
            'code' => 'required|string|max:255|unique:units,code',
        ]);

        // ✅ 2. Generate slug automatically
        $validated['slug'] = \Str::slug($validated['name']);

        // ✅ 4. Create unit record
        Unit::create($validated);

        // ✅ 5. Return back with flash success (Inertia expects this)
        return redirect()
            ->route('units.index')
            ->with('flash.success', 'Unit created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Unit $unit)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Unit $unit)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:units,name,' . $unit->id,
            'code' => 'required|string|max:255|unique:units,code,' . $unit->id,
        ]);

        // 🟢 FIX: Generate the new slug from the validated name
        $validated['slug'] = Str::slug($validated['name']);

        $unit->update($validated);

        return back()->with('success', 'Unit updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Unit $unit)
    {
        $unit->delete();

        return redirect()->back()->with('success', 'Unit deleted successfully');
    }
    public function exportSinglePdf(Unit $unit)
    {
        $pdf = Pdf::loadView('units.unit-single', compact('unit'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("unit_{$unit->id}.pdf");
    }

    public function exportSingleExcel(Unit $unit)
        {
            return Excel::download(
                new class($unit) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                    protected $unit;
                    public function __construct($unit) { $this->unit = $unit; }

                    public function collection()
                    {
                        return collect([[
                            'ID' => $this->unit->id,
                            'Name' => $this->unit->name,
                            'Slug' => $this->unit->slug,
                            'Code' => $this->unit->code,
                            'Created Date' => $this->unit->created_at->format('d M Y'),
                        ]]);
                    }

                    public function headings(): array
                    {
                        return ['ID', 'Name', 'Slug', 'Code', 'Created Date'];
                    }
                },
                "unit_{$unit->id}.xlsx"
            );
        }
    public function bulkDelete(Request $request)
        {
            $ids = $request->input('ids', []);

            if (empty($ids)) {
                return back()->with('error', 'No units selected.');
            }

            $deletedCount = Unit::destroy($ids);


            return back()->with('success', count($ids) . ' unit(s) deleted successfully.');
        }

    public function bulkExportPDF(Request $request)
        {
            $ids = explode(',', $request->input('ids', ''));
            $units = Unit::whereIn('id', $ids)->get();

            if ($units->isEmpty()) {
                return back()->with('error', 'No units selected for export.');
            }

            $pdf = Pdf::loadView('units.unit-bulk-pdf', compact('units'))
                ->setPaper('a4', 'portrait');

            return $pdf->download('units_export.pdf');
        }

    public function bulkExportExcel(Request $request)
        {
            $ids = explode(',', $request->input('ids', ''));
            $units = Unit::whereIn('id', $ids)->get();

            if ($units->isEmpty()) {
                return back()->with('error', 'No units selected for export.');
            }

            return Excel::download(
                new class($units) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                    protected $units;
                    public function __construct($units) { $this->units = $units; }

                    public function collection()
                    {
                        return $this->units->map(fn ($unit) => [
                            'ID' => $unit->id,
                            'Name' => $unit->name,
                            'Slug' => $unit->slug,
                            'Code' => $unit->code,
                            'Created Date' => optional($unit->created_at)->format('d M Y'),
                        ]);
                    }

                    public function headings(): array
                    {
                        return ['ID', 'Name', 'Slug', 'Code', 'Created Date'];
                    }
                },
                'units_export.xlsx'
            );
        }

    // 🧾 Download Excel Template
    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $sheet->setCellValue('A1', 'name');
        $sheet->setCellValue('B1', 'code');

        // Example Row
        $sheet->setCellValue('A2', 'Sample Unit');
        $sheet->setCellValue('B2', 'Sample code');

        // Auto-size columns
        foreach (range('A', 'B') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Output file
        $writer = new Xlsx($spreadsheet);
        $filename = 'units_template.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }

    // 📥 Import Units (Excel or CSV)
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
            $code = trim($row['code'] ?? '');
            if (empty($name) || empty($code)) continue;

            $baseSlug = Str::slug($name);
            $slug = $baseSlug;

            $exists = Unit::where('slug', $slug)
                ->orWhere('name', $name)
                ->orWhere('code', $code) //
                ->exists();

            if ($exists) {
                $name .= ' (duplicate)';
                $slug .= '-duplicate';
                $code .= ' (duplicate)';
            }

            Unit::create([
                'name' => $name,
                'slug' => $slug,
                'code' => $code,
                'created_at' => Carbon::now(),
            ]);

            $imported++;
        }

        return back()->with('success', "$imported unit(s) imported successfully.");
    }
}
