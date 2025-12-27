<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Brands Export</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: middle; }
        th { background-color: #f5f5f5; }
        h2 { text-align: center; margin-bottom: 10px; }
        img { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; }
    </style>
</head>
<body>
    <h2>Brands Export</h2>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Logo</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Created Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($brands as $brand)
                <tr>
                    <td>{{ $loop->iteration }}</td>

                    {{-- ✅ Logo with fallback text --}}
                    <td>
                        @if($brand->logo && file_exists(public_path('storage/' . $brand->logo)))
                            <img src="{{ public_path('storage/' . $brand->logo) }}" alt="{{ $brand->name }}">
                        @else
                            No logo uploaded
                        @endif
                    </td>

                    <td>{{ $brand->name ?? '—' }}</td>
                    <td>{{ $brand->slug ?? '—' }}</td>

                    {{-- ✅ Description fallback --}}
                    <td>{{ $brand->description ?: 'No description provided' }}</td>

                    <td>{{ $brand->created_at ? $brand->created_at->format('d M Y') : '—' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
