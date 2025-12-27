<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'contact_person',
        'phone',
        'email',
        'address',
        'is_active',
        // 'slug' is typically excluded and set manually or via an observer/mutator
    ];
}
