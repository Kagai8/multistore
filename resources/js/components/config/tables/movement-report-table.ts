/* eslint-disable @typescript-eslint/no-explicit-any */
import { ArrowLeftRight } from "lucide-react";

export const MovementTableConfig = {
    moduleName: "Stock Movement",

    columns: [
        {
            label: 'Date/Time',
            key: 'created_at',
            type: 'date-time',
            className: 'p-4 border text-center whitespace-nowrap',
            sortable: true
        },
        {
            label: 'Product',
            key: 'product.name',
            className: 'p-4 border font-medium',
        },
        {
            label: 'Type',
            key: 'type', // purchase, sale, transfer, adjustment
            type: 'tag-status',
            className: 'p-4 border text-center font-bold'
        },
        {
            label: 'Qty Change',
            key: 'quantity',
            className: 'p-4 border text-center font-bold',
            isTotalable: true
        },
        {
            label: 'Source',
            key: 'stock_transfer.source_store.name', // 🟢 Access nested data
            className: 'p-4 border text-sm text-slate-600',
            render: (row: any) => row.stock_transfer?.source_store?.name || 'N/A'
        },
        {
            label: 'Destination',
            key: 'stock_transfer.destination_store.name', // 🟢 Access nested data
            className: 'p-4 border text-sm text-slate-600',
            render: (row: any) => row.stock_transfer?.destination_store?.name || 'N/A'
        },
        {
            label: 'User',
            key: 'stock_transfer.user.name', // 🟢 Movement user is on the transfer model
            className: 'p-4 border text-sm text-gray-600',
        },
        {
            label: 'Reference',
            key: 'reference_number',
            className: 'p-4 border text-xs font-mono text-gray-500',
        }
    ],

    actions: [
        {
            label: 'View Source',
            icon: ArrowLeftRight,
            className: 'bg-slate-700 hover:bg-slate-800 text-white p-2 rounded-lg',
        }
    ]
};
