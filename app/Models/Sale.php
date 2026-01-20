<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use App\Models\Scopes\StoreScope;

class Sale extends Model
{
    protected $fillable = [
        'store_id',
        'user_id',
        'customer_id',
        'source_id',
        'source_type',      // Polymorphic Link (e.g., App\Models\Invoice)
        'reference_no',     // Matches Invoice Number
        'total_amount',
        'payment_status',
        'status'            // completed, returned, cancelled
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    protected static function booted()
    {
        // Security: Filter by Store
        static::addGlobalScope(new StoreScope);
    }

    // --- Relationships ---

    /**
     * Link to Source (Invoice).
     * Usage: $sale->source returns the original Invoice model.
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
