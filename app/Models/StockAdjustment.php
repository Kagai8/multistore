<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Scopes\StoreScope;

class StockAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'store_id',
        'user_id',
        'type', // 'in' or 'out'
        'adjustment_reason_id',
        'quantity',
        'old_stock',
        'new_stock',
        'notes',
        'related_transfer_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function adjustmentReason()
    {
        return $this->belongsTo(AdjustmentReason::class);
    }

    protected static function booted(): void
    {
        // 🟢 Required Scope Registration
        static::addGlobalScope(new StoreScope);
    }

    public function reason(): BelongsTo
    {
        return $this->belongsTo(AdjustmentReason::class, 'adjustment_reason_id');
    }
}
