<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('debt_repayments', function (Blueprint $table) {
            $table->id();

            // Context
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained(); // The cashier who took the money
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();

            // Receipt Details
            $table->string('receipt_number')->unique(); // e.g., RPY-2024-001
            $table->decimal('amount_paid', 12, 2); // Total lump sum paid
            $table->date('payment_date');
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('debt_repayments');
    }
};
