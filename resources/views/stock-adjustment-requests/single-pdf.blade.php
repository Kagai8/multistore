<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Adjustment Request #{{ $adjustmentRequest->id }}</title>
    <style>
        @page { margin: 100px 25px 60px 25px; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10px; color: #333; line-height: 1.5; }

        /* Fixed Header/Footer */
        header { position: fixed; top: -80px; left: 0px; right: 0px; height: 80px; border-bottom: 2px solid #ea580c; }
        footer { position: fixed; bottom: -40px; left: 0px; right: 0px; height: 30px; border-top: 1px solid #ea580c; text-align: center; font-size: 8px; color: #777; padding-top: 5px; }

        /* Tables & Layout */
        .header-table, .meta-table, .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .meta-table td { vertical-align: top; }

        .info-table th { background: #f8fafc; color: #4a5568; padding: 6px; text-align: left; border: 1px solid #e2e8f0; font-size: 9px; }
        .info-table td { padding: 6px; border: 1px solid #e2e8f0; font-size: 10px; }

        /* Typography */
        h1 { font-size: 18px; color: #ea580c; margin: 0; text-transform: uppercase; font-weight: bold; text-align: right; }
        .company-name { font-size: 14px; font-weight: bold; }
        .section-title { font-size: 11px; font-weight: bold; color: #ea580c; border-bottom: 1px solid #e2e8f0; margin: 20px 0 10px 0; text-transform: uppercase; }

        /* Status Badges */
        .status-badge { font-weight: bold; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; font-size: 9px; display: inline-block; }
        .status-approved { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .status-rejected { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        .status-pending { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
        .status-draft { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }

        /* Type Colors */
        .type-in { color: #15803d; font-weight: bold; }
        .type-out { color: #b91c1c; font-weight: bold; }

        /* Audit Grid (The Missing Piece) */
        .audit-grid { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .audit-grid td { width: 50%; vertical-align: top; border: 1px solid #eee; padding: 10px; }
        .audit-label { font-size: 8px; text-transform: uppercase; color: #777; margin-bottom: 4px; }
        .audit-val { font-weight: bold; font-size: 11px; color: #333; }
        .audit-date { font-size: 9px; color: #555; margin-top: 2px; }

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
                    <h1>Adjustment Request</h1>
                    <div style="font-size: 9px; color: #555; margin-top: 5px;">
                        Req ID: #{{ str_pad($adjustmentRequest->id, 6, '0', STR_PAD_LEFT) }}
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
                    <td width="33%"><strong>Printed By:</strong><br> {{ auth()->user()->name ?? 'System User' }}</td>
                    <td width="33%"><strong>Current Status:</strong><br>
                        @php
                            $s = $adjustmentRequest->status;
                            $class = $s === 'approved' ? 'status-approved' : ($s === 'rejected' ? 'status-rejected' : ($s === 'draft' ? 'status-draft' : 'status-pending'));
                        @endphp
                        <span class="status-badge {{ $class }}">{{ str_replace('_', ' ', $s) }}</span>
                    </td>
                    <td width="33%" align="right"><strong>Date:</strong><br> {{ now()->format('d M Y, h:i A') }}</td>
                </tr>
            </table>
        </div>

        <div class="section-title">Request Overview</div>
        <table class="info-table">
            <tr>
                <th width="20%">Reason Code</th>
                <td width="30%">{{ $adjustmentRequest->reason->name ?? 'N/A' }}</td>
                <th width="20%">Adjustment Type</th>
                <td width="30%">
                    @if($adjustmentRequest->type === 'in')
                        <span class="type-in">STOCK IN (+)</span>
                    @else
                        <span class="type-out">STOCK OUT (-)</span>
                    @endif
                </td>
            </tr>
            <tr>
                <th>Target Store</th>
                <td colspan="3">{{ $adjustmentRequest->store->name ?? 'N/A' }}</td>
            </tr>
        </table>

        <div class="section-title">Item Details</div>
        <table class="info-table">
            <thead>
                <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th style="text-align: right;">Quantity Adjusted</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>{{ $adjustmentRequest->product->name ?? 'Unknown Product' }}</strong></td>
                    <td style="font-family: monospace;">{{ $adjustmentRequest->product->sku ?? '—' }}</td>
                    <td style="text-align: right; font-weight: bold; font-size: 11px;">
                        {{ $adjustmentRequest->type === 'out' ? '-' : '+' }}{{ number_format($adjustmentRequest->quantity) }}
                    </td>
                </tr>
            </tbody>
        </table>

        @if($adjustmentRequest->notes)
            <div class="section-title">Notes / Remarks</div>
            <div style="border: 1px solid #e2e8f0; padding: 10px; background: #f8fafc; border-radius: 4px; font-style: italic;">
                "{{ $adjustmentRequest->notes }}"
            </div>
        @endif

        <div class="section-title">Workflow Audit Trail</div>
        <table class="audit-grid">
            <tr>
                <td>
                    <div class="audit-label">Step 1: Requested By</div>
                    <div class="audit-val">{{ $adjustmentRequest->requester->name ?? 'Unknown User' }}</div>
                    <div class="audit-date">
                        {{ $adjustmentRequest->created_at?->format('d M Y, h:i A') }}
                    </div>
                </td>

                <td>
                    <div class="audit-label">Step 2: Review & Approval</div>
                    <div class="audit-val">
                        @if($adjustmentRequest->status === 'approved')
                            <span style="color:#15803d;">Approved by {{ $adjustmentRequest->approver->name ?? 'Admin' }}</span>
                        @elseif($adjustmentRequest->status === 'rejected')
                            <span style="color:#b91c1c;">Rejected by {{ $adjustmentRequest->approver->name ?? 'Admin' }}</span>
                        @elseif($adjustmentRequest->status === 'draft')
                            <span style="color:#666;">Draft - Not Submitted</span>
                        @else
                            <span style="color:#eab308; font-style:italic;">Pending Management Review</span>
                        @endif
                    </div>
                    <div class="audit-date">
                        @if($adjustmentRequest->approved_at)
                            {{ $adjustmentRequest->approved_at->format('d M Y, h:i A') }}
                        @else
                            —
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        <div style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 10px;">
             <table width="100%">
                <tr>
                    <td width="50%"><strong>Requester Sign:</strong> __________________</td>
                    <td width="50%" align="right"><strong>Approver Sign:</strong> __________________</td>
                </tr>
            </table>
        </div>
    </main>
</body>
</html>
