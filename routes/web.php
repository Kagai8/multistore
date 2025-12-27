<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\NewStockEntryController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\AdjustmentReasonController;
use App\Http\Controllers\StockAdjustmentRequestController;

// Redirect root to login if not authenticated
Route::get('/', function () {
    if (Auth::check()) {
        return to_route('dashboard'); // or your inventory index
    }
    return to_route('login');
})->name('home');

// Explicit login route (if not already defined)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // --------------------------------------------------------------BRANDS ROUTES-------------------------------------------- //
    Route::get('/brands/download-template', [BrandController::class, 'downloadTemplate'])->name('brands.download-template');
    Route::post('/brands/import', [BrandController::class, 'import'])->name('brands.import'); // <-- Just one
    Route::post('/brands/bulk-delete', [BrandController::class, 'bulkDelete'])->name('brands.bulk-delete');
    Route::get('/brands/bulk-export-pdf', [BrandController::class, 'bulkExportPDF'])->name('brands.bulk-export-pdf');
    Route::get('/brands/bulk-export-excel', [BrandController::class, 'bulkExportExcel'])->name('brands.bulk-export-excel');
    Route::resource('brands', BrandController::class);
    Route::get('/brands/{brand}/export-pdf', [BrandController::class, 'exportSinglePdf'])->name('brands.export.pdf.single');
    Route::get('/brands/{brand}/export-excel', [BrandController::class, 'exportSingleExcel'])->name('brands.export.excel.single');

    // --------------------------------------------------------------CATEGORIES ROUTES-------------------------------------------- //
    Route::get('/categories/download-template', [CategoryController::class, 'downloadTemplate'])->name('categories.download-template');
    Route::post('/categories/import', [CategoryController::class, 'import'])->name('categories.import'); // <-- Just one
    Route::post('/categories/bulk-delete', [CategoryController::class, 'bulkDelete'])->name('categories.bulk-delete');
    Route::get('/categories/bulk-export-pdf', [CategoryController::class, 'bulkExportPDF'])->name('categories.bulk-export-pdf');
    Route::get('/categories/bulk-export-excel', [CategoryController::class, 'bulkExportExcel'])->name('categories.bulk-export-excel');
    Route::resource('categories', CategoryController::class);
    Route::get('/categories/{category}/export-pdf', [CategoryController::class, 'exportSinglePdf'])->name('categories.export.pdf.single');
    Route::get('/categories/{category}/export-excel', [CategoryController::class, 'exportSingleExcel'])->name('categories.export.excel.single');

    // --------------------------------------------------------------UNITS ROUTES-------------------------------------------- //
    Route::get('/units/download-template', [UnitController::class, 'downloadTemplate'])->name('units.download-template');
    Route::post('/units/import', [UnitController::class, 'import'])->name('units.import'); // <-- Just one
    Route::post('/units/bulk-delete', [UnitController::class, 'bulkDelete'])->name('units.bulk-delete');
    Route::get('/units/bulk-export-pdf', [UnitController::class, 'bulkExportPDF'])->name('units.bulk-export-pdf');
    Route::get('/units/bulk-export-excel', [UnitController::class, 'bulkExportExcel'])->name('units.bulk-export-excel');
    Route::resource('units', UnitController::class);
    Route::get('/units/{unit}/export-pdf', [UnitController::class, 'exportSinglePdf'])->name('units.export.pdf.single');
    Route::get('/units/{unit}/export-excel', [UnitController::class, 'exportSingleExcel'])->name('units.export.excel.single');

    // --------------------------------------------------------------SUPPLIERS ROUTES-------------------------------------------- //
    Route::get('/suppliers/download-template', [SupplierController::class, 'downloadTemplate'])->name('suppliers.download-template');
    Route::post('/suppliers/import', [SupplierController::class, 'import'])->name('suppliers.import'); // <-- Just one
    Route::post('/suppliers/bulk-delete', [SupplierController::class, 'bulkDelete'])->name('suppliers.bulk-delete');
    Route::get('/suppliers/bulk-export-pdf', [SupplierController::class, 'bulkExportPDF'])->name('suppliers.bulk-export-pdf');
    Route::get('/suppliers/bulk-export-excel', [SupplierController::class, 'bulkExportExcel'])->name('suppliers.bulk-export-excel');
    Route::resource('suppliers', SupplierController::class);
    Route::get('/suppliers/{supplier}/export-pdf', [SupplierController::class, 'exportSinglePdf'])->name('suppliers.export.pdf.single');
    Route::get('/suppliers/{supplier}/export-excel', [SupplierController::class, 'exportSingleExcel'])->name('suppliers.export.excel.single');

    // --------------------------------------------------------------CUSTOMERS ROUTES-------------------------------------------- //
    Route::get('/customers/download-template', [CustomerController::class, 'downloadTemplate'])->name('customers.download-template');
    Route::post('/customers/import', [CustomerController::class, 'import'])->name('customers.import'); // <-- Just one
    Route::post('/customers/bulk-delete', [CustomerController::class, 'bulkDelete'])->name('customers.bulk-delete');
    Route::get('/customers/bulk-export-pdf', [CustomerController::class, 'bulkExportPDF'])->name('customers.bulk-export-pdf');
    Route::get('/customers/bulk-export-excel', [CustomerController::class, 'bulkExportExcel'])->name('customers.bulk-export-excel');
    Route::resource('customers', CustomerController::class);
    Route::get('/customers/{customer}/export-pdf', [CustomerController::class, 'exportSinglePdf'])->name('customers.export.pdf.single');
    Route::get('/customers/{customer}/export-excel', [CustomerController::class, 'exportSingleExcel'])->name('customers.export.excel.single');

    // --------------------------------------------------------------STORES ROUTES-------------------------------------------- //
    Route::get('/stores/download-template', [StoreController::class, 'downloadTemplate'])->name('stores.download-template');
    Route::post('/stores/import', [StoreController::class, 'import'])->name('stores.import'); // <-- Just one
    Route::post('/stores/bulk-delete', [StoreController::class, 'bulkDelete'])->name('stores.bulk-delete');
    Route::get('/stores/bulk-export-pdf', [StoreController::class, 'bulkExportPDF'])->name('stores.bulk-export-pdf');
    Route::get('/stores/bulk-export-excel', [StoreController::class, 'bulkExportExcel'])->name('stores.bulk-export-excel');
    Route::resource('stores', StoreController::class);
    Route::get('/stores/{store}/export-pdf', [StoreController::class, 'exportSinglePdf'])->name('stores.export.pdf.single');
    Route::get('/stores/{store}/export-excel', [StoreController::class, 'exportSingleExcel'])->name('stores.export.excel.single');

    // --------------------------------------------------------------PRODUCTS ROUTES-------------------------------------------- //
    Route::get('/products/download-template', [ProductController::class, 'downloadTemplate'])->name('products.download-template');
    Route::post('/products/import', [ProductController::class, 'import'])->name('products.import'); // <-- Just one
    Route::post('/products/bulk-delete', [ProductController::class, 'bulkDelete'])->name('products.bulk-delete');
    Route::get('/products/bulk-export-pdf', [ProductController::class, 'bulkExportPDF'])->name('products.bulk-export-pdf');
    Route::get('/products/bulk-export-excel', [ProductController::class, 'bulkExportExcel'])->name('products.bulk-export-excel');
    Route::resource('products', ProductController::class);
    Route::get('/products/{product}/export-pdf', [ProductController::class, 'exportSinglePdf'])->name('products.export.pdf.single');
    Route::get('/products/{product}/export-excel', [ProductController::class, 'exportSingleExcel'])->name('products.export.excel.single');

    // --------------------------------------------------------------STOCKS ROUTES-------------------------------------------- //
    Route::post('/inventory/stock/adjust', [StockController::class, 'adjustStoreStock'])
    ->name('inventory.stock.adjust');
    Route::get('/stocks/download-template', [StockController::class, 'downloadTemplate'])->name('stocks.download-template');
    Route::post('/stocks/import', [StockController::class, 'import'])->name('stocks.import'); // <-- Just one
    Route::post('/stocks/bulk-delete', [StockController::class, 'bulkDelete'])->name('stocks.bulk-delete');
    Route::get('stocks/bulk-export/pdf', [StockController::class, 'bulkExportPDF'])
    ->name('stocks.bulk-export.pdf');

    Route::get('stocks/bulk-export/excel', [StockController::class, 'bulkExportExcel'])
    ->name('stocks.bulk-export.excel');
    Route::resource('stocks', StockController::class);
    Route::get('/stocks/{stock}/export-pdf', [StockController::class, 'exportSinglePdf'])->name('stocks.export.pdf.single');
    Route::get('/stocks/{stock}/export-excel', [StockController::class, 'exportSingleExcel'])->name('stocks.export.excel.single');

    // --------------------------------------------------------------Adjustment requests ROUTES------------------------------------------
    Route::prefix('stock-adjustment-requests') // 🔴 Note: match your Inertia href (`/stock-adjustment-requests`)
    ->middleware(['auth', 'verified'])
    ->group(function () {

        // 1. Resource Routes
        Route::get('/', [StockAdjustmentRequestController::class, 'index'])->name('stock-adjustment-requests.index');
        Route::post('/', [StockAdjustmentRequestController::class, 'store'])->name('stock-adjustment-requests.store');
        Route::put('/{request}', [StockAdjustmentRequestController::class, 'update'])->name('stock-adjustment-requests.update');
        Route::delete('/{request}', [StockAdjustmentRequestController::class, 'destroy'])->name('stock-adjustment-requests.destroy');

        // 🔑 NEW: Submit Draft for Approval
        Route::post('/{request}/submit', [StockAdjustmentRequestController::class, 'submit'])->name('stock-adjustment-requests.submit');

        // 2. Approval Workflow
        Route::post('/{request}/approve', [StockAdjustmentRequestController::class, 'approve'])->name('stock-adjustment-requests.approve');
        Route::post('/{request}/reject', [StockAdjustmentRequestController::class, 'reject'])->name('stock-adjustment-requests.reject');

        // 3. Exports
        Route::get('/{request}/export/pdf', [StockAdjustmentRequestController::class, 'exportSinglePdf'])->name('stock-adjustment-requests.export.pdf.single');
        Route::get('/{request}/export/excel', [StockAdjustmentRequestController::class, 'exportSingleExcel'])->name('stock-adjustment-requests.export.excel.single');


        // Optional: Bulk exports (if you implement them later)
        Route::get('/export/pdf', [StockAdjustmentRequestController::class, 'bulkExportPDF'])->name('stock-adjustment-requests.bulk-export.pdf');
        Route::get('/export/excel', [StockAdjustmentRequestController::class, 'bulkExportExcel'])->name('stock-adjustment-requests.bulk-export.excel');
    });

    // --------------------------------------------------------------ADJUSTMENT REASON ROUTES-------------------------------------------- //

    Route::get('/adjustmentreasons/download-template', [AdjustmentReasonController::class, 'downloadTemplate'])->name('adjustmentreasons.download-template');
    Route::post('/adjustmentreasons/import', [AdjustmentReasonController::class, 'import'])->name('adjustmentreasons.import'); // <-- Just one
    Route::post('/adjustmentreasons/bulk-delete', [AdjustmentReasonController::class, 'bulkDelete'])->name('adjustmentreasons.bulk-delete');
    Route::get('/adjustmentreasons/bulk-export-pdf', [AdjustmentReasonController::class, 'bulkExportPDF'])->name('adjustmentreasons.bulk-export-pdf');
    Route::get('/adjustmentreasons/bulk-export-excel', [AdjustmentReasonController::class, 'bulkExportExcel'])->name('adjustmentreasons.bulk-export-excel');
    Route::resource('adjustmentreasons', AdjustmentReasonController::class);
    Route::get('/adjustmentreasons/{adjustmentreason}/export-pdf', [AdjustmentReasonController::class, 'exportSinglePdf'])->name('adjustmentreasons.export.pdf.single');
    Route::get('/adjustmentreasons/{adjustmentreason}/export-excel', [AdjustmentReasonController::class, 'exportSingleExcel'])->name('adjustmentreasons.export.excel.single');

    // Resource Routes (Covers index, store, update, destroy)
    Route::resource('stock-transfers', StockTransferController::class);
        // Status Updates
        Route::post('stock-transfers/{stock_transfer}/initiate', [StockTransferController::class, 'initiate'])
            ->name('stock-transfers.initiate');
         // 🟢 NEW: Approval/Rejection Endpoints
        Route::post('stock-transfers/{stock_transfer}/approve', [StockTransferController::class, 'approve'])->name('stock-transfers.approve');
        Route::post('stock-transfers/{stock_transfer}/reject', [StockTransferController::class, 'reject'])->name('stock-transfers.reject');
        Route::post('stock-transfers/{stock_transfer}/send', [StockTransferController::class, 'send'])
            ->name('stock-transfers.send');
        Route::post('stock-transfers/{stock_transfer}/receive', [StockTransferController::class, 'receive'])
            ->name('stock-transfers.receive');
        // Single Exports
        Route::get('stock-transfers/{stock_transfer}/export/pdf', [StockTransferController::class, 'exportSinglePdf'])
            ->name('stock-transfers.export.pdf.single');
        Route::get('stock-transfers/{stock_transfer}/export/excel', [StockTransferController::class, 'exportSingleExcel'])
            ->name('stock-transfers.export.excel.single');
        // 🟢 BULK Actions
        Route::post('stock-transfers/bulk-delete', [StockTransferController::class, 'bulkDelete'])
            ->name('stock-transfers.bulk-delete');
        Route::get('stock-transfers/bulk-export/pdf/{ids}', [StockTransferController::class, 'bulkExportPDF'])
            ->name('stock-transfers.bulk-export.pdf');
        Route::get('stock-transfers/bulk-export/excel/{ids}', [StockTransferController::class, 'bulkExportExcel'])
            ->name('stock-transfers.bulk-export.excel');

        Route::controller(StockAdjustmentController::class)->group(function () {
            // Main Audit Log View
            Route::get('stock-adjustments', 'index')->name('stock-adjustments.index');

            // Core Stock Adjustment Transaction Handler
            Route::post('stock-adjustments', 'store')->name('stock-adjustments.store');

            // Bulk Exports for Audit Log
            Route::get('stock-adjustments/export/pdf', 'bulkExportPDF')->name('stock-adjustments.bulkExportPDF');
            Route::get('stock-adjustments/export/excel', 'bulkExportExcel')->name('stock-adjustments.bulkExportExcel');

            // Single Adjustment Record Exports
            Route::get('stock-adjustments/{adjustment}/pdf', 'exportSinglePdf')->name('stock-adjustments.exportSinglePdf');
            Route::get('stock-adjustments/{adjustment}/excel', 'exportSingleExcel')->name('stock-adjustments.exportSingleExcel');
        });

    Route::middleware(['auth', 'verified'])->group(function () {

        // --- Core Resource Routes (Flow 2: New Stock Entry) ---
        Route::resource('new-stock-entries', NewStockEntryController::class)->except(['create', 'show', 'edit']);
        // Note: We exclude 'create', 'show', 'edit' as they are handled by a modal/index view.

        // --- Stock Flow Actions ---
        // 1. Critical action to commit received stock to inventory
        Route::post('new-stock-entries/{new_stock_entry}/post', [NewStockEntryController::class, 'post'])
            ->name('new-stock-entries.post');

        // --- Bulk & Utility Actions ---

        // 2. Bulk Delete
        Route::post('new-stock-entries/bulk-delete', [NewStockEntryController::class, 'bulkDelete'])
            ->name('new-stock-entries.bulk-delete');

        // 3. Export PDF (Single Record)
        Route::get('new-stock-entries/export/pdf/{new_stock_entry}', [NewStockEntryController::class, 'exportSinglePdf'])
            ->name('new-stock-entries.export.pdf.single');

        // 4. Export Excel (Single Record)
        Route::get('new-stock-entries/export/excel/{new_stock_entry}', [NewStockEntryController::class, 'exportSingleExcel'])
            ->name('new-stock-entries.export.excel.single');

        // 5. Bulk Export PDF (Accepts comma-separated IDs via query string)
        Route::get('new-stock-entries/bulk-export-pdf', [NewStockEntryController::class, 'bulkExportPdf'])
            ->name('new-stock-entries.bulk-export-pdf');

        // 6. Bulk Export Excel (Accepts comma-separated IDs via query string)
        Route::get('new-stock-entries/bulk-export-excel', [NewStockEntryController::class, 'bulkExportExcel'])
            ->name('new-stock-entries.bulk-export-excel');

        // 🟢 Custom Routes (MUST come BEFORE Route::resource)
        Route::get('/roles/download-template', [RoleController::class, 'downloadTemplate'])->name('roles.download-template');
        // Note: roles.import is already defined by Route::resource POST /roles, but we'll use a unique path for clarity/safety.
        // Since your frontend uses 'roles.import', we'll keep the path separate from the resource store path.
        Route::post('/roles/import', [RoleController::class, 'import'])->name('roles.import');
        Route::post('/roles/bulk-delete', [RoleController::class, 'bulkDelete'])->name('roles.bulk-delete');
        Route::get('/roles/bulk-export-pdf', [RoleController::class, 'bulkExportPDF'])->name('roles.bulk-export-pdf');
        Route::get('/roles/bulk-export-excel', [RoleController::class, 'bulkExportExcel'])->name('roles.bulk-export-excel');

        // 🟢 Single Export Routes (MUST come BEFORE Route::resource because {role} is a wildcard)
        Route::get('/roles/{role}/export-pdf', [RoleController::class, 'exportSinglePdf'])->name('roles.export.pdf.single');
        Route::get('/roles/{role}/export-excel', [RoleController::class, 'exportSingleExcel'])->name('roles.export.excel.single');

        // 🟢 Standard Resource Routes (MUST come LAST in the block)
        // This defines: index, create, store, show, edit, update, destroy
        Route::resource('roles', RoleController::class)->only([
            'index', 'store', 'update', 'destroy' // Typically, create/show/edit are handled by Inertia/modal
        ]);

        // --------------------------------------------------------------USERS ROUTES-------------------------------------------- //
        Route::get('/users/download-template', [UserController::class, 'downloadTemplate'])->name('users.download-template');
        Route::post('/users/import', [UserController::class, 'import'])->name('users.import'); // <-- Just one
        Route::post('/users/bulk-delete', [UserController::class, 'bulkDelete'])->name('users.bulk-delete');
        Route::get('/users/bulk-export-pdf', [UserController::class, 'bulkExportPDF'])->name('users.bulk-export-pdf');
        Route::get('/users/bulk-export-excel', [UserController::class, 'bulkExportExcel'])->name('users.bulk-export-excel');
        Route::resource('users', UserController::class);
        Route::get('/users/{user}/export-pdf', [UserController::class, 'exportSinglePdf'])->name('users.export.pdf.single');
        Route::get('/users/{user}/export-excel', [UserController::class, 'exportSingleExcel'])->name('users.export.excel.single');

        Route::controller(PermissionController::class)->prefix('permissions')->name('permissions.')->group(function () {
            // CRUD Routes (index, store, show, update, destroy)
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::get('/{permission}', 'show')->name('show');
            // This is what Laravel is looking for when Inertia spoofs the POST with _method=PUT.
            Route::put('/{permission}', 'update')->name('update'); // PUT /permissions/{id}
            Route::delete('/{permission}', 'destroy')->name('destroy');

            // Bulk Actions
            Route::post('/bulk-delete', 'bulkDelete')->name('bulk-delete');

            // Import/Export (Context Actions)
            Route::post('/import', 'import')->name('import');
            Route::get('/download-template', 'downloadTemplate')->name('download-template');

            // Export (Single)
            Route::get('/export/pdf/{permission}', 'exportPdfSingle')->name('export.pdf.single');
            Route::get('/export/excel/{permission}', 'exportExcelSingle')->name('export.excel.single');

            // Export (Bulk)
            // Note: Passes IDs as a comma-separated string in the query parameter
            Route::get('/bulk-export/pdf', 'bulkExportPdf')->name('bulk-export-pdf');
            Route::get('/bulk-export/excel', 'bulkExportExcel')->name('bulk-export-excel');
        });
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
