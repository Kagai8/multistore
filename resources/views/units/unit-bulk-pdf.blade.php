<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Units Export</title>
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
    <h2>Units Export</h2>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Code</th>
                <th>Created Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($units as $unit)
                <tr>
                    <td>{{ $loop->iteration }}</td>
                    <td>{{ $unit->name ?? '—' }}</td>
                    <td>{{ $unit->slug ?? '—' }}</td>
                    <td>{{ $unit->code ?? '—' }}</td>
                    <td>{{ $unit->created_at ? $unit->created_at->format('d M Y') : '—' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
