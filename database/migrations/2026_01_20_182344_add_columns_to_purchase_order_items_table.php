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
        Schema::table('purchase_order_items', function (Blueprint $table) {
            // Links
            $table->foreignId('purchase_order_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('restrict'); // Enforces the "Golden Rule" (Must exist)

            // Quantities
            $table->integer('quantity_ordered');
            $table->integer('quantity_received')->default(0); // Tracks partial deliveries

            // Pricing (Locks in the agreed cost)
            $table->decimal('unit_cost', 15, 2);
            $table->decimal('total_cost', 15, 2); // quantity * unit_cost
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropForeign(['purchase_order_id']);
            $table->dropForeign(['product_id']);
            $table->dropColumn([
                'purchase_order_id',
                'product_id',
                'quantity_ordered',
                'quantity_received',
                'unit_cost',
                'total_cost',
            ]);
        });
    }
};
