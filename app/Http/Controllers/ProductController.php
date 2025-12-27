<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Unit;
use Inertia\Inertia;
use App\Models\Brand;
use App\Models\Product;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Illuminate\Validation\Rule;

class ProductController extends Controller
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

        // base query with relationships
        $query = Product::with(['category', 'brand', 'unit', 'supplier']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('products.name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhereHas('category', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('brand', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('supplier', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        // Apply Date Range Filter
        if ($dateFrom || $dateTo) {
            $start = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
            $end = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

            if ($start && !$end) {
                $query->where('products.created_at', '>=', $start);
            }
            elseif (!$start && $end) {
                $query->where('products.created_at', '<=', $end);
            }
            elseif ($start && $end) {
                 $query->whereBetween('products.created_at', [$start, $end]);
            }
        }

        // Fetch lookup data for select inputs in the modal
        $categories = Category::all(['id', 'name']);
        $brands = Brand::all(['id', 'name']);
        $units = Unit::all(['id', 'name']);
        $suppliers = Supplier::all(['id', 'name']);

        // counts for UI
        $totalCount = Product::count();
        $filteredCount = $query->count();

        // Pagination and Transformation logic
        $transform = function (Product $product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'retail_price' => $product->retail_price,
                'special_price' => $product->special_price,
                'buying_price' => $product->buying_price,
                'barcode' => $product->barcode,
                'weight' => $product->weight,
                'wholesale_price' => $product->wholesale_price,
                'discount' => $product->discount,
                'is_purchasable' => $product->is_purchasable,
                'category' => $product->category->name ?? 'N/A',
                'brand' => $product->brand->name ?? 'N/A',
                'unit' => $product->unit->name ?? 'N/A',
                'supplier' => $product->supplier->name ?? 'N/A',
                'is_active' => $product->is_active,
                // Pass IDs for editing purposes
                'category_id' => $product->category_id,
                'brand_id' => $product->brand_id,
                'unit_id' => $product->unit_id,
                'supplier_id' => $product->supplier_id,
                // Images and metadata
                'main_image' => $product->main_image ?? null, // <--- REMOVED Storage::url()
                'multi_images' => $product->multi_images ?? [],
                'colors' => $product->colors,
                'description' => $product->description,
                'created_at' => $product->created_at?->format('d M Y'),
            ];
        };

        if ($perPage === -1) {
            $all = $query->latest()->get()->map($transform);
            $products = [
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
            $products = $paginator;
        }

        return Inertia::render('products/index', [
            'products' => $products,
            'filters' => $request->only(['search', 'perPage','dateFrom', 'dateTo']),
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'lookupData' => compact('categories', 'brands', 'units', 'suppliers'),
        ]);
    }


// In app/Http/Controllers/ProductController.php

public function store(Request $request)
{
    // 1. Validation Block
    // NOTE: We MUST still validate using the keys sent from the frontend (new_main_image)
    // to ensure validation errors are correctly linked back to the Inertia form field names.
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'barcode' => 'nullable|string|max:100|unique:products,barcode',
        'category_id' => 'required|exists:categories,id',
        'brand_id' => 'required|exists:brands,id',
        'unit_id' => 'required|exists:units,id',
        'supplier_id' => 'required|exists:suppliers,id',
        'weight' => 'nullable|numeric|min:0',
        'retail_price' => 'required|numeric|min:0',
        'special_price' => 'nullable|numeric|min:0',
        'wholesale_price' => 'nullable|numeric|min:0',
        'buying_price' => 'nullable|numeric|min:0',
        'discount' => 'nullable|numeric|min:0',
        'colors' => 'nullable|array',
        'description' => 'nullable|string',
        'is_active' => 'boolean',
        'is_purchasable' => 'boolean',

        // Validation for the names sent from the frontend (to tie errors back)
        'new_main_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        'new_multi_images' => 'nullable|array',
        'new_multi_images.*' => 'nullable|image|mimes:jpg,jpeg,png,webp,svg|max:2048',
    ]);

    $validated['slug'] = Str::slug($validated['name']);

    // Initialize the DB fields to NULL/empty array
    $validated['main_image'] = null;
    $validated['multi_images'] = [];

    // 2. Handle Main Image Upload
    // 🛑 CRITICAL FIX: The file is received under the key 'main_image' in the request object!
    if ($request->file('main_image') && $request->file('main_image')->isValid()) {
        $validated['main_image'] = $request->file('main_image')->store('products/main', 'public');
    }

    // 3. Handle Multi Images Upload
    $multiImagePaths = [];

    // 🛑 CRITICAL FIX: The multi-files are received under the key 'multi_images'!
    $files = $request->file('multi_images');

    if ($files && is_array($files)) {
        foreach ($files as $file) {
            // Check if $file is a valid uploaded file object before storing
            if ($file && $file->isValid()) {
                 $multiImagePaths[] = $file->store('products/multi', 'public');
            }
        }
    }
    $validated['multi_images'] = $multiImagePaths;

    // 4. SKU Generation (Unchanged)
    $tempSku = 'TEMP-' . Str::uuid()->toString();
    $validated['sku'] = $tempSku;

    $product = Product::create($validated);

    $productId = $product->id;
    $paddedId = str_pad($productId, 6, '0', STR_PAD_LEFT);
    $finalSku = 'P-' . $paddedId;
    $product->update(['sku' => $finalSku]);

    return redirect()
        ->route('products.index')
        ->with('flash.success', 'Product created successfully.');
}

    /**
     * Update the specified resource in storage.
     */
    // In ProductController.php inside the update(Request $request, Product $product) method:



