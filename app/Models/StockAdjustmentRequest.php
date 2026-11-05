<?php

namespace App\Models;

use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model; // ✅ THIS IS REQUIRED
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\StockAdjustmentRequest
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $store_id
 * @property int $product_id
 * @property int $adjustment_reason_id
 * @property string $type
 * @property float $quantity
 * @property string|null $notes
 * @property string $status
 * @property int $requested_by_id
 * @property int|null $approved_by_id
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\AdjustmentReason|null $reason
 * @property-read \App\Models\Product|null $product
 * @property-read \App\Models\Store|null $store
 * @property-read \App\Models\User|null $approver
 * @property-read \App\Models\User|null $requester
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \App\Models\StockAdjustmentRequest create(array $attributes = [])
 * @method static \App\Models\StockAdjustmentRequest findOrFail(mixed $id, array|string $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class StockAdjustmentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'product_id',
        'adjustment_reason_id',
        'type',
        'quantity',
        'notes',
        'status',
        'requested_by_id',
        'approved_by_id',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'quantity' => 'decimal:4',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // --- Relationships ---

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * @return BelongsTo<\App\Models\Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<\App\Models\AdjustmentReason, $this>
     */
    public function reason(): BelongsTo
    {
        return $this->belongsTo(AdjustmentReason::class, 'adjustment_reason_id');
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_id');
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope);
    }
}
