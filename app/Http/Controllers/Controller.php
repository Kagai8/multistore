<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\Notification; // 🟢 Import this
use App\Models\User;
use App\Notifications\SystemAlert; // 🟢 Import this

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Send a notification to everyone in a specific store (plus Super Admins).
     */
    protected function notifyStore($storeId, $title, $message, $actionUrl = null)
    {
        // 1. Find staff in that store
        $storeUsers = User::where('store_id', $storeId)->where('is_active', true)->get();

        // 2. Find Super Admins (Global view)
        // 🟢 FIX: Use 'whereHas' instead of 'role()' to avoid the conflict
        $admins = User::whereHas('roles', function ($q) {
            $q->where('name', 'super-administrator');
        })->get();

        // 3. Combine them (unique users only)
        $recipients = $storeUsers->merge($admins)->unique('id');

        // 4. Send!
        if ($recipients->count() > 0) {
            Notification::send($recipients, new SystemAlert($title, $message, $actionUrl));
        }
    }
}
