<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Scopes\StoreScope;
use Illuminate\Support\Facades\Auth;

class PosSession extends Model
{
    protected $fillable = [
        'store_id', 'user_id',
        'start_time', 'end_time',
        'opening_cash', 'closing_cash', 'cash_difference',
        'status', 'notes'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'opening_cash' => 'decimal:2',
        'closing_cash' => 'decimal:2',
        'cash_difference' => 'decimal:2',
    ];

    // Enforce Store Security
    protected static function booted()
    {
        static::addGlobalScope(new StoreScope);

        static::creating(function ($model) {
            if (Auth::check()) {
                $model->store_id = Auth::user()->store_id;
                $model->user_id = Auth::id();
            }
        });
    }

    public function sales()
    {
        return $this->hasMany(PosSale::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }
}
