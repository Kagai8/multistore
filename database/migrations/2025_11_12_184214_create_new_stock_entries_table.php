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
        Schema::create('new_stock_entries', function (Blueprint $table) {
            $table->id();
            // Links to the core product being received
            $table->foreignId('product_id')->constrained('products')->onDelete('restrict');

            // Links to the supplier who sent the goods
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('restrict');

            // The location where the stock was received (implicitly the Warehouse Store)
            // While the stock is NOT live here, we record the intended destination for auditing.
            $table->foreignId('store_id')->constrained('stores')->onDelete('restrict');

            // --- Receipt Details ---
            $table->integer('quantity_received')->comment('Total quantity received in this shipment.');
            $table->string('invoice_number')->nullable()->comment('Supplier invoice or reference number.');

            // --- Flow Management ---
            $table->integer('quantity_transferred')->default(0)->comment('Quantity already allocated/transferred to other stores.');
            $table->enum('status', ['pending', 'partially_sent', 'completed'])->default('pending')->comment('Status of the allocation process.');

            // --- Audit ---
            $table->foreignId('user_id')->nullable()->constrained('users')->comment('User who recorded the entry.');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('new_stock_entries');
    }
};
