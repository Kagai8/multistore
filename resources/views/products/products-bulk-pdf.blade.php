<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Product Master List</title>
    <style>
        /** DOMPDF COMPATIBILITY SETTINGS */
        @page {
            margin: 100px 20px 60px 20px;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 9px;
            color: #333;
            line-height: 1.3;
        }

        /* --- HEADER & FOOTER --- */
        header {
            position: fixed;
            top: -80px;
            left: 0px;
            right: 0px;
            height: 85px; /* Slightly taller for logo */
            border-bottom: 2px solid #ea580c;
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

        .header-table, .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .header-table td { vertical-align: top; }

        h1 {
            font-size: 18px;
            color: #ea580c;
            margin: 0;
            text-transform: uppercase;
            font-weight: bold;
            text-align: right;
        }

        .company-name { font-size: 15px; font-weight: bold; color: #111; text-transform: uppercase; }
        .company-details { font-size: 9px; color: #555; }
        .logo-img { max-height: 50px; width: auto; margin-right: 10px; }

        /* --- AUDIT META BOX --- */
        .meta-box {
            background-color: #fff7ed;
            border: 1px solid #fed7aa;
            padding: 8px;
            margin-bottom: 15px;
        }
        .meta-box strong { color: #ea580c; }
        .meta-table td { vertical-align: top; }

        /* --- DATA TABLE --- */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .data-table th {
            background-color: #ea580c;
            color: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
            padding: 6px 4px;
            font-size: 8px;
            border: 1px solid #c2410c;
            text-align: left;
        }

        .data-table td {
            border: 1px solid #e2e8f0;
            padding: 4px;
            font-size: 9px;
            color: #2d3748;
            vertical-align: middle;
        }

        .data-table tr:nth-child(even) { background-color: #ffedd5; }

        /* --- SPECIAL COLUMN STYLES --- */
        .img-cell { text-align: center; width: 40px; }
        .product-thumb { width: 35px; height: 35px; object-fit: contain; border-radius: 3px; border: 1px solid #ddd; background: #fff; }
        .sku-text { font-family: 'Courier New', monospace; font-weight: bold; color: #ea580c; font-size: 8px; }
        .price-cell { text-align: right; font-family: 'Courier New', monospace; font-size: 9px; white-space: nowrap; }
        .retail-price { font-weight: bold; color: #15803d; }
        .meta-text { font-size: 8px; color: #666; display: block; }
        .page-number:before { content: "Page " counter(page); }
    </style>
</head>
<body>

    <header>
        <table class="header-table">
            <tr>
                <td width="15%" valign="top">
                    @if(isset($company) && $company->logo_path)
                        <img src="{{ public_path('storage/' . $company->logo_path) }}" class="logo-img">
                    @endif
                </td>

                <td width="45%">
                    <div class="company-name">
                        {{ $company->name ?? $store->name ?? 'Alpha Logistics Systems' }}
                    </div>
                    <div class="company-details">
                        {{ $company->address ?? $store->address ?? 'Address Not Set' }}<br>
                        {{ $company->city ?? $store->city ?? 'City Not Set' }}
                        @if(!empty($company->phone) || !empty($store->phone))
                            | Tel: {{ $company->phone ?? $store->phone }}
                        @endif
                        @if(!empty($company->email) || !empty($store->email))
                            | Email: {{ $company->email ?? $store->email }}
                        @endif
                        @if(!empty($company->website))
                            <br>{{ $company->website }}
                        @endif
                    </div>
                </td>

                <td width="40%" align="right">
                    <h1>Product Master List</h1>
                    <div class="company-details" style="margin-top: 5px;">
                        Ref: PROD-EXP-{{ now()->timestamp }}
                    </div>
                </td>
            </tr>
        </table>
    </header>

    <footer>
        <table width="100%">
            <tr>
                <td align="left" width="33%">{{ $company->name ?? 'Alpha System' }}</td>
                <td align="center" width="33%">CONFIDENTIAL DOCUMENT</td>
                <td align="right" width="33%"><span class="page-number"></span></td>
            </tr>
        </table>
    </footer>

    <main>
        <div class="meta-box">
            <table class="meta-table">
                <tr>
                    <td width="25%">
                        <strong>Generated By:</strong><br>
                        {{ auth()->user()->name ?? 'System User' }}
                    </td>
                    <td width="25%">
                        <strong>Role / Position:</strong><br>
                       {{ ucfirst(auth()->user()->roles->first()?->name ?? auth()->user()->role?->name ?? 'Standard User') }}
                    </td>
                    <td width="25%">
                        <strong>Store / Branch:</strong><br>
                        {{ auth()->user()->store->name ?? 'Head Office' }}
                    </td>
                    <td width="25%" align="right">
                        <strong>Generated On:</strong><br>
                        {{ now()->format('d M Y, h:i A') }}
                    </td>
                </tr>
            </table>
        </div>

        <table class="data-table">
            <thead>
                <tr>
                    <th width="4%">#</th>
                    <th width="8%">Image</th>
                    <th width="24%">Product Identity</th>
                    <th width="18%">Classification</th>
                    <th width="8%">Unit</th>
                    <th width="10%" style="text-align: right">Buying</th>
                    <th width="10%" style="text-align: right">Retail</th>
                    <th width="9%" style="text-align: right">Whole.</th>
                    <th width="9%" style="text-align: right">Special</th>
                </tr>
            </thead>
            <tbody>
                @foreach($products as $product)
                    <tr>
                        <td align="center">{{ $loop->iteration }}</td>

                        <td class="img-cell">
                            @if($product->main_image && file_exists(public_path('storage/' . $product->main_image)))
                                <img src="{{ public_path('storage/' . $product->main_image) }}" class="product-thumb" alt="Img">
                            @else
                                <div style="width:35px; height:35px; background:#eee; color:#999; line-height:35px; font-size:8px; border-radius:3px;">N/A</div>
                            @endif
                        </td>

                        <td>
                            <strong style="color: #1a202c;">{{ $product->name ?? '—' }}</strong><br>
                            <span class="sku-text">SKU: {{ $product->sku ?? '—' }}</span>
                        </td>

                        <td>
                            <span class="meta-text">Cat:</span> {{ $product->category->name ?? 'N/A' }}<br>
                            <span class="meta-text">Brand:</span> {{ $product->brand->name ?? 'N/A' }}
                        </td>

                        <td align="center">
                            {{ $product->unit->name ?? 'Item' }}
                        </td>

                        <td class="price-cell">
                            {{ number_format($product->buying_price ?? 0, 2) }}
                        </td>
                        <td class="price-cell retail-price">
                            {{ number_format($product->retail_price ?? 0, 2) }}
                        </td>
                        <td class="price-cell">
                            {{ number_format($product->wholesale_price ?? 0, 2) }}
                        </td>
                        <td class="price-cell">
                            {{ number_format($product->special_price ?? 0, 2) }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right; font-size: 9px; color: #777; border-top: 1px dashed #ea580c; padding-top: 5px;">
            <strong>Total Products Cataloged:</strong> {{ count($products) }}
        </div>
    </main>
</body>
</html>
