<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // 🟢 Don't forget this import!

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add the new columns
        Schema::table('invoices', function (Blueprint $table) {
            $table->timestamp('refunded_at')->nullable()->after('voided_at');
            $table->foreignId('refunded_by')->nullable()->constrained('users')->after('refunded_at');
        });

        // 2. Update the 'status' ENUM constraint for PostgreSQL
        // We drop the old rule and add a new one that allows 'refunded'
        DB::statement("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check");
        DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'posted', 'void', 'refunded'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Revert the ENUM constraint (Remove 'refunded')
        DB::statement("ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check");
        DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'posted', 'void'))");

        // 2. Drop the columns
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['refunded_by']);
            $table->dropColumn(['refunded_at', 'refunded_by']);
        });
    }
};
