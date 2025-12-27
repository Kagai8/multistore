<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Scopes\StoreScope;
use Illuminate\Support\Facades\Auth;

class Stock extends Model
{
   use HasFactory;

    protected $fillable = [
        'product_id',
        'store_id',
        'current_stock',
        'reorder_level',
        'reorder_quantity',
    ];

    protected $casts = [
        'current_stock' => 'integer',
        'reorder_level' => 'integer',
        'reorder_quantity' => 'integer',
    ];

    // Relationships

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    // Helper: Checks if the stock level is below the defined reorder threshold
    public function needsReorder(): bool
    {
        return $this->current_stock <= $this->reorder_level && $this->reorder_level > 0;
    }

    protected static function booted(): void
    {
        // 1. READ ACCESS: Applies the filter for restricted users
        static::addGlobalScope(new \App\Models\Scopes\StoreScope);

        // 2. WRITE ACCESS: Forces store_id for restricted users
        static::creating(function ($model) {
            $user = Auth::user();

            // 🛑 FIX: Change ->isGlobalUser() to ->is_global_user
            if ($user && !$user->is_global_user) {
                // Guarantees the record belongs to the user's store
                $model->store_id = $user->store_id;
            }
        });
    }
}
