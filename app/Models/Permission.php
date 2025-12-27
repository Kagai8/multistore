<?php

namespace App\Models;


use Spatie\Permission\Models\Permission as SpatiePermission;

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
