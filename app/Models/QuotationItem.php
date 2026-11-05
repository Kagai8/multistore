<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\QuotationItem
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $quotation_id
 * @property int $product_id
 * @property string $price_category
 * @property int $quantity
 * @property float $unit_price
 * @property float $sub_total
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Product|null $product
 * @property-read \App\Models\Quotation|null $quotation
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class QuotationItem extends Model
{
    protected $fillable = [
        'quotation_id',
        'product_id',
        'price_category', // retail, wholesale, special, manual
        'quantity',
        'unit_price',
        'sub_total',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'sub_total' => 'decimal:2',
    ];

    // --- Relationships ---

    /**
     * @return BelongsTo<\App\Models\Quotation, $this>
     */
    /**
     * 1. The Parent Quotation
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    /**
     * @return BelongsTo<\App\Models\Product, $this>
     */
    /**
     * 2. The Product
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
