<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pos_sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();

            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2); // Snapshot of price at moment of sale
            $table->decimal('sub_total', 15, 2);  // qty * unit_price

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sale_items');
    }
};
