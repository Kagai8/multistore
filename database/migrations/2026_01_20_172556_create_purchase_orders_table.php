<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();

            // Core Relations
            $table->foreignId('supplier_id')->constrained()->onDelete('restrict');
            $table->foreignId('store_id')->constrained()->onDelete('cascade');

            // Details
            $table->string('po_number')->unique(); // e.g., PO-2024-001
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->date('expected_delivery_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('draft'); // draft, pending_approval, ordered, partial, received, cancelled

            // 🟢 1. REQUEST LOG (Who created/requested it)
            $table->foreignId('requested_by_id')->constrained('users');
            $table->timestamp('requested_at')->useCurrent(); // Defaults to now

            // 🟢 2. APPROVAL LOG (Who authorized it)
            $table->foreignId('approved_by_id')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();

            // 🟢 3. RECEIVING LOG (Who checked it in)
            // Note: If received in parts, this tracks the *latest* receipt action.
            $table->foreignId('received_by_id')->nullable()->constrained('users');
            $table->timestamp('received_at')->nullable();

            // 🟢 4. CANCELLATION LOG (Who killed the deal)
            $table->foreignId('cancelled_by_id')->nullable()->constrained('users');
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
