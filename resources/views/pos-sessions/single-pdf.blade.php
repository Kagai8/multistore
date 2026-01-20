<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Shift Report #{{ $posSession->id }}</title>
    <style>
        @page { margin: 30px; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; }

        /* CONTAINER */
        .box { border: 2px solid #ea580c; padding: 25px; border-radius: 8px; position: relative; min-height: 900px; }

        /* HEADER */
        .header-table { width: 100%; border-bottom: 2px dashed #ddd; padding-bottom: 15px; margin-bottom: 20px; }
        .company-logo { max-height: 60px; max-width: 150px; }
        .company-info { font-size: 9px; color: #666; line-height: 1.3; margin-top: 5px; }
        .doc-title { font-size: 24px; font-weight: bold; color: #ea580c; text-transform: uppercase; text-align: right; }
        .doc-meta { font-size: 10px; color: #777; text-align: right; font-family: monospace; margin-top: 5px; }

        /* CONTENT */
        .section-title { font-size: 12px; font-weight: bold; background: #ea580c; color: #fff; padding: 5px 10px; margin: 20px 0 10px 0; border-radius: 2px; }

        table.data { width: 100%; border-collapse: collapse; font-size: 11px; }
        table.data td { padding: 6px; border-bottom: 1px solid #eee; }
        table.data tr:last-child td { border-bottom: none; }
        .text-right { text-align: right; }
        .text-bold { font-weight: bold; }
        .mono { font-family: monospace; font-size: 12px; }

        /* SUMMARY BOXES */
        .summary-box { background: #fff7ed; border: 1px solid #fed7aa; padding: 15px; margin-top: 10px; border-radius: 4px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .final-total { border-top: 2px solid #ea580c; padding-top: 5px; margin-top: 5px; font-size: 14px; font-weight: bold; color: #ea580c; }

        .discrepancy-positive { color: #16a34a; }
        .discrepancy-negative { color: #dc2626; }

        /* FOOTER */
        .watermark { position: absolute; top: 35%; left: 25%; font-size: 80px; color: rgba(234, 88, 12, 0.05); transform: rotate(-30deg); font-weight: bold; z-index: -1; }
        .signatures { margin-top: 50px; width: 100%; }
        .sig-box { width: 40%; border-top: 1px solid #aaa; padding-top: 5px; text-align: center; font-size: 10px; color: #666; }
    </style>
</head>
<body>
    <div class="box">
        <div class="watermark">Z-REPORT</div>

        <table class="header-table">
            <tr>
                <td width="50%" valign="top">
                    @if($company && $company->logo)
                        <img src="{{ public_path('storage/' . $company->logo) }}" class="company-logo">
                    @else
                        <div style="font-size: 18px; font-weight: bold;">{{ $company->name ?? 'POS SYSTEM' }}</div>
                    @endif
                    <div class="company-info">
                        {{ $company->address ?? '' }}<br>
                        {{ $company->phone ?? '' }} | {{ $company->email ?? '' }}
                    </div>
                </td>
                <td width="50%" valign="top">
                    <div class="doc-title">SHIFT CLOSURE</div>
                    <div class="doc-meta">
                        SESSION ID: #{{ str_pad($posSession->id, 6, '0', STR_PAD_LEFT) }}<br>
                        STORE: {{ strtoupper($posSession->store->name) }}<br>
                        PRINTED: {{ now()->format('d M Y H:i') }}
                    </div>
                </td>
            </tr>
        </table>

        <table class="data">
            <tr>
                <td width="20%" class="text-bold">Cashier:</td>
                <td width="30%">{{ $posSession->user->name }}</td>
                <td width="20%" class="text-bold">Status:</td>
                <td width="30%">{{ strtoupper($posSession->status) }}</td>
            </tr>
            <tr>
                <td class="text-bold">Opened:</td>
                <td>{{ $posSession->start_time->format('d M Y, H:i') }}</td>
                <td class="text-bold">Closed:</td>
                <td>{{ $posSession->end_time ? $posSession->end_time->format('d M Y, H:i') : 'ACTIVE' }}</td>
            </tr>
        </table>

        <div class="section-title">CASH DRAWER RECONCILIATION</div>
        <div class="summary-box">
            <table width="100%">
                <tr>
                    <td>Opening Float</td>
                    <td class="text-right mono">{{ number_format($posSession->opening_cash, 2) }}</td>
                </tr>
                <tr>
                    <td>(+) Cash Sales Collected</td>
                    <td class="text-right mono">{{ number_format($paymentBreakdown['cash'], 2) }}</td>
                </tr>
                <tr>
                    <td style="border-top: 1px dashed #ccc; padding-top:5px; font-weight:bold;">(=) Expected Cash in Drawer</td>
                    <td class="text-right mono" style="border-top: 1px dashed #ccc; padding-top:5px; font-weight:bold;">{{ number_format($expectedCash, 2) }}</td>
                </tr>
                <tr>
                    <td style="padding-top:10px;">(-) Actual Closing Count</td>
                    <td class="text-right mono" style="padding-top:10px;">{{ number_format($posSession->closing_cash, 2) }}</td>
                </tr>
                <tr>
                    <td class="final-total">VARIANCE / DISCREPANCY</td>
                    <td class="text-right mono final-total {{ $posSession->cash_difference < 0 ? 'discrepancy-negative' : 'discrepancy-positive' }}">
                        {{ number_format($posSession->cash_difference, 2) }}
                    </td>
                </tr>
            </table>
        </div>

        <div class="section-title">REVENUE BREAKDOWN</div>
        <table class="data">
            <thead>
                <tr style="background: #f4f4f4;">
                    <th align="left" style="padding:5px;">Method</th>
                    <th align="right" style="padding:5px;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($paymentBreakdown as $method => $amount)
                    @if($amount > 0)
                    <tr>
                        <td style="text-transform: capitalize;">{{ str_replace('_', ' ', $method) }}</td>
                        <td class="text-right mono">{{ number_format($amount, 2) }}</td>
                    </tr>
                    @endif
                @endforeach
                <tr style="background: #eee; font-weight:bold;">
                    <td>TOTAL REVENUE</td>
                    <td class="text-right mono">{{ number_format(array_sum($paymentBreakdown), 2) }}</td>
                </tr>
            </tbody>
        </table>

        @if($posSession->notes)
            <div class="section-title">NOTES</div>
            <div style="border: 1px dashed #ccc; padding: 10px; font-style: italic; background: #fafafa;">
                {{ $posSession->notes }}
            </div>
        @endif

        <table class="signatures">
            <tr>
                <td align="center">
                    <div class="sig-box">
                        <strong>{{ $posSession->user->name }}</strong><br>
                        Cashier Signature
                    </div>
                </td>
                <td align="center">
                    <div class="sig-box">
                        Verified By (Manager)<br>
                        Signature & Date
                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
