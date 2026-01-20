<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    /**
     * Mark a specific notification as read.
     */
    public function markAsRead($id)
    {
        $user = Auth::user();

        // Find the notification belonging to this user
        $notification = $user->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
            Log::info("Notification Read: User [{$user->id}] marked alert [{$id}] as read.");
        } else {
            Log::warning("Notification Error: User [{$user->id}] tried to read missing/unauthorized alert [{$id}].");
        }

        // Return back so Inertia refreshes the props (red dot disappears)
        return back();
    }

    /**
     * Mark ALL notifications as read for the current user.
     */
    public function markAllRead()
    {
        $user = Auth::user();

        $user->unreadNotifications->markAsRead();

        Log::info("Notifications Cleared: User [{$user->id}] marked ALL as read.");

        return back();
    }
}
