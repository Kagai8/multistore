<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Order {{ $purchaseOrder->po_number }}</title>
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

        /* Visuals */
        .arrow-cell { text-align: center; font-size: 20px; color: #ea580c; font-weight: bold; vertical-align: middle; }

        /* Status Badges */
        .badge { padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 9px; text-transform: uppercase; }
        .badge-draft { background: #f3f4f6; color: #374151; }
        .badge-ordered { background: #dbeafe; color: #1e40af; } /* Blue for Ordered */
        .badge-received { background: #dcfce7; color: #15803d; } /* Green for Received */
        .badge-cancelled { background: #fee2e2; color: #991b1b; } /* Red for Cancelled */

        /* Audit Grid */
        .audit-grid td { width: 25%; vertical-align: top; border: 1px solid #eee; padding: 8px; }
        .audit-label { font-size: 8px; text-transform: uppercase; color: #777; margin-bottom: 2px; }
        .audit-val { font-weight: bold; font-size: 10px; }
        .audit-date { font-size: 8px; color: #555; margin-top: 2px; }

        .page-number:before { content: "Page " counter(page); }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
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
                    <h1>Purchase Order</h1>
                    <div style="font-size: 9px; color: #555; margin-top: 5px;">
                        PO #: {{ $purchaseOrder->po_number }}
                    </div>
                </td>
            </tr>
        </table>
    </header>

    <footer>
        <table width="100%">
            <tr>
                <td align="left" width="33%">Generated via Alpha System</td>
                <td align="center" width="33%">OFFICIAL ORDER</td>
                <td align="right" width="33%"><span class="page-number"></span></td>
            </tr>
        </table>
    </footer>

    <main>
        <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 10px; margin-bottom: 20px; font-size: 9px;">
            <table class="meta-table">
                <tr>
                    <td width="33%"><strong>Requested By:</strong><br> {{ $purchaseOrder->requestedBy->name ?? 'System' }}</td>
                    <td width="33%"><strong>Current Status:</strong><br>
                        <span class="badge badge-{{ $purchaseOrder->status }}">{{ $purchaseOrder->status }}</span>
                    </td>
                    <td width="33%" align="right"><strong>Order Date:</strong><br> {{ $purchaseOrder->order_date->format('d M Y') }}</td>
                </tr>
            </table>
        </div>

        <div class="section-title">Vendor & Shipping Information</div>
        <table class="info-table">
            <tr>
                <th width="45%">Vendor / Supplier</th>
                <th width="10%"></th>
                <th width="45%">Ship To (Delivery Address)</th>
            </tr>
            <tr>
                <td>
                    <strong>{{ $purchaseOrder->supplier->name ?? 'Unknown Supplier' }}</strong><br>
                    <span style="color:#666;">
                        {{ $purchaseOrder->supplier->address ?? '' }}<br>
                        Email: {{ $purchaseOrder->supplier->email ?? 'N/A' }}
                    </span>
                </td>
                <td class="arrow-cell">&rarr;</td>
                <td>
                    <strong>{{ $purchaseOrder->store->name ?? 'Unknown Store' }}</strong><br>
                    <span style="color:#666;">
                        {{ $purchaseOrder->store->location ?? 'Head Office' }}<br>
                        Expected Delivery: <strong>{{ $purchaseOrder->expected_delivery_date ? $purchaseOrder->expected_delivery_date->format('d M Y') : 'TBD' }}</strong>
                    </span>
                </td>
            </tr>
        </table>

        <div class="section-title">Order Items</div>
        <table class="info-table">
            <thead>
                <tr>
                    <th width="5%">#</th>
                    <th width="40%">Product Name</th>
                    <th width="15%">SKU</th>
                    <th width="10%" class="text-right">Qty</th>
                    <th width="15%" class="text-right">Unit Cost</th>
                    <th width="15%" class="text-right">Line Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($purchaseOrder->items as $item)
                <tr>
                    <td align="center">{{ $loop->iteration }}</td>
                    <td>{{ $item->product->name ?? 'Item Removed' }}</td>
                    <td style="font-family: monospace;">{{ $item->product->sku ?? '—' }}</td>
                    <td class="text-right font-bold">{{ number_format($item->quantity_ordered) }}</td>
                    <td class="text-right">{{ number_format($item->unit_cost, 2) }}</td>
                    <td class="text-right font-bold">{{ number_format($item->total_cost, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="5" class="text-right font-bold" style="background: #fff7ed; border-top: 2px solid #ea580c;">GRAND TOTAL (KES)</td>
                    <td class="text-right font-bold" style="background: #fff7ed; border-top: 2px solid #ea580c; font-size: 11px;">
                        {{ number_format($purchaseOrder->total_amount, 2) }}
                    </td>
                </tr>
            </tfoot>
        </table>

        @if($purchaseOrder->notes)
        <div class="section-title">Notes & Instructions</div>
        <div style="border:1px solid #e2e8f0; padding:10px; font-style:italic;">
            {{ $purchaseOrder->notes }}
        </div>
        @endif

        <div class="section-title">Authorization Audit Trail</div>
        <table class="audit-grid" width="100%" cellspacing="0">
            <tr>
                <td>
                    <div class="audit-label">1. Requested By</div>
                    <div class="audit-val">{{ $purchaseOrder->requestedBy->name ?? 'System' }}</div>
                    <div class="audit-date">{{ optional($purchaseOrder->requested_at)->format('d M Y') ?? $purchaseOrder->created_at->format('d M Y') }}</div>
                </td>

                <td>
                    <div class="audit-label">2. Approved By</div>
                    <div class="audit-val">{{ $purchaseOrder->approvedBy->name ?? '—' }}</div>
                    <div class="audit-date">
                        @if($purchaseOrder->approved_at)
                            {{ $purchaseOrder->approved_at->format('d M Y') }}
                        @else
                            <span style="color:#999; font-style:italic;">Pending</span>
                        @endif
                    </div>
                </td>

                <td>
                    <div class="audit-label">3. Received By</div>
                    <div class="audit-val">{{ $purchaseOrder->receivedBy->name ?? '—' }}</div>
                    <div class="audit-date">
                        @if($purchaseOrder->received_at)
                            {{ $purchaseOrder->received_at->format('d M Y') }}
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
                    <td width="50%"><strong>Authorized Signatory:</strong> _________________________</td>
                    <td width="50%" align="right"><strong>Vendor Acceptance:</strong> _________________________</td>
                </tr>
            </table>
        </div>
    </main>
</body>
</html>
