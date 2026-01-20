<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'source_item_id',
        'source_item_type', // Link to invoice_items
        'price_category',   // retail, wholesale...
        'quantity',
        'unit_price',
        'total_price'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    // --- Relationships ---

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Link back to the original draft item (InvoiceItem).
     * This allows you to audit exactly which line on the invoice created this sale record.
     */
    public function sourceItem(): MorphTo
    {
        return $this->morphTo();
    }
}
