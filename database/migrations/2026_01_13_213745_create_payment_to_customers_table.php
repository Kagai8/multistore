<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('payment_to_customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained(); // Who gave the change
            $table->foreignId('customer_id')->constrained();
            $table->foreignId('invoice_id')->nullable()->constrained(); // Linked to which sale?
            $table->decimal('amount', 12, 2);
            $table->string('type'); // 'change', 'refund'
            $table->string('method')->default('cash'); // Almost always cash
            $table->text('notes')->nullable();
            $table->timestamp('payment_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_to_customers');
    }
};
