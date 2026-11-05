<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

/**
 * App\Models\MpesaTransaction
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property string|null $transaction_code
 * @property string $msisdn
 * @property string $business_shortcode
 * @property string $transaction_type
 * @property string|null $account_reference
 * @property string|null $first_name
 * @property string|null $last_name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int|null $payment_id
 * @property float $amount
 * @property string $status
 * @property string|null $result_desc
 * @property string|null $checkout_request_id
 * @property-read \App\Models\Payment|null $payment
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \App\Models\MpesaTransaction create(array $attributes = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class MpesaTransaction extends Model
{
    protected $fillable = [
        'transaction_code',
        'msisdn',
        'business_shortcode',
        'transaction_type', // paybill, buy_goods
        'account_reference',
        'first_name',
        'last_name',

        // 🟢 NEW: Added these to fix the "Mass Assignment" / SQL Error
        'payment_id',
        'amount',
        'status',
        'result_desc',
        'checkout_request_id',
    ];

    /**
     * @return MorphOne<\App\Models\Payment, $this>
     */
    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'method');
    }
}
