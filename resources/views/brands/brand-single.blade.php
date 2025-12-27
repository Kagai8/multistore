<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Brand Details</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #333;
            margin: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            border: 1px solid #999;
            padding: 8px;
            text-align: left;
        }
        th {
            background: #f38b3c;
            color: #fff;
        }
        h2 {
            color: #f38b3c;
            text-align: center;
        }
        .logo-wrapper {
            text-align: center;
            margin-bottom: 15px;
        }
        .logo-wrapper img {
            width: 100px;
            height: auto;
            border-radius: 6px;
            border: 1px solid #ccc;
        }
        .no-logo {
            color: #999;
            font-style: italic;
        }
    </style>
</head>
<body>
    <h2>Brand Details</h2>

    <div class="logo-wrapper">
        @if($brand->logo)
            <img src="{{ public_path('storage/' . $brand->logo) }}" alt="Brand Logo">
        @else
            <p class="no-logo">No logo provided</p>
        @endif
    </div>

    <table>
        <tr>
            <th>ID</th>
            <td>{{ $brand->id }}</td>
        </tr>
        <tr>
            <th>Name</th>
            <td>{{ $brand->name }}</td>
        </tr>
        <tr>
            <th>Slug</th>
            <td>{{ $brand->slug ?? '—' }}</td>
        </tr>
        <tr>
            <th>Description</th>
            <td>{{ $brand->description ?? 'No description provided' }}</td>
        </tr>
        <tr>
            <th>Created Date</th>
            <td>{{ $brand->created_at?->format('d M Y') }}</td>
        </tr>
    </table>
</body>
</html>
