<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany; // 🟢 NEW: Import Spatie's Role
use Spatie\Permission\Models\Role as SpatieRole;

// 🟢 SWITCH: Extend SpatieRole instead of Model
/**
 * App\Models\Role
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property string $name
 * @property string|null $label
 * @property string $guard_name
 * @property bool $is_active
 * @property bool $all_store_access
 * @property string|null $description
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property int|null $team_id
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \Illuminate\Database\Eloquent\Collection<int, \App\Models\Role> all(mixed $columns = ['*'])
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Role create(array $attributes = [])
 * @method static \App\Models\Role find(mixed $id, array|string $columns = ['*'])
 * @method static \App\Models\Role findOrFail(mixed $id, array|string $columns = ['*'])
 * @method static \App\Models\Role first(array|string $columns = ['*'])
 * @method static \App\Models\Role firstOrCreate(array $attributes = [], array $values = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class Role extends SpatieRole
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        // Spatie requires 'name' and 'guard_name'.
        // We use 'label' and 'description' for your custom fields.
        'name',
        'label', // Custom display field (was 'name' in old migration)
        'description',
        'is_active',
        'guard_name', // Required by Spatie (default: 'web')
        'all_store_access', // New field for all store access
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'all_store_access' => 'boolean',
    ];

    // 🟢 FIX: Change return type to BelongsToMany
    /**
     * @return BelongsToMany<\Illuminate\Database\Eloquent\Model, $this>
     */
    public function users(): BelongsToMany
    {
        // Calling parent::users() ensures the relationship is correctly set up
        // using Spatie's internal configuration (which is cleaner).
        // Alternatively, if you need to define it manually:

        // return $this->belongsToMany(
        //     User::class,
        //     'model_has_roles', // Spatie's pivot table name
        //     'role_id',
        //     'model_id'
        // );

        // For simplicity and adherence to the package:
        return parent::users();
    }
}
