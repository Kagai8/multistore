<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

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
        'checkout_request_id'
    ];

    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'method');
    }
}
