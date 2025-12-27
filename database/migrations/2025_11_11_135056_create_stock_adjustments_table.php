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
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            

            // 1. Core Foreign Keys (What was adjusted, and where)
            $table->foreignId('product_id')->constrained()->onDelete('restrict');
            $table->foreignId('store_id')->constrained()->onDelete('restrict');
            $table->foreignId('user_id')->constrained()->onDelete('restrict')->comment('Who performed the adjustment');

            // 2. Adjustment Details
            // Use 'in' (positive) or 'out' (negative) to classify the reason/direction
            $table->enum('type', ['in', 'out'])->comment('Direction of adjustment: in (positive) or out (negative)');

            // Reasons for adjustment (e.g., Damage, Count Error, Return, Theft)
            $table->foreignId('adjustment_reason_id')->nullable()->constrained('adjustment_reasons')->onDelete('set null');

            $table->decimal('quantity', 10, 2)->default(0)->comment('The quantity added or removed (always positive)');

            // 3. Stock Tracking (Audit)
            $table->integer('old_stock')->comment('Stock level BEFORE this adjustment was applied');
            $table->integer('new_stock')->comment('Stock level AFTER this adjustment was applied');

            // 4. Metadata
            $table->text('notes')->nullable();

            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
