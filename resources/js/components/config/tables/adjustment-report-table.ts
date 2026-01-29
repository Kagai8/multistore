import { AlertCircle, FileText } from "lucide-react";

export const AdjustmentTableConfig = {
    moduleName: "Stock Adjustments",

    columns: [
        {
            label: 'Date',
            key: 'created_at',
            type: 'date-time',
            className: 'p-4 border text-center',
        },
        {
            label: 'Product',
            key: 'product.name',
            className: 'p-4 border font-bold',
        },
        {
            label: 'Reason',
            key: 'reason', // Damaged, Found, Expired, Return
            type: 'tag-status',
            className: 'p-4 border text-center font-bold'
        },
        {
            label: 'Qty Adj',
            key: 'adjusted_quantity',
            className: 'p-4 border text-center text-red-600 font-bold',
            isTotalable: true
        },
        {
            label: 'Loss/Gain Value',
            key: 'value_impact',
            type: 'currency',
            className: 'p-4 border text-right font-semibold',
            isTotalable: true
        },
        {
            label: 'Notes',
            key: 'notes',
            className: 'p-4 border text-sm text-gray-500 italic',
            defaultHidden: true
        }
    ],

    actions: [
        {
            label: 'View Audit',
            icon: AlertCircle,
            className: 'bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg',
            permission: 'view-adjustment-audit',
        }
    ]
};
