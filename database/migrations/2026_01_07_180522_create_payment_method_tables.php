<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. MANUAL TRANSACTIONS (Cash, Manual M-Pesa, Bank Transfer)
        Schema::create('manual_transactions', function (Blueprint $table) {
            $table->id();
            // Link back to Parent Payment is implicit via the parent's method_id

            $table->enum('method_category', ['cash', 'bank_transfer', 'mpesa_manual', 'cheque', 'other']);
            $table->string('reference_no')->nullable(); // Check # or "CASH"

            // Audit Trail for Cash
            $table->decimal('amount_tendered', 15, 2)->default(0);
            $table->decimal('change_returned', 15, 2)->default(0);

            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 2. M-PESA TRANSACTIONS (Automated STK & C2B)
        Schema::create('mpesa_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_code')->unique(); // The Receipt No (QXJ...)
            $table->string('msisdn'); // Customer Phone
            $table->string('business_shortcode'); // Your Paybill/Till

            $table->enum('transaction_type', ['paybill', 'buy_goods']);
            $table->string('account_reference')->nullable(); // Invoice # for Paybill

            // KYC Data from Safaricom
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();

            $table->timestamps();
        });

        // 3. CARD TRANSACTIONS (Terminal/PDQ)
        Schema::create('card_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('card_type')->nullable(); // Visa, MC
            $table->string('last_four', 4)->nullable();
            $table->string('auth_code')->nullable(); // Receipt Auth Code
            $table->string('terminal_id')->nullable();
            $table->timestamps();
        });

        // 4. CUSTOMER DEBTS (The Liability Tracker)
        Schema::create('customer_debts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained();

            // What created this debt? (Invoice #101)
            $table->morphs('source');

            $table->decimal('principal_amount', 15, 2); // Original Debt
            $table->decimal('balance', 15, 2); // Current owed (decreases with payment)

            $table->date('due_date')->nullable();
            $table->enum('status', ['active', 'cleared', 'bad_debt'])->default('active');

            $table->timestamps();
        });

        // 5. CREDIT TRANSACTIONS (Usage of Credit Limit)
        Schema::create('credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained();

            // Which specific Debt record did this pay off? (Optional linkage)
            // Or if this IS the creation of debt, it links to the Debt record
            $table->foreignId('customer_debt_id')->nullable()->constrained('customer_debts');

            $table->decimal('amount', 15, 2);
            $table->decimal('running_balance', 15, 2)->comment('Customer total debt after this');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_transactions');
        Schema::dropIfExists('customer_debts');
        Schema::dropIfExists('card_transactions');
        Schema::dropIfExists('mpesa_transactions');
        Schema::dropIfExists('manual_transactions');
    }
};
