<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class ManualTransaction extends Model
{
    protected $fillable = [
        'method_category', // cash, bank_transfer, etc.
        'reference_no',
        'amount_tendered',
        'change_returned',
        'notes'
    ];

    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'method');
    }
}
