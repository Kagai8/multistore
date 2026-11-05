<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * App\Models\Customer
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property string $name
 * @property string|null $number
 * @property string|null $email
 * @property float|null $credit_limit
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property float|null $loyalty_points
 * @property-read \App\Models\Store|null $store
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\CustomerDebt> $debts
 * @property-read float|null $total_debt Sum of active debt balances, added via withSum().
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \Illuminate\Database\Eloquent\Collection<int, \App\Models\Customer> all(mixed $columns = ['*'])
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Customer create(array $attributes = [])
 * @method static \App\Models\Customer find(mixed $id, array|string $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Builder<static> select(mixed $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereHas(string $relation, ?\Closure $callback = null, string $operator = '>=', int|string $count = 1)
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class Customer extends Model
{
    protected $fillable = [
        'name',
        'number',
        'email',
        'credit_limit',
    ];

    // Cast credit_limit to float for convenience
    protected $casts = [
        'credit_limit' => 'float',
    ];

    /**
     * @return HasMany<\App\Models\CustomerDebt, $this>
     */
    public function debts(): HasMany
    {
        return $this->hasMany(CustomerDebt::class);
    }

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
