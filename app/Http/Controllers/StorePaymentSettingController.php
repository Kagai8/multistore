<?php

namespace App\Http\Controllers;

use App\Models\StorePaymentSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StorePaymentSettingController extends Controller
{
    /**
     * Display settings for the CURRENT store only.
     */
    public function index()
    {
        $user = Auth::user();

        // 🟢 STORE SCOPE: Only show settings for this user's store
        $settings = StorePaymentSetting::where('store_id', $user->store_id)
            ->latest()
            ->get()
            ->map(function ($setting) {
                // We unpack the JSON here so the Frontend sees flat data
                $creds = $setting->credentials ?? [];

                return [
                    'id' => $setting->id,
                    'provider' => $setting->provider,
                    'type' => $setting->type, // 'paybill' or 'till'
                    'business_number' => $setting->business_number,
                    'account_number' => $setting->account_number, // Only for Paybill
                    'is_active' => $setting->is_active,

                    // Unpacked Credentials for the Edit Form
                    'consumer_key' => $creds['consumer_key'] ?? '',
                    'consumer_secret' => $creds['consumer_secret'] ?? '',
                    'passkey' => $creds['passkey'] ?? '',
                ];
            });

        return Inertia::render('payment-settings/index', [
            'settings' => $settings
        ]);
    }

    /**
     * Save new settings.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'provider' => 'required|string',
            'type' => 'required|in:paybill,till', // The Toggle
            'business_number' => 'required|string',

            // Account Number is only really needed for Paybill, but we allow nullable
            'account_number' => 'nullable|string',

            // Credentials
            'consumer_key' => 'required|string',
            'consumer_secret' => 'required|string',
            'passkey' => 'required|string',
            'is_active' => 'boolean'
        ]);

        // 🟢 JSON PACKING
        $credentials = [
            'consumer_key' => $validated['consumer_key'],
            'consumer_secret' => $validated['consumer_secret'],
            'passkey' => $validated['passkey'],
        ];

        StorePaymentSetting::create([
            'store_id' => $user->store_id, // Force current store
            'provider' => $validated['provider'],
            'type' => $validated['type'],
            'business_number' => $validated['business_number'],
            'account_number' => $validated['account_number'],
            'credentials' => $credentials, // Laravel casts this to JSON automatically
            'is_active' => $validated['is_active'],
        ]);

        return back()->with('success', 'Payment setting saved successfully.');
    }

    /**
     * Update existing settings.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        // 🟢 SECURITY: Ensure we only update settings belonging to this store
        $setting = StorePaymentSetting::where('store_id', $user->store_id)
            ->where('id', $id)
            ->firstOrFail();

        $validated = $request->validate([
            'provider' => 'required|string',
            'type' => 'required|in:paybill,till',
            'business_number' => 'required|string',
            'account_number' => 'nullable|string',
            'consumer_key' => 'required|string',
            'consumer_secret' => 'required|string',
            'passkey' => 'nullable|string', // Nullable on update in case they don't want to change it
            'is_active' => 'boolean'
        ]);

        // Merge new passkey only if provided, otherwise keep old
        $currentCreds = $setting->credentials ?? [];
        $newCreds = [
            'consumer_key' => $validated['consumer_key'],
            'consumer_secret' => $validated['consumer_secret'],
            'passkey' => $validated['passkey'] ? $validated['passkey'] : ($currentCreds['passkey'] ?? ''),
        ];

        $setting->update([
            'provider' => $validated['provider'],
            'type' => $validated['type'],
            'business_number' => $validated['business_number'],
            'account_number' => $validated['account_number'],
            'credentials' => $newCreds,
            'is_active' => $validated['is_active'],
        ]);

        return back()->with('success', 'Payment setting updated.');
    }

    public function destroy($id)
    {
        $user = Auth::user();
        StorePaymentSetting::where('store_id', $user->store_id)->where('id', $id)->delete();
        return back()->with('success', 'Configuration deleted.');
    }
}
