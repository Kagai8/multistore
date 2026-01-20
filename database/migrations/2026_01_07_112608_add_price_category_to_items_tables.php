<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Fix Invoice Items (The immediate error from your logs)
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->string('price_category')->default('retail')->after('product_id');
        });

        // 2. Fix Sale Items (Preventing the next error when you click "Post")
        Schema::table('sale_items', function (Blueprint $table) {
            $table->string('price_category')->default('retail')->after('product_id');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn('price_category');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('price_category');
        });
    }
};
