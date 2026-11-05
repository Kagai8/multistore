<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\PurchaseOrderItem
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int $purchase_order_id
 * @property int $product_id
 * @property int $quantity_ordered
 * @property int $quantity_received
 * @property float $unit_cost
 * @property float $total_cost
 * @property-read \App\Models\Product|null $product
 * @property-read \App\Models\PurchaseOrder|null $purchaseOrder
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static int count(string $columns = '*')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereHas(string $relation, ?\Closure $callback = null, string $operator = '>=', int|string $count = 1)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'product_id',
        'quantity_ordered',
        'quantity_received',
        'unit_cost',
        'total_cost',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    // Relationships
    /**
     * @return BelongsTo<\App\Models\PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * @return BelongsTo<\App\Models\Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
