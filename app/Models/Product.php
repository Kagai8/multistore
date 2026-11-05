<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * App\Models\Product
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $sku
 * @property string|null $barcode
 * @property array|null $colors
 * @property int $category_id
 * @property int $brand_id
 * @property int|null $unit_id
 * @property int|null $supplier_id
 * @property float $retail_price
 * @property float|null $wholesale_price
 * @property float|null $buying_price
 * @property float $discount
 * @property string|null $description
 * @property string|null $main_image
 * @property array|null $multi_images
 * @property float|null $weight
 * @property bool $is_active
 * @property bool $is_purchasable
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property float|null $special_price
 * @property-read \App\Models\Brand|null $brand
 * @property-read \App\Models\Category|null $category
 * @property-read \App\Models\Supplier|null $supplier
 * @property-read \App\Models\Unit|null $unit
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Stock> $stocks
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \Illuminate\Database\Eloquent\Collection<int, \App\Models\Product> all(mixed $columns = ['*'])
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Product create(array $attributes = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> select(mixed $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class Product extends Model
{
    protected $fillable = [
        'name',
        'slug', // Handled by controller/mutator
        'sku',
        'barcode',

        'colors', // Stored as JSON

        // Foreign Keys
        'category_id',
        'brand_id',
        'unit_id',
        'supplier_id',

        // Pricing
        'retail_price',
        'special_price',
        'wholesale_price',
        'buying_price',
        'discount',

        // Media & Description
        'description',
        'main_image',
        'multi_images', // Stored as JSON

        // Status & Logistics
        'weight',
        'is_active',
        'is_purchasable',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'retail_price' => 'decimal:2',
        'special_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'buying_price' => 'decimal:2',
        'discount' => 'decimal:2',
        'weight' => 'decimal:2',
        'is_active' => 'boolean',
        'is_purchasable' => 'boolean',
        'colors' => 'array',       // 🟢 Cast JSON field as an array
        'multi_images' => 'array', // 🟢 Cast JSON field as an array
    ];

    // --- Relationships ---

    /**
     * @return BelongsTo<\App\Models\Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return BelongsTo<\App\Models\Brand, $this>
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * @return BelongsTo<\App\Models\Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * @return BelongsTo<\App\Models\Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * @return HasMany<\App\Models\Stock, $this>
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class, 'product_id');
    }
}
