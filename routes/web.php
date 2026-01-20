<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\PosController;
use App\Http\Controllers\DebtController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\MpesaController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SaleItemController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NewStockEntryController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\AdjustmentReasonController;
use App\Http\Controllers\PaymentToCustomerController;
use App\Http\Controllers\PurchaseOrderItemController;
use App\Http\Controllers\StockTransferItemController;
use App\Http\Controllers\StorePaymentSettingController;
use App\Http\Controllers\StockAdjustmentRequestController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\PosSessionController;

/*
|--------------------------------------------------------------------------
| Public & Guest Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Auth::check() ? to_route('dashboard') : to_route('login');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
});

// MPESA Callback (Usually needs to be public/excluded from auth, but keeping here per your structure)
Route::post('/mpesa/callback', [MpesaController::class, 'callback']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {

    // --- Dashboard ---
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // =========================================================================
    // 1. MASTER DATA
    // =========================================================================

    // --- BRANDS ---
    Route::middleware(['permission:access-brands'])->group(function () {
        Route::get('/brands/download-template', [BrandController::class, 'downloadTemplate'])->name('brands.download-template');
        Route::post('/brands/import', [BrandController::class, 'import'])->name('brands.import');
        Route::post('/brands/bulk-delete', [BrandController::class, 'bulkDelete'])->name('brands.bulk-delete');
        Route::get('/brands/bulk-export-pdf', [BrandController::class, 'bulkExportPDF'])->name('brands.bulk-export-pdf');
        Route::get('/brands/bulk-export-excel', [BrandController::class, 'bulkExportExcel'])->name('brands.bulk-export-excel');
        Route::get('/brands/{brand}/export-pdf', [BrandController::class, 'exportSinglePdf'])->name('brands.export.pdf.single');
        Route::get('/brands/{brand}/export-excel', [BrandController::class, 'exportSingleExcel'])->name('brands.export.excel.single');
        Route::resource('brands', BrandController::class);
    });

    // --- CATEGORIES ---
    Route::middleware(['permission:access-categories'])->group(function () {
        Route::get('/categories/download-template', [CategoryController::class, 'downloadTemplate'])->name('categories.download-template');
        Route::post('/categories/import', [CategoryController::class, 'import'])->name('categories.import');
        Route::post('/categories/bulk-delete', [CategoryController::class, 'bulkDelete'])->name('categories.bulk-delete');
        Route::get('/categories/bulk-export-pdf', [CategoryController::class, 'bulkExportPDF'])->name('categories.bulk-export-pdf');
        Route::get('/categories/bulk-export-excel', [CategoryController::class, 'bulkExportExcel'])->name('categories.bulk-export-excel');
        Route::get('/categories/{category}/export-pdf', [CategoryController::class, 'exportSinglePdf'])->name('categories.export.pdf.single');
        Route::get('/categories/{category}/export-excel', [CategoryController::class, 'exportSingleExcel'])->name('categories.export.excel.single');
        Route::resource('categories', CategoryController::class);
    });

    // --- UNITS ---
    Route::middleware(['permission:access-units'])->group(function () {
        Route::get('/units/download-template', [UnitController::class, 'downloadTemplate'])->name('units.download-template');
        Route::post('/units/import', [UnitController::class, 'import'])->name('units.import');
        Route::post('/units/bulk-delete', [UnitController::class, 'bulkDelete'])->name('units.bulk-delete');
        Route::get('/units/bulk-export-pdf', [UnitController::class, 'bulkExportPDF'])->name('units.bulk-export-pdf');
        Route::get('/units/bulk-export-excel', [UnitController::class, 'bulkExportExcel'])->name('units.bulk-export-excel');
        Route::get('/units/{unit}/export-pdf', [UnitController::class, 'exportSinglePdf'])->name('units.export.pdf.single');
        Route::get('/units/{unit}/export-excel', [UnitController::class, 'exportSingleExcel'])->name('units.export.excel.single');
        Route::resource('units', UnitController::class);
    });

    // --- PRODUCTS ---
    Route::middleware(['permission:access-products'])->group(function () {
        Route::get('/products/download-template', [ProductController::class, 'downloadTemplate'])->name('products.download-template');
        Route::post('/products/import', [ProductController::class, 'import'])->name('products.import');
        Route::post('/products/bulk-delete', [ProductController::class, 'bulkDelete'])->name('products.bulk-delete');
        Route::get('/products/bulk-export-pdf', [ProductController::class, 'bulkExportPDF'])->name('products.bulk-export-pdf');
        Route::get('/products/bulk-export-excel', [ProductController::class, 'bulkExportExcel'])->name('products.bulk-export-excel');
        Route::get('/products/{product}/export-pdf', [ProductController::class, 'exportSinglePdf'])->name('products.export.pdf.single');
        Route::get('/products/{product}/export-excel', [ProductController::class, 'exportSingleExcel'])->name('products.export.excel.single');
        Route::resource('products', ProductController::class);
    });

    // --- STORES ---
    Route::middleware(['permission:access-stores'])->group(function () {
        Route::get('/stores/download-template', [StoreController::class, 'downloadTemplate'])->name('stores.download-template');
        Route::post('/stores/import', [StoreController::class, 'import'])->name('stores.import');
        Route::post('/stores/bulk-delete', [StoreController::class, 'bulkDelete'])->name('stores.bulk-delete');
        Route::get('/stores/bulk-export-pdf', [StoreController::class, 'bulkExportPDF'])->name('stores.bulk-export-pdf');
        Route::get('/stores/bulk-export-excel', [StoreController::class, 'bulkExportExcel'])->name('stores.bulk-export-excel');
        Route::get('/stores/{store}/export-pdf', [StoreController::class, 'exportSinglePdf'])->name('stores.export.pdf.single');
        Route::get('/stores/{store}/export-excel', [StoreController::class, 'exportSingleExcel'])->name('stores.export.excel.single');
        Route::resource('stores', StoreController::class);
    });

    // --- SUPPLIERS ---
    Route::middleware(['permission:access-suppliers'])->group(function () {
        Route::get('/suppliers/download-template', [SupplierController::class, 'downloadTemplate'])->name('suppliers.download-template');
        Route::post('/suppliers/import', [SupplierController::class, 'import'])->name('suppliers.import');
        Route::post('/suppliers/bulk-delete', [SupplierController::class, 'bulkDelete'])->name('suppliers.bulk-delete');
        Route::get('/suppliers/bulk-export-pdf', [SupplierController::class, 'bulkExportPDF'])->name('suppliers.bulk-export-pdf');
        Route::get('/suppliers/bulk-export-excel', [SupplierController::class, 'bulkExportExcel'])->name('suppliers.bulk-export-excel');
        Route::get('/suppliers/{supplier}/export-pdf', [SupplierController::class, 'exportSinglePdf'])->name('suppliers.export.pdf.single');
        Route::get('/suppliers/{supplier}/export-excel', [SupplierController::class, 'exportSingleExcel'])->name('suppliers.export.excel.single');
        Route::resource('suppliers', SupplierController::class);
    });

    // --- CUSTOMERS ---
    Route::middleware(['permission:access-customers'])->group(function () {
        Route::get('/customers/download-template', [CustomerController::class, 'downloadTemplate'])->name('customers.download-template');
        Route::post('/customers/import', [CustomerController::class, 'import'])->name('customers.import');
        Route::post('/customers/bulk-delete', [CustomerController::class, 'bulkDelete'])->name('customers.bulk-delete');
        Route::get('/customers/bulk-export-pdf', [CustomerController::class, 'bulkExportPDF'])->name('customers.bulk-export-pdf');
        Route::get('/customers/bulk-export-excel', [CustomerController::class, 'bulkExportExcel'])->name('customers.bulk-export-excel');
        Route::get('/customers/{customer}/export-pdf', [CustomerController::class, 'exportSinglePdf'])->name('customers.export.pdf.single');
        Route::get('/customers/{customer}/export-excel', [CustomerController::class, 'exportSingleExcel'])->name('customers.export.excel.single');
        Route::resource('customers', CustomerController::class);
    });


    // =========================================================================
    // 2. INVENTORY MANAGEMENT
    // =========================================================================

    // --- GENERAL STOCK ---
    Route::middleware(['permission:access-general-stock'])->group(function () {
        Route::post('/inventory/stock/adjust', [StockController::class, 'adjustStoreStock'])->name('inventory.stock.adjust');
        Route::get('/stocks/download-template', [StockController::class, 'downloadTemplate'])->name('stocks.download-template');
        Route::post('/stocks/import', [StockController::class, 'import'])->name('stocks.import');
        Route::post('/stocks/bulk-delete', [StockController::class, 'bulkDelete'])->name('stocks.bulk-delete');
        Route::get('stocks/bulk-export/pdf', [StockController::class, 'bulkExportPDF'])->name('stocks.bulk-export.pdf');
        Route::get('stocks/bulk-export/excel', [StockController::class, 'bulkExportExcel'])->name('stocks.bulk-export.excel');
        Route::get('/stocks/{stock}/export-pdf', [StockController::class, 'exportSinglePdf'])->name('stocks.export.pdf.single');
        Route::get('/stocks/{stock}/export-excel', [StockController::class, 'exportSingleExcel'])->name('stocks.export.excel.single');
        Route::resource('stocks', StockController::class);
    });

    // --- NEW STOCK ENTRIES ---
    Route::middleware(['permission:access-new-stock-entries'])->group(function () {
        Route::post('new-stock-entries/{new_stock_entry}/post', [NewStockEntryController::class, 'post'])->name('new-stock-entries.post');
        Route::post('new-stock-entries/bulk-delete', [NewStockEntryController::class, 'bulkDelete'])->name('new-stock-entries.bulk-delete');
        Route::get('new-stock-entries/export/pdf/{new_stock_entry}', [NewStockEntryController::class, 'exportSinglePdf'])->name('new-stock-entries.export.pdf.single');
        Route::get('new-stock-entries/export/excel/{new_stock_entry}', [NewStockEntryController::class, 'exportSingleExcel'])->name('new-stock-entries.export.excel.single');
        Route::get('new-stock-entries/bulk-export-pdf', [NewStockEntryController::class, 'bulkExportPdf'])->name('new-stock-entries.bulk-export-pdf');
        Route::get('new-stock-entries/bulk-export-excel', [NewStockEntryController::class, 'bulkExportExcel'])->name('new-stock-entries.bulk-export-excel');
        Route::resource('new-stock-entries', NewStockEntryController::class)->except(['create', 'show', 'edit']);
    });

    // --- STOCK TRANSFERS ---
    Route::middleware(['permission:access-stock-transfers'])->group(function () {
        Route::post('stock-transfers/{stock_transfer}/initiate', [StockTransferController::class, 'initiate'])->name('stock-transfers.initiate');
        Route::post('stock-transfers/{stock_transfer}/approve', [StockTransferController::class, 'approve'])->name('stock-transfers.approve');
        Route::post('stock-transfers/{stock_transfer}/reject', [StockTransferController::class, 'reject'])->name('stock-transfers.reject');
        Route::post('stock-transfers/{stock_transfer}/send', [StockTransferController::class, 'send'])->name('stock-transfers.send');
        Route::post('stock-transfers/{stock_transfer}/receive', [StockTransferController::class, 'receive'])->name('stock-transfers.receive');
        Route::get('stock-transfers/{stock_transfer}/export/pdf', [StockTransferController::class, 'exportSinglePdf'])->name('stock-transfers.export.pdf.single');
        Route::get('stock-transfers/{stock_transfer}/export/excel', [StockTransferController::class, 'exportSingleExcel'])->name('stock-transfers.export.excel.single');
        Route::post('stock-transfers/bulk-delete', [StockTransferController::class, 'bulkDelete'])->name('stock-transfers.bulk-delete');
        Route::get('stock-transfers/bulk-export/pdf/{ids}', [StockTransferController::class, 'bulkExportPDF'])->name('stock-transfers.bulk-export.pdf');
        Route::get('stock-transfers/bulk-export/excel/{ids}', [StockTransferController::class, 'bulkExportExcel'])->name('stock-transfers.bulk-export.excel');
        Route::resource('stock-transfers', StockTransferController::class);
    });

    // --- STOCK TRANSFER ITEMS (Reporting) ---
    Route::middleware(['permission:access-stock-transfer-reports'])->group(function () {
        Route::get('stock-transfer-items', [StockTransferItemController::class, 'index'])->name('stock-transfer-items.index');
        Route::get('stock-transfer-items/bulk-export-pdf', [StockTransferItemController::class, 'bulkExportPdf'])->name('stock-transfer-items.bulk-export-pdf');
        Route::get('stock-transfer-items/bulk-export-excel', [StockTransferItemController::class, 'bulkExportExcel'])->name('stock-transfer-items.bulk-export-excel');
    });

    // --- STOCK ADJUSTMENT REQUESTS ---
    Route::middleware(['permission:access-manual-adjustments'])->prefix('stock-adjustment-requests')->group(function () {
        Route::get('/', [StockAdjustmentRequestController::class, 'index'])->name('stock-adjustment-requests.index');
        Route::post('/', [StockAdjustmentRequestController::class, 'store'])->name('stock-adjustment-requests.store');
        Route::put('/{request}', [StockAdjustmentRequestController::class, 'update'])->name('stock-adjustment-requests.update');
        Route::delete('/{request}', [StockAdjustmentRequestController::class, 'destroy'])->name('stock-adjustment-requests.destroy');
        Route::post('/{request}/submit', [StockAdjustmentRequestController::class, 'submit'])->name('stock-adjustment-requests.submit');
        Route::post('/{request}/approve', [StockAdjustmentRequestController::class, 'approve'])->name('stock-adjustment-requests.approve');
        Route::post('/{request}/reject', [StockAdjustmentRequestController::class, 'reject'])->name('stock-adjustment-requests.reject');
        Route::get('/{request}/export/pdf', [StockAdjustmentRequestController::class, 'exportSinglePdf'])->name('stock-adjustment-requests.export.pdf.single');
        Route::get('/{request}/export/excel', [StockAdjustmentRequestController::class, 'exportSingleExcel'])->name('stock-adjustment-requests.export.excel.single');
        Route::get('/export/pdf', [StockAdjustmentRequestController::class, 'bulkExportPDF'])->name('stock-adjustment-requests.bulk-export.pdf');
        Route::get('/export/excel', [StockAdjustmentRequestController::class, 'bulkExportExcel'])->name('stock-adjustment-requests.bulk-export.excel');
    });

    // --- ADJUSTMENT REASONS ---
    Route::middleware(['permission:access-adjustment-reasons'])->group(function () {
        Route::get('/adjustmentreasons/download-template', [AdjustmentReasonController::class, 'downloadTemplate'])->name('adjustmentreasons.download-template');
        Route::post('/adjustmentreasons/import', [AdjustmentReasonController::class, 'import'])->name('adjustmentreasons.import');
        Route::post('/adjustmentreasons/bulk-delete', [AdjustmentReasonController::class, 'bulkDelete'])->name('adjustmentreasons.bulk-delete');
        Route::get('/adjustmentreasons/bulk-export-pdf', [AdjustmentReasonController::class, 'bulkExportPDF'])->name('adjustmentreasons.bulk-export-pdf');
        Route::get('/adjustmentreasons/bulk-export-excel', [AdjustmentReasonController::class, 'bulkExportExcel'])->name('adjustmentreasons.bulk-export-excel');
        Route::get('/adjustmentreasons/{adjustmentreason}/export-pdf', [AdjustmentReasonController::class, 'exportSinglePdf'])->name('adjustmentreasons.export.pdf.single');
        Route::get('/adjustmentreasons/{adjustmentreason}/export-excel', [AdjustmentReasonController::class, 'exportSingleExcel'])->name('adjustmentreasons.export.excel.single');
        Route::resource('adjustmentreasons', AdjustmentReasonController::class);
    });

    // --- STOCK ADJUSTMENT LOGS ---
    Route::middleware(['permission:access-stock-adjustments'])->controller(StockAdjustmentController::class)->group(function () {
        Route::get('stock-adjustments', 'index')->name('stock-adjustments.index');
        Route::post('stock-adjustments', 'store')->name('stock-adjustments.store');
        Route::get('stock-adjustments/export/pdf', 'bulkExportPDF')->name('stock-adjustments.bulkExportPDF');
        Route::get('stock-adjustments/export/excel', 'bulkExportExcel')->name('stock-adjustments.bulkExportExcel');
        Route::get('stock-adjustments/{adjustment}/pdf', 'exportSinglePdf')->name('stock-adjustments.exportSinglePdf');
        Route::get('stock-adjustments/{adjustment}/excel', 'exportSingleExcel')->name('stock-adjustments.exportSingleExcel');
    });


    // =========================================================================
    // 3. SALES & FINANCE
    // =========================================================================

    // --- POS (Point of Sale) ---
    Route::middleware(['permission:access-pos'])->group(function () {
        Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
        Route::post('/pos', [PosController::class, 'store'])->name('pos.store');
        Route::post('/pos/open', [PosController::class, 'openSession'])->name('pos.open');
        Route::post('/pos/close-session', [PosController::class, 'closeSession'])->name('pos.close-session');
        Route::delete('/pos/{posSale}', [PosController::class, 'destroy'])->name('pos.destroy');
        Route::post('/mpesa/stk-push', [MpesaController::class, 'stkPush'])->name('mpesa.stk-push');
    });

    // --- POS SESSIONS REPORT ---
    Route::middleware(['permission:access-pos-reports'])->group(function () {
        Route::get('pos-sessions/export-pdf/{posSession}', [PosSessionController::class, 'exportPdf'])->name('pos-sessions.export.pdf');
        Route::get('pos-sessions/export-excel/{posSession}', [PosSessionController::class, 'exportExcel'])->name('pos-sessions.export.excel');
        Route::get('pos-sessions/bulk-export-pdf/{ids}', [PosSessionController::class, 'bulkExportPDF'])->name('pos-sessions.bulk-export.pdf');
        Route::get('pos-sessions/bulk-export-excel/{ids}', [PosSessionController::class, 'bulkExportExcel'])->name('pos-sessions.bulk-export.excel');
        Route::resource('pos-sessions', PosSessionController::class)->only(['index', 'show']);
    });

    // --- QUOTATIONS ---
    Route::middleware(['permission:access-quotations'])->group(function () {
        Route::post('quotations/{quotation}/convert', [QuotationController::class, 'convert'])->name('quotations.convert');
        Route::post('quotations/{quotation}/mark-sent', [QuotationController::class, 'markSent'])->name('quotations.mark-sent');
        Route::post('quotations/{quotation}/mark-rejected', [QuotationController::class, 'markRejected'])->name('quotations.mark-rejected');
        Route::get('quotations/{quotation}/export/pdf', [QuotationController::class, 'exportPdf'])->name('quotations.export.pdf');
        Route::get('quotations/bulk-export/pdf/{ids}', [QuotationController::class, 'bulkExportPDF'])->name('quotations.bulk-export.pdf');
        Route::get('quotations/bulk-export/excel/{ids}', [QuotationController::class, 'bulkExportExcel'])->name('quotations.bulk-export.excel');
        Route::resource('quotations', QuotationController::class)->except(['create', 'edit', 'show']);
    });

    // --- INVOICES ---
    Route::middleware(['permission:access-invoices'])->group(function () {
        Route::post('invoices/{invoice}/post', [InvoiceController::class, 'post'])->name('invoices.post');
        Route::post('/invoices/{invoice}/void', [InvoiceController::class, 'void'])->name('invoices.void');
        Route::post('/invoices/{invoice}/payment', [InvoiceController::class, 'addPayment'])->name('invoices.payment');
        Route::post('/invoices/{invoice}/refund', [InvoiceController::class, 'refund'])->name('invoices.refund');
        Route::get('/invoices/{invoice}/print-receipt', [InvoiceController::class, 'printReceipt'])->name('invoices.print-receipt');
        Route::get('invoices/{invoice}/export/pdf', [InvoiceController::class, 'exportSinglePdf'])->name('invoices.export.pdf.single');
        Route::get('invoices/{invoice}/export/excel', [InvoiceController::class, 'exportSingleExcel'])->name('invoices.export.excel.single');
        Route::get('invoices/bulk-export/pdf/{ids}', [InvoiceController::class, 'bulkExportPDF'])->name('invoices.bulk-export.pdf');
        Route::get('invoices/bulk-export/excel/{ids}', [InvoiceController::class, 'bulkExportExcel'])->name('invoices.bulk-export.excel');
        Route::resource('invoices', InvoiceController::class)->except(['create', 'edit', 'show']);
    });

    // --- SALES (Ledger) ---
    Route::middleware(['permission:access-sales'])->group(function () {
        Route::get('sales/{sale}/export/pdf', [SaleController::class, 'exportPdf'])->name('sales.export.pdf');
        Route::get('sales/{sale}/export/excel', [SaleController::class, 'exportExcel'])->name('sales.export.excel');
        Route::get('sales/bulk-export/pdf/{ids}', [SaleController::class, 'bulkExportPDF'])->name('sales.bulk-export.pdf');
        Route::get('sales/bulk-export/excel/{ids}', [SaleController::class, 'bulkExportExcel'])->name('sales.bulk-export.excel');
        Route::resource('sales', SaleController::class)->only(['index', 'show']);
    });

    // --- SALE ITEMS (Reporting) ---
    Route::middleware(['permission:access-sale-items'])->prefix('sale-items')->name('sale-items.')->group(function () {
        Route::get('/', [SaleItemController::class, 'index'])->name('index');
        Route::get('/{item}/export/pdf', [SaleItemController::class, 'exportPdf'])->name('export.pdf.single');
        Route::get('/{item}/export/excel', [SaleItemController::class, 'exportExcel'])->name('export.excel.single');
        Route::get('/bulk-export/pdf/{ids}', [SaleItemController::class, 'bulkExportPDF'])->name('bulk-export.pdf');
        Route::get('/bulk-export/excel/{ids}', [SaleItemController::class, 'bulkExportExcel'])->name('bulk-export.excel');
    });

    // --- PAYMENTS (Incoming) ---
    Route::middleware(['permission:access-payments'])->group(function () {
        Route::get('payments/{payment}/export/pdf', [PaymentController::class, 'exportPdf'])->name('payments.export.pdf');
        Route::get('payments/{payment}/export/excel', [PaymentController::class, 'exportExcel'])->name('payments.export.excel');
        Route::get('payments/bulk-export/pdf/{ids}', [PaymentController::class, 'bulkExportPDF'])->name('payments.bulk-export.pdf');
        Route::get('payments/bulk-export/excel/{ids}', [PaymentController::class, 'bulkExportExcel'])->name('payments.bulk-export.excel');
        Route::resource('payments', PaymentController::class)->only(['index', 'show']);
    });

    // --- PAYMENTS TO CUSTOMERS (Outgoing) ---
    Route::middleware(['permission:access-outgoing-payments'])->group(function () {
        Route::get('payments-to-customers/{payment}/export/pdf', [PaymentToCustomerController::class, 'exportPdf'])->name('payments-to-customers.export.pdf');
        Route::get('payments-to-customers/{payment}/export/excel', [PaymentToCustomerController::class, 'exportExcel'])->name('payments-to-customers.export.excel');
        Route::get('payments-to-customers/bulk-export/pdf/{ids}', [PaymentToCustomerController::class, 'bulkExportPDF'])->name('payments-to-customers.bulk-export.pdf');
        Route::get('payments-to-customers/bulk-export/excel/{ids}', [PaymentToCustomerController::class, 'bulkExportExcel'])->name('payments-to-customers.bulk-export.excel');
        Route::resource('payments-to-customers', PaymentToCustomerController::class)->only(['index', 'show']);
    });

    // --- DEBTS & DEBTORS ---
    Route::middleware(['permission:access-debts'])->prefix('debts')->name('debts.')->group(function () {
        Route::get('/', [DebtController::class, 'index'])->name('index');
        Route::post('/payment', [DebtController::class, 'store'])->name('store');
        Route::get('/export/pdf/bulk/{ids}', [DebtController::class, 'exportDebtorsPdf'])->name('export.pdf.bulk');
        Route::get('/export/excel/bulk/{ids}', [DebtController::class, 'exportDebtorsExcel'])->name('export.excel.bulk');
        Route::get('/{customer}', [DebtController::class, 'show'])->name('show');
        Route::get('/{customer}/statement', [DebtController::class, 'exportStatementPdf'])->name('export.statement');
    });


    // =========================================================================
    // 📦 PURCHASE ORDERS (Procurement)
    // =========================================================================

    // --- PURCHASE ORDERS ---
    Route::middleware(['permission:access-purchase-orders'])->group(function () {
        // Workflow Actions
        Route::post('purchase-orders/{purchase_order}/mark-ordered', [PurchaseOrderController::class, 'markOrdered'])->name('purchase-orders.mark-ordered');
        Route::post('purchase-orders/{purchase_order}/receive', [PurchaseOrderController::class, 'markReceived'])->name('purchase-orders.receive');
        Route::post('purchase-orders/{purchase_order}/cancel', [PurchaseOrderController::class, 'cancel'])->name('purchase-orders.cancel');

        // Single Export
        Route::get('purchase-orders/{purchase_order}/export/pdf', [PurchaseOrderController::class, 'exportSinglePdf'])->name('purchase-orders.export.pdf.single');
        Route::get('purchase-orders/{purchase_order}/export/excel', [PurchaseOrderController::class, 'exportSingleExcel'])->name('purchase-orders.export.excel.single');

        // Bulk Actions
        Route::get('purchase-orders/bulk-export/pdf/{ids}', [PurchaseOrderController::class, 'bulkExportPDF'])->name('purchase-orders.bulk-export.pdf');
        Route::get('purchase-orders/bulk-export/excel/{ids}', [PurchaseOrderController::class, 'bulkExportExcel'])->name('purchase-orders.bulk-export.excel');

        // Standard Resource
        Route::resource('purchase-orders', PurchaseOrderController::class);
    });

    // --- PURCHASE ORDER ITEMS ---
    Route::middleware(['permission:access-purchase-order-items'])->prefix('purchase-order-items')->name('purchase-order-items.')->group(function () {
        Route::get('/', [PurchaseOrderItemController::class, 'index'])->name('index');
        Route::get('/bulk-export/pdf', [PurchaseOrderItemController::class, 'bulkExportPDF'])->name('bulk-export.pdf');
        Route::get('/bulk-export/excel', [PurchaseOrderItemController::class, 'bulkExportExcel'])->name('bulk-export.excel');
    });


    // =========================================================================
    // 4. ACCESS CONTROL (User Management)
    // =========================================================================

    // --- USERS ---
    Route::middleware(['permission:access-users'])->group(function () {
        Route::get('/users/download-template', [UserController::class, 'downloadTemplate'])->name('users.download-template');
        Route::post('/users/import', [UserController::class, 'import'])->name('users.import');
        Route::post('/users/bulk-delete', [UserController::class, 'bulkDelete'])->name('users.bulk-delete');
        Route::get('/users/bulk-export-pdf', [UserController::class, 'bulkExportPDF'])->name('users.bulk-export-pdf');
        Route::get('/users/bulk-export-excel', [UserController::class, 'bulkExportExcel'])->name('users.bulk-export-excel');
        Route::get('/users/{user}/export-pdf', [UserController::class, 'exportSinglePdf'])->name('users.export.pdf.single');
        Route::get('/users/{user}/export-excel', [UserController::class, 'exportSingleExcel'])->name('users.export.excel.single');
        Route::resource('users', UserController::class);
    });

    // --- ROLES ---
    Route::middleware(['permission:access-roles'])->group(function () {
        Route::get('/roles/download-template', [RoleController::class, 'downloadTemplate'])->name('roles.download-template');
        Route::post('/roles/import', [RoleController::class, 'import'])->name('roles.import');
        Route::post('/roles/bulk-delete', [RoleController::class, 'bulkDelete'])->name('roles.bulk-delete');
        Route::get('/roles/bulk-export-pdf', [RoleController::class, 'bulkExportPDF'])->name('roles.bulk-export-pdf');
        Route::get('/roles/bulk-export-excel', [RoleController::class, 'bulkExportExcel'])->name('roles.bulk-export-excel');
        Route::get('/roles/{role}/export-pdf', [RoleController::class, 'exportSinglePdf'])->name('roles.export.pdf.single');
        Route::get('/roles/{role}/export-excel', [RoleController::class, 'exportSingleExcel'])->name('roles.export.excel.single');
        Route::resource('roles', RoleController::class)->only(['index', 'store', 'update', 'destroy']);
    });

    // --- PERMISSIONS ---
    Route::middleware(['permission:access-permissions'])->controller(PermissionController::class)->prefix('permissions')->name('permissions.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::get('/{permission}', 'show')->name('show');
        Route::put('/{permission}', 'update')->name('update');
        Route::delete('/{permission}', 'destroy')->name('destroy');
        Route::post('/bulk-delete', 'bulkDelete')->name('bulk-delete');
        Route::post('/import', 'import')->name('import');
        Route::get('/download-template', 'downloadTemplate')->name('download-template');
        Route::get('/export/pdf/{permission}', 'exportPdfSingle')->name('export.pdf.single');
        Route::get('/export/excel/{permission}', 'exportExcelSingle')->name('export.excel.single');
        Route::get('/bulk-export/pdf', 'bulkExportPdf')->name('bulk-export-pdf');
        Route::get('/bulk-export/excel', 'bulkExportExcel')->name('bulk-export-excel');
    });


    // =========================================================================
    // 5. SETTINGS & UTILITIES
    // =========================================================================

    // --- NOTIFICATIONS ---
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    // --- COMPANY SETTINGS ---
    Route::middleware(['permission:access-company-settings'])->group(function () {
        Route::resource('company-settings', CompanySettingController::class);
        Route::post('company-settings/{company_setting}/set-default', [CompanySettingController::class, 'setDefault'])->name('company-settings.set-default');
    });

    // --- PAYMENT SETTINGS ---
    Route::middleware(['permission:access-payment-settings'])->group(function () {
        Route::get('/settings/payments', [StorePaymentSettingController::class, 'index'])->name('payment-settings.index');
        Route::post('/settings/payments', [StorePaymentSettingController::class, 'store'])->name('payment-settings.store');
        Route::put('/settings/payments/{id}', [StorePaymentSettingController::class, 'update'])->name('payment-settings.update');
        Route::delete('/settings/payments/{id}', [StorePaymentSettingController::class, 'destroy'])->name('payment-settings.destroy');
    });

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
