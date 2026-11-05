<?php

namespace Tests\Feature\Qa;

use App\Models\AdjustmentReason;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Shared scaffolding for the QA behavioural suite.
 *
 * Every test starts from a freshly migrated PostgreSQL database seeded with the
 * real RolesAndPermissionsSeeder so that the reference data (roles, permissions,
 * stores and adjustment reasons) is exactly what a production install would get.
 */
abstract class QaTestCase extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected Store $warehouse;

    protected Store $branch;

    protected Supplier $supplier;

    protected Customer $walkIn;

    protected Customer $customer;

    protected Product $productA;

    protected Product $productB;

    protected Category $category;

    protected Brand $brand;

    protected Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // The seeder produces the super administrator and the warehouse store.
        $this->admin = User::where('email', 'quincykagai@gmail.com')->firstOrFail();
        $this->warehouse = Store::where('code', 'STR-0001')->firstOrFail();

        // `stores.type` is constrained to warehouse|retail by the database.
        $this->branch = Store::create([
            'name' => 'Nakuru Branch',
            'code' => 'STR-0002',
            'type' => 'retail',
        ]);

        // Customer id 1 is treated as the walk-in till customer by InvoiceController.
        // PostgreSQL sequences are not rolled back with the test transaction, so the
        // counter has to be reset explicitly to keep the scenario deterministic.
        DB::statement('ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1');

        $this->walkIn = Customer::create(['name' => 'Walk-in Customer', 'number' => '0000000000']);
        $this->customer = Customer::create([
            'name' => 'QA Retail Customer',
            'number' => '0712345678',
            'email' => 'qa.customer@example.test',
            'credit_limit' => 50000,
        ]);

        $this->category = Category::create(['name' => 'QA Category', 'slug' => 'qa-category']);
        $this->brand = Brand::create(['name' => 'QA Brand', 'slug' => 'qa-brand']);
        $this->unit = Unit::create(['name' => 'Pieces', 'code' => 'PCS', 'slug' => 'pieces']);
        $this->supplier = Supplier::create([
            'name' => 'QA Supplier',
            'slug' => 'qa-supplier',
            'is_active' => true,
        ]);

        $this->productA = $this->makeProduct('QA Widget A', 100, 80, 60);
        $this->productB = $this->makeProduct('QA Widget B', 250, 200, 150);

        $this->stockAt($this->productA, $this->warehouse, 100);
        $this->stockAt($this->productB, $this->warehouse, 50);
        $this->stockAt($this->productA, $this->branch, 10);
        $this->stockAt($this->productB, $this->branch, 5);
    }

    protected function makeProduct(string $name, float $retail, float $wholesale, float $buying): Product
    {
        return Product::create([
            'name' => $name,
            'slug' => Str::slug($name),
            'sku' => strtoupper(Str::slug($name, '-')),
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'unit_id' => $this->unit->id,
            'supplier_id' => $this->supplier->id,
            'retail_price' => $retail,
            'wholesale_price' => $wholesale,
            'special_price' => $retail,
            'buying_price' => $buying,
            'discount' => 0,
            'is_active' => true,
            'is_purchasable' => true,
        ]);
    }

    /**
     * Create (or overwrite) the stock row for a product/store pair and return it.
     */
    protected function stockAt(Product $product, Store $store, int $quantity): Stock
    {
        $stock = Stock::withoutGlobalScopes()
            ->where('product_id', $product->id)
            ->where('store_id', $store->id)
            ->first();

        if ($stock) {
            $stock->update(['current_stock' => $quantity]);

            return $stock->fresh();
        }

        return Stock::withoutGlobalScopes()->create([
            'product_id' => $product->id,
            'store_id' => $store->id,
            'current_stock' => $quantity,
            'reorder_level' => 5,
            'reorder_quantity' => 20,
        ]);
    }

    /**
     * Current stock quantity, bypassing the store scope so assertions are exact.
     */
    protected function qty(Product $product, Store $store): int
    {
        $stock = Stock::withoutGlobalScopes()
            ->where('product_id', $product->id)
            ->where('store_id', $store->id)
            ->first();

        return $stock ? (int) $stock->current_stock : 0;
    }

    protected function reasonId(string $name): int
    {
        return (int) AdjustmentReason::firstOrCreate(
            ['name' => $name],
            ['name' => $name, 'slug' => Str::slug($name)]
        )->id;
    }
}
