<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>POS Sessions Audit Log</title>
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
        .status-badge { padding: 2px 4px; border-radius: 3px; font-size: 8px; text-transform: uppercase; color: #fff; font-weight: bold; }
        .status-open { background: #16a34a; }
        .status-closed { background: #555; }

        /* STATS GRID */
        .stats-table { width: 100%; margin-bottom: 15px; }
        .stat-card-cell { width: 25%; padding: 4px; vertical-align: top; }
        .stat-card { border: 1px solid #e5e7eb; background: #ffffff; padding: 8px; border-radius: 4px; }
        .stat-title { font-size: 8px; text-transform: uppercase; color: #6b7280; font-weight: bold; }
        .stat-value { font-size: 11px; font-weight: bold; color: #111; margin-top: 2px; }
        .card-highlight { background: #fff7ed; border-color: #fed7aa; }
        .title-highlight { color: #ea580c; }

        /* DATA TABLE */
        .data-table th { background: #ea580c; color: #fff; padding: 6px; border: 1px solid #c2410c; text-align: left; font-size: 8px; text-transform: uppercase; }
        .data-table td { border: 1px solid #e2e8f0; padding: 5px; vertical-align: middle; }
        .data-table tr:nth-child(even) { background: #ffedd5; }
        .negative { color: #dc2626; }
        .positive { color: #16a34a; }
    </style>
</head>
<body>
    <header>
        <table width="100%">
            <tr>
                <td width="60%">
                    <div class="company-name">{{ $company->name ?? 'POS SYSTEM' }}</div>
                    <div style="font-size: 9px; color: #555;">{{ $company->address ?? 'POS Audit Log' }}</div>
                </td>
                <td width="40%" align="right">
                    <h1 style="margin: 0; color: #ea580c; font-size: 16px; text-transform: uppercase;">Sessions Audit Log</h1>
                    <div style="font-size: 9px; color: #555;">Generated: {{ now()->format('d M Y, h:i A') }}</div>
                </td>
            </tr>
        </table>
    </header>

    <footer>
        <table width="100%">
            <tr>
                <td align="left" width="33%">{{ $company->name ?? 'POS System' }}</td>
                <td align="center" width="33%">CONFIDENTIAL AUDIT</td>
                <td align="right" width="33%"><span class="page-number"></span></td>
            </tr>
        </table>
    </footer>

    <main>
        {{-- CALCULATE STATS FOR HEADER --}}
        @php
            $totalSessions = $sessions->count();
            $totalDiscrepancy = $sessions->sum('cash_difference');
            $openSessions = $sessions->where('status', 'open')->count();
            $shortages = $sessions->where('cash_difference', '<', 0)->count();
        @endphp

        <table class="stats-table">
            <tr>
                <td class="stat-card-cell">
                    <div class="stat-card card-highlight">
                        <div class="stat-title title-highlight">Total Shifts</div>
                        <div class="stat-value title-highlight">{{ $totalSessions }}</div>
                    </div>
                </td>
                <td class="stat-card-cell">
                    <div class="stat-card">
                        <div class="stat-title">Net Discrepancy</div>
                        <div class="stat-value {{ $totalDiscrepancy < 0 ? 'negative' : '' }}">
                            {{ number_format($totalDiscrepancy, 2) }}
                        </div>
                    </div>
                </td>
                <td class="stat-card-cell">
                    <div class="stat-card">
                        <div class="stat-title">Active Shifts</div>
                        <div class="stat-value">{{ $openSessions }}</div>
                    </div>
                </td>
                <td class="stat-card-cell">
                    <div class="stat-card">
                        <div class="stat-title">Shortage Events</div>
                        <div class="stat-value negative">{{ $shortages }}</div>
                    </div>
                </td>
            </tr>
        </table>

        <table class="data-table">
            <thead>
                <tr>
                    <th width="8%">ID</th>
                    <th width="15%">Cashier</th>
                    <th width="12%">Store</th>
                    <th width="12%">Opened</th>
                    <th width="12%">Closed</th>
                    <th width="10%" class="text-right">Opening</th>
                    <th width="10%" class="text-right">Closing</th>
                    <th width="10%" class="text-right">Diff</th>
                    <th width="8%" align="center">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sessions as $s)
                <tr>
                    <td class="amount">#{{ $s->id }}</td>
                    <td>{{ $s->user->name ?? 'Unknown' }}</td>
                    <td>{{ $s->store->name ?? '-' }}</td>
                    <td>{{ $s->start_time->format('d M H:i') }}</td>
                    <td>{{ $s->end_time ? $s->end_time->format('d M H:i') : '-' }}</td>
                    <td class="text-right amount">{{ number_format($s->opening_cash, 2) }}</td>
                    <td class="text-right amount">{{ number_format($s->closing_cash, 2) }}</td>
                    <td class="text-right amount {{ $s->cash_difference < 0 ? 'negative' : ($s->cash_difference > 0 ? 'positive' : '') }}">
                        {{ number_format($s->cash_difference, 2) }}
                    </td>
                    <td align="center">
                        <span class="status-badge {{ $s->status == 'open' ? 'status-open' : 'status-closed' }}">
                            {{ strtoupper($s->status) }}
                        </span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </main>
</body>
</html>
