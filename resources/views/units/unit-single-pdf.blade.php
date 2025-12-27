<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Unit Details</title>
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
    </style>
</head>
<body>
    <h2>Brand Details</h2>

    <table>
        <tr>
            <th>ID</th>
            <td>{{ $unit->id }}</td>
        </tr>
        <tr>
            <th>Name</th>
            <td>{{ $unit->name }}</td>
        </tr>
        <tr>
            <th>Slug</th>
            <td>{{ $unit->slug ?? '—' }}</td>
        </tr>
        <tr>
            <th>Name</th>
            <td>{{ $unit->code }}</td>
        </tr>
        <tr>
            <th>Created Date</th>
            <td>{{ $unit->created_at?->format('d M Y') }}</td>
        </tr>
    </table>
</body>
</html>
