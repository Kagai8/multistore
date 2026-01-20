<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class CardTransaction extends Model
{
    protected $fillable = [
        'card_type',
        'last_four',
        'auth_code',
        'terminal_id'
    ];

    public function payment(): MorphOne
    {
        return $this->morphOne(Payment::class, 'method');
    }
}
