import { FileSpreadsheet, FileText } from 'lucide-react';

export const PerformanceTableConfig = {
    moduleName: 'Product Performance',
    columns: [
        {
            label: 'Product',
            key: 'product_name',
            className: 'p-4 border font-bold text-gray-800',
            sortable: true,
        },
        {
            label: 'SKU',
            key: 'sku',
            className: 'p-4 border font-mono text-xs',
            sortable: true,
        },
        {
            label: 'Qty Sold',
            key: 'total_qty_sold',
            className: 'p-4 border text-center font-semibold',
            sortable: true,
            isTotalable: true,
        },
        {
            label: 'Total Revenue',
            key: 'total_revenue',
            type: 'currency',
            className: 'p-4 border text-right',
            sortable: true,
            isTotalable: true,
        },
        {
            label: 'Total Profit',
            key: 'total_profit',
            type: 'currency',
            className: 'p-4 border text-right font-bold text-emerald-700',
            sortable: true,
            isTotalable: true,
        },
        {
            label: 'Avg Margin',
            key: 'avg_margin',
            type: 'percentage',
            className: 'p-4 border text-center text-blue-600 font-medium',
            sortable: true,
        },
    ],
    actions: [
        {
            label: 'Export PDF',
            icon: FileText,
            permission: 'export-financial-report',
        },
        {
            label: 'Export Excel',
            icon: FileSpreadsheet,
            permission: 'export-financial-report',
        },
    ],
};
