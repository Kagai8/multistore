<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Seed the system's mandatory customer records.
     */
    public function run(): void
    {
        // 🟢 The Walk-In Customer is a SYSTEM record used by the POS.
        // firstOrCreate = safe to re-run; it will never duplicate (id=4 in your DB).
        Customer::firstOrCreate(
            ['name' => 'Walk-In Customer'], // lookup key (must match exactly)
            [
                'number'         => null,
                'email'          => null,
                'credit_limit'   => 0,
                'loyalty_points' => 0,
            ]
        );

        echo "✅ Walk-In Customer ensured (ID: ".Customer::where('name', 'Walk-In Customer')->value('id').").\n";
    }
}
