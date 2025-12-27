<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\Permission; // Our custom model
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;


class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $module = $request->input('module'); // 🟢 NEW: Module filter (specific to permissions)
        $perPage = (int) ($request->input('perPage', 10));
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        // base query
        $query = Permission::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                // Search by label, name (slug), or module
                $q->where('label', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('module', 'like', "%{$search}%");
            });
        }

        // Apply Module Filter
        if ($module) {
            $query->where('module', $module);
        }

        // 🟢 NEW: Apply Date Range Filter (from BrandController)
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

        // counts for UI
        $totalCount = Permission::count();
        $filteredCount = $query->count();

        // Transformation function
        $transform = function (Permission $permission) {
            return [
                'id' => $permission->id,
                'label' => $permission->label,
                'name' => $permission->name,
                'module' => $permission->module,
                'description' => $permission->description,
                'is_active' => $permission->is_active,
                'created_at' => optional($permission->created_at)->format('d M Y'),
                // 🟢 NEW: Add role count for 'Cannot delete' check (optional but useful)
                'role_count' => $permission->roles->count(),
            ];
        };

        // 🟢 NEW: Pagination Logic (from BrandController)
        if ($perPage === -1) {
            $all = $query->latest()->get()->map($transform);
            $permissions = [
                'data' => $all,
                'total' => $filteredCount,
                'per_page' => $perPage,
                'from' => $all->count() ? 1 : 0,
                'to' => $all->count(),
                'links' => [],
            ];
        } else {
            $paginator = $query->latest()->paginate($perPage)->withQueryString();
            $paginator->getCollection()->transform($transform);
            $permissions = $paginator;
        }

        return Inertia::render('permissions/index', [
            'permissions' => $permissions,
            'filters' => $request->only(['search', 'module', 'perPage','dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
        ]);
    }

    public function create() { /* Unused */ }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validation is inline (as agreed)
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'module' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $name = Str::slug($validated['label']);

        // 🟢 FIX: Check if permission with this name already exists
        // 🟢 FIX: Manual check for Slug collision (e.g. "View User" vs "view-user")
        if (Permission::where('name', $name)->exists()) {
            // Returns error on the 'label' field specifically
            return back()->withErrors(['label' => 'Permission with this name already exists.'])->withInput();
        }


        $permission = Permission::create([
            'module' => $validated['module'],
            'label' => $validated['label'],
            'name' => Str::slug($validated['label']), // Generate slug from label
            'description' => $validated['description'],
            'guard_name' => 'web',
            'is_active' => true, // Default to active
        ]);

        if($permission) {
            return redirect()->route('permissions.index')->with('success', 'Permission created successfully');
        }
        return redirect()->back()->with('error', 'Unable to create permission. Please try again');
    }



    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Permission $permission)
    {
        // Validation is inline
        $validated = $request->validate([
            'label' => [
                'required',
                'string',
                'max:255',
                Rule::unique('permissions', 'label')->ignore($permission->id, 'id'),
            ],
            'module' => 'required|string|max:255',
            'description' => 'nullable|string',
            // Allow updating is_active flag
            'is_active' => 'required|boolean',
        ]);

        $name = Str::slug($validated['label']);

        // 🟢 FIX: Check if *another* permission already has this name
        if (Permission::where('name', $name)->where('id', '!=', $permission->id)->exists()) {
            return back()->withErrors(['label' => 'Permission with this name already exists.'])->withInput();
        }

        if ($permission) {
            $permission->module = $validated['module'];
            $permission->label = $validated['label'];
            $permission->name = Str::slug($validated['label']);
            $permission->description = $validated['description'];
            $permission->is_active = $validated['is_active'];

            $permission->save();
            return redirect()->route('permissions.index')->with('success', 'Permission updated successfully');
        }

        return redirect()->back()->with('error', 'Unable to update permission. Please try again');
    }

    /**
     * Remove the specified resource from storage. (Using string $id as requested)
     */
    public function destroy(string $id)
    {
        $permission = Permission::findOrFail($id);

        if ($permission->roles()->exists()) {
             return back()->with('error', 'Cannot delete permission: It is currently assigned to one or more roles.');
        }

        DB::beginTransaction();
        try {
            $permission->delete();
            DB::commit();
            return redirect()->back()->with('success', 'Permission deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Permission Deletion Error: " . $e->getMessage());
            return back()->with('error', 'Failed to delete permission due to a system error.');
        }
    }

    // --- 🟢 NEW: BULK ACTIONS (from BrandController) ---

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return back()->with('error', 'No permissions selected.');
        }

        $permissions = Permission::whereIn('id', $ids)->get();

        // Prevent deletion if any permission is assigned to a role
        if ($permissions->filter(fn ($p) => $p->roles()->exists())->count() > 0) {
            return back()->with('error', "Cannot delete selected permission(s): One or more are assigned to roles.");
        }

        DB::beginTransaction();
        try {
            $deletedCount = Permission::whereIn('id', $ids)->delete();
            DB::commit();
            return back()->with('success', $deletedCount . ' permission(s) deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Bulk Permission Deletion Error: " . $e->getMessage());
            return back()->with('error', 'Failed to delete permissions: ' . $e->getMessage());
        }
    }

    // --- 🟢 NEW: EXPORT ACTIONS (from BrandController) ---

    // Note: PDF/Excel Exports use simple array structure for Permissions

    public function exportSinglePdf(Permission $permission)
    {
        $pdf = Pdf::loadView('permissions.permission-single', compact('permission'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("permission_{$permission->id}.pdf");
    }

    public function bulkExportPDF(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $permissions = Permission::whereIn('id', $ids)->get();

        if ($permissions->isEmpty()) {
            return back()->with('error', 'No permissions selected for export.');
        }

        $pdf = Pdf::loadView('permissions.permission-bulk-pdf', compact('permissions'))
            ->setPaper('a4', 'portrait');

        return $pdf->download('permissions_export.pdf');
    }

    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $permissions = Permission::whereIn('id', $ids)->get();

        if ($permissions->isEmpty()) {
            return back()->with('error', 'No permissions selected for export.');
        }

        return Excel::download(
            new class($permissions) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $permissions;
                public function __construct($permissions) { $this->permissions = $permissions; }

                public function collection()
                {
                    return $this->permissions->map(fn ($p) => [
                        'ID' => $p->id,
                        'Label' => $p->label,
                        'Name' => $p->name,
                        'Module' => $p->module,
                        'Description' => $p->description,
                        'Active' => $p->is_active ? 'Yes' : 'No',
                        'Created Date' => optional($p->created_at)->format('d M Y'),
                    ]);
                }

                public function headings(): array
                {
                    return ['ID', 'Label', 'Name', 'Module', 'Description', 'Active', 'Created Date'];
                }
            },
            'permissions_export.xlsx'
        );
    }

    // --- 🟢 NEW: IMPORT ACTIONS (from BrandController) ---

    // 🧾 Download Excel Template
    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $sheet->setCellValue('A1', 'label');
        $sheet->setCellValue('B1', 'module');
        $sheet->setCellValue('C1', 'description');

        // Example Row
        $sheet->setCellValue('A2', 'View Dashboard');
        $sheet->setCellValue('B2', 'dashboard');
        $sheet->setCellValue('C2', 'Allows access to the main dashboard view');

        // Auto-size columns
        foreach (range('A', 'C') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'permissions_template.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }

    // 📥 Import Permissions (Excel or CSV)
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,txt|max:4096',
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $rows = [];

        // Simple manual parsing for CSV/TXT
        if ($extension === 'csv' || $extension === 'txt') {
            if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
                $header = array_map('strtolower', fgetcsv($handle, 1000, ','));
                while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                    if (count($header) === count($data)) {
                        $rows[] = array_combine($header, $data);
                    }
                }
                fclose($handle);
            }
        } else {
            // Handle Excel file
            $sheets = Excel::toArray([], $file);
            $rows = $sheets[0] ?? [];
            if (!empty($rows)) {
                 $header = array_map('strtolower', $rows[0]);
                 unset($rows[0]);
                 $rows = array_map(fn($r) => count($header) === count($r) ? array_combine($header, $r) : null, $rows);
                 $rows = array_filter($rows);
            }
        }

        $imported = 0;

        foreach ($rows as $row) {
            $label = trim($row['label'] ?? '');
            $module = trim($row['module'] ?? '');

            if (empty($label) || empty($module)) continue;

            $name = Str::slug($label);

            // Check if a permission with the same name (slug) already exists
            $exists = Permission::where('name', $name)->exists();

            if ($exists) {
                // Skip duplicates during import to maintain uniqueness
                continue;
            }

            Permission::create([
                'label' => $label,
                'module' => $module,
                'name' => $name, // Use the generated slug
                'description' => $row['description'] ?? 'Imported permission',
                'guard_name' => 'web',
                'is_active' => true,
            ]);

            $imported++;
        }

        return back()->with('success', "$imported permission(s) imported successfully.");
    }
}