// app/Http/Controllers/ProductController.php

// In app/Http/Controllers/ProductController.php (FINAL FIX FOR NO UPDATE)

// In app/Http/Controllers/ProductController.php - Replace update method

public function update(Request $request, Product $product)
{
    // ✅ Validate normal fields (no files yet)
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'barcode' => ['nullable', 'string', 'max:100', Rule::unique('products')->ignore($product->id)],
        'category_id' => 'required|exists:categories,id',
        'brand_id' => 'required|exists:brands,id',
        'unit_id' => 'required|exists:units,id',
        'supplier_id' => 'required|exists:suppliers,id',
        'retail_price' => 'required|numeric|min:0',
        'special_price' => 'nullable|numeric|min:0',
        'buying_price' => 'required|numeric|min:0',

        'wholesale_price' => 'nullable|numeric|min:0',
        'discount' => 'nullable|numeric|min:0',
        'weight' => 'nullable|numeric|min:0',

        'colors' => 'nullable|array',
        'description' => 'nullable|string',

        'is_active' => 'boolean',
        'is_purchasable' => 'boolean',

        // ✅ our real file inputs
        'main_image' => 'nullable|image|max:2048',
        'multi_images' => 'nullable|array',
        'multi_images.*' => 'nullable|image|max:2048',

        // ✅ metadata from frontend
        'main_image_cleared' => 'boolean',
        'existing_multi_images' => 'nullable|array',
    ]);

    // =========================================================
    // ✅ MAIN IMAGE HANDLING
    // =========================================================
    $mainImage = $product->main_image;

    // delete + replace
    if ($request->hasFile('main_image')) {
        if ($mainImage && Storage::disk('public')->exists($mainImage)) {
            Storage::disk('public')->delete($mainImage);
        }

        $mainImage = $request->file('main_image')->store('products/main', 'public');
    }

    // just delete existing (no new upload)
    elseif ($request->boolean('main_image_cleared')) {

        if ($mainImage && Storage::disk('public')->exists($mainImage)) {
            Storage::disk('public')->delete($mainImage);
        }

        $mainImage = null;
    }

    // =========================================================
    // ✅ MULTI IMAGE HANDLING
    // =========================================================

    $finalMulti = [];

    // keep existing images from frontend
    if ($request->filled('existing_multi_images')) {
        foreach ($request->existing_multi_images as $path) {
            $clean = str_replace('storage/', '', ltrim($path, '/'));
            $finalMulti[] = $clean;
        }
    }

    // delete removed images
    $original = $product->multi_images ?? [];

    foreach ($original as $existing) {
        if (!in_array($existing, $finalMulti)) {
            if (Storage::disk('public')->exists($existing)) {
                Storage::disk('public')->delete($existing);
            }
        }
    }

    // add new uploaded images
    if ($request->hasFile('multi_images')) {
        foreach ($request->file('multi_images') as $file) {
            $finalMulti[] = $file->store('products/multi', 'public');
        }
    }

    // =========================================================
    // ✅ FINAL UPDATE
    // =========================================================
    $validated['main_image'] = $mainImage;
    $validated['multi_images'] = $finalMulti;

    $validated['slug'] = Str::slug($validated['name']);

    $product->update($validated);

    return back()->with('success', 'Product updated successfully.');
}



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        // Delete main image
        if ($product->main_image && Storage::disk('public')->exists($product->main_image)) {
            Storage::disk('public')->delete($product->main_image);
        }

        // Delete multi images
        if ($product->multi_images) {
            foreach ($product->multi_images as $path) {
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }
        }

        $product->delete();

        return redirect()->back()->with('success', 'Product deleted successfully');
    }

    /**
     * Handle bulk deletion, including associated files.
     */
    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return back()->with('error', 'No products selected.');
        }

        $products = Product::whereIn('id', $ids)->get();

        DB::beginTransaction();
        try {
            $deletedCount = 0;
            foreach ($products as $product) {
                // Delete main image
                if ($product->main_image && Storage::disk('public')->exists($product->main_image)) {
                    Storage::disk('public')->delete($product->main_image);
                }
                // Delete multi images
                if ($product->multi_images) {
                    foreach ($product->multi_images as $path) {
                        if (Storage::disk('public')->exists($path)) {
                            Storage::disk('public')->delete($path);
                        }
                    }
                }
                $product->delete();
                $deletedCount++;
            }
            DB::commit();
            return back()->with('success', $deletedCount . ' product(s) deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to delete products: ' . $e->getMessage());
        }
    }

    /**
     * Handle single PDF export.
     */
    public function exportSinglePdf(Product $product)
    {
        // Load the relationships for the PDF view
        $product->load(['category', 'brand', 'unit', 'supplier']);

        $pdf = Pdf::loadView('products.product-single', compact('product'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("product_{$product->id}.pdf");
    }

    /**
     * Handle single Excel export.
     */
    public function exportSingleExcel(Product $product)
    {
        $product->load(['category', 'brand', 'unit', 'supplier']);

        return Excel::download(
            new class($product) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $product;
                public function __construct($product) { $this->product = $product; }

                public function collection()
                {
                    return collect([[
                        'ID' => $this->product->id,
                        'SKU' => $this->product->sku,
                        'Name' => $this->product->name,
                        'Category' => $this->product->category->name ?? 'N/A',
                        'Brand' => $this->product->brand->name ?? 'N/A',
                        'Supplier' => $this->product->supplier->name ?? 'N/A',
                        'Retail Price' => $this->product->retail_price,
                        'Buying Price' => $this->product->buying_price,
                        'Created Date' => $this->product->created_at?->format('d M Y'),
                    ]]);
                }

                public function headings(): array
                {
                    return ['ID', 'SKU', 'Name', 'Category', 'Brand', 'Supplier', 'Retail Price', 'Buying Price', 'Created Date'];
                }
            },
            "product_{$product->id}.xlsx"
        );
    }

    /**
     * Handle bulk PDF export.
     */
    public function bulkExportPDF(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $products = Product::whereIn('id', $ids)->with(['category', 'brand', 'unit', 'supplier'])->get();

        if ($products->isEmpty()) {
            return back()->with('error', 'No products selected for export.');
        }

        $pdf = Pdf::loadView('products.products-bulk-pdf', compact('products'))
            ->setPaper('a4', 'portrait');

        return $pdf->download('products_export.pdf');
    }

    /**
     * Handle bulk Excel export.
     */
    public function bulkExportExcel(Request $request)
    {
        $ids = explode(',', $request->input('ids', ''));
        $products = Product::whereIn('id', $ids)->with(['category', 'brand', 'unit', 'supplier'])->get();

        if ($products->isEmpty()) {
            return back()->with('error', 'No products selected for export.');
        }

        return Excel::download(
            new class($products) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
                protected $products;
                public function __construct($products) { $this->products = $products; }

                public function collection()
                {
                    return $this->products->map(fn ($product) => [
                        'ID' => $product->id,
                        'SKU' => $product->sku,
                        'Name' => $product->name,
                        'Category' => $product->category->name ?? 'N/A',
                        'Brand' => $product->brand->name ?? 'N/A',
                        'Supplier' => $product->supplier->name ?? 'N/A',
                        'Retail Price' => $product->retail_price,
                        'Buying Price' => $product->buying_price,
                        'Special Price' => $product->special_price,
                        'Wholesale Price' => $product->wholesale_price,
                        'Active' => $product->is_active ? 'Yes' : 'No',
                        'Created Date' => optional($product->created_at)->format('d M Y'),
                    ]);
                }

                public function headings(): array
                {
                    return ['ID', 'SKU', 'Name', 'Category', 'Brand', 'Supplier', 'Retail Price', 'Buying Price', 'Special Price', 'Wholesale Price', 'Active', 'Created Date'];
                }
            },
            'products_export.xlsx'
        );
    }

    /**
     * Download Excel Template for import.
     */
    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $sheet->setCellValue('A1', 'name');
        $sheet->setCellValue('B1', 'retail_price');
        $sheet->setCellValue('C1', 'buying_price');
        $sheet->setCellValue('D1', 'category_name'); // Need names for import lookup
        $sheet->setCellValue('E1', 'brand_name');
        $sheet->setCellValue('F1', 'supplier_name');
        $sheet->setCellValue('G1', 'unit_name');
        $sheet->setCellValue('H1', 'description');
        $sheet->setCellValue('I1', 'special_price');
        $sheet->setCellValue('J1', 'wholesale_price');

        // Output file
        $writer = new Xlsx($spreadsheet);
        $filename = 'products_template.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename);
    }

    /**
     * Handle bulk import of products.
     */
    // app/Http/Controllers/ProductController.php



