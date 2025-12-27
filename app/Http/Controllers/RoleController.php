<?php

namespace App\Http\Controllers;

use App\Models\Role; // Our custom Role model (which extends SpatieRole)
use Inertia\Inertia;
use App\Models\Permission;
use Illuminate\Support\Str;
use Illuminate\Http\Request; // Use base Request for filtering
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

// Exports
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;


class RoleController extends Controller
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

        $query = Role::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('label', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply Date Range Filter
        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;
            if ($start && $end) {
                 $query->whereBetween('created_at', [$start, $end]);
            }
        }

        // Counts for UI
        $totalCount = Role::count();
        $filteredCount = $query->count();

        // Permissions grouped by module for the modal form
        $permissionsGrouped = Permission::get()->groupBy('module');

        // Transformation function
        $transform = function (Role $role) {
            return [
                'id' => $role->id,
                'label' => $role->label,
                'name' => $role->name,
                'description' => $role->description,
                'created_at' => optional($role->created_at)->format('d M Y'),
                // Permissions attached to the role (used for viewing/editing)
                'permissions_ids' => $role->permissions->pluck('name')->toArray(), // Use name/slug for Spatie
                // 🟢 NEW: Add user count for 'Cannot delete' check
                'user_count' => $role->users()->count(),
                'all_store_access' => (bool) $role->all_store_access,
                'is_active' => (bool) $role->is_active,
            ];
        };

        // Pagination Logic (consistent with PermissionController)
        if ($perPage === -1) {
            $all = $query->latest()->get()->map($transform);
            $roles = [
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
            $roles = $paginator;
        }

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'permissionsGrouped' => $permissionsGrouped, // Pass this to the frontend
            'filters' => $request->only(['search', 'perPage','dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
        ]);
    }

    public function create() { /* Unused */ }
    public function show(string $id) { /* Unused */ }
    public function edit(string $id) { /* Unused */ }


    /**
     * Store a newly created resource in storage.
     * Uses your core syncPermissions logic.
     */
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // 🔍 LOG 1: Raw Input
        Log::info('--- ROLE CREATE: START ---', ['input' => $request->all()]);

        // Merge logic to handle 'permissions_ids' vs 'permissions'
        if (!$request->has('permissions') && $request->has('permissions_ids')) {
            Log::info('ROLE CREATE: Merging permissions_ids into permissions key.');
            $request->merge(['permissions' => $request->input('permissions_ids')]);
        }

        $validated = $request->validate([
            'label' => 'required|string|max:255|unique:roles,label',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
            'is_active' => 'required|boolean',
            'all_store_access' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        try {
            $role = Role::create([
                'label' => $validated['label'],
                'name' => Str::slug($validated['label']),
                'description' => $validated['description'],
                'guard_name' => 'web',
                'is_active' => $validated['is_active'],
                'all_store_access' => $validated['all_store_access'] ?? false,
            ]);

            // 🔍 LOG 2: Check what we are about to sync
            $rawPermissions = $validated['permissions'] ?? [];
            $permissionsToSync = [];

            // Formatting loop
            foreach ($rawPermissions as $perm) {
                if (is_array($perm) && isset($perm['name'])) {
                    $permissionsToSync[] = $perm['name'];
                } elseif (is_string($perm) || is_numeric($perm)) {
                    $permissionsToSync[] = $perm;
                }
            }

            Log::info('ROLE CREATE: Permissions prepared for sync', [
                'role_id' => $role->id,
                'count' => count($permissionsToSync),
                'permissions_list' => $permissionsToSync
            ]);

            // Sync
            $role->syncPermissions($permissionsToSync);

            // 🔍 LOG 3: Verification
            Log::info('ROLE CREATE: Success. Current database permissions count: ' . $role->permissions()->count());

            DB::commit();
            return redirect()->route('roles.index')->with('success', 'Role created successfully with Permissions');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("ROLE CREATE: FAILED", ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Unable to create role. ' . $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Role $role)
    {
        // 🔍 LOG 1: Raw Input
        Log::info("--- ROLE UPDATE: START (Role ID: {$role->id}) ---", ['input' => $request->all()]);

        // Merge logic
        if (!$request->has('permissions') && $request->has('permissions_ids')) {
            Log::info('ROLE UPDATE: Merging permissions_ids into permissions key.');
            $request->merge(['permissions' => $request->input('permissions_ids')]);
        }

        $validated = $request->validate([
            'label' => [
                'required', 'string', 'max:255',
                Rule::unique('roles', 'label')->ignore($role->id),
            ],
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
            'is_active' => 'required|boolean',
            'all_store_access' => 'nullable|boolean',
        ]);

        // Security Check
        if ($role->name === 'super-administrator' && !($validated['all_store_access'] ?? false)) {
            Log::warning('ROLE UPDATE: Blocked attempt to revoke super-admin access.');
            return redirect()->back()->with('error', 'The Super Administrator role must retain All Store Access.');
        }

        DB::beginTransaction();
        try {
            $role->label = $validated['label'];
            $role->name = Str::slug($validated['label']);
            $role->description = $validated['description'];
            $role->is_active = $validated['is_active'];
            $role->all_store_access = $validated['all_store_access'] ?? false;
            $role->save();

            // 🔍 LOG 2: Check what we are about to sync
            $rawPermissions = $validated['permissions'] ?? [];
            $permissionsToSync = [];

            foreach ($rawPermissions as $perm) {
                if (is_array($perm) && isset($perm['name'])) {
                    $permissionsToSync[] = $perm['name'];
                } elseif (is_string($perm) || is_numeric($perm)) {
                    $permissionsToSync[] = $perm;
                }
            }

            Log::info('ROLE UPDATE: Permissions prepared for sync', [
                'role_id' => $role->id,
                'count' => count($permissionsToSync),
                'permissions_list' => $permissionsToSync
            ]);

            // Sync
            $role->syncPermissions($permissionsToSync);

            // 🔍 LOG 3: Verification
            // Force refresh of relationship to get accurate count
            Log::info('ROLE UPDATE: Success. Current database permissions count: ' . $role->refresh()->permissions()->count());

            DB::commit();
            return redirect()->route('roles.index')->with('success', 'Role updated successfully with Permissions');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("ROLE UPDATE: FAILED", ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Unable to update role. ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $role = Role::findOrFail($id);

        if ($role->users()->count() > 0) {
             return back()->with('error', 'Cannot delete role: It is currently assigned to one or more users.');
        }

        DB::beginTransaction();
        try {
            $role->delete();
            DB::commit();
            return redirect()->back()->with('success', 'Role deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Role Deletion Error: " . $e->getMessage());
            return back()->with('error', 'Failed to delete role due to a system error.');
        }
    }

    // --- 🟢 SECONDARY METHODS (Bulk Actions, Export, Import) ---

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return back()->with('error', 'No roles selected.');
        }

        $roles = Role::whereIn('id', $ids)->get();

        // Prevent deletion if any role is assigned to a user
        if ($roles->filter(fn ($r) => $r->users()->count() > 0)->count() > 0) {
            return back()->with('error', "Cannot delete selected role(s): One or more are assigned to users.");
        }

        DB::beginTransaction();
        try {
            $deletedCount = Role::whereIn('id', $ids)->delete();
            DB::commit();
            return back()->with('success', $deletedCount . ' role(s) deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Bulk Role Deletion Error: " . $e->getMessage());
            return back()->with('error', 'Failed to delete roles: ' . $e->getMessage());
        }
    }

    // --- EXPORT ACTIONS ---

    public function exportSinglePdf(Role $role)
    {
        $pdf = Pdf::loadView('roles.role-single', compact('role'))
            ->setPaper('a4', 'portrait');
        return $pdf->download("role_{$role->id}.pdf");
    }

    public function bulkExportPDF(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $roles = Role::whereIn('id', $ids)->get();

        if ($roles->isEmpty()) {
            return back()->with('error', 'No roles selected for export.');
        }

        $pdf = Pdf::loadView('roles.role-bulk-pdf', compact('roles'))
            ->setPaper('a4', 'portrait');

        return $pdf->download('roles_export.pdf');
    }

    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $roles = Role::whereIn('id', $ids)->get();

        if ($roles->isEmpty()) {
            return back()->with('error', 'No roles selected for export.');
        }

        return Excel::download(
            new class($roles) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $roles;
                public function __construct($roles) { $this->roles = $roles; }

                public function collection()
                {
                    return $this->roles->map(fn ($r) => [
                        'ID' => $r->id,
                        'Label' => $r->label,
                        'Name (Slug)' => $r->name,
                        'Description' => $r->description,
                        'Permissions Count' => $r->permissions->count(),
                        'Created Date' => optional($r->created_at)->format('d M Y'),
                    ]);
                }

                public function headings(): array
                {
                    return ['ID', 'Label', 'Name (Slug)', 'Description', 'Permissions Count', 'Created Date'];
                }
            },
            'roles_export.xlsx'
        );
    }

    // --- IMPORT ACTIONS ---

    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $sheet->setCellValue('A1', 'label');
        $sheet->setCellValue('B1', 'description');

        // Example Row
        $sheet->setCellValue('A2', 'Warehouse Manager');
        $sheet->setCellValue('B2', 'Can manage inventory and stock transfers');

        foreach (range('A', 'B') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'roles_template.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,txt|max:4096',
        ]);

        $file = $request->file('file');
        // Simple file parsing logic (using similar structure as PermissionController)
        $rows = (new \App\Services\ImportService())->parseFile($file);

        $imported = 0;

        foreach ($rows as $row) {
            $label = trim($row['label'] ?? '');
            if (empty($label)) continue;

            $name = Str::slug($label);

            // Check if a role with the same name (slug) already exists
            $exists = Role::where('name', $name)->exists();
            if ($exists) continue;

            Role::create([
                'label' => $label,
                'name' => $name,
                'description' => $row['description'] ?? 'Imported role',
                'guard_name' => 'web',
            ]);

            $imported++;
        }

        return back()->with('success', "$imported role(s) imported successfully.");
    }
}
