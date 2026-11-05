<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Stock Adjustments Report</title>
    <style>
        /* Reusing Valuation styles for consistency */
        @page { margin: 100px 25px 60px 25px; }
        body { font-family: 'Helvetica', sans-serif; font-size: 9px; color: #333; line-height: 1.4; }
        header { position: fixed; top: -80px; left: 0px; right: 0px; height: 85px; border-bottom: 2px solid #ea580c; }
        .company-name { font-size: 14px; font-weight: bold; text-transform: uppercase; }
        h1 { font-size: 18px; color: #ea580c; margin: 0; text-transform: uppercase; text-align: right; }
        .meta-box { background-color: #fff7ed; border: 1px solid #fed7aa; padding: 8px; margin-bottom: 15px; }
        .stat-card { border: 1px solid #e5e7eb; padding: 10px; border-radius: 4px; background: #fff; }
        .stat-title { font-size: 8px; text-transform: uppercase; color: #6b7280; font-weight: bold; }
        .stat-value { font-size: 14px; font-weight: bold; margin-top: 4px; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { background: #ea580c; color: #fff; padding: 7px 5px; text-align: left; font-size: 8px; }
        .data-table td { border: 1px solid #e2e8f0; padding: 6px 5px; }
        .text-right { text-align: right; }
        .impact-positive { color: #166534; }
        .impact-negative { color: #991b1b; }
    </style>
</head>
<body>
    <header>
        <table width="100%">
            <tr>
                <td width="60%">
                    <div class="company-name">{{ $company->name ?? 'Alpha Logistics' }}</div>
                    <div>Inventory Adjustment Audit</div>
                </td>
                <td width="40%" align="right">
                    <h1>Adjustment Report</h1>
                    <div>{{ now()->format('d M Y') }}</div>
                </td>
            </tr>
        </table>
    </header>

    <main>
        <div class="meta-box">
            <table width="100%">
                <tr>
                    <td><strong>Auditor:</strong> {{ auth()->user()->name }}</td>
                    <td><strong>Branch:</strong> {{ $store->name ?? 'All Stores' }}</td>
                    <td align="right"><strong>Generated On:</strong> {{ now()->format('h:i A') }}</td>
                </tr>
            </table>
        </div>

        <table width="100%" style="margin-bottom: 20px;">
            <tr>
                <td width="50%" style="padding-right: 10px;">
                    <div class="stat-card">
                        <div class="stat-title">Net Value Impact</div>
                        <div class="stat-value {{ $stats['net_value_impact'] >= 0 ? 'impact-positive' : 'impact-negative' }}">
                            KSh {{ number_format($stats['net_value_impact'], 2) }}
                        </div>
                    </div>
                </td>
                <td width="50%">
                    <div class="stat-card">
                        <div class="stat-title">Items Affected</div>
                        <div class="stat-value">{{ number_format($stats['items_affected']) }} Units</div>
                    </div>
                </td>
            </tr>
        </table>

        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Store</th>
                    <th>Reason</th>
                    <th class="text-right">Before</th>
                    <th class="text-right">Adj Qty</th>
                    <th class="text-right">After</th>
                    <th class="text-right">Value Impact</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data as $row)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($row->created_at)->format('d/m/y H:i') }}</td>
                    <td style="font-weight: bold;">{{ $row->product_name }}</td>
                    <td>{{ $row->store_name }}</td>
                    <td>{{ $row->reason_name }}</td>
                    <td class="text-right">{{ $row->old_stock }}</td>
                    <td class="text-right" style="font-weight: bold;">{{ $row->adjusted_qty > 0 ? '+' : '' }}{{ $row->adjusted_qty }}</td>
                    <td class="text-right">{{ $row->new_stock }}</td>
                    <td class="text-right {{ $row->value_impact >= 0 ? 'impact-positive' : 'impact-negative' }}">
                        {{ number_format($row->value_impact, 2) }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </main>
</body>
</html>
