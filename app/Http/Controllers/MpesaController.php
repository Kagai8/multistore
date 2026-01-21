<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\MpesaTransaction;
use App\Models\StorePaymentSetting;
use Carbon\Carbon;

class MpesaController extends Controller
{
    /**
     * Trigger the STK Push to the customer's phone.
     */
    public function stkPush(Request $request)
    {
        $user = $request->user();
        Log::info("💸 M-Pesa STK Push Initiated", [
            'user' => $user->name,
            'store_id' => $user->store_id,
            'phone' => $request->phone,
            'amount' => $request->amount
        ]);

        // 1. Validation
        $request->validate([
            'phone' => 'required|regex:/^254\d{9}$/', // Must start with 254
            'amount' => 'required|numeric|min:1',
        ]);

        // 2. Get Store Settings
        $settings = StorePaymentSetting::where('store_id', $user->store_id)
            ->where('provider', 'mpesa')
            ->where('is_active', true)
            ->first();

        if (!$settings) {
            Log::error("❌ M-Pesa Settings missing for Store ID: {$user->store_id}");
            return response()->json(['error' => 'M-Pesa not configured for this store'], 400);
        }

        // Extract credentials from JSON column
        $creds = $settings->credentials;
        if (!isset($creds['consumer_key']) || !isset($creds['consumer_secret'])) {
            Log::error("❌ M-Pesa Credentials incomplete in JSON", ['store_id' => $user->store_id]);
            return response()->json(['error' => 'M-Pesa configuration invalid'], 500);
        }

        // 3. Generate Access Token
        $accessToken = $this->generateAccessToken($creds);
        if (!$accessToken) {
            return response()->json(['error' => 'Failed to authenticate with M-Pesa'], 500);
        }

        // 4. Prepare the Payload
        $timestamp = Carbon::now()->format('YmdHis');
        $passkey = $creds['passkey'];
        $paybill = $settings->business_number;
        $password = base64_encode($paybill . $passkey . $timestamp);

        // 🟢 FIX: Dynamic Callback URL
        // It tries to find 'MPESA_CALLBACK_URL' in your .env or Render Dashboard.
        // If not found, it generates one based on the current domain.
        $callbackUrl = env('MPESA_CALLBACK_URL');
        if (empty($callbackUrl)) {
            $callbackUrl = url('/api/mpesa/callback');
        }

        Log::info("🚀 Sending Request to Safaricom", [
            'paybill' => $paybill,
            'amount' => $request->amount,
            'callback' => $callbackUrl
        ]);

        try {
            $response = Http::withToken($accessToken)->post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', [
                'BusinessShortCode' => $paybill,
                'Password' => $password,
                'Timestamp' => $timestamp,
                'TransactionType' => 'CustomerPayBillOnline', // Sandbox default
                'Amount' => (int) $request->amount,
                'PartyA' => $request->phone,
                'PartyB' => $paybill,
                'PhoneNumber' => $request->phone,
                'CallBackURL' => $callbackUrl,
                'AccountReference' => 'POS-' . $user->store_id,
                'TransactionDesc' => 'Payment for goods',
            ]);

            $resData = $response->json();
            Log::info("📩 Safaricom Response Received", $resData);

            // 5. Handle Response
            if (isset($resData['ResponseCode']) && $resData['ResponseCode'] == '0') {
                MpesaTransaction::create([
                    'msisdn' => $request->phone,
                    'business_shortcode' => $paybill,
                    'transaction_type' => 'paybill',
                    'amount' => $request->amount,
                    'status' => 'PENDING',
                    'checkout_request_id' => $resData['CheckoutRequestID'],
                ]);

                Log::info("✅ STK Push Sent Successfully. Tracking ID: " . $resData['CheckoutRequestID']);

                return response()->json([
                    'success' => true,
                    'message' => 'Request sent to phone',
                    'checkout_request_id' => $resData['CheckoutRequestID']
                ]);
            }

