<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/**
 * App\Models\InvoiceItem
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $invoice_id
 * @property int $product_id
 * @property int $quantity
 * @property float $unit_price
 * @property float $sub_total
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string $price_category
 * @property-read \App\Models\Invoice|null $invoice
 * @property-read \App\Models\Product|null $product
 * @property-read \App\Models\SaleItem|null $saleItem
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \App\Models\InvoiceItem create(array $attributes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'product_id',
        'price_category', // Important: retail, wholesale, special, manual
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
     * @return BelongsTo<\App\Models\Invoice, $this>
     */
    /**
     * 1. The Parent Invoice
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * @return BelongsTo<\App\Models\Product, $this>
     */
    /**
     * 2. The Product
     * We access product details (Name, SKU) through here.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return MorphOne<\App\Models\SaleItem, $this>
     */
    /**
     * 3. The Audit Trace
     * Links this draft item to the permanent 'SaleItem' created later.
     */
    public function saleItem(): MorphOne
    {
        return $this->morphOne(SaleItem::class, 'source_item');
    }
}
