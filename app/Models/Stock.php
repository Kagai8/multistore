<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * App\Models\Stock
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $product_id
 * @property int $store_id
 * @property int $current_stock
 * @property int $reorder_level
 * @property int $reorder_quantity
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Product|null $product
 * @property-read \App\Models\Store|null $store
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Stock create(array $attributes = [])
 * @method static \App\Models\Stock firstOrCreate(array $attributes = [], array $values = [])
 * @method static \App\Models\Stock firstOrNew(array $attributes = [], array $values = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> join(string $table, string $first, ?string $operator = null, ?string $second = null, string $type = 'inner', bool $where = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> select(mixed $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereColumn(string|array $first, ?string $operator = null, ?string $second = null, ?string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class Stock extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'store_id',
        'current_stock',
        'reorder_level',
        'reorder_quantity',
    ];

    protected $casts = [
        'current_stock' => 'integer',
        'reorder_level' => 'integer',
        'reorder_quantity' => 'integer',
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

    // Helper: Checks if the stock level is below the defined reorder threshold
    public function needsReorder(): bool
    {
        return $this->current_stock <= $this->reorder_level && $this->reorder_level > 0;
    }

    protected static function booted(): void
    {
        // 1. READ ACCESS: Applies the filter logic we just fixed above
        static::addGlobalScope(new \App\Models\Scopes\StoreScope);

        // 2. WRITE ACCESS: Forces store_id for restricted users
        static::creating(function ($model) {
            $user = Auth::user();

            // 🟢 FIX: Calculate Global Access from the Role
            // Reuse isGlobal() so write access matches the read-side StoreScope.
            $hasGlobalAccess = $user && $user->isGlobal();

            // If user exists AND does NOT have global access...
            if ($user && ! $hasGlobalAccess) {
                // ...force the stock to belong to their store
                $model->store_id = $user->store_id;
            }
        });
    }
}
