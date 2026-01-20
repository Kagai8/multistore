import {
    FileSpreadsheet,
    FileText,
} from "lucide-react";

export const SaleItemTableConfig = {
    moduleName: "Item Sales",

    columns: [
        {
            label: 'Date',
            key: 'created_at',
            type: 'date-time',
            className: 'p-4 border text-center whitespace-nowrap text-xs text-gray-500'
        },
        {
            label: 'Product',
            key: 'product_name',
            className: 'p-4 border font-bold text-gray-800'
        },
        {
            label: 'Price Type',
            key: 'price_category',
            className: 'p-4 border text-center text-xs font-semibold uppercase text-blue-600'
        },
        {
            label: 'Qty',
            key: 'quantity',
            className: 'p-4 border text-center font-bold'
        },
        {
            label: 'Total',
            key: 'total_price',
            type: 'currency',
            className: 'p-4 border text-right font-mono font-bold text-emerald-700'
        },
        {
            label: 'Ref',
            key: 'reference_no',
            className: 'p-4 border text-center font-mono text-xs'
        },
        {
            label: 'Store',
            key: 'store_name',
            className: 'p-4 border text-sm text-gray-600'
        },
        {
            label: 'Source',
            key: 'source_type',
            className: 'p-4 border text-center text-xs'
        },

        // Actions
        {
            label: 'Actions',
            key: 'actions',
            isAction: true,
            isMandatory: true,
            className: 'p-4 border text-center w-24'
        },
    ],

    actions: [
        {
            label: 'Export PDF',
            icon: FileText,
            permission: 'export-sales',
        },
        {
            label: 'Export Excel',
            icon: FileSpreadsheet,
            permission: 'export-sales',
        },
    ],
};
