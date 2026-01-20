<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationItem extends Model
{
    protected $fillable = [
        'quotation_id',
        'product_id',
        'price_category', // retail, wholesale, special, manual
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
     * 1. The Parent Quotation
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    /**
     * 2. The Product
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
