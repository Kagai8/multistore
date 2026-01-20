<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'product_id',
        'price_category', // Important: retail, wholesale, special, manual
        'quantity',
        'unit_price',
        'sub_total'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'sub_total' => 'decimal:2',
    ];

    // --- Relationships ---

    /**
     * 1. The Parent Invoice
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * 2. The Product
     * We access product details (Name, SKU) through here.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * 3. The Audit Trace
     * Links this draft item to the permanent 'SaleItem' created later.
     */
    public function saleItem(): MorphOne
    {
        return $this->morphOne(SaleItem::class, 'source_item');
    }
}
