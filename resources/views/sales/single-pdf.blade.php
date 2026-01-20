<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sale {{ $sale->reference_no }}</title>
    <style>
        @page { margin: 100px 25px 100px 25px; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10px; color: #333; line-height: 1.4; }

        /* HEADER & FOOTER */
        header { position: fixed; top: -80px; left: 0px; right: 0px; height: 80px; border-bottom: 2px solid #ea580c; }
        footer { position: fixed; bottom: -60px; left: 0px; right: 0px; height: 50px; border-top: 1px solid #ea580c; font-size: 8px; color: #777; padding-top: 10px; }

        /* TABLES */
        table { width: 100%; border-collapse: collapse; }
        .header-table td { vertical-align: top; }

        .info-table { width: 100%; margin-bottom: 15px; border: 1px solid #e2e8f0; }
        .info-table th { background: #f8fafc; color: #4a5568; padding: 6px; text-align: left; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
        .info-table td { padding: 6px; border-bottom: 1px solid #eee; }
        .info-table tr:last-child td { border-bottom: none; }

        /* TYPOGRAPHY */
        h1 { font-size: 22px; color: #ea580c; margin: 0; text-transform: uppercase; font-weight: bold; text-align: right; }
        .company-name { font-size: 14px; font-weight: bold; color: #111; }
        .section-title { font-size: 11px; font-weight: bold; color: #ea580c; border-bottom: 1px solid #e2e8f0; margin: 15px 0 8px 0; text-transform: uppercase; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-green { color: #16a34a; }
        .text-red { color: #dc2626; }

        /* BADGES */
        .badge { padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 9px; text-transform: uppercase; display: inline-block; }
        .status-paid { color: #15803d; border: 1px solid #15803d; }
        .status-partial { color: #ca8a04; border: 1px solid #ca8a04; }
        .status-unpaid { color: #dc2626; border: 1px solid #dc2626; }

        .page-number:before { content: "Page " counter(page); }
    </style>
</head>
<body>
    <header>
        <table class="header-table">
            <tr>
                <td width="50%">
                    <div class="company-name">{{ strtoupper($sale->store->name ?? 'Store Name') }}</div>
                    <div style="font-size: 9px; color: #555; margin-top: 4px;">
                        {{ $sale->store->address ?? '123 Enterprise Road' }}<br>
                        {{ $sale->store->city ?? 'Nairobi' }}, Kenya<br>
                        Phone: {{ $sale->store->phone ?? '+254 ...' }}
                    </div>
                </td>
                <td width="50%" align="right">
                    <h1>Sales Receipt</h1>
                    <div style="font-size: 11px; margin-top: 5px;"># {{ $sale->reference_no }}</div>
                    <div style="margin-top: 5px;">
                        <span class="badge status-{{ $sale->payment_status }}">{{ $sale->payment_status }}</span>
                    </div>
                </td>
            </tr>
        </table>
    </header>

    <footer>
        <table width="100%">
            <tr>
                <td width="33%" align="left">
                    Cashier: {{ $sale->user->name ?? 'System' }}<br>
                    Printed: {{ now()->format('d M Y, h:i A') }}
                </td>
                <td width="33%" align="center">
                    Thank you for shopping with us!
                </td>
                <td width="33%" align="right">
                    Page <span class="page-number"></span>
                </td>
            </tr>
        </table>
    </footer>

    <main>
        <table class="w-full" style="margin-bottom: 20px;">
            <tr>
                <td width="50%" valign="top" style="background: #f9f9f9; padding: 10px; border: 1px solid #eee;">
                    <div style="font-size: 8px; text-transform: uppercase; color: #777;">Sold To</div>
                    <div style="font-size: 11px; font-weight: bold;">{{ $sale->customer->name ?? 'Walk-in Customer' }}</div>
                    @if($sale->customer && $sale->customer->phone)
                        <div>{{ $sale->customer->phone }}</div>
                    @endif
                </td>
                <td width="5%" style="border:none;"></td>
                <td width="45%" valign="top">
                    <table class="info-table" style="margin: 0;">
                        <tr>
                            <th width="40%">Date</th>
                            <td align="right">{{ $sale->created_at->format('d M Y, h:i A') }}</td>
                        </tr>
                        <tr>
                            <th>Source</th>
                            <td align="right">
                                @if(str_contains($sale->source_type, 'Pos')) POS
                                @elseif(str_contains($sale->source_type, 'Invoice')) Invoice
                                @else Direct Sale @endif
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="section-title">Items</div>
        <table class="info-table">
            <thead>
                <tr>
                    <th width="5%" class="text-center">#</th>
                    <th width="50%">Product</th>
                    <th width="10%" class="text-center">Qty</th>
                    <th width="15%" class="text-right">Unit Price</th>
                    <th width="20%" class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sale->items as $item)
                <tr>
                    <td align="center">{{ $loop->iteration }}</td>
                    <td><span class="font-bold">{{ $item->product->name ?? 'Item' }}</span></td>
                    <td align="center">{{ $item->quantity }}</td>
                    <td align="right">{{ number_format($item->unit_price, 2) }}</td>
                    <td align="right" class="font-bold">{{ number_format($item->total_price, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <table width="100%" style="margin-top: 10px;">
            <tr>
                <td width="55%"></td>
                <td width="45%">
                    <table class="info-table">
                        <tr style="background: #f1f5f9;">
                            <td class="text-right font-bold" style="padding: 8px;">TOTAL AMOUNT</td>
                            <td align="right" class="font-bold" style="padding: 8px;">{{ number_format($sale->total_amount, 2) }}</td>
                        </tr>
                        <tr>
                            <td class="text-right font-bold">Amount Paid</td>
                            <td align="right" class="text-green font-bold">{{ number_format($sale->paid_amount, 2) }}</td>
                        </tr>
                        @php $balance = $sale->total_amount - $sale->paid_amount; @endphp
                        @if($balance > 0.01)
                        <tr>
                            <td class="text-right font-bold text-red">Balance Due</td>
                            <td align="right" class="text-red font-bold">{{ number_format($balance, 2) }}</td>
                        </tr>
                        @endif
                    </table>
                </td>
            </tr>
        </table>
    </main>
</body>
</html>
