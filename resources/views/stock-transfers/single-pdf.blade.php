<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transfer Note {{ $stockTransfer->reference }}</title>
    <style>
        @page { margin: 100px 25px 60px 25px; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10px; color: #333; line-height: 1.5; }

        /* Header/Footer */
        header { position: fixed; top: -80px; left: 0px; right: 0px; height: 80px; border-bottom: 2px solid #ea580c; }
        footer { position: fixed; bottom: -40px; left: 0px; right: 0px; height: 30px; border-top: 1px solid #ea580c; text-align: center; font-size: 8px; color: #777; padding-top: 5px; }

        /* Layout */
        .header-table, .meta-table, .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .meta-table td { vertical-align: top; }
        .info-table th { background: #f8fafc; color: #4a5568; padding: 6px; text-align: left; border: 1px solid #e2e8f0; font-size: 9px; }
        .info-table td { padding: 6px; border: 1px solid #e2e8f0; font-size: 10px; }

        h1 { font-size: 18px; color: #ea580c; margin: 0; text-transform: uppercase; font-weight: bold; text-align: right; }
        .company-name { font-size: 14px; font-weight: bold; }
        .section-title { font-size: 11px; font-weight: bold; color: #ea580c; border-bottom: 1px solid #e2e8f0; margin: 20px 0 10px 0; text-transform: uppercase; }

        /* Transfer Arrow Visual */
        .arrow-cell { text-align: center; font-size: 20px; color: #ea580c; font-weight: bold; vertical-align: middle; }

        /* Status Badges */
        .badge { padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 9px; text-transform: uppercase; }
        .badge-draft { background: #f3f4f6; color: #374151; }
        .badge-sent { background: #dbeafe; color: #1e40af; }
        .badge-received { background: #dcfce7; color: #15803d; }
        .badge-initiated { background: #fef9c3; color: #854d0e; }

        /* Audit Grid */
        .audit-grid td { width: 33%; vertical-align: top; border: 1px solid #eee; padding: 8px; }
        .audit-label { font-size: 8px; text-transform: uppercase; color: #777; margin-bottom: 2px; }
        .audit-val { font-weight: bold; font-size: 10px; }
        .audit-date { font-size: 8px; color: #555; margin-top: 2px; }

        .page-number:before { content: "Page " counter(page); }
    </style>
</head>
<body>
    <header>
        <table class="header-table">
            <tr>
                <td width="60%">
                    <div class="company-name">ALPHA LOGISTICS SYSTEMS</div>
                    <div style="font-size: 9px; color: #555;">
                        123 Industrial Area, Enterprise Road<br>
                        Nairobi, Kenya 00100
                    </div>
                </td>
                <td width="40%" align="right">
                    <h1>Transfer Note</h1>
                    <div style="font-size: 9px; color: #555; margin-top: 5px;">
                        Ref: {{ $stockTransfer->reference }}
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
        <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 10px; margin-bottom: 20px; font-size: 9px;">
            <table class="meta-table">
                <tr>
                    <td width="33%"><strong>Initiated By:</strong><br> {{ $stockTransfer->user->name ?? 'System' }}</td>
                    <td width="33%"><strong>Current Status:</strong><br>
                        <span class="badge badge-{{ $stockTransfer->status }}">{{ $stockTransfer->status }}</span>
                    </td>
                    <td width="33%" align="right"><strong>Printed On:</strong><br> {{ now()->format('d M Y, h:i A') }}</td>
                </tr>
            </table>
        </div>

        <div class="section-title">Logistics Route</div>
        <table class="info-table">
            <tr>
                <th width="40%">Source (Origin)</th>
                <th width="20%"></th>
                <th width="40%">Destination (Target)</th>
            </tr>
            <tr>
                <td>
                    <strong>{{ $stockTransfer->sourceStore->name ?? 'Unknown' }}</strong><br>
                    <span style="color:#666;">Code: {{ $stockTransfer->sourceStore->code ?? 'N/A' }}</span>
                </td>
                <td class="arrow-cell">&rarr;</td>
                <td>
                    <strong>{{ $stockTransfer->destinationStore->name ?? 'Unknown' }}</strong><br>
                    <span style="color:#666;">Code: {{ $stockTransfer->destinationStore->code ?? 'N/A' }}</span>
                </td>
            </tr>
        </table>

        {{-- 🟢 Display Delivery Info if available --}}
        @if($stockTransfer->delivery_type)
        <div class="section-title">Delivery Details</div>
        <table class="info-table">
            <tr>
                <th width="25%">Delivery Method</th>
                <td>{{ ucfirst($stockTransfer->delivery_type) }}</td>
                <th width="25%">Assigned Driver / Carrier</th>
                <td>
                    {{ $stockTransfer->carrier_name ?? $stockTransfer->assignedToUser->name ?? 'N/A' }}
                </td>
            </tr>
            <tr>
                <th>Vehicle / Tracking Ref</th>
                <td>{{ $stockTransfer->tracking_reference ?? 'N/A' }}</td>
                <th>Contact</th>
                <td>{{ $stockTransfer->contact_number ?? 'N/A' }}</td>
            </tr>
        </table>
        @endif

        <div class="section-title">Items Manifest</div>
        <table class="info-table">
            <thead>
                <tr>
                    <th width="5%">#</th>
                    <th width="50%">Product Name</th>
                    <th width="25%">SKU</th>
                    <th width="20%" style="text-align: right;">Quantity</th>
                </tr>
            </thead>
            <tbody>
                @foreach($stockTransfer->items as $item)
                <tr>
                    <td align="center">{{ $loop->iteration }}</td>
                    <td>{{ $item->product->name ?? 'Item Removed' }}</td>
                    <td style="font-family: monospace;">{{ $item->product->sku ?? '—' }}</td>
                    <td style="text-align: right; font-weight: bold;">{{ number_format($item->quantity) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        @if($stockTransfer->notes)
        <div class="section-title">Notes</div>
        <div style="border:1px solid #e2e8f0; padding:10px; font-style:italic;">
            {{ $stockTransfer->notes }}
        </div>
        @endif

        <div class="section-title">Workflow Audit Trail</div>
        <table class="audit-grid" width="100%" cellspacing="0">
            <tr>
                <td>
                    <div class="audit-label">Step 1: Initiated By</div>
                    <div class="audit-val">{{ $stockTransfer->user->name ?? 'System' }}</div>
                    <div class="audit-date">{{ $stockTransfer->created_at->format('d M Y, h:i A') }}</div>
                </td>

                <td>
                    <div class="audit-label">Step 2: Approved By</div>
                    <div class="audit-val">{{ $stockTransfer->approvedBy->name ?? '—' }}</div>
                    <div class="audit-date">
                        @if($stockTransfer->approved_at)
                            {{ $stockTransfer->approved_at->format('d M Y, h:i A') }}
                        @else
                            <span style="color:#999; font-style:italic;">Pending</span>
                        @endif
                    </div>
                </td>

                <td>
                    <div class="audit-label">Step 3: Received By</div>
                    <div class="audit-val">{{ $stockTransfer->receivedBy->name ?? '—' }}</div>
                    <div class="audit-date">
                        @if($stockTransfer->received_at)
                            {{ $stockTransfer->received_at->format('d M Y, h:i A') }}
                        @else
                            <span style="color:#999; font-style:italic;">Pending Receipt</span>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        <div style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 10px;">
             <table width="100%">
                <tr>
                    <td width="33%"><strong>Dispatched By (Sign):</strong> _________________</td>
                    <td width="33%" align="center"><strong>Carrier (Sign):</strong> _________________</td>
                    <td width="33%" align="right"><strong>Received By (Sign):</strong> _________________</td>
                </tr>
            </table>
        </div>
    </main>
</body>
</html>
