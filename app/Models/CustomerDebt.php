<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerDebt extends Model
{
    protected $fillable = [
        'customer_id',
        'source_type', // e.g. Invoice
        'source_id',
        'principal_amount',
        'balance',
        'due_date',
        'status' // active, cleared, bad_debt
    ];

    protected $casts = [
        'principal_amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * What created this debt? (Usually an Invoice)
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    
}