            Log::error("❌ Safaricom Rejected Request", $resData);
            return response()->json(['error' => $resData['errorMessage'] ?? 'Failed to initiate payment'], 400);

        } catch (\Exception $e) {
            Log::error("🔥 Critical Exception in STK Push: " . $e->getMessage());
            return response()->json(['error' => 'System Error'], 500);
        }
    }

    // ... (Keep the rest of your methods: generateAccessToken, callback, checkStatus, verifyTransaction exactly as they were) ...
    // I am omitting them here to save space, but DO NOT DELETE THEM from your file.

    /**
     * Generate OAuth Token from Safaricom
     */
    private function generateAccessToken($creds)
    {
        try {
            $url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

            $response = Http::withBasicAuth($creds['consumer_key'], $creds['consumer_secret'])
                ->get($url);

            if ($response->successful()) {
                return $response->json()['access_token'];
            }

            Log::error("❌ Failed to generate M-Pesa Token", (array) $response->json());
            return null;

        } catch (\Exception $e) {
            Log::error("🔥 Token Generation Exception: " . $e->getMessage());
            return null;
        }
    }

    public function callback(Request $request)
    {
        Log::info("🔔 Callback Hit!", $request->all());

        $data = $request->json()->all();

        if (!isset($data['Body']['stkCallback'])) {
            Log::error("❌ Invalid Callback Structure");
            return response()->json(['result' => 'fail']);
        }

        $callback = $data['Body']['stkCallback'];
        $checkoutRequestId = $callback['CheckoutRequestID'];

        $transaction = MpesaTransaction::where('checkout_request_id', $checkoutRequestId)->first();

        if (!$transaction) {
            Log::error("❌ Transaction Not Found for ID: $checkoutRequestId");
            return response()->json(['result' => 'fail']);
        }

        if ($callback['ResultCode'] == 0) {
            Log::info("✅ Payment Successful for " . $transaction->msisdn);
            $items = $callback['CallbackMetadata']['Item'];
            $receipt = collect($items)->firstWhere('Name', 'MpesaReceiptNumber')['Value'] ?? null;

            $transaction->update([
                'status' => 'COMPLETED',
                'transaction_code' => $receipt,
                'result_desc' => 'Payment Successful',
            ]);
        } else {
            Log::warning("⚠️ Payment Failed: " . $callback['ResultDesc']);
            $transaction->update([
                'status' => 'FAILED',
                'result_desc' => $callback['ResultDesc'],
            ]);
        }

        return response()->json(['result' => 'success']);
    }

    public function checkStatus($checkoutRequestId)
    {
        $transaction = MpesaTransaction::where('checkout_request_id', $checkoutRequestId)->first();

        if (!$transaction) {
            return response()->json(['status' => 'PENDING'], 200);
        }

        return response()->json([
            'status' => $transaction->status,
            'transaction_code' => $transaction->transaction_code,
            'result_desc' => $transaction->result_desc
        ]);
    }

   public function verifyTransaction(Request $request)
    {
        Log::info("🔍 VERIFY HIT: Endpoint Reached.", $request->all());

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'phone' => 'required|string',
            'amount' => 'required|numeric'
        ]);

        if ($validator->fails()) {
            Log::error("❌ VERIFY VALIDATION FAILED:", $validator->errors()->toArray());
            return response()->json([
                'error' => 'Invalid data. Please check Phone and Amount.'
            ], 422);
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', $request->phone);
        $last9 = substr($cleanPhone, -9);

        Log::info("🔍 SEARCHING: Phone ending in '...{$last9}' | Amount: {$request->amount}");

        $transaction = MpesaTransaction::where('msisdn', 'LIKE', "%{$last9}")
            ->where('amount', $request->amount)
            ->where('status', 'COMPLETED')
            ->whereDoesntHave('payment')
            ->latest()
            ->first();

        if (!$transaction) {
            $isUsed = MpesaTransaction::where('msisdn', 'LIKE', "%{$last9}")
                ->where('amount', $request->amount)
                ->has('payment')
                ->exists();

            if ($isUsed) {
                Log::warning("❌ FOUND BUT USED: Transaction exists but is already linked to another invoice.");
                return response()->json(['error' => "This payment has already been used."], 409);
            }

            Log::warning("❌ NOT FOUND: No matching record in DB.");
            return response()->json([
                'error' => "No payment found from ...{$last9} for KSh {$request->amount}. Ensure the SMS has arrived."
            ], 404);
        }

        Log::info("✅ VERIFY SUCCESS: {$transaction->transaction_code}");

        return response()->json([
            'success' => true,
            'message' => "Confirmed: {$transaction->transaction_code}",
            'data' => $transaction
        ]);
    }
}
