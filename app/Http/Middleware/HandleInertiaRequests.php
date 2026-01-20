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

        $user = $request->user();

        return [
            ...parent::share($request),
            // 🟢 ADD THIS SECTION: The Bridge for Messages
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'receipt_data' => fn () => $request->session()->get('receipt_data'),
            ],
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
            // 🟢 ADD THIS BLOCK: Now notifications are available on EVERY page load
            'notifications' => $user ? $user->notifications()
                ->latest()
                ->take(10) // Limit to 10 to keep pages fast
                ->get()
                ->map(function ($n) {
                    return [
                        'id' => $n->id,
                        'title' => $n->data['title'] ?? 'System Alert',
                        'message' => $n->data['message'] ?? '',
                        'time' => $n->created_at->diffForHumans(),
                        'read' => !is_null($n->read_at),
                        'action_url' => $n->data['action_url'] ?? null,
                    ];
                }) : [],
            'inventoryConfig' => $request->user() ? [
                'userContext' => [
                    'store_id' => $request->user()->store_id,
                    'store_name' => $request->user()->loadMissing('store')->store?->name,

                    // 🟢 THE FIX: Check the ROLE for the access flag
                    'is_global_user' => $request->user()->isGlobal(),
                    'roles' => $request->user()->roles->pluck('name'),
                ],
            ] : ['userContext' => null],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
