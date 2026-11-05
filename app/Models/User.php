<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens; // 🟢 NEW: Import Spatie Trait
use Spatie\Permission\Traits\HasRoles;

/**
 * App\Models\User
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property int|null $store_id
 * @property bool $is_active
 * @property string $password
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property \Illuminate\Support\Carbon|null $two_factor_confirmed_at
 * @property-read \App\Models\Role|null $role
 * @property-read \App\Models\Store|null $store
 * @property-read bool $is_global_user
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $unreadNotifications
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \Illuminate\Database\Eloquent\Collection<int, \App\Models\User> all(mixed $columns = ['*'])
 * @method static int count(string $columns = '*')
 * @method static \App\Models\User create(array $attributes = [])
 * @method static \Illuminate\Database\Eloquent\Factories\Factory factory(mixed $count = null, array $state = [])
 * @method static \App\Models\User find(mixed $id, array|string $columns = ['*'])
 * @method static \App\Models\User firstOrCreate(array $attributes = [], array $values = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereHas(string $relation, ?\Closure $callback = null, string $operator = '>=', int|string $count = 1)
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    // 🟢 NEW: Add HasRoles trait
    use HasApiTokens, HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'store_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // --- Relationships ---

    /**
     * @return BelongsTo<\App\Models\Role, $this>
     */
    /**
     * Get the Role associated with the User.
     */
    public function role(): BelongsTo
    {
        // Keep this relationship for your existing system,
        // even though Spatie handles role assignment internally.
        return $this->belongsTo(Role::class);
    }

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    /**
     * Get the Store the User is assigned to.
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    // --- Scoping Logic (Global Access) ---

    /**
     * Determine if the user has full, unrestricted (Warehouse/Super Admin) access.
     * * Global Access is granted if the user is a Super Admin OR
     * they are assigned to the primary Alpha/Warehouse store (ID 1).
     */
    public function isGlobal(): bool
    {
        // 1. Robust: Check for specific Super Admin role name (Spatie)
        if ($this->hasRole('super-administrator')) {
            return true;
        }

        // 2. Flexible: Check if ANY assigned role has the 'all_store_access' flag
        // This handles your existing database column logic
        return $this->roles->contains(function ($role) {
            return (bool) $role->getAttribute('all_store_access');
        });
    }

    /**
     * Backend mirror of the `is_global_user` prop shared with the frontend.
     *
     * Scopes and controllers read `$user->is_global_user`; without this accessor the
     * attribute resolves to null, silently treating global users as store-restricted.
     */
    protected function isGlobalUser(): Attribute
    {
        return Attribute::get(fn (): bool => $this->isGlobal());
    }
}
