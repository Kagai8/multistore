<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            // Add order_date if it's missing
            if (!Schema::hasColumn('purchase_orders', 'order_date')) {
                $table->date('order_date')->after('po_number');
            }

            // Add expected_delivery_date if it's missing
            if (!Schema::hasColumn('purchase_orders', 'expected_delivery_date')) {
                $table->date('expected_delivery_date')->nullable()->after('order_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn(['order_date', 'expected_delivery_date']);
        });
    }
};

