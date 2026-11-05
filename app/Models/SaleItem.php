<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * App\Models\SaleItem
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $sale_id
 * @property int $product_id
 * @property string|null $source_item_type
 * @property int|null $source_item_id
 * @property int $quantity
 * @property float $unit_price
 * @property float $total_price
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string $price_category
 * @property-read \App\Models\Product|null $product
 * @property-read \App\Models\Sale|null $sale
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static mixed avg(string $column)
 * @method static int count(string $columns = '*')
 * @method static \App\Models\SaleItem create(array $attributes = [])
 * @method static mixed sum(string $column)
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'source_item_id',
        'source_item_type', // Link to invoice_items
        'price_category',   // retail, wholesale...
        'quantity',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    // --- Relationships ---

    /**
     * @return BelongsTo<\App\Models\Sale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * @return BelongsTo<\App\Models\Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return MorphTo<\Illuminate\Database\Eloquent\Model, $this>
     */
    /**
     * Link back to the original draft item (InvoiceItem).
     * This allows you to audit exactly which line on the invoice created this sale record.
     */
    public function sourceItem(): MorphTo
    {
        return $this->morphTo();
    }
}
