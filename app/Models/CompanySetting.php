<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * App\Models\CompanySetting
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property string $name
 * @property string|null $slogan
 * @property string|null $address
 * @property string|null $city
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $website
 * @property string|null $tax_pin
 * @property string|null $logo_path
 * @property string|null $receipt_footer
 * @property bool $is_default
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static int count(string $columns = '*')
 * @method static \App\Models\CompanySetting create(array $attributes = [])
 * @method static \App\Models\CompanySetting first(array|string $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Builder<static> latest(?string $column = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class CompanySetting extends Model
{
    protected $fillable = [
        'name', 'slogan', 'address', 'city', 'phone',
        'email', 'website', 'tax_pin', 'logo_path',
        'receipt_footer', 'is_default',
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
