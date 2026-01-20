<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_sales', function (Blueprint $table) {
            $table->id();

            // Relationships
            $table->foreignId('store_id')->constrained();
            $table->foreignId('user_id')->constrained(); // Cashier
            $table->foreignId('customer_id')->constrained(); // Default to Walk-in (ID 1)
            $table->foreignId('pos_session_id')->constrained(); // Link to the specific shift

            // Identification
            $table->string('receipt_number')->unique(); // e.g., RCP-2025-0001

            // Financials
            $table->decimal('total_amount', 15, 2);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);

            // Payment Handling
            $table->decimal('tendered_amount', 15, 2)->default(0); // Cash handed over
            $table->decimal('change_amount', 15, 2)->default(0);   // Change returned

            // Logic Status
            // completed: Done
            // parked: Held bill (Paused)
            // void: Cancelled
            // returned: Refunded
            $table->enum('status', ['completed', 'parked', 'void', 'returned'])->default('completed');

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes(); // Audit history
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sales');
    }
};
