<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Traits\HasRoles; // 🟢 NEW: Import Spatie Trait
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    // 🟢 NEW: Add HasRoles trait
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles, HasApiTokens;

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
     * Get the Role associated with the User.
     */
    public function role(): BelongsTo
    {
        // Keep this relationship for your existing system,
        // even though Spatie handles role assignment internally.
        return $this->belongsTo(Role::class);
    }

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
            return (bool) $role->all_store_access;
        });
    }
}
