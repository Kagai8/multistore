/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowLeftRight } from 'lucide-react';

export const MovementTableConfig = {
    moduleName: 'Stock Movement',

    columns: [
        {
            label: 'Date/Time',
            key: 'created_at',
            type: 'date-time',
            className: 'p-4 border text-center whitespace-nowrap',
            sortable: true,
        },
        {
            label: 'Product',
            key: 'product_name',
            className: 'p-4 border font-medium',
        },
        {
            label: 'Status',
            key: 'status',
            type: 'tag-status',
            className: 'p-4 border text-center font-bold',
        },
        {
            label: 'Qty',
            key: 'quantity',
            className: 'p-4 border text-center font-bold',
            isTotalable: true,
        },
        {
            label: 'Source',
            key: 'source_name',
            className: 'p-4 border text-sm text-slate-600',
        },
        {
            label: 'Destination',
            key: 'destination_name',
            className: 'p-4 border text-sm text-slate-600',
        },
        {
            label: 'Delivery',
            key: 'delivery_type',
            className: 'p-4 border text-xs',
            // Simplified string return to avoid TypeScript JSX errors in .ts files
            render: (row: any) => {
                const type = row.delivery_type
                    ? row.delivery_type.toUpperCase()
                    : 'INTERNAL';
                return row.carrier_name
                    ? `${type} (${row.carrier_name})`
                    : type;
            },
        },
        {
            label: 'Initiated By',
            key: 'user_name',
            className: 'p-4 border text-sm text-gray-600',
        },
        {
            label: 'Reference',
            key: 'reference_number',
            className: 'p-4 border text-xs font-mono text-gray-500',
        },
    ],

    actions: [
        {
            label: 'View Source',
            icon: ArrowLeftRight,
            className:
                'bg-slate-700 hover:bg-slate-800 text-white p-2 rounded-lg',
        },
    ],
};
