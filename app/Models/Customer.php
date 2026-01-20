<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


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

    public function debts()
    {
        return $this->hasMany(CustomerDebt::class);
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }
}
