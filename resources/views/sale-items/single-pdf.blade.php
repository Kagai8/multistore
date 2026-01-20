<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Item Detail #{{ $item->id }}</title>
    <style>
        @page { margin: 50px 25px 50px 25px; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10px; color: #333; line-height: 1.4; }

        /* Borders & Layout */
        .container { border: 2px solid #ea580c; padding: 20px; border-radius: 8px; position: relative; }

        /* Headers */
        h1 { font-size: 18px; color: #ea580c; margin: 0 0 5px 0; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid #fed7aa; padding-bottom: 5px; }
        .label { font-size: 8px; text-transform: uppercase; color: #777; margin-bottom: 2px; letter-spacing: 0.5px; }
        .value { font-size: 11px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }

        /* Grid */
        .row { width: 100%; margin-bottom: 10px; }
        .col { display: inline-block; vertical-align: top; }
        .col-50 { width: 48%; }
        .col-33 { width: 32%; }

        /* Special Highlights */
        .total-box { background: #fff7ed; border: 1px dashed #ea580c; padding: 10px; text-align: center; margin-top: 15px; border-radius: 4px; }
        .total-label { font-size: 10px; color: #ea580c; text-transform: uppercase; }
        .total-amt { font-size: 16px; font-weight: bold; color: #ea580c; }

        .badge { background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 8px; border: 1px solid #bae6fd; }
    </style>
</head>
<body>
    <div class="container">
        <table width="100%" style="margin-bottom: 15px;">
            <tr>
                <td width="70%">
                    <h1>Product Detail Slip</h1>
                    <div style="font-size: 9px; color: #555;">Record ID: ITEM-{{ str_pad($item->id, 6, '0', STR_PAD_LEFT) }}</div>
                </td>
                <td width="30%" align="right">
                    <div class="label">Generated Date</div>
                    <div style="font-size: 9px;">{{ now()->format('d M Y, h:i A') }}</div>
                </td>
            </tr>
        </table>

        <div style="margin-bottom: 15px; background: #f9fafb; padding: 10px; border: 1px solid #eee;">
            <div class="label">Product Name</div>
            <div class="value" style="font-size: 13px;">{{ $item->product->name ?? 'Unknown Product' }}</div>

            <table width="100%">
                <tr>
                    <td>
                        <div class="label">SKU / Code</div>
                        <div class="value">{{ $item->product->sku ?? '-' }}</div>
                    </td>
                    <td>
                        <div class="label">Price Category</div>
                        <div class="value"><span class="badge">{{ ucfirst($item->price_category) }}</span></div>
                    </td>
                </tr>
            </table>
        </div>

        <div style="margin-bottom: 15px;">
            <div class="label" style="border-bottom: 1px solid #eee; margin-bottom: 5px;">Transaction Context</div>
            <table width="100%">
                <tr>
                    <td width="33%">
                        <div class="label">Sale Reference</div>
                        <div class="value" style="font-family: monospace;">{{ $item->sale->reference_no }}</div>
                    </td>
                    <td width="33%">
                        <div class="label">Store Branch</div>
                        <div class="value">{{ $item->sale->store->name ?? '-' }}</div>
                    </td>
                    <td width="33%">
                        <div class="label">Transaction Date</div>
                        <div class="value">{{ $item->sale->created_at->format('d M Y') }}</div>
                    </td>
                </tr>
                <tr>
                    <td colspan="3">
                        <div class="label">Customer</div>
                        <div class="value">{{ $item->sale->customer->name ?? 'Walk-in Customer' }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="total-box">
            <table width="100%">
                <tr>
                    <td align="center" style="border-right: 1px solid #fed7aa;">
                        <div class="total-label">Quantity</div>
                        <div class="total-amt" style="color: #555;">{{ $item->quantity }}</div>
                    </td>
                    <td align="center" style="border-right: 1px solid #fed7aa;">
                        <div class="total-label">Unit Price</div>
                        <div class="total-amt" style="color: #555; font-size: 12px;">{{ number_format($item->unit_price, 2) }}</div>
                    </td>
                    <td align="center">
                        <div class="total-label">Line Total</div>
                        <div class="total-amt">{{ number_format($item->total_price, 2) }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 8px; color: #999;">
            This is a system generated record from Alpha Logistics Systems.
        </div>
    </div>
</body>
</html>
