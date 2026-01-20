<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales Register</title>
    <style>
        @page { margin: 100px 25px 60px 25px; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9px; color: #333; line-height: 1.4; }

        /* HEADER & FOOTER */
        header { position: fixed; top: -80px; left: 0px; right: 0px; height: 80px; border-bottom: 2px solid #ea580c; }
        footer { position: fixed; bottom: -40px; left: 0px; right: 0px; height: 30px; border-top: 1px solid #ea580c; text-align: center; font-size: 8px; color: #777; padding-top: 5px; }

        /* LAYOUT */
        .header-table, .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        h1 { font-size: 18px; color: #ea580c; margin: 0; text-transform: uppercase; font-weight: bold; text-align: right; }
        .company-name { font-size: 14px; font-weight: bold; }

        /* DATA TABLE */
        .data-table th { background: #ea580c; color: #fff; padding: 6px 4px; border: 1px solid #c2410c; text-align: left; font-size: 8px; text-transform: uppercase; }
        .data-table td { border: 1px solid #e2e8f0; padding: 5px; vertical-align: middle; }
        .data-table tr:nth-child(even) { background: #ffedd5; }

        /* COLUMNS */
        .ref-cell { font-family: monospace; font-weight: bold; color: #2d3748; }
        .amount-cell { text-align: right; font-family: monospace; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #eee !important; border-top: 2px solid #ea580c; }

        /* STATUS COLORS */
        .status-paid { color: #15803d; font-weight: bold; }
        .status-partial { color: #ca8a04; font-weight: bold; }
        .status-unpaid { color: #dc2626; font-weight: bold; }

        .page-number:before { content: "Page " counter(page); }
    </style>
</head>
<body>
    <header>
        <table class="header-table">
            <tr>
                <td width="60%">
                    <div class="company-name">ALPHA LOGISTICS SYSTEMS</div>
                    <div style="font-size: 9px; color: #555;">Sales & Revenue Report</div>
                </td>
                <td width="40%" align="right">
                    <h1>Sales Register</h1>
                    <div style="font-size: 9px; color: #555; margin-top: 5px;">Ref: SL-REG-{{ now()->timestamp }}</div>
                </td>
            </tr>
        </table>
    </header>

    <footer>
        <table width="100%">
            <tr>
                <td align="left" width="33%">Generated via Alpha System</td>
                <td align="center" width="33%">CONFIDENTIAL</td>
                <td align="right" width="33%"><span class="page-number"></span></td>
            </tr>
        </table>
    </footer>

    <main>
        <table class="data-table">
            <thead>
                <tr>
                    <th width="10%">Date</th>
                    <th width="12%">Reference</th>
                    <th width="12%">Store</th>
                    <th width="15%">Customer</th>
                    <th width="12%">Cashier / User</th>
                    <th width="8%">Source</th>
                    <th width="12%" style="text-align: right;">Total</th>
                    <th width="12%" style="text-align: right;">Paid</th>
                    <th width="7%">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sales as $sale)
                    <tr>
                        <td>{{ $sale->created_at->format('d M Y') }}</td>
                        <td class="ref-cell">{{ $sale->reference_no }}</td>
                        <td>{{ $sale->store->name ?? '-' }}</td>
                        <td>{{ $sale->customer->name ?? 'Walk-in' }}</td>
                        <td>{{ $sale->user->name ?? 'System' }}</td>
                        <td style="font-size: 8px;">
                            @if(str_contains($sale->source_type, 'Pos')) POS
                            @elseif(str_contains($sale->source_type, 'Invoice')) INV
                            @else SALE @endif
                        </td>
                        <td class="amount-cell">{{ number_format($sale->total_amount, 2) }}</td>
                        <td class="amount-cell">{{ number_format($sale->paid_amount, 2) }}</td>
                        <td>
                            @if($sale->payment_status === 'paid') <span class="status-paid">PAID</span>
                            @elseif($sale->payment_status === 'partial') <span class="status-partial">PART</span>
                            @else <span class="status-unpaid">UNPD</span> @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td colspan="6" align="right">TOTALS:</td>
                    <td class="amount-cell">{{ number_format($sales->sum('total_amount'), 2) }}</td>
                    <td class="amount-cell">{{ number_format($sales->sum('paid_amount'), 2) }}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>

        <div style="margin-top: 20px; text-align: right; font-size: 9px; color: #777;">
            <strong>Total Transactions:</strong> {{ $sales->count() }}
        </div>
    </main>
</body>
</html>
