<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosSaleItem extends Model
{
    protected $fillable = [
        'pos_sale_id', 'product_id',
        'quantity', 'unit_price', 'sub_total'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'sub_total' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
