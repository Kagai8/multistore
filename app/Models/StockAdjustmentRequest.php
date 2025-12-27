<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo; // ✅ THIS IS REQUIRED
use App\Models\Scopes\StoreScope;
use App\Models\Store;
use App\Models\Product;
use App\Models\AdjustmentReason;
use App\Models\User;

class StockAdjustmentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'product_id',
        'adjustment_reason_id',
        'type',
        'quantity',
        'notes',
        'status',
        'requested_by_id',
        'approved_by_id',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'quantity' => 'decimal:4',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    // --- Relationships ---

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function reason(): BelongsTo
    {
        return $this->belongsTo(AdjustmentReason::class, 'adjustment_reason_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    protected static function booted(): void
    {
        static::addGlobalScope(new StoreScope);
    }
}
