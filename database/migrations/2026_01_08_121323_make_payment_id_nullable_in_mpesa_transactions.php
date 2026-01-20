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
        Schema::table('mpesa_transactions', function (Blueprint $table) {
            // 1. ADD payment_id (It didn't exist before)
            // We make it nullable for the "Orphan" state
            $table->unsignedBigInteger('payment_id')->nullable()->after('id');

            // 2. ADD Amount (This was also missing)
            $table->decimal('amount', 10, 2)->after('msisdn');

            // 3. ADD Tracking Columns for STK Push
            $table->string('status')->default('PENDING')->after('amount');
            $table->string('result_desc')->nullable()->after('status');
            $table->string('checkout_request_id')->nullable()->index()->after('transaction_code');

            // 4. MODIFY transaction_code to be nullable
            // (It exists, but we need to remove the 'NOT NULL' requirement)
            $table->string('transaction_code')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('mpesa_transactions', function (Blueprint $table) {
            // 1. Drop the columns we added
            $table->dropColumn([
                'payment_id',
                'amount',
                'status',
                'result_desc',
                'checkout_request_id'
            ]);

            // 2. Revert transaction_code to NOT NULL (how it was originally)
            $table->string('transaction_code')->nullable(false)->change();
        });
    }
};
