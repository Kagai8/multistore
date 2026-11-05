import { AlertCircle } from 'lucide-react';

export const AdjustmentTableConfig = {
    moduleName: 'Stock Adjustments',

    columns: [
        {
            label: 'Date',
            key: 'created_at',
            type: 'date-time',
            className: 'p-4 border text-center',
        },
        {
            label: 'Product',
            key: 'product_name', // Matches joined product name
            className: 'p-4 border font-bold',
        },
        {
            label: 'Store',
            key: 'store_name', // Matches joined store name
            className: 'p-4 border',
        },
        {
            label: 'Reason',
            key: 'reason_name', // Maps to the adjustment reason name
            type: 'tag-status',
            className: 'p-4 border text-center font-bold',
        },
        {
            label: 'Before',
            key: 'old_stock', // From your StockAdjustment Model
            className: 'p-4 border text-center text-gray-600',
        },
        {
            label: 'Qty Adj',
            key: 'adjusted_qty', // Matches the Controller alias
            className: 'p-4 border text-center text-red-600 font-bold',
            isTotalable: true,
        },
        {
            label: 'After',
            key: 'new_stock', // From your StockAdjustment Model
            className: 'p-4 border text-center text-green-600',
        },
        {
            label: 'Loss/Gain Value',
            key: 'value_impact',
            type: 'currency',
            className: 'p-4 border text-right font-semibold',
            isTotalable: true,
        },
        {
            label: 'Notes',
            key: 'notes',
            className: 'p-4 border text-sm text-gray-500 italic',
            defaultHidden: true,
        },
    ],

    actions: [
        {
            label: 'View Audit',
            icon: AlertCircle,
            className:
                'bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg',
            permission: 'view-adjustment-audit',
        },
    ],
};
