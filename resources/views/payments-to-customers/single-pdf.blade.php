<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Voucher #{{ $payment->id }}</title>
    <style>
        @page { margin: 30px; }
        body { font-family: 'Helvetica', sans-serif; font-size: 11px; color: #333; }
        .box { border: 2px solid #ea580c; padding: 20px; border-radius: 8px; position: relative; }

        h1 { color: #ea580c; margin: 0 0 10px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; text-transform: uppercase; }
        .store-name { font-size: 14px; font-weight: bold; color: #111; margin-bottom: 5px; }

        .row { margin-bottom: 8px; }
        .label { font-weight: bold; color: #555; width: 120px; display: inline-block; }

        .amount-box { margin-top: 15px; padding: 10px; background: #fff7ed; border: 1px solid #fed7aa; text-align: center; }
        .amount { font-size: 18px; font-weight: bold; color: #ea580c; }

        .watermark { position: absolute; top: 30%; left: 30%; font-size: 60px; color: rgba(234, 88, 12, 0.05); transform: rotate(-30deg); font-weight: bold; }
    </style>
</head>
<body>
    <div class="box">
        <div class="watermark">{{ strtoupper($payment->type) }}</div>

        <table width="100%">
            <tr>
                <td width="70%">
                    <h1>PAYMENT VOUCHER</h1>
                    <div class="store-name">{{ strtoupper($payment->store->name ?? 'Alpha Logistics') }}</div>
                    <div style="font-size: 10px; color: #777;">Date: {{ $payment->payment_date->format('d M Y') }}</div>
                </td>
                <td align="right" valign="top">
                    <div style="font-family: monospace; font-size: 12px; background: #eee; padding: 5px;">ID: PV-{{ $payment->id }}</div>
                </td>
            </tr>
        </table>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">

        <div class="row"><span class="label">Paid To:</span> {{ $payment->customer->name ?? 'Walk-In Customer' }}</div>
        <div class="row"><span class="label">Payment Type:</span> {{ ucfirst($payment->type) }}</div>
        <div class="row"><span class="label">Method:</span> {{ ucfirst($payment->method) }}</div>

        @if($payment->invoice_id || $payment->pos_sale_id)
        <div class="row"><span class="label">Reference:</span>
            {{ $payment->invoice_id ? 'Invoice #'.$payment->invoice->invoice_number : 'POS Receipt #'.$payment->pos_sale->receipt_number }}
        </div>
        @endif

        <div class="amount-box">
            <div style="font-size: 10px; text-transform: uppercase;">Amount Paid Out</div>
            <div class="amount">{{ number_format($payment->amount, 2) }}</div>
        </div>

        @if($payment->notes)
        <div style="margin-top: 15px; padding: 10px; border: 1px dashed #ccc; background: #fafafa;">
            <strong>Notes:</strong> {{ $payment->notes }}
        </div>
        @endif

        <table width="100%" style="margin-top: 40px;">
            <tr>
                <td align="center" width="50%">
                    ________________________<br>
                    <span style="font-size: 9px; color: #777;">Authorized By</span><br>
                    <strong>{{ $payment->user->name ?? 'Manager' }}</strong>
                </td>
                <td align="center" width="50%">
                    ________________________<br>
                    <span style="font-size: 9px; color: #777;">Received By</span><br>
                    <span style="font-size: 9px;">Signature / Name</span>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
