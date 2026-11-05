<?php

namespace App\Models;

use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

/**
 * App\Models\PosSession
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $store_id
 * @property int $user_id
 * @property \Illuminate\Support\Carbon $start_time
 * @property \Illuminate\Support\Carbon|null $end_time
 * @property float $opening_cash
 * @property float|null $closing_cash
 * @property float|null $cash_difference
 * @property string $status
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Store|null $store
 * @property-read \App\Models\User|null $user
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\PosSale> $sales
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static int count(string $columns = '*')
 * @method static \App\Models\PosSession create(array $attributes = [])
 * @method static \App\Models\PosSession firstOrCreate(array $attributes = [], array $values = [])
 * @method static mixed sum(string $column)
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class PosSession extends Model
{
    protected $fillable = [
        'store_id', 'user_id',
        'start_time', 'end_time',
        'opening_cash', 'closing_cash', 'cash_difference',
        'status', 'notes',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'opening_cash' => 'decimal:2',
        'closing_cash' => 'decimal:2',
        'cash_difference' => 'decimal:2',
    ];

    // Enforce Store Security
    protected static function booted()
    {
        static::addGlobalScope(new StoreScope);

        static::creating(function ($model) {
            if (Auth::check()) {
                $model->store_id = Auth::user()->store_id;
                $model->user_id = Auth::id();
            }
        });
    }

    /**
     * @return HasMany<\App\Models\PosSale, $this>
     */
    public function sales(): HasMany
    {
        return $this->hasMany(PosSale::class);
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
