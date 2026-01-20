<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditTransaction extends Model
{
    protected $fillable = [
        'customer_id',
        'customer_debt_id', // Links to the specific debt created/paid
        'amount',
        'running_balance'
    ];

    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'method');
    }

    public function debt(): BelongsTo
    {
        return $this->belongsTo(CustomerDebt::class, 'customer_debt_id');
    }
}
