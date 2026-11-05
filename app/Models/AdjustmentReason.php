<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * App\Models\AdjustmentReason
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\StockAdjustment> $stockAdjustments
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \Illuminate\Database\Eloquent\Collection<int, \App\Models\AdjustmentReason> all(mixed $columns = ['*'])
 * @method static int count(string $columns = '*')
 * @method static \App\Models\AdjustmentReason create(array $attributes = [])
 * @method static \App\Models\AdjustmentReason firstOrCreate(array $attributes = [], array $values = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
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
    /**
     * @return HasMany<\App\Models\StockAdjustment, $this>
     */
    public function stockAdjustments(): HasMany
    {
        return $this->hasMany(StockAdjustment::class);
    }
}
