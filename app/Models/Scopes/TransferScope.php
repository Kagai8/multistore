<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Scopes\TransferScope;
use Illuminate\Support\Facades\Log;

class TransferScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
{
    /** @var User|null $user */
    $user = Auth::user();

    // 🟢 DEBUG CHECK (Keep this for now, it's very helpful)
    $isGlobal = $user && $user->is_global_user; // Access the property
    Log::alert('SCOPE CHECK:', ['UserID' => optional($user)->id, 'IsGlobal' => $isGlobal, 'StoreID' => optional($user)->store_id]);


    // 🛑 1. CRITICAL: DENY ACCESS IF UNATHENTICATED
    if (!$user) {
        $builder->whereRaw('1 = 0'); // Deny access (returns empty set)
        return;
    }

    // ✅ 2. GLOBAL ACCESS BYPASS (MUST BE SECOND)
    // If the user IS global, stop the scope immediately. No filters applied.
    if ($user->is_global_user) {
        return;
    }

    // 🛑 3. SECURITY CHECK: DENY ACCESS IF RESTRICTED AND NO STORE ID
    // If the user is authenticated but not global AND has no store ID, deny access.
    if ($user->store_id === null) {
        $builder->whereRaw('1 = 0');
        return;
    }

    // 4. RESTRICTED ACCESS FILTER: Must be source OR destination.
    // This runs only for restricted users who HAVE a store_id.
    $builder->where(function (Builder $query) use ($user, $model) {
        $table = $model->getTable();
        $storeId = $user->store_id;

        $query->where($table . '.source_store_id', $storeId)
              ->orWhere($table . '.destination_store_id', $storeId);
    });
}
}
