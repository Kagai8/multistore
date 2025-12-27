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
        Schema::create('stock_adjustment_requests', function (Blueprint $table) {
            $table->id();
            // --- Core Request Details (What, Where, Why) ---
            $table->foreignId('store_id')->constrained('stores');
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('adjustment_reason_id')->constrained('adjustment_reasons');

            // 'in' or 'out' based on positive/negative quantity
            $table->enum('type', ['in', 'out']);
            // Quantity is always stored as the positive absolute value
            $table->decimal('quantity', 12, 4)->unsigned();
            $table->text('notes')->nullable();

            // --- Workflow and Audit Fields ---
            // Status: draft, pending_approval, approved, rejected
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'rejected'])
                  ->default('pending_approval')
                  ->index();

            // Who created the request
            $table->foreignId('requested_by_id')->constrained('users');

            // Who approved/rejected it (nullable until action is taken)
            $table->foreignId('approved_by_id')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustment_requests');
    }
};
