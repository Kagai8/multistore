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
            // We change the column to be nullable
            $table->date('transfer_date')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('stock_transfers', function (Blueprint $table) {
            // To reverse, we'd make it required again (ensure no nulls exist first!)
            $table->date('transfer_date')->nullable(false)->change();
        });
    }
};
