<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * App\Models\CustomerDebt
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $customer_id
 * @property string $source_type
 * @property int $source_id
 * @property float $principal_amount
 * @property float $balance
 * @property \Illuminate\Support\Carbon|null $due_date
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Customer|null $customer
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \App\Models\CustomerDebt create(array $attributes = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class CustomerDebt extends Model
{
    protected $fillable = [
        'customer_id',
        'source_type', // e.g. Invoice
        'source_id',
        'principal_amount',
        'balance',
        'due_date',
        'status', // active, cleared, bad_debt
    ];

    protected $casts = [
        'principal_amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'due_date' => 'date',
    ];

    /**
     * @return BelongsTo<\App\Models\Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return MorphTo<\Illuminate\Database\Eloquent\Model, $this>
     */
    /**
     * What created this debt? (Usually an Invoice)
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}
