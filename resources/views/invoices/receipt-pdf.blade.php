<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt #{{ $invoice->invoice_number }}</title>
    <style>
        @page { margin: 20px; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 11px; line-height: 1.4; }

        /* Layout Grid */
        .w-full { width: 100%; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .mb-2 { margin-bottom: 10px; }

        /* Header */
        .header-title { font-size: 24px; font-weight: bold; color: #444; letter-spacing: 1px; }
        .company-name { font-size: 14px; font-weight: bold; color: #ea580c; } /* Orange accent */

        /* Tables */
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f4f6; padding: 6px; text-align: left; font-size: 10px; border-bottom: 1px solid #ddd; text-transform: uppercase; color: #555; }
        td { padding: 6px; border-bottom: 1px solid #eee; }
        .totals-row td { border-bottom: none; padding-top: 2px; padding-bottom: 2px; }

        /* Payment Section */
        .payment-box { border: 1px dashed #aaa; padding: 10px; background: #fafafa; margin-top: 15px; }

        /* Status Badges & Colors */
        .status-paid { color: #16a34a; border: 2px solid #16a34a; padding: 5px 10px; transform: rotate(-5deg); display: inline-block; font-weight: bold; font-size: 14px; }
        .status-partial { color: #ea580c; border: 2px solid #ea580c; padding: 5px 10px; display: inline-block; font-weight: bold; }
        .status-unpaid { color: #dc2626; border: 2px solid #dc2626; padding: 5px 10px; display: inline-block; font-weight: bold; }

        .text-green { color: #16a34a; }
        .text-red { color: #dc2626; }
        .text-purple { color: #7e22ce; }
    </style>
</head>
<body>

    <table class="w-full mb-2">
        <tr>
            <td width="60%" style="border:none; vertical-align: top;">
                <div class="company-name">{{ strtoupper($invoice->store->name ?? 'Company Name') }}</div>
                <div>123 Enterprise Road, Industrial Area</div>
                <div>Nairobi, Kenya</div>
                <div>Tel: +254 700 000 000</div>
            </td>
            <td width="40%" class="text-right" style="border:none; vertical-align: top;">
                <div class="header-title">RECEIPT</div>
                <div style="margin-top:5px;"># {{ $invoice->invoice_number }}</div>
                <div style="color:#777;">Date: {{ $invoice->invoice_date->format('d M Y') }}</div>
            </td>
        </tr>
    </table>

    <hr style="border: 0; border-top: 1px solid #ddd; margin: 10px 0;">

    <div class="mb-2">
        <span class="text-bold uppercase" style="color:#777; font-size:9px;">Received From:</span><br>
        <span class="text-bold" style="font-size:13px;">{{ $invoice->customer->name }}</span>
        @if($invoice->customer->phone) <br>{{ $invoice->customer->phone }} @endif
    </div>

    <div style="margin-top: 15px;">
        <table>
            <thead>
                <tr>
                    <th width="50%">Description</th>
                    <th width="15%" class="text-center">Qty</th>
                    <th width="15%" class="text-right">Price</th>
                    <th width="20%" class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $item)
                <tr>
                    <td>{{ $item->product->name }}</td>
                    <td class="text-center">{{ $item->quantity }}</td>
                    <td class="text-right">{{ number_format($item->unit_price, 2) }}</td>
                    <td class="text-right">{{ number_format($item->sub_total, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div style="margin-top: 10px;">
        <table style="width: 100%;">
            <tr>
                <td width="60%" style="border:none; vertical-align: top; padding-top: 20px;">
                    <div class="text-center">
                        @if($invoice->status === 'refunded')
                            <div class="status-unpaid" style="border-color:#7e22ce; color:#7e22ce">REFUNDED</div>
                        @elseif($invoice->payment_status === 'paid')
                            <div class="status-paid">FULLY PAID</div>
                        @elseif($invoice->payment_status === 'partial')
                            <div class="status-partial">PARTIALLY PAID</div>
                        @else
                            <div class="status-unpaid">UNPAID</div>
                        @endif
                    </div>
                </td>
                <td width="40%" style="border:none;">
                    <table style="width: 100%;">
                        <tr class="totals-row">
                            <td class="text-right text-bold">Subtotal:</td>
                            <td class="text-right">{{ number_format($invoice->sub_total, 2) }}</td>
                        </tr>
                        @if($invoice->tax_amount > 0)
                        <tr class="totals-row">
                            <td class="text-right text-bold">Tax:</td>
                            <td class="text-right">{{ number_format($invoice->tax_amount, 2) }}</td>
                        </tr>
                        @endif
                        @if($invoice->discount_amount > 0)
                        <tr class="totals-row">
                            <td class="text-right text-bold">Discount:</td>
                            <td class="text-right">({{ number_format($invoice->discount_amount, 2) }})</td>
                        </tr>
                        @endif
                        <tr>
                            <td class="text-right text-bold" style="padding-top:10px;">Grand Total:</td>
                            <td class="text-right text-bold" style="padding-top:10px; font-size:14px;">{{ number_format($invoice->total_amount, 2) }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    <div class="payment-box">
        <div class="uppercase text-bold" style="font-size:10px; color:#555; border-bottom:1px solid #ccc; padding-bottom:5px; margin-bottom:5px;">
            Payment History
        </div>
        @if($invoice->payments->count() > 0)
            <table style="width: 100%;">
                @foreach($invoice->payments as $payment)
                <tr>
                    <td style="border:none; padding: 2px;">
                        <span style="color:#555;">{{ $payment->payment_date->format('d/m/Y') }}</span> &mdash;
                        <span class="text-bold">{{ ucfirst(str_replace('_', ' ', $payment->method)) }}</span>
                        @if($payment->transaction_ref)
                            <span style="font-size:9px; color:#777;">(Ref: {{ $payment->transaction_ref }})</span>
                        @endif
                    </td>
                    <td class="text-right" style="border:none; padding: 2px;">
                        {{ number_format($payment->amount, 2) }}
                    </td>
                </tr>
                @endforeach

                @php
                    $balance = $invoice->total_amount - $invoice->paid_amount;
                @endphp

                <tr>
                    <td style="border-top:1px solid #ccc; padding-top:5px;" class="text-right text-bold">Total Tendered:</td>
                    <td style="border-top:1px solid #ccc; padding-top:5px;" class="text-right text-bold">{{ number_format($invoice->paid_amount, 2) }}</td>
                </tr>

                @if($invoice->status === 'refunded')
                    <tr>
                        <td style="border:none;" class="text-right text-bold text-purple">AMOUNT REFUNDED:</td>
                        <td style="border:none;" class="text-right text-bold text-purple">
                            {{ number_format($invoice->paid_amount, 2) }}
                        </td>
                    </tr>
                @elseif($balance < -0.01)
                    <tr>
                        <td style="border:none;" class="text-right text-bold">CHANGE:</td>
                        <td style="border:none;" class="text-right text-bold text-green">
                            {{ number_format(abs($balance), 2) }}
                        </td>
                    </tr>
                @elseif($balance > 0.01)
                    <tr>
                        <td style="border:none;" class="text-right text-bold">BALANCE DUE:</td>
                        <td style="border:none;" class="text-right text-bold text-red">
                            {{ number_format($balance, 2) }}
                        </td>
                    </tr>
                @else
                    <tr>
                        <td style="border:none;" class="text-right text-bold">BALANCE:</td>
                        <td style="border:none;" class="text-right text-bold text-green">
                            0.00
                        </td>
                    </tr>
                @endif
                </table>
        @else
            <div class="text-center" style="color:#999; padding: 5px;">No payments recorded.</div>
        @endif
    </div>

    <div style="margin-top: 30px; text-align: center; font-size: 9px; color: #777;">
        <p>Thank you for your business!</p>
        <p>Served by: {{ $invoice->user->name }} | {{ now()->format('d/m/Y H:i:s') }}</p>
    </div>

</body>
</html>
