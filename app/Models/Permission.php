<?php

namespace App\Models;

use Spatie\Permission\Models\Permission as SpatiePermission;

/**
 * App\Models\Permission
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property string $name
 * @property string|null $label
 * @property string|null $module
 * @property string|null $description
 * @property string $guard_name
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \Illuminate\Database\Eloquent\Collection<int, \App\Models\Permission> all(mixed $columns = ['*'])
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Permission create(array $attributes = [])
 * @method static \App\Models\Permission findOrFail(mixed $id, array|string $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Collection<int, \App\Models\Permission> get(array|string $columns = ['*'])
 * @method static \App\Models\Permission updateOrCreate(array $attributes = [], array $values = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class Permission extends SpatiePermission
{
    /**
     * The custom and Spatie fields that are mass assignable.
     * We need to explicitly list the new fields we added to the table.
     */
    protected $fillable = [
        'module',
        'name',
        'label',
        'description',
        'is_active',
        'guard_name',
    ];

    // Ensure the model knows which table to use
    protected $table = 'permissions';
}
