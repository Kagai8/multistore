import { FileSpreadsheet, FileText } from 'lucide-react';

export const DebtTableConfig = {
    moduleName: 'Debt Aging Ledger',
    columns: [
        {
            label: 'Customer',
            key: 'customer_name',
            className: 'p-4 border font-bold',
        },
        {
            label: 'Total Debt',
            key: 'total_debt',
            type: 'currency',
            className: 'p-4 border text-right font-bold text-red-700',
            isTotalable: true,
        },
        {
            label: 'Last Payment',
            key: 'last_payment_date',
            className: 'p-4 border text-center text-sm',
        },
        {
            label: 'Status',
            key: 'status',
            type: 'badge',
            className: 'p-4 border text-center',
        },
        {
            label: 'Days Overdue',
            key: 'days_overdue',
            className: 'p-4 border text-center font-mono text-red-600',
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
