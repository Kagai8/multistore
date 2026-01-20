<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_sessions', function (Blueprint $table) {
            $table->id();

            // Context
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained(); // The Cashier

            // Shift Details
            $table->timestamp('start_time');
            $table->timestamp('end_time')->nullable();

            // Cash Tracking (The "Z-Report" Logic)
            $table->decimal('opening_cash', 15, 2)->default(0); // Float amount
            $table->decimal('closing_cash', 15, 2)->nullable(); // Actual count at end
            $table->decimal('cash_difference', 15, 2)->nullable(); // Over/Short

            // Status: open = Active Selling, closed = Day Ended
            $table->enum('status', ['open', 'closed'])->default('open');

            $table->text('notes')->nullable(); // For explaining shortages
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sessions');
    }
};
