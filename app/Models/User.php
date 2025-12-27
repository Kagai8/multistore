<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Traits\HasRoles; // 🟢 NEW: Import Spatie Trait


class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    // 🟢 NEW: Add HasRoles trait
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles;

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
   public function getIsGlobalUserAttribute(): bool
    {
        // Keep your existing, correct logic:
        if ($this->role) {
            return $this->role->all_store_access;
        }

        // Default to restricted access
        return false;
    }
}
