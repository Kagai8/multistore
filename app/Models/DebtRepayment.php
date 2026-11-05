<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/**
 * App\Models\DebtRepayment
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $store_id
 * @property int $user_id
 * @property int $customer_id
 * @property string $receipt_number
 * @property float $amount_paid
 * @property \Illuminate\Support\Carbon $payment_date
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Customer|null $customer
 * @property-read \App\Models\Payment|null $payment
 * @property-read \App\Models\User|null $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \App\Models\DebtRepayment create(array $attributes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class DebtRepayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'user_id',
        'customer_id',
        'receipt_number',
        'amount_paid',
        'payment_date',
        'notes',
    ];

    protected $casts = [
        'amount_paid' => 'decimal:2',
        'payment_date' => 'date',
    ];

    /**
     * @return BelongsTo<\App\Models\Customer, $this>
     */
    /**
     * The Customer who made this payment.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    /**
     * The Cashier/User who recorded it.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return MorphOne<\App\Models\Payment, $this>
     */
    /**
     * Link to the actual Money Transaction (Payment table).
     * This makes it polymorphic compatible with your existing system.
     */
    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'payable');
    }
}
