<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();

            // Context
            $table->foreignId('store_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('customer_id')->constrained();

            // Data
            $table->string('quotation_number')->unique(); // e.g., QT-2024-001
            $table->date('quotation_date');
            $table->date('valid_until')->nullable();

            // Financials (Same as Invoice, but no Payments)
            $table->decimal('sub_total', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);

            // Lifecycle
            $table->string('status')->default('draft'); // draft, sent, accepted, rejected, expired

            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
