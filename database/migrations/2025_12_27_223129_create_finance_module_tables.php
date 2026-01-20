<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. INVOICES (The Workspace / Drafts)
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();

            // Context
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained(); // Creator
            $table->foreignId('customer_id')->constrained(); // Walk-in (ID 1) or Registered

            // Identification
            $table->string('invoice_number')->unique(); // Format: INV-2025-001
            $table->date('invoice_date');
            $table->date('due_date')->nullable();

            // Financials
            $table->decimal('sub_total', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);

            // Payment Tracking (Cached Calculation)
            $table->decimal('paid_amount', 15, 2)->default(0);

            // 🟢 THE LOGIC COLUMNS (As agreed)
            // 1. Status: Controls Editability (Draft=Yes, Posted=No)
            $table->enum('status', ['draft', 'posted', 'void'])->default('draft');

            // 2. Payment Status: Controls Money Owed
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');

            // 3. Arrangement: The User's Intent from the Form (Full vs Partial)
            $table->enum('payment_arrangement', ['full', 'partial'])->nullable();

            // Audit for Voiding
            $table->timestamp('voided_at')->nullable();
            $table->string('void_reason')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. INVOICE ITEMS (The Draft Cart)
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();

            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2); // Manual override allowed here
            $table->decimal('sub_total', 15, 2);  // quantity * unit_price

            $table->timestamps();
        });

        // 3. PAYMENTS (The Money Trail)
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained(); // Cashier
            $table->foreignId('store_id')->constrained(); // Drawer

            $table->decimal('amount', 15, 2);

            // Includes 'credit_limit' per your rule
            $table->enum('method', ['cash', 'mpesa', 'card', 'bank_transfer', 'credit_limit', 'other']);

            // Handles Refunds (Negative entries) for Voids
            $table->enum('type', ['payment', 'refund'])->default('payment');

            $table->string('transaction_ref')->nullable(); // M-Pesa Code
            $table->date('payment_date');

            $table->timestamps();
        });

        // 4. SALES (The Master Ledger)
        // Created ONLY when Invoice is 'Posted'
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('customer_id')->constrained();

            // Polymorphic Link to Source (Invoice, POS, etc.)
            // Creates 'source_id' and 'source_type' columns
            $table->nullableMorphs('source');

            $table->string('reference_no')->unique(); // Matches Invoice Number
            $table->decimal('total_amount', 15, 2);

            // Snapshot of status at moment of posting
            $table->enum('payment_status', ['paid', 'partial']);
            $table->enum('status', ['completed', 'returned', 'cancelled'])->default('completed');

            $table->timestamps();
        });

        // 5. SALE ITEMS (The Audit Trace)
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();

            // Link back to specific 'invoice_items' row for deep auditing
            $table->nullableMorphs('source_item');

            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total_price', 15, 2);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Dropped in reverse order to prevent Foreign Key errors
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
    }
};
