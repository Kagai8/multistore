<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Outgoing Payments Register</title>
    <style>
        @page { margin: 100px 25px 60px 25px; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9px; color: #333; line-height: 1.4; }

        /* HEADER & FOOTER */
        header { position: fixed; top: -80px; left: 0px; right: 0px; height: 80px; border-bottom: 2px solid #ea580c; }
        footer { position: fixed; bottom: -40px; left: 0px; right: 0px; height: 30px; border-top: 1px solid #ea580c; text-align: center; color: #777; padding-top: 5px; }

        /* UTILS */
        table { width: 100%; border-collapse: collapse; }
        .company-name { font-size: 14px; font-weight: bold; }
        .page-number:before { content: "Page " counter(page); }
        .text-right { text-align: right; }
        .amount { font-weight: bold; font-family: monospace; }

        /* STATS GRID (3 Cols) */
        .stats-table { width: 100%; margin-bottom: 15px; }
        .stat-card-cell { width: 33.33%; padding: 4px; vertical-align: top; }
        .stat-card { border: 1px solid #e5e7eb; background: #ffffff; padding: 10px; border-radius: 4px; }
        .stat-title { font-size: 8px; text-transform: uppercase; color: #6b7280; font-weight: bold; }
        .stat-value { font-size: 12px; font-weight: bold; color: #111; margin-top: 4px; }
        .card-highlight { background: #fff7ed; border-color: #fed7aa; }
        .title-highlight { color: #ea580c; }

        /* DATA TABLE */
        .data-table th { background: #ea580c; color: #fff; padding: 6px; border: 1px solid #c2410c; text-align: left; font-size: 8px; text-transform: uppercase; }
        .data-table td { border: 1px solid #e2e8f0; padding: 5px; vertical-align: middle; }
        .data-table tr:nth-child(even) { background: #ffedd5; }
    </style>
</head>
<body>
    <header>
        <table width="100%">
            <tr>
                <td width="60%">
                    <div class="company-name">ALPHA LOGISTICS SYSTEMS</div>
                    <div style="font-size: 9px; color: #555;">Outgoing Funds Register</div>
                </td>
                <td width="40%" align="right">
                    <h1 style="margin: 0; color: #ea580c; font-size: 16px; text-transform: uppercase;">Outgoing Payments</h1>
                    <div style="font-size: 9px; color: #555;">Generated: {{ now()->format('d M Y, h:i A') }}</div>
                </td>
            </tr>
        </table>
    </header>

    <footer>
        <table width="100%">
            <tr>
                <td align="left" width="33%">Alpha Logistics</td>
                <td align="center" width="33%">CONFIDENTIAL</td>
                <td align="right" width="33%"><span class="page-number"></span></td>
            </tr>
        </table>
    </footer>

    <main>
        @php
            $grandTotal = $payments->sum('amount');
            $typeStats = $payments->groupBy('type')->map(fn($row) => $row->sum('amount'))->sortDesc();
            $allStats = collect(['Total Outgoing' => $grandTotal])->merge($typeStats);
            $rows = $allStats->chunk(3);
        @endphp

        <table class="stats-table">
            @foreach($rows as $row)
            <tr>
                @foreach($row as $label => $amount)
                    <td class="stat-card-cell">
                        @php $isTotal = ($label === 'Total Outgoing'); @endphp
                        <div class="stat-card {{ $isTotal ? 'card-highlight' : '' }}">
                            <div class="stat-title {{ $isTotal ? 'title-highlight' : '' }}">{{ ucfirst($label) }}</div>
                            <div class="stat-value {{ $isTotal ? 'title-highlight' : '' }}">{{ number_format($amount, 2) }}</div>
                        </div>
                    </td>
                @endforeach
                @for($i = $row->count(); $i < 3; $i++) <td class="stat-card-cell"></td> @endfor
            </tr>
            @endforeach
        </table>

        <table class="data-table">
            <thead>
                <tr>
                    <th width="12%">Date</th>
                    <th width="10%">Type</th>
                    <th width="15%">Store</th>
                    <th width="20%">Paid To</th>
                    <th width="10%">Method</th>
                    <th width="12%">Authorized By</th>
                    <th width="10%" class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($payments as $p)
                <tr>
                    <td>{{ $p->payment_date->format('d M Y') }}</td>
                    <td>{{ ucfirst($p->type) }}</td>
                    <td>{{ $p->store->name ?? '-' }}</td>
                    <td>{{ $p->customer->name ?? 'Walk-in' }}</td>
                    <td>{{ ucfirst($p->method) }}</td>
                    <td>{{ $p->user->name ?? 'System' }}</td>
                    <td class="text-right amount">{{ number_format($p->amount, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr style="background: #eee; font-weight: bold;">
                    <td colspan="6" align="right" style="padding-right: 10px;">TOTAL OUTGOING:</td>
                    <td class="text-right amount" style="color: #ea580c; border-top: 2px solid #ea580c;">{{ number_format($grandTotal, 2) }}</td>
                </tr>
            </tfoot>
        </table>
    </main>
</body>
</html>
