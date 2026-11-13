<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $customers = DB::table('customers')->whereNotNull('number')->get(['id', 'number']);

        foreach ($customers as $customer) {
            // Remove all non-numeric characters (spaces, dashes, plus signs)
            $cleanNumber = preg_replace('/[^0-9]/', '', $customer->number);
            $originalClean = $cleanNumber;

            // Normalize to 254 format
            if (str_starts_with($cleanNumber, '07')) {
                $cleanNumber = '254' . substr($cleanNumber, 1);
            } elseif (str_starts_with($cleanNumber, '7')) {
                $cleanNumber = '254' . $cleanNumber;
            } elseif (str_starts_with($cleanNumber, '25407')) {
                $cleanNumber = '2547' . substr($cleanNumber, 4);
            }

            // Only update if it actually changed
            if ($cleanNumber !== $originalClean) {
                DB::table('customers')->where('id', $customer->id)->update(['number' => $cleanNumber]);
            }
        }
    }

    public function down(): void
    {
        // Data cleanup migrations are typically not reversible
    }
};
