<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * App\Models\Store
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $address
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string $type
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \Illuminate\Database\Eloquent\Collection<int, \App\Models\Store> all(mixed $columns = ['*'])
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Store create(array $attributes = [])
 * @method static \App\Models\Store first(array|string $columns = ['*'])
 * @method static \App\Models\Store firstOrCreate(array $attributes = [], array $values = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> latest(?string $column = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
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
