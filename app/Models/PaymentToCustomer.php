<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\PaymentToCustomer
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $store_id
 * @property int $user_id
 * @property int $customer_id
 * @property int|null $invoice_id
 * @property float $amount
 * @property string $type
 * @property string $method
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon $payment_date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int|null $pos_sale_id
 * @property-read \App\Models\Customer|null $customer
 * @property-read \App\Models\Invoice|null $invoice
 * @property-read \App\Models\PosSale|null $posSale
 * @property-read \App\Models\Store|null $store
 * @property-read \App\Models\User|null $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static int count(string $columns = '*')
 * @method static \App\Models\PaymentToCustomer create(array $attributes = [])
 * @method static mixed sum(string $column)
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class PaymentToCustomer extends Model
{
    protected $fillable = [
        'store_id', 'user_id', 'customer_id', 'invoice_id',
        'amount', 'type', 'method', 'notes', 'payment_date', 'pos_sale_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    /**
     * @return BelongsTo<\App\Models\Invoice, $this>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * @return BelongsTo<\App\Models\PosSale, $this>
     */
    /**
     * Relationship to the POS Sale (if this change came from the Register)
     */
    public function posSale(): BelongsTo
    {
        return $this->belongsTo(PosSale::class);
    }

    /**
     * @return BelongsTo<\App\Models\Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
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
