<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Product Profile: {{ $product->name }}</title>
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
            text-align: left; width: 25%; padding: 6px;
            background-color: #f8fafc; color: #4a5568;
            border: 1px solid #e2e8f0; font-weight: bold; font-size: 9px;
        }
        .info-table td {
            padding: 6px; border: 1px solid #e2e8f0;
            color: #2d3748; font-size: 10px;
        }

        /* --- PRODUCT SPECIFIC STYLES --- */

        .identity-layout { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .identity-layout td { vertical-align: top; }

        .main-image-container {
            border: 1px solid #ddd;
            padding: 5px;
            background: #fff;
            text-align: center;
            border-radius: 4px;
        }

        .main-image {
            width: 120px;
            height: 120px;
            object-fit: contain;
        }

        .sku-badge {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            color: #ea580c;
            font-size: 11px;
            background: #fff7ed;
            padding: 2px 6px;
            border-radius: 4px;
        }

        /* Pricing Table */
        .pricing-table th { background-color: #ea580c; color: #fff; }
        .price-val { font-family: 'Courier New', monospace; font-weight: bold; text-align: right; }
        .price-retail { color: #15803d; font-size: 11px; }

        /* Gallery Strip */
        .gallery-container {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px;
            border-radius: 4px;
        }

        .gallery-thumb {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border: 1px solid #ccc;
            margin-right: 8px;
            margin-bottom: 5px;
            border-radius: 3px;
            background: #fff;
            display: inline-block; /* Essential for DomPDF */
        }

        .page-number:before { content: "Page " counter(page); }
    </style>
</head>
<body>

    <header>
        <table class="header-table">
            <tr>
                <td width="60%">
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
                    <h1>Product Profile</h1>
                    <div class="company-details" style="margin-top: 5px;">
                        SKU: {{ $product->sku }}
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
                        <strong>Generated By:</strong><br> {{ auth()->user()->name ?? 'System User' }}
                    </td>
                    <td width="33%">
                        <strong>Role:</strong><br> {{ ucfirst(auth()->user()->roles->first()?->name ?? auth()->user()->role?->name ?? 'Standard User') }}
                    </td>
                    <td width="33%" align="right">
                        <strong>Date:</strong><br> {{ now()->format('d M Y, h:i A') }}
                    </td>
                </tr>
            </table>
        </div>

        <table class="identity-layout">
            <tr>
                <td width="65%" style="padding-right: 15px;">
                    <div class="section-title" style="margin-top: 0;">Product Identity</div>
                    <table class="info-table">
                        <tr>
                            <th>Product Name</th>
                            <td style="font-size: 12px; font-weight: bold;">{{ $product->name }}</td>
                        </tr>
                        <tr>
                            <th>SKU</th>
                            <td><span class="sku-badge">{{ $product->sku ?? '—' }}</span></td>
                        </tr>
                        <tr>
                            <th>Barcode</th>
                            <td style="font-family: monospace;">{{ $product->barcode ?? '—' }}</td>
                        </tr>
                        <tr>
                            <th>Active Status</th>
                            <td>
                                <strong>{{ $product->is_active ? 'Active' : 'Inactive' }}</strong>
                                / Purchasable: {{ $product->is_purchasable ? 'Yes' : 'No' }}
                            </td>
                        </tr>
                    </table>
                </td>

                <td width="35%">
                    <div class="section-title" style="margin-top: 0; text-align:center;">Primary Image</div>
                    <div class="main-image-container">
                        @if($product->main_image && file_exists(public_path('storage/' . $product->main_image)))
                            <img src="{{ public_path('storage/' . $product->main_image) }}" class="main-image">
                        @else
                            <div style="height: 120px; line-height: 120px; color: #999;">No Image</div>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        <div class="section-title">Classification & Logistics</div>
        <table class="info-table">
            <tr>
                <th width="15%">Category</th>
                <td width="35%">{{ $product->category->name ?? 'N/A' }}</td>
                <th width="15%">Brand</th>
                <td width="35%">{{ $product->brand->name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <th>Unit</th>
                <td>{{ $product->unit->name ?? 'N/A' }}</td>
                <th>Supplier</th>
                <td>{{ $product->supplier->name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <th>Weight</th>
                <td>{{ number_format($product->weight ?? 0, 2) }} kg</td>
                <th>Colors</th>
                <td>
                    @if(!empty($product->colors))
                        {{ implode(', ', $product->colors) }}
                    @else
                        —
                    @endif
                </td>
            </tr>
        </table>

        <div class="section-title">Pricing Matrix</div>
        <table class="info-table pricing-table">
            <thead>
                <tr>
                    <th>Price Tier</th>
                    <th style="text-align: right;">Amount (KSH)</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Buying Price</td>
                    <td class="price-val">{{ number_format($product->buying_price ?? 0, 2) }}</td>
                    <td><i>Cost to Business</i></td>
                </tr>
                <tr>
                    <td><strong>Retail Price</strong></td>
                    <td class="price-val price-retail">{{ number_format($product->retail_price ?? 0, 2) }}</td>
                    <td>Standard Selling Price</td>
                </tr>
                <tr>
                    <td>Wholesale Price</td>
                    <td class="price-val">{{ number_format($product->wholesale_price ?? 0, 2) }}</td>
                    <td>Bulk Purchase Price</td>
                </tr>
                <tr>
                    <td>Special Price</td>
                    <td class="price-val" style="color: #ea580c;">{{ number_format($product->special_price ?? 0, 2) }}</td>
                    <td>Promotional Price</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Additional Media</div>
        <div class="gallery-container">
            @php
                // Safely handle multi_images whether array or JSON string
                $galleryImages = $product->multi_images;
                if (is_string($galleryImages)) {
                    $galleryImages = json_decode($galleryImages, true);
                }
                $hasImages = false;
            @endphp

            @if(is_array($galleryImages) && count($galleryImages) > 0)
                @foreach($galleryImages as $path)
                    @if(file_exists(public_path('storage/' . $path)))
                        @php $hasImages = true; @endphp
                        <img src="{{ public_path('storage/' . $path) }}" class="gallery-thumb">
                    @endif
                @endforeach
            @endif

            @if(!$hasImages)
                <div style="text-align: center; color: #777; font-style: italic; padding: 10px;">
                    No additional images found in gallery.
                </div>
            @endif
        </div>

        <div class="section-title">System Data</div>
        <table class="info-table">
            <tr>
                <th width="20%">Registered On</th>
                <td>{{ $product->created_at ? $product->created_at->format('d F Y, H:i A') : '—' }}</td>
            </tr>
            <tr>
                <th>Last Updated</th>
                <td>{{ $product->updated_at ? $product->updated_at->format('d F Y, H:i A') : '—' }}</td>
            </tr>
            <tr>
                <th>Description</th>
                <td>{{ $product->description ?? 'No detailed description available.' }}</td>
            </tr>
        </table>

    </main>
</body>
</html>
