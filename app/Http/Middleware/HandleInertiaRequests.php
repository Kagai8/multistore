<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'csrf_token' => csrf_token(),
            'auth' => [
                'user' => $request->user(),
                // Eager load roles to ensure they are available
                'roles' => fn() => $request->user()?->loadMissing('roles')->roles->pluck('name'),
                'permissions' => $request->user()
                                ? $request->user()->getAllPermissions()->pluck('name')->toArray()
                                : [],
            ],
            'inventoryConfig' => $request->user() ? [
                'userContext' => [
                    'store_id' => $request->user()->store_id,
                    'store_name' => $request->user()->loadMissing('store')->store?->name,

                    // 🟢 THE FIX: Check the ROLE for the access flag
                    'is_global_user' => (bool) ($request->user()->loadMissing('roles')->roles->first()?->all_store_access ?? false),
                ],
            ] : ['userContext' => null],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
