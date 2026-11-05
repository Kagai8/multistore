<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/**
 * App\Models\CreditTransaction
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $customer_id
 * @property int|null $customer_debt_id
 * @property float $amount
 * @property float $running_balance
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\CustomerDebt|null $debt
 * @property-read \App\Models\Payment|null $payment
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \App\Models\CreditTransaction create(array $attributes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class CreditTransaction extends Model
{
    protected $fillable = [
        'customer_id',
        'customer_debt_id', // Links to the specific debt created/paid
        'amount',
        'running_balance',
    ];

    /**
     * @return MorphOne<\App\Models\Payment, $this>
     */
    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'method');
    }

    /**
     * @return BelongsTo<\App\Models\CustomerDebt, $this>
     */
    public function debt(): BelongsTo
    {
        return $this->belongsTo(CustomerDebt::class, 'customer_debt_id');
    }
}
