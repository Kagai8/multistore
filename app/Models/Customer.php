<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'number',
        'email',
        'credit_limit',
    ];

    // Cast credit_limit to float for convenience
    protected $casts = [
        'credit_limit' => 'float',
    ];
}
