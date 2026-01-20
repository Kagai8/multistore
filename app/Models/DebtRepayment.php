<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

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
     * The Customer who made this payment.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * The Cashier/User who recorded it.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Link to the actual Money Transaction (Payment table).
     * This makes it polymorphic compatible with your existing system.
     */
    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'payable');
    }
}

