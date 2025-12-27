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
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->enum('approved_status', ['pending', 'approved', 'rejected'])->default('pending')->after('status');
            $table->foreignId('approved_by_id')->nullable()->after('approved_status')->constrained('users');
            $table->timestamp('approved_at')->nullable()->after('approved_by_id');

            // 🟢 Receipt Audit
            $table->foreignId('received_by_id')->nullable()->after('approved_at')->constrained('users');
            $table->timestamp('received_at')->nullable()->after('received_by_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropForeign(['received_by_id']);
            $table->dropColumn('received_at');
            $table->dropColumn('received_by_id');

            $table->dropColumn('approved_at');
            $table->dropForeign(['approved_by_id']);
            $table->dropColumn('approved_by_id');
            $table->dropColumn('approved_status');
        });
    }
};
