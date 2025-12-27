<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Role;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
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

        // 🟢 FIX 1: Load 'roles' (plural) because Spatie uses a relationship, not a column.
        $query = User::with(['roles', 'store']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  // 🟢 FIX 2: Search inside the 'roles' relationship
                  ->orWhereHas('roles', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('store', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        // Apply Date Range Filter
        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

            if ($start && $end) {
                 $query->whereBetween('users.created_at', [$start, $end]);
            }
        }

        // Fetch lookup data for select inputs in the modal
        $roles = Role::where('is_active', true)->get(['id', 'name']);
        $stores = Store::all(['id', 'name']);

        $totalCount = User::count();
        $filteredCount = $query->count();

        // 🟢 FIX 3: Transformation logic to get data from Spatie
        $transform = function (User $user) {
            // Get the first assigned role (Spatie supports multiple, but we usually use one)
            $primaryRole = $user->roles->first();

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,

                // Get ID from the relationship, not the user table column
                'role_id' => $primaryRole ? $primaryRole->id : null,
                'store_id' => $user->store_id,

                // Get Name from the relationship
                'role_name' => $primaryRole ? $primaryRole->name : 'N/A',
                'store_name' => $user->store->name ?? 'N/A',

                'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->format('d M Y h:i A') : null,
                'created_at' => $user->created_at?->format('d M Y h:i A'),
            ];
        };

        if ($perPage === -1) {
            $all = $query->latest()->get()->map($transform);
            $users = [
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
            $users = $paginator;
        }

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => $request->only(['search', 'perPage','dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'lookupData' => compact('roles', 'stores'),
            'currentUserId' => auth()->id(),
        ]);
    }

    public function store(Request $request)
    {
        // 1. Sanitize "null" strings
        if ($request->input('role_id') === 'null') $request->merge(['role_id' => null]);
        if ($request->input('store_id') === 'null') $request->merge(['store_id' => null]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role_id' => 'required|exists:roles,id', // Required for logic, not for user table
            'store_id' => 'nullable|exists:stores,id',
        ]);

        // 🟢 FIX: Create User WITHOUT role_id
        // We do not pass role_id here because the column does not exist in the users table.
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'store_id' => $validated['store_id'] ?? null,
        ]);

        // 2. Assign the Role (Spatie Relationship)
        // We use the ID from validation to find the Role Model and sync it.
        $role = Role::find($validated['role_id']);
        if ($user && $role) {
            $user->syncRoles($role->name);
        }

        return redirect()
            ->route('users.index')
            ->with('success', 'User created successfully and role assigned.');
    }



   public function update(Request $request, User $user)
    {
        // 1. Sanitize "null" strings
        if ($request->input('role_id') === 'null') $request->merge(['role_id' => null]);
        if ($request->input('store_id') === 'null') $request->merge(['store_id' => null]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8|confirmed',
            'role_id' => 'required|exists:roles,id',
            'store_id' => 'nullable|exists:stores,id',
        ]);

        // Handle Password
        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        // 🟢 FIX: Extract role_id and UNSET it immediately
        // We save it to $newRoleId for Spatie, but remove it from $validated so User::update doesn't crash.
        $newRoleId = $validated['role_id'] ?? null;
        unset($validated['role_id']);

        // Security: Super Admin Logic
        $isSuperAdmin = $user->id === 1;
        $skipRoleSync = false;

        if ($isSuperAdmin) {
            // Prevent changing Store for Super Admin
            unset($validated['store_id']);

            // Check if Super Admin is trying to change their own role (Dangerous)
            // We force skip the sync to keep them as Super Admin
            $skipRoleSync = true;
        }

        // 2. Update User Table (Safe now, role_id is gone)
        $user->update($validated);

        // 3. Sync Spatie Role
        if (!$skipRoleSync && $newRoleId) {
            $role = Role::find($newRoleId);
            if ($role) {
                $user->syncRoles($role->name);
            }
        }

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        if ($user->id === 1) return back()->with('error', 'The Super Admin user cannot be deleted.');
        if ($user->id === auth()->id()) return back()->with('error', 'You cannot delete yourself.');
        $user->delete();
        return redirect()->back()->with('success', 'User deleted successfully');
    }


    /**
     * Handle bulk deletion.
     */
    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) return back()->with('error', 'No users selected.');

        // 🛑 SECURITY: Protect Admin & Self
        $protectedIds = [1, auth()->id()];
        $ids = array_diff($ids, $protectedIds);

        if (count($ids) === 0) {
            return back()->with('error', 'Cannot perform bulk delete on protected user accounts.');
        }

        DB::beginTransaction();
        try {
            $deletedCount = User::whereIn('id', $ids)->delete();
            DB::commit();
            return back()->with('success', $deletedCount . ' user(s) deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to delete users.');
        }
    }

    // --- Export Methods ---

    public function exportSinglePdf(User $user)
    {
        $user->load(['role', 'store']);
        $pdf = Pdf::loadView('users.user-single-pdf', compact('user'))->setPaper('a4', 'portrait');
        return $pdf->download("user_{$user->id}.pdf");
    }

    public function exportSingleExcel(User $user)
    {
        $user->load(['role', 'store']);
        return Excel::download(new class($user) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            protected $user;
            public function __construct($user) { $this->user = $user; }
            public function collection() {
                return collect([[
                    $this->user->id,
                    $this->user->name,
                    $this->user->email,
                    $this->user->role->name ?? 'N/A',
                    $this->user->store->name ?? 'N/A',
                    $this->user->created_at?->format('d M Y'),
                ]]);
            }
            public function headings(): array { return ['ID', 'Name', 'Email', 'Role', 'Store', 'Created Date']; }
        }, "user_{$user->id}.xlsx");
    }

    public function bulkExportPDF(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $users = User::whereIn('id', $ids)->with(['role', 'store'])->get();
        if ($users->isEmpty()) return back()->with('error', 'No users selected.');

        $pdf = Pdf::loadView('users.users-bulk-pdf', compact('users'))->setPaper('a4', 'portrait');
        return $pdf->download('users_export.pdf');
    }

    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $users = User::whereIn('id', $ids)->with(['role', 'store'])->get();
        if ($users->isEmpty()) return back()->with('error', 'No users selected.');

        return Excel::download(new class($users) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            protected $users;
            public function __construct($users) { $this->users = $users; }
            public function collection() {
                return $this->users->map(fn ($user) => [
                    $user->id, $user->name, $user->email, $user->role->name ?? 'N/A', $user->store->name ?? 'N/A', $user->is_active ? 'Yes' : 'No', optional($user->created_at)->format('d M Y')
                ]);
            }
            public function headings(): array { return ['ID', 'Name', 'Email', 'Role', 'Store', 'Active', 'Created Date']; }
        }, 'users_export.xlsx');
    }

    // --- Import Methods ---

    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setCellValue('A1', 'name'); $sheet->setCellValue('B1', 'email'); $sheet->setCellValue('C1', 'password');
        $sheet->setCellValue('D1', 'role_name'); $sheet->setCellValue('E1', 'store_name');

        $writer = new Xlsx($spreadsheet);
        return response()->streamDownload(fn() => $writer->save('php://output'), 'users_template.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|mimes:xlsx,csv|max:4096']);
        $errors = [];
        $GLOBALS['imported_count'] = 0;

        $roles = Role::all()->keyBy(fn ($r) => Str::lower($r->name));
        $stores = Store::all()->keyBy(fn ($s) => Str::lower($s->name));

        // Note: Ensure you have a Role named 'Staff' and a Store named 'Main Store' or update these defaults
        $defaultRole = $roles->get('staff')?->id ?? Role::first()->id ?? null;
        $defaultStore = $stores->get('main store')?->id ?? Store::first()->id ?? null;

        DB::beginTransaction();
        try {
            Excel::import(new class($roles, $stores, $errors, $defaultRole, $defaultStore) implements \Maatwebsite\Excel\Concerns\ToCollection {
                private $roles, $stores, $errors, $defaultRole, $defaultStore;
                public function __construct($roles, $stores, &$errors, $defaultRole, $defaultStore) {
                    $this->roles = $roles; $this->stores = $stores; $this->errors = &$errors;
                    $this->defaultRole = $defaultRole; $this->defaultStore = $defaultStore;
                }

                public function collection(\Illuminate\Support\Collection $rows) {
                    foreach ($rows->skip(1) as $rowIndex => $row) {
                        $data = [
                            'name' => trim($row[0] ?? ''), 'email' => trim($row[1] ?? ''),
                            'password' => trim($row[2] ?? ''), 'role_name' => trim($row[3] ?? ''), 'store_name' => trim($row[4] ?? '')
                        ];
                        $rowNum = $rowIndex + 1; $rowErrors = [];

                        if (empty($data['name'])) $rowErrors[] = 'Name required.';
                        if (empty($data['email'])) $rowErrors[] = 'Email required.';
                        if (empty($data['password'])) $rowErrors[] = 'Password required.';
                        if (User::where('email', $data['email'])->exists()) $rowErrors[] = "Email exists.";

                        if (!empty($rowErrors)) { $this->errors[$rowNum] = $rowErrors; continue; }

                        $roleId = $this->roles->get(Str::lower($data['role_name']))?->id ?? $this->defaultRole;
                        $storeId = $this->stores->get(Str::lower($data['store_name']))?->id ?? $this->defaultStore;

                        try {
                            User::create([
                                'name' => $data['name'], 'email' => $data['email'],
                                'password' => bcrypt($data['password']), 'role_id' => $roleId, 'store_id' => $storeId,
                            ]);
                            $GLOBALS['imported_count']++;
                        } catch (\Exception $e) {
                            $this->errors[$rowNum] = ["DB Error: " . $e->getMessage()];
                        }
                    }
                }
            }, $request->file('file'));

            if (!empty($errors)) {
                DB::rollBack(); // Rollback if any errors to keep clean state (optional)
                return back()->with('error', "Import failed on " . count($errors) . " rows.");
            }

            DB::commit();
            return back()->with('success', "{$GLOBALS['imported_count']} users imported.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Import error: ' . $e->getMessage());
        }
    }
}