/**
 * Handle bulk import of products.
 */
// app/Http/Controllers/ProductController.php

// app/Http/Controllers/ProductController.php

// app/Http/Controllers/ProductController.php

public function import(Request $request)
{
    $request->validate([
        'file' => 'required|mimes:xlsx,csv|max:4096',
    ]);

    $file = $request->file('file');
    $errors = [];

    // 🟢 CRITICAL FIX: Initialize global variable for counting successes
    $GLOBALS['imported_count'] = 0;

    // 1. Cache Lookups
    $categories = Category::all()->keyBy(fn ($c) => Str::lower($c->name));
    $brands     = Brand::all()->keyBy(fn ($b) => Str::lower($b->name));
    $units      = Unit::all()->keyBy(fn ($u) => Str::lower($u->name));
    $suppliers  = Supplier::all()->keyBy(fn ($s) => Str::lower($s->name));

    // 2. Determine Fallback IDs (Based on your "General" and "Pieces" entries)
    // We use 'get' on the keyed collection to find the ID of the fallback names.
    $defaultCategory = $categories->get('general')?->id;
    $defaultBrand    = $brands->get('general')?->id;
    $defaultSupplier = $suppliers->get('general')?->id;
    $defaultUnit     = $units->get('pieces')?->id; // Using 'pieces' as the fallback name

    // 🛑 Final Safety Check: If any required default is missing, halt the import
    if (!$defaultUnit || !$defaultCategory || !$defaultBrand || !$defaultSupplier) {
        $missing = [];
        if (!$defaultUnit) $missing[] = 'Unit ("Pieces")';
        if (!$defaultCategory) $missing[] = 'Category ("General")';
        if (!$defaultBrand) $missing[] = 'Brand ("General")';
        if (!$defaultSupplier) $missing[] = 'Supplier ("General")';

        $errorMsg = 'Import failed. Missing required fallback entities in DB: ' . implode(', ', $missing) . '. Please create them.';
        Log::error("Import Setup Failure: " . $errorMsg);
        return back()->with('error', $errorMsg);
    }

    DB::beginTransaction();
    try {
        Excel::import(new class($categories, $brands, $units, $suppliers, $errors) implements \Maatwebsite\Excel\Concerns\ToCollection {

            // ... (Properties and __construct remain the same) ...
            private $categories; private $brands; private $units; private $suppliers; private $errors;

            public function __construct($categories, $brands, $units, $suppliers, &$errors)
            {
                $this->categories = $categories;
                $this->brands = $brands;
                $this->units = $units;
                $this->suppliers = $suppliers;
                $this->errors = &$errors;
                // Note: Fallback IDs are passed via closure scope, not __construct
            }

            public function collection(\Illuminate\Support\Collection $rows)
            {
                // Accessing the fallback IDs from the parent function's scope
                $defaultUnit = $this->units->get('pieces')?->id;
                $defaultCategory = $this->categories->get('general')?->id;
                $defaultBrand = $this->brands->get('general')?->id;
                $defaultSupplier = $this->suppliers->get('general')?->id;

                foreach ($rows->skip(1) as $rowIndex => $row) {
                    $data = [
                        // ... (data mapping remains the same) ...
                        'name'              => trim($row[0] ?? ''),
                        'retail_price'      => $row[1] ?? 0,
                        'buying_price'      => $row[2] ?? 0,
                        'category_name'     => trim($row[3] ?? ''),
                        'brand_name'        => trim($row[4] ?? ''),
                        'supplier_name'     => trim($row[5] ?? ''),
                        'unit_name'         => trim($row[6] ?? ''),
                        'description'       => trim($row[7] ?? ''),
                        'special_price'     => $row[8] ?? 0,
                        'wholesale_price'   => $row[9] ?? 0,
                    ];

                    $rowNum = $rowIndex + 1;
                    $rowErrors = [];

                    // --- 2. Validation and Lookup ---
                    if (empty($data['name'])) {
                        $rowErrors[] = 'Product name is required.';
                    }

                    $categoryId = $this->lookupId($this->categories, $data['category_name']);
                    $brandId    = $this->lookupId($this->brands, $data['brand_name']);
                    $unitId     = $this->lookupId($this->units, $data['unit_name']);
                    $supplierId = $this->lookupId($this->suppliers, $data['supplier_name']);

                    // The lookup error checks are now purely informational, as the DB fix is below.
                    if (!empty($data['category_name']) && !$categoryId) $rowErrors[] = "Category '{$data['category_name']}' not found.";
                    if (!empty($data['brand_name']) && !$brandId)    $rowErrors[] = "Brand '{$data['brand_name']}' not found.";
                    if (!empty($data['unit_name']) && !$unitId)     $rowErrors[] = "Unit '{$data['unit_name']}' not found.";
                    if (!empty($data['supplier_name']) && !$supplierId) $rowErrors[] = "Supplier '{$data['supplier_name']}' not found.";

                    // If we have lookup errors, continue but don't skip creation yet.

                    // --- 3. Product Creation ---
                    try {
                        // 🛑 THE FIX: Use the default ID if the lookup failed or was blank.
                        // Based on the error, unit_id is NOT NULL. Let's assume the others are too,
                        // as per your stated intent of using Brands as the guide for CRUDs.
                        $product = Product::create([
                            'name'              => $data['name'],
                            'slug'              => Str::slug($data['name']),
                            'barcode'           => null,

                            // Apply Fallback IDs for required NOT NULL columns
                            'category_id'       => $categoryId ?? $defaultCategory,
                            'brand_id'          => $brandId ?? $defaultBrand,
                            'unit_id'           => $unitId ?? $defaultUnit,
                            'supplier_id'       => $supplierId ?? $defaultSupplier,

                            // Numerical values
                            'retail_price'      => max(0, (float) $data['retail_price']),
                            'buying_price'      => max(0, (float) $data['buying_price']),
                            'special_price'     => max(0, (float) $data['special_price']),
                            'wholesale_price'   => max(0, (float) $data['wholesale_price']),
                            'discount'          => 0,
                            'weight'            => 0,

                            // String/Array values
                            'description'       => $data['description'] ?: 'Not provided',
                            'colors'            => [],
                            'is_active'         => true,
                            'is_purchasable'    => true,
                        ]);

                        // Final SKU generation and count update
                        $paddedId = str_pad($product->id, 6, '0', STR_PAD_LEFT);
                        $product->update(['sku' => 'P-' . $paddedId]);
                        $GLOBALS['imported_count']++;

                    } catch (\Exception $e) {
                        // This catch is now purely for *unexpected* DB errors,
                        // as we handled the expected NOT NULL errors with default IDs.
                        $rowErrors[] = "Database Error: " . Str::limit($e->getMessage(), 100);
                        Log::error("Product Import DB Error on row {$rowNum}: " . $e->getMessage());
                    }

                    // Collect any row errors (lookup failures or unexpected DB errors)
                    if (!empty($rowErrors)) {
                        $this->errors[$rowNum] = $rowErrors;
                    }
                }
            }

            // Helper function for ID lookup
            private function lookupId($collection, $name)
            {
                if (empty($name)) return null;
                return $collection->get(Str::lower($name))?->id;
            }
        }, $file);

        // 🟢 Retrieve and clean up global variable
        $imported = $GLOBALS['imported_count'];
        unset($GLOBALS['imported_count']);

        if (!empty($errors)) {
            // Commit successful partial imports before returning error summary
            DB::commit();
            $errorSummary = "Successfully imported {$imported} product(s). Failed to import " . count($errors) . " row(s).";
            Log::error("Product Import Failure Details: " . json_encode($errors));
            return back()->with('error', $errorSummary . " Check the application logs for detailed errors.");
        }

        // 🟢 Final success commit
        DB::commit();
        return back()->with('success', "{$imported} product(s) imported successfully.");

    } catch (\Exception $e) {
        // Catch critical errors (e.g., file not found, transaction issue)
        DB::rollBack();
        Log::error("Critical Product Import Error: " . $e->getMessage());
        return back()->with('error', 'A critical error occurred during import. Check logs for details.');
    }
}
}
