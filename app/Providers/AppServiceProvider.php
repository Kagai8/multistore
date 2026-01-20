<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Relations\Relation;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 🟢 Register the Friendly Names
        Relation::morphMap([
            // What is being paid?
            'invoice' => 'App\Models\Invoice',
            'debt' => 'App\Models\CustomerDebt',
            // 'pos_sale' => 'App\Models\PosSale', // Future proofing

            // How is it paid? (The Methods)
            'manual' => 'App\Models\ManualTransaction',
            'mpesa_auto' => 'App\Models\MpesaTransaction',
            'card' => 'App\Models\CardTransaction',
            'credit' => 'App\Models\CreditTransaction',
        ]);
    }
}
