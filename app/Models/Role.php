<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Role as SpatieRole; // 🟢 NEW: Import Spatie's Role
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use App\Models\User;

// 🟢 SWITCH: Extend SpatieRole instead of Model
class Role extends SpatieRole
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
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
