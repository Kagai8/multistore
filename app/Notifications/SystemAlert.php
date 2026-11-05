<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification; // 🟢 1. Make sure this is imported
use Illuminate\Support\Facades\Auth;

class SystemAlert extends Notification
{
    use Queueable; // 🟢 2. UNCOMMENT/ADD THIS LINE

    public $title;

    public $message;

    public $actionUrl;

    public function __construct($title, $message, $actionUrl = null)
    {
        $this->title = $title;
        $this->message = $message;
        $this->actionUrl = $actionUrl;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toArray($notifiable)
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'action_url' => $this->actionUrl,
            'created_by' => Auth::id(),
        ];
    }
}
