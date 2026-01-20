<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StorePaymentSetting extends Model
{
    protected $fillable = [
        'store_id',
        'provider', // 'mpesa'
        'type',     // 'paybill', 'till'
        'business_number',
        'account_number',
        'credentials', // JSON
        'is_active'
    ];

    protected $casts = [
        // 🔴 CHANGE THIS LINE: Remove 'encrypted:'
        'credentials' => 'array',
        'is_active' => 'boolean',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
