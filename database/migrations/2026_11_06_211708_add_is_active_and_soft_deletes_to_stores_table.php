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
        Schema::table('stores', function (Blueprint $table) {
            // Add is_active column, defaulting to true (active)
            $table->boolean('is_active')->default(true)->after('type');

            // Add soft deletes column
            $table->softDeletes()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn('is_active');
            $table->dropSoftDeletes();
        });
    }
};
