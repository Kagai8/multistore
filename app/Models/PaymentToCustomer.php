<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
    public function invoice() {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Relationship to the POS Sale (if this change came from the Register)
     */
    public function posSale() {
        return $this->belongsTo(PosSale::class);
    }

    public function customer() {
        return $this->belongsTo(Customer::class);
    }

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
