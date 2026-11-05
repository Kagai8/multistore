<?php

namespace App\Models;

use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\StockAdjustment
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $product_id
 * @property int $store_id
 * @property int $user_id
 * @property string $type
 * @property int|null $adjustment_reason_id
 * @property float $quantity
 * @property int $old_stock
 * @property int $new_stock
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int|null $related_transfer_id
 * @property-read \App\Models\AdjustmentReason|null $adjustmentReason
 * @property-read \App\Models\AdjustmentReason|null $reason
 * @property-read \App\Models\Product|null $product
 * @property-read \App\Models\Store|null $store
 * @property-read \App\Models\User|null $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \App\Models\StockAdjustment create(array $attributes = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class StockAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'store_id',
        'user_id',
        'type', // 'in' or 'out'
        'adjustment_reason_id',
        'quantity',
        'old_stock',
        'new_stock',
        'notes',
        'related_transfer_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    // Relationships
    /**
     * @return BelongsTo<\App\Models\Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<\App\Models\AdjustmentReason, $this>
     */
    public function adjustmentReason(): BelongsTo
    {
        return $this->belongsTo(AdjustmentReason::class);
    }

    protected static function booted(): void
    {
        // 🟢 Required Scope Registration
        static::addGlobalScope(new StoreScope);
    }

    /**
     * @return BelongsTo<\App\Models\AdjustmentReason, $this>
     */
    public function reason(): BelongsTo
    {
        return $this->belongsTo(AdjustmentReason::class, 'adjustment_reason_id');
    }
}
