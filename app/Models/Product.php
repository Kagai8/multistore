<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Stock;

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
     * @var array
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

    public function category() // ✅ Remove the type hint
{
    return $this->belongsTo(Category::class);
}

public function brand() // ✅ Remove the type hint
{
    return $this->belongsTo(Brand::class);
}

public function unit() // ✅ Remove the type hint
{
    return $this->belongsTo(Unit::class);
}

public function supplier() // ✅ Remove the type hint
{
    return $this->belongsTo(Supplier::class);
}

public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class, 'product_id');
    }
}
