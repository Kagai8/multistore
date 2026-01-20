<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // 1. Link Split Payments
            $table->string('payment_group_id')->nullable()->after('id')->index();

            // 2. Polymorphic Relation for WHAT is being paid (Invoice, Debt, Sale)
            // Replaces strict 'invoice_id'
            $table->nullableMorphs('payable'); // Adds payable_id, payable_type

            // 3. Polymorphic Relation for HOW it is paid (MpesaTransaction, etc)
            // Replaces strict 'method' string
            $table->nullableMorphs('method'); // Adds method_id, method_type

            // 4. Status Tracking
            $table->enum('status', ['completed', 'pending', 'failed', 'void'])->default('completed')->after('amount');
        });

        // 🟢 DATA MIGRATION SCRIPT (Preserve History)
        // Move existing invoice_id data to the new polymorphic columns
        DB::statement("UPDATE payments SET payable_type = 'App\\\\Models\\\\Invoice', payable_id = invoice_id WHERE invoice_id IS NOT NULL");

        // We do NOT drop invoice_id yet to be safe, but you can make it nullable now
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('invoice_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['payment_group_id', 'payable_type', 'payable_id', 'method_type', 'method_id', 'status']);
            $table->foreignId('invoice_id')->nullable(false)->change();
        });
    }
};
