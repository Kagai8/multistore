<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CompanySetting extends Model
{
    protected $fillable = [
        'name', 'slogan', 'address', 'city', 'phone',
        'email', 'website', 'tax_pin', 'logo_path',
        'receipt_footer', 'is_default'
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    // Helper to get full logo URL
    protected $appends = ['logo_url'];

    public function getLogoUrlAttribute()
    {
        return $this->logo_path ? Storage::url($this->logo_path) : null;
    }
}
