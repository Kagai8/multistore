<?php

namespace App\Models;

use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * App\Models\Sale
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $store_id
 * @property int $user_id
 * @property int $customer_id
 * @property string|null $source_type
 * @property int|null $source_id
 * @property string $reference_no
 * @property float $total_amount
 * @property string $payment_status
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Customer|null $customer
 * @property-read \App\Models\Store|null $store
 * @property-read \App\Models\User|null $user
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\SaleItem> $items
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Sale create(array $attributes = [])
 * @method static mixed sum(string $column)
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereNotIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class Sale extends Model
{
    protected $fillable = [
        'store_id',
        'user_id',
        'customer_id',
        'source_id',
        'source_type',      // Polymorphic Link (e.g., App\Models\Invoice)
        'reference_no',     // Matches Invoice Number
        'total_amount',
        'payment_status',
        'status',            // completed, returned, cancelled
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    protected static function booted()
    {
        // Security: Filter by Store
        static::addGlobalScope(new StoreScope);
    }

    // --- Relationships ---

    /**
     * @return MorphTo<\Illuminate\Database\Eloquent\Model, $this>
     */
    /**
     * Link to Source (Invoice).
     * Usage: $sale->source returns the original Invoice model.
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return HasMany<\App\Models\SaleItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * @return BelongsTo<\App\Models\Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
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
}
