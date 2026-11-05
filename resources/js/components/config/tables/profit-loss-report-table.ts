import { FileSpreadsheet, FileText } from 'lucide-react';

/**
 * PROFIT & LOSS LENS
 * Focused on transaction-level margins and price category auditing.
 */
export const ProfitLossTableConfig = {
    moduleName: 'Profit & Loss Ledger',
    columns: [
        {
            label: 'Ref No.',
            key: 'sales.reference_no',
            className: 'p-4 border font-mono text-xs text-gray-600',
            sortable: true,
        },
        {
            label: 'Product',
            key: 'product_name',
            className: 'p-4 border font-bold text-gray-800',
            sortable: true,
        },
        {
            label: 'Category',
            key: 'price_category',
            type: 'badge', // 🟢 Highlights if it was Retail, Manual, Wholesale, etc.
            className:
                'p-4 border text-center uppercase text-[10px] tracking-wider font-black',
            sortable: true,
        },
        {
            label: 'Store',
            key: 'store_name',
            className: 'p-4 border text-sm',
            sortable: true,
        },
        {
            label: 'Qty',
            key: 'quantity',
            className: 'p-4 border text-center',
            sortable: true,
            isTotalable: true,
        },
        {
            label: 'Unit Cost',
            key: 'unit_cost', // product.buying_price
            type: 'currency',
            className: 'p-4 border text-right text-gray-500 italic',
        },
        {
            label: 'Sold At',
            key: 'unit_price',
            type: 'currency',
            className: 'p-4 border text-right font-semibold',
        },
        {
            label: 'Gross Profit',
            key: 'gross_profit',
            type: 'currency',
            className:
                'p-4 border text-right font-bold text-emerald-700 bg-emerald-50/30',
            isTotalable: true,
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
