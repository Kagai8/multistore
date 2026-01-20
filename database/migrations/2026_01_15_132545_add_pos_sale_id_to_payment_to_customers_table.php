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
        Schema::table('payment_to_customers', function (Blueprint $table) {
            // Nullable because a payment might belong to an Invoice OR a POS Sale
            $table->foreignId('pos_sale_id')->nullable()->constrained()->nullOnDelete()->after('invoice_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_to_customers', function (Blueprint $table) {
            $table->dropForeign(['pos_sale_id']);
            $table->dropColumn('pos_sale_id');
        });
    }
};
