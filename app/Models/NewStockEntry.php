<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Scopes\StoreScope;

class NewStockEntry extends Model
{
    use HasFactory;

    // The name of the table in the database
    protected $table = 'new_stock_entries';

    // Fields that can be mass assigned
    protected $fillable = [
        'product_id',
        'supplier_id',
        'store_id',
        'quantity_received',
        'invoice_number',
        'quantity_transferred',
        'status',
        'user_id',
    ];

    // Status constants for clarity
    public const STATUS_PENDING = 'pending';
    public const STATUS_PARTIALLY_SENT = 'partially_sent';
    public const STATUS_COMPLETED = 'completed';

    // --- Relationships ---

    /**
     * Get the product associated with the new stock entry.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the supplier who provided the goods.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the store where the stock was received (implicitly the Warehouse).
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Get the user who recorded the entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // --- Accessors/Calculations (Flow Logic) ---

    /**
     * Calculate the quantity available for transfer.
     */
    public function getAvailableToTransferAttribute(): int
    {
        return $this->quantity_received - $this->quantity_transferred;
    }

    protected static function booted(): void
    {
        // 🟢 Required Scope Registration
        static::addGlobalScope(new StoreScope);
    }
}
