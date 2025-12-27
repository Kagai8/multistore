<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use App\Models\Store; // 🟢 Import Store Model
use Illuminate\Support\Facades\Hash;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ---------------------------------------------------------
        // 🟢 STEP 1: Create the Main Store (Warehouse)
        // ---------------------------------------------------------
        $store = Store::firstOrCreate(
            ['code' => 'STR-0001'], // Unique Code to check
            [
                'name' => 'Warehouse',
                'type' => 'warehouse',
                // Optional fields (good to have for completeness)
                'email' => 'admin@warehouse.com',
                'address' => 'Headquarters',
                'phone' => '000-000-0000',
            ]
        );

        echo "✅ Store '{$store->name}' created (ID: {$store->id}).\n";

        // ---------------------------------------------------------
        // 🟢 STEP 2: Define & Create Permissions
        // ---------------------------------------------------------
        $permissions = [
            // User Management
            ['name' => 'access-user-management', 'label' => 'Access User Management', 'module' => 'users', 'description' => 'permission to access user management module'],
            ['name' => 'access-users', 'label' => 'Access Users', 'module' => 'users', 'description' => 'permission to access users module'],
            ['name' => 'create-user', 'label' => 'Create User', 'module' => 'users', 'description' => 'permission to a create user'],
            ['name' => 'view-user', 'label' => 'View User', 'module' => 'users', 'description' => 'permission to view user'],
            ['name' => 'edit-user', 'label' => 'Edit User', 'module' => 'users', 'description' => null],
            ['name' => 'delete-user', 'label' => 'Delete User', 'module' => 'users', 'description' => 'permission to delete user'],
            ['name' => 'export-user', 'label' => 'Export User', 'module' => 'users', 'description' => 'permission to export user'],
            ['name' => 'bulk-delete-user', 'label' => 'Bulk Delete User', 'module' => 'users', 'description' => 'permission to bulk delete users'],
            ['name' => 'bulk-export-user', 'label' => 'Bulk Export User', 'module' => 'users', 'description' => 'permission to bulk export users'],

            // Roles
            ['name' => 'access-roles', 'label' => 'Access Roles', 'module' => 'roles', 'description' => 'permission to access roles module'],
            ['name' => 'create-role', 'label' => 'Create Role', 'module' => 'roles', 'description' => 'permission to create role'],
            ['name' => 'edit-role', 'label' => 'Edit Role', 'module' => 'roles', 'description' => 'permission to edit role'],
            ['name' => 'view-role', 'label' => 'View Role', 'module' => 'roles', 'description' => 'permission to view role'],
            ['name' => 'delete-role', 'label' => 'Delete Role', 'module' => 'roles', 'description' => 'permission to delete role'],

            // Permissions
            ['name' => 'access-permissions', 'label' => 'Access Permissions', 'module' => 'permissions', 'description' => 'permission to access permissions module'],
            ['name' => 'create-permission', 'label' => 'Create Permission', 'module' => 'permissions', 'description' => 'permission create permission'],
            ['name' => 'edit-permission', 'label' => 'Edit Permission', 'module' => 'permissions', 'description' => 'permission to edit permission'],

            // Stores
            ['name' => 'access-stores', 'label' => 'Access Stores', 'module' => 'stores', 'description' => 'permission to access stores'],
            ['name' => 'create-store', 'label' => 'Create Store', 'module' => 'stores', 'description' => 'permission to create new store'],
            ['name' => 'view-store', 'label' => 'View Store', 'module' => 'stores', 'description' => 'permission to view store'],
            ['name' => 'edit-store', 'label' => 'Edit Store', 'module' => 'stores', 'description' => 'permission to edit store'],
            ['name' => 'delete-store', 'label' => 'Delete Store', 'module' => 'stores', 'description' => 'permission to delete store'],
            ['name' => 'export-excel-store', 'label' => 'Export Excel Store', 'module' => 'stores', 'description' => 'permission to export excel store'],
            ['name' => 'export-pdf-store', 'label' => 'Export Pdf Store', 'module' => 'stores', 'description' => 'permission to export pdf store'],

            // Customers
            ['name' => 'access-customers', 'label' => 'Access Customers', 'module' => 'customers', 'description' => 'permission to access customers module'],
            ['name' => 'create-customer', 'label' => 'Create Customer', 'module' => 'customers', 'description' => 'permission to create customer'],
            ['name' => 'view-customer', 'label' => 'View Customer', 'module' => 'customers', 'description' => 'permission to view customer'],
            ['name' => 'edit-customer', 'label' => 'Edit Customer', 'module' => 'customers', 'description' => 'permission to edit customer'],
            ['name' => 'delete-customer', 'label' => 'Delete Customer', 'module' => 'customers', 'description' => 'permission to delete customer'],
            ['name' => 'import-customer', 'label' => 'Import Customer', 'module' => 'customers', 'description' => null],
            ['name' => 'download-template-customer', 'label' => 'Download Template Customer', 'module' => 'customers', 'description' => null],
            ['name' => 'export-customer-pdf', 'label' => 'Export Customer Pdf', 'module' => 'customers', 'description' => 'permission to export customer pdf'],
            ['name' => 'export-customer-excel', 'label' => 'Export Customer Excel', 'module' => 'customers', 'description' => 'permission to export customer excel'],

            // Suppliers
            ['name' => 'access-suppliers', 'label' => 'Access Suppliers', 'module' => 'suppliers', 'description' => 'permission to access suppliers'],
            ['name' => 'create-supplier', 'label' => 'Create Supplier', 'module' => 'suppliers', 'description' => 'permission to create supplier'],
            ['name' => 'view-supplier', 'label' => 'View Supplier', 'module' => 'suppliers', 'description' => 'permission to view supplier'],
            ['name' => 'edit-supplier', 'label' => 'Edit Supplier', 'module' => 'suppliers', 'description' => 'permission to edit supplier'],
            ['name' => 'delete-supplier', 'label' => 'Delete Supplier', 'module' => 'suppliers', 'description' => 'permission to delete supplier'],
            ['name' => 'import-supplier', 'label' => 'Import Supplier', 'module' => 'suppliers', 'description' => null],
            ['name' => 'download-template-supplier', 'label' => 'Download Template Supplier', 'module' => 'suppliers', 'description' => null],
            ['name' => 'export-pdf-supplier', 'label' => 'Export Pdf Supplier', 'module' => 'suppliers', 'description' => 'permission to export pdf supplier'],
            ['name' => 'export-excel-supplier', 'label' => 'Export Excel Supplier', 'module' => 'suppliers', 'description' => 'permission to export excel supplier'],

            // Brands
            ['name' => 'access-brands', 'label' => 'Access Brands', 'module' => 'brands', 'description' => 'permission to access brands module'],
            ['name' => 'create-brand', 'label' => 'Create Brand', 'module' => 'brands', 'description' => 'permission to create brand'],
            ['name' => 'view-brand', 'label' => 'View Brand', 'module' => 'brands', 'description' => 'permission to view brand'],
            ['name' => 'edit-brand', 'label' => 'Edit Brand', 'module' => 'brands', 'description' => 'permission to edit brand'],
            ['name' => 'delete-brand', 'label' => 'Delete Brand', 'module' => 'brands', 'description' => 'permission to delete brand'],
            ['name' => 'import-brand', 'label' => 'Import Brand', 'module' => 'brands', 'description' => 'permission to import brand'],
            ['name' => 'download-template-brand', 'label' => 'Download Template Brand', 'module' => 'brands', 'description' => 'permission to download template'],

            // Categories
            ['name' => 'access-categories', 'label' => 'Access Categories', 'module' => 'categories', 'description' => 'permission to access brands module'],
            ['name' => 'create-category', 'label' => 'Create Category', 'module' => 'categories', 'description' => 'permission to create category'],
            ['name' => 'view-category', 'label' => 'View Category', 'module' => 'categories', 'description' => 'permission to view category'],
            ['name' => 'edit-category', 'label' => 'Edit Category', 'module' => 'categories', 'description' => 'permission to edit category'],
            ['name' => 'delete-category', 'label' => 'Delete Category', 'module' => 'categories', 'description' => 'permission to delete category'],
            ['name' => 'import-category', 'label' => 'Import Category', 'module' => 'categories', 'description' => null],
            ['name' => 'download-template-category', 'label' => 'Download Template Category', 'module' => 'categories', 'description' => 'permission to import category'],

            // Units
            ['name' => 'access-units', 'label' => 'Access Units', 'module' => 'units', 'description' => 'permission to access units module'],
            ['name' => 'create-unit', 'label' => 'Create Unit', 'module' => 'units', 'description' => 'permission to create unit'],
            ['name' => 'view-unit', 'label' => 'View Unit', 'module' => 'units', 'description' => 'permission to view unit'],
            ['name' => 'edit-unit', 'label' => 'Edit Unit', 'module' => 'units', 'description' => 'permission to edit unit'],
            ['name' => 'delete-unit', 'label' => 'Delete Unit', 'module' => 'units', 'description' => null],

            // Products
            ['name' => 'access-products', 'label' => 'Access Products', 'module' => 'products', 'description' => 'permission to access products module'],
            ['name' => 'create-product', 'label' => 'Create Product', 'module' => 'products', 'description' => 'permission to create product'],
            ['name' => 'view-product', 'label' => 'View Product', 'module' => 'products', 'description' => 'permission to view product'],
            ['name' => 'edit-product', 'label' => 'Edit Product', 'module' => 'products', 'description' => 'permission to edit product'],
            ['name' => 'delete-product', 'label' => 'Delete Product', 'module' => 'products', 'description' => 'permission to delete product'],
            ['name' => 'import-product', 'label' => 'Import Product', 'module' => 'products', 'description' => null],
            ['name' => 'download-template-product', 'label' => 'Download Template Product', 'module' => 'products', 'description' => null],
            ['name' => 'export-pdf-product', 'label' => 'Export Pdf Product', 'module' => 'products', 'description' => 'permission to export pdf of product'],
            ['name' => 'export-excel-product', 'label' => 'Export Excel Product', 'module' => 'products', 'description' => 'permission to export excel of product'],

            // Adjustment Reasons
            ['name' => 'access-adjustment-reasons', 'label' => 'Access Adjustment Reasons', 'module' => 'adjustment-reasons', 'description' => 'permission to access adjustment reasons'],
            ['name' => 'create-adjustment-reason', 'label' => 'Create Adjustment Reason', 'module' => 'adjustment-reasons', 'description' => 'permission to create adjustment reason'],
            ['name' => 'view-adjustmentreason', 'label' => 'View AdjustmentReason', 'module' => 'adjustment-reasons', 'description' => 'permission to view adjustment reason'],
            ['name' => 'edit-adjustmentreason', 'label' => 'Edit AdjustmentReason', 'module' => 'adjustment-reasons', 'description' => 'permission to edit adjustment reason'],
            ['name' => 'delete-adjustmentreason', 'label' => 'Delete AdjustmentReason', 'module' => 'adjustment-reasons', 'description' => 'permission to delete adjustment reason'],
            ['name' => 'bulk-delete-adjustmentreason', 'label' => 'Bulk Delete AdjustmentReason', 'module' => 'adjustment-reasons', 'description' => 'permission to bulk delete adjustment reasons'],
            ['name' => 'bulk-export-pdf-adjustmentreason', 'label' => 'Bulk Export Pdf AdjustmentReason', 'module' => 'adjustment-reasons', 'description' => 'permission to bulk export pdf adjustment reasons'],
            ['name' => 'bulk-export-excel-adjustmentreason', 'label' => 'Bulk Export Excel AdjustmentReason', 'module' => 'adjustment-reasons', 'description' => 'permission to export bulk excel adjustment reasons'],

            // Stocks (General)
            ['name' => 'access-stock-management', 'label' => 'Access Stock Management', 'module' => 'stocks', 'description' => 'permission to access stock management module'],
            ['name' => 'access-general-stock', 'label' => 'Access General Stock', 'module' => 'stocks', 'description' => 'permission to access general stock'],
            ['name' => 'create-stock-correction', 'label' => 'Create Stock Correction', 'module' => 'stocks', 'description' => 'permission to create stock correction'],
            ['name' => 'edit-stock-policy', 'label' => 'Edit Stock Policy', 'module' => 'stocks', 'description' => 'permission to edit stock policy'],
            ['name' => 'access-manual-adjustments', 'label' => 'Access Manual Adjustments', 'module' => 'stocks', 'description' => 'permission to access manual adjustments'],
            ['name' => 'export-stock-list', 'label' => 'Export Stock List', 'module' => 'stocks', 'description' => 'permission to export stock list'],

            // New Stock Entries
            ['name' => 'access-new-stock-entries', 'label' => 'Access New Stock Entries', 'module' => 'new-stock', 'description' => 'permission to access new stock entries'],
            ['name' => 'create-new-stock-entry', 'label' => 'Create New Stock Entry', 'module' => 'new-stock', 'description' => 'permission to create new stock entry'],
            ['name' => 'post-new-stock-entry', 'label' => 'Post New Stock Entry', 'module' => 'new-stock', 'description' => 'permission to post new stock entry'],
            ['name' => 'view-new-stock-entry', 'label' => 'View New Stock Entry', 'module' => 'new-stock', 'description' => 'permission to view new stock entry'],
            ['name' => 'edit-new-stock-entry', 'label' => 'Edit New Stock Entry', 'module' => 'new-stock', 'description' => 'permission to edit new stock entry'],
            ['name' => 'export-pdf-new-stock', 'label' => 'Export Pdf New Stock', 'module' => 'new-stock', 'description' => 'permission to export pdf new stock'],
            ['name' => 'export-excel-new-stock', 'label' => 'Export Excel New Stock', 'module' => 'new-stock', 'description' => 'permission to export excel new stock'],

            // Stock Transfers
            ['name' => 'access-stock-transfers', 'label' => 'Access Stock Transfers', 'module' => 'stock-transfers', 'description' => 'permission to access stock transfers'],
            ['name' => 'create-stock-transfer', 'label' => 'Create Stock Transfer', 'module' => 'stock-transfers', 'description' => 'permission to create stock transfer'],
            ['name' => 'view-stock-transfer', 'label' => 'View Stock Transfer', 'module' => 'stock-transfers', 'description' => 'permission to view stock transfers'],
            ['name' => 'edit-stock-transfer', 'label' => 'Edit Stock Transfer', 'module' => 'stock-transfers', 'description' => 'permission to edit stock transfer'],
            ['name' => 'delete-stock-transfer', 'label' => 'Delete Stock Transfer', 'module' => 'stock-transfers', 'description' => 'permission to delete stock transfer'],
            ['name' => 'send-stock-transfer', 'label' => 'Send Stock Transfer', 'module' => 'stock-transfers', 'description' => 'permission to send stock transfer'],
            ['name' => 'receive-stock-transfer', 'label' => 'Receive Stock Transfer', 'module' => 'stock-transfers', 'description' => 'permission to receive stock transfer'],
            ['name' => 'approve-stock-transfer', 'label' => 'Approve Stock Transfer', 'module' => 'stock-transfers', 'description' => 'permission to approve stock transfer'],
            ['name' => 'export-pdf-stock-transfer', 'label' => 'Export Pdf Stock Transfer', 'module' => 'stock-transfers', 'description' => 'permission to export pdf stock transfer'],
            ['name' => 'export-excel-stock-transfer', 'label' => 'Export Excel Stock Transfer', 'module' => 'stock-transfers', 'description' => 'permission to export excel stock transfer'],

            // Stock Adjustments (Requests/History)
            ['name' => 'access-stock-adjustments', 'label' => 'Access Stock Adjustments', 'module' => 'stock-adjustments', 'description' => 'permission to access stock adjustments'],
            ['name' => 'create-stock-adjustment-request', 'label' => 'Create Stock Adjustment Request', 'module' => 'stocks', 'description' => 'permissiion to create stock adjustment request'],
            ['name' => 'view-stock-adjustment-request', 'label' => 'View Stock Adjustment Request', 'module' => 'stock-adjustments', 'description' => 'permission to view'],
            ['name' => 'edit-stock-adjustment-request', 'label' => 'Edit Stock Adjustment Request', 'module' => 'stock-adjustments', 'description' => 'permission to edit stock adjustment request'],
            ['name' => 'delete-stock-adjustment-request', 'label' => 'Delete Stock Adjustment Request', 'module' => 'stock-adjustments', 'description' => 'permission to delete stock adjustment request'],
            ['name' => 'approve-stock-adjustment-request', 'label' => 'Approve Stock Adjustment Request', 'module' => 'stock-adjustments', 'description' => 'permission to approve stock adjustment request'],
            ['name' => 'export-pdf-stock-adjustment-request', 'label' => 'Export Pdf Stock Adjustment Request', 'module' => 'stock-adjustments', 'description' => 'permission to export pdf stock adjustment request'],
            ['name' => 'export-excel-stock-adjustment-request', 'label' => 'Export Excel Stock Adjustment Request', 'module' => 'stock-adjustments', 'description' => 'permission to export excel stock adjustment request'],
        ];

        $now = now();
        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['name' => $permission['name']],
                [
                    'label' => $permission['label'],
                    'module' => $permission['module'],
                    'description' => $permission['description'],
                    'guard_name' => 'web',
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        // ---------------------------------------------------------
        // 🟢 STEP 3: Create Super Admin Role
        // ---------------------------------------------------------
        $role = Role::firstOrCreate(
            ['name' => 'super-administrator'],
            [
                'label' => 'Super Administrator',
                'guard_name' => 'web',
                'all_store_access' => true,
                'is_active' => true,
                'description' => 'Role with full permissions across all stores.',
            ]
        );

        // Assign permissions
        $role->syncPermissions(Permission::all());


        // ---------------------------------------------------------
        // 🟢 STEP 4: Create User (Quincy Kagai)
        // ---------------------------------------------------------
        $user = User::firstOrCreate(
            ['email' => 'quincykagai@gmail.com'],
            [
                'name' => 'Quincy Kagai', // 🟢 Updated Name
                'password' => Hash::make('Njoroge@88'),
                'store_id' => $store->id, // 🟢 Explicitly set to the created store ID (1)
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Assign Role
        $user->assignRole($role);

        echo "\n";
        echo "✅ All " . count($permissions) . " permissions seeded.\n";
        echo "✅ Super Administrator Role created.\n";
        echo "✅ User Quincy Kagai created at Store: " . $store->name . ".\n";
    }
}
