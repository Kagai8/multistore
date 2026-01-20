<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class StoreScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = Auth::user();

        // Safety check: If no user is logged in, hide everything
        if (!$user) {
            $builder->whereRaw('1 = 0');
            return;
        }

        // 🟢 THE FIX: Ask the User model directly
        if ($user->isGlobal()) {
            return; // Super Admins see everything
        }

        // Normal Users: Filter by their assigned Store
        if ($user->store_id) {
            $builder->where($model->getTable() . '.store_id', $user->store_id);
        } else {
            $builder->whereRaw('1 = 0');
        }
    }
}
