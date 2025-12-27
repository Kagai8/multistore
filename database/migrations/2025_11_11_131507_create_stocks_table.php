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
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();

            // 1. Core Foreign Keys (Location and Product)
            // Links to the Products Module
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            // Links to the Stores Module
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();

            // 2. Quantity Tracking
            // The current count of the product at this store. unsignedInteger prevents negative stock.
            $table->unsignedInteger('current_stock')->default(0);

            // 3. Inventory Management Thresholds (Used for Reorder Reports)
            // The minimum quantity that triggers a reorder alert.
            $table->unsignedInteger('reorder_level')->default(0);
            // The suggested batch size to order/transfer when reorder level is breached.
            $table->unsignedInteger('reorder_quantity')->default(0);

            // 4. Indexing and Constraints
            // Ensures that only one record exists for a specific Product at a specific Store.
            $table->unique(['product_id', 'store_id']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
