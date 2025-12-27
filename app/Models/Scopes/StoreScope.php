<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;
use App\Models\User; // Import the User model

class StoreScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
{
    /** @var User|null $user */
    $user = Auth::user();

    // If no user is authenticated, or the user has no store_id (and is not global), deny access.
    // This is the most secure default.
    if (!$user || ($user->store_id === null && !$user->is_global_user)) {
         $builder->whereRaw('1 = 0'); // Deny access (returns empty set)
         return;
    }

    // 1. If the user IS authenticated AND is a Global User, do nothing (full access).
    if ($user->is_global_user) {
        return;
    }

    // 2. If the user IS authenticated and NOT global, apply the store_id filter.
    // We already know $user->store_id is set here due to the initial check.
    $builder->where($model->getTable().'.store_id', $user->store_id);

    }
}
