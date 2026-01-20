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
        Schema::table('products', function (Blueprint $table) {
            // 🟢 Make these columns nullable
            $table->unsignedBigInteger('unit_id')->nullable()->change();
            $table->unsignedBigInteger('supplier_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // 🔴 Revert them back to required (not null)
            // Note: This might fail if you have null values in the DB when rolling back
            $table->unsignedBigInteger('unit_id')->nullable(false)->change();
            $table->unsignedBigInteger('supplier_id')->nullable(false)->change();
        });
    }
};
