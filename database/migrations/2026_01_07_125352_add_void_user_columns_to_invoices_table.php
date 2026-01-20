<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Add the missing User tracking columns
            $table->foreignId('void_requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['void_requested_by']);
            $table->dropForeign(['voided_by']);
            $table->dropColumn(['void_requested_by', 'voided_by']);
        });
    }
};
