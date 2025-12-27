<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AdjustmentReason extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description', 'is_active'];

    // Auto-set slug on creation/update
    protected static function boot()
    {
        parent::boot();
        static::saving(function ($reason) {
            $reason->slug = Str::slug($reason->name);
        });
    }

    // Relationship: A reason can be used in many adjustments
    public function stockAdjustments()
    {
        return $this->hasMany(StockAdjustment::class);
    }
}
