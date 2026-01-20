<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id();

            // Parent Link
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();

            // Product Link
            $table->foreignId('product_id')->constrained();

            // Pricing Details
            $table->string('price_category')->default('retail'); // retail, wholesale, special, manual
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('sub_total', 15, 2);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
    }
};
