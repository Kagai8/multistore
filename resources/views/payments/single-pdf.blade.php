<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt {{ $payment->transaction_ref }}</title>
    <style>
        @page { margin: 30px; }
        body { font-family: 'Helvetica', sans-serif; font-size: 11px; color: #333; }
        .box { border: 2px solid #ea580c; padding: 20px; border-radius: 8px; }
        h1 { color: #ea580c; margin: 0 0 10px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
        .row { display: block; margin-bottom: 8px; }
        .label { font-weight: bold; color: #555; width: 120px; display: inline-block; }
        .amount-box { margin-top: 15px; padding: 10px; background: #fff7ed; border: 1px solid #fed7aa; text-align: center; }
        .amount { font-size: 18px; font-weight: bold; color: #ea580c; }
    </style>
</head>
<body>
    <div class="box">
        <table width="100%">
            <tr>
                <td width="70%">
                    <h1>PAYMENT RECEIPT</h1>
                    <div><strong>{{ strtoupper($payment->store->name ?? 'Alpha Logistics') }}</strong></div>
                    <div style="font-size: 10px; color: #777;">Date: {{ $payment->payment_date->format('d M Y, h:i A') }}</div>
                </td>
                <td align="right">
                    <div style="font-family: monospace; font-size: 12px;">{{ $payment->transaction_ref }}</div>
                    <div style="color: green; font-weight: bold; margin-top: 5px;">PAID</div>
                </td>
            </tr>
        </table>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

        <div class="row"><span class="label">Customer:</span> {{ $payment->payable->customer->name ?? 'Walk-In Customer' }}</div>
        <div class="row"><span class="label">Payment Method:</span> {{ ucfirst($payment->method) }}</div>
        <div class="row"><span class="label">Received By:</span> {{ $payment->user->name ?? 'System' }}</div>

        <div class="amount-box">
            <div style="font-size: 10px; text-transform: uppercase;">Amount Received</div>
            <div class="amount">{{ number_format($payment->amount, 2) }}</div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 9px; color: #aaa;">
            Thank you for your business.
        </div>
    </div>
</body>
</html>
