<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    protected $fillable = [
        'name',
        'type',
        'code', // Include in fillable because the system inserts it
        'phone',
        'email',
        'address',
    ];
}
