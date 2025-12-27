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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            // Core Product Identity
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku', 100)->unique();
            $table->string('barcode', 100)->nullable()->unique();
            $table->json('colors')->nullable();

            // Relationships (Foreign Keys)
            $table->foreignId('category_id')->constrained('categories')->onDelete('restrict');
            $table->foreignId('brand_id')->constrained('brands')->onDelete('restrict');
            $table->foreignId('unit_id')->constrained('units')->onDelete('restrict');
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('restrict'); // 🟢 New Field: Supplier Link

            // Pricing
            $table->decimal('retail_price', 10, 2);
            $table->decimal('wholesale_price', 10, 2)->nullable();
            $table->decimal('buying_price', 10, 2)->nullable();
            $table->decimal('discount', 10, 2)->default(0.00);

            // Media & Description
            $table->text('description')->nullable();
            $table->string('main_image')->nullable();
            $table->json('multi_images')->nullable();

            // Logistics & Status
            $table->decimal('weight', 8, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_purchasable')->default(true);

            

            // Add indices for performance on frequently queried fields
            $table->index(['name']);
            $table->index(['category_id', 'brand_id', 'supplier_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
