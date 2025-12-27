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
        Schema::table('stock_adjustments', function (Blueprint $table) {
            $table->foreignId('related_transfer_id')
                  ->nullable()
                  ->constrained('stock_transfers')
                  ->onDelete('set null') // If a transfer is deleted, keep the adjustments but clear the link.
                  ->after('adjustment_reason_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_adjustments', function (Blueprint $table) {
            $table->dropForeign(['related_transfer_id']);
            $table->dropColumn('related_transfer_id');
        });
    }
};
