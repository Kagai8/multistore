<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_payment_settings', function (Blueprint $table) {
            $table->id();

            // Link to Store
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();

            // Gateway Type (M-Pesa, Bank, etc.)
            $table->string('provider')->default('mpesa'); // 'mpesa', 'bank', 'stripe'

            // Configuration Details
            $table->enum('type', ['paybill', 'till', 'bank_account']);
            $table->string('business_number'); // Paybill No, Till No, or Bank Acc No
            $table->string('account_number')->nullable(); // Only for Paybill/Bank

            // Secrets (Encrypted JSON)
            // Stores Consumer Key, Secret, Passkey, etc.
            $table->json('credentials')->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Prevent duplicate configs for same provider type in one store
            $table->unique(['store_id', 'provider', 'type', 'business_number'], 'store_payment_config_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_payment_settings');
    }
};
