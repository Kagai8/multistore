<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Stock Receipt #{{ $newStockEntry->id }}</title>
    <style>
        /** DOMPDF COMPATIBILITY SETTINGS */
        @page {
            margin: 100px 25px 60px 25px;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #333;
            line-height: 1.5;
        }

        /* --- HEADER & FOOTER --- */
        header {
            position: fixed;
            top: -80px;
            left: 0px;
            right: 0px;
            height: 80px;
            border-bottom: 2px solid #ea580c; /* Orange accent */
        }

        footer {
            position: fixed;
            bottom: -40px;
            left: 0px;
            right: 0px;
            height: 30px;
            border-top: 1px solid #ea580c;
            text-align: center;
            font-size: 8px;
            color: #777;
            padding-top: 5px;
        }

        .header-table { width: 100%; border-collapse: collapse; }
        .company-name { font-size: 14px; font-weight: bold; color: #111; }
        .company-details { font-size: 9px; color: #555; }
        h1 { font-size: 18px; color: #ea580c; margin: 0; text-transform: uppercase; font-weight: bold; text-align: right; }

        /* --- AUDIT META BOX --- */
        .meta-box {
            background-color: #fff7ed;
            border: 1px solid #fed7aa;
            padding: 10px;
            margin-bottom: 20px;
            font-size: 9px;
        }
        .meta-table { width: 100%; border-collapse: collapse; }
        .meta-table td { vertical-align: top; }

        /* --- SECTION STYLING --- */
        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #ea580c;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            margin-top: 20px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        /* --- TABLES --- */
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .info-table th {
            text-align: left; width: 30%; padding: 6px;
            background-color: #f8fafc; color: #4a5568;
            border: 1px solid #e2e8f0; font-weight: bold; font-size: 9px;
        }
        .info-table td {
            padding: 6px; border: 1px solid #e2e8f0;
            color: #2d3748; font-size: 10px;
        }

        /* --- RECEIPT SPECIFIC STYLES --- */
        .status-badge {
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 3px;
            text-transform: uppercase;
            font-size: 9px;
            display: inline-block;
        }
        .status-completed { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .status-pending { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }

        .invoice-ref {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            font-size: 11px;
            color: #333;
        }

        .qty-highlight {
            font-size: 14px;
            font-weight: bold;
            color: #ea580c;
        }

        .page-number:before { content: "Page " counter(page); }
    </style>
</head>
<body>

    <header>
        <table class="header-table">
            <tr>
                <td width="60%">
                    <div class="company-name">ALPHA LOGISTICS SYSTEMS</div>
                    <div class="company-details">
                        123 Industrial Area, Enterprise Road<br>
                        Nairobi, Kenya 00100<br>
                        support@alphalogistics.com | +254 700 000 000
                    </div>
                </td>
                <td width="40%" align="right">
                    <h1>Goods Receipt Note</h1>
                    <div class="company-details" style="margin-top: 5px;">
                        Receipt #: GRN-{{ str_pad($newStockEntry->id, 6, '0', STR_PAD_LEFT) }}
                    </div>
                </td>
            </tr>
        </table>
    </header>

    <footer>
        <table width="100%">
            <tr>
                <td align="left" width="33%">Generated via Alpha System</td>
                <td align="center" width="33%">CONFIDENTIAL DOCUMENT</td>
                <td align="right" width="33%"><span class="page-number"></span></td>
            </tr>
        </table>
    </footer>

    <main>
        <div class="meta-box">
            <table class="meta-table">
                <tr>
                    <td width="33%">
                        <strong>Printed By:</strong><br> {{ auth()->user()->name ?? 'System User' }}
                    </td>
                    <td width="33%">
                        <strong>Role:</strong><br> {{ auth()->user()->role->label ?? 'N/A' }}
                    </td>
                    <td width="33%" align="right">
                        <strong>Date Printed:</strong><br> {{ now()->format('d M Y, h:i A') }}
                    </td>
                </tr>
            </table>
        </div>

        <table style="width: 100%; margin-bottom: 20px;">
            <tr>
                <td width="48%" valign="top">
                    <div class="section-title" style="margin-top: 0;">Supplier / Source</div>
                    <table class="info-table">
                        <tr>
                            <th>Supplier Name</th>
                            <td><strong>{{ $newStockEntry->supplier->name ?? 'Unknown Supplier' }}</strong></td>
                        </tr>
                        <tr>
                            <th>Invoice / Ref #</th>
                            <td class="invoice-ref">{{ $newStockEntry->invoice_number ?? 'N/A' }}</td>
                        </tr>
                    </table>
                </td>
                <td width="4%"></td> <td width="48%" valign="top">
                    <div class="section-title" style="margin-top: 0;">Destination / Store</div>
                    <table class="info-table">
                        <tr>
                            <th>Received At</th>
                            <td>{{ $newStockEntry->store->name ?? 'Head Office' }}</td>
                        </tr>
                        <tr>
                            <th>Status</th>
                            <td>
                                @if($newStockEntry->status === 'completed')
                                    <span class="status-badge status-completed">POSTED / LIVE</span>
                                @else
                                    <span class="status-badge status-pending">PENDING</span>
                                @endif
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="section-title">Received Item Details</div>
        <table class="info-table">
            <thead>
                <tr>
                    <th width="40%">Product Name</th>
                    <th width="20%">SKU</th>
                    <th width="20%">Unit</th>
                    <th width="20%">Quantity Received</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>{{ $newStockEntry->product->name ?? 'Unknown Product' }}</strong></td>
                    <td style="font-family: monospace;">{{ $newStockEntry->product->sku ?? '—' }}</td>
                    <td>{{ $newStockEntry->product->unit->name ?? 'Item' }}</td>
                    <td class="qty-highlight">{{ number_format($newStockEntry->quantity_received) }}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">System Workflow</div>
        <table class="info-table">
            <tr>
                <th width="25%">Recorded By</th>
                <td>{{ $newStockEntry->user->name ?? 'System' }}</td>
            </tr>
            <tr>
                <th>Recorded On</th>
                <td>{{ $newStockEntry->created_at ? $newStockEntry->created_at->format('d F Y, h:i A') : '—' }}</td>
            </tr>
            <tr>
                <th>Current Availability</th>
                <td>
                    {{ number_format($newStockEntry->available_to_transfer) }} units available for transfer
                </td>
            </tr>
            <tr>
                <th>Transfer History</th>
                <td>
                    {{ number_format($newStockEntry->quantity_transferred) }} units have been transferred out
                </td>
            </tr>
        </table>

        <div style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 10px;">
            <table width="100%">
                <tr>
                    <td width="50%">
                        <strong>Received By (Sign):</strong> ______________________
                    </td>
                    <td width="50%" align="right">
                        <strong>Verified By (Sign):</strong> ______________________
                    </td>
                </tr>
            </table>
        </div>

    </main>
</body>
</html>
