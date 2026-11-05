import { FileSpreadsheet, FileText } from 'lucide-react';

export const PaymentsTableConfig = {
    moduleName: 'Payment Method Split',
    columns: [
        {
            label: 'Method',
            key: 'payment_method',
            type: 'badge',
            className: 'p-4 border text-center uppercase font-black',
        },
        { label: 'Staff', key: 'user_name', className: 'p-4 border text-sm' },
        {
            label: 'Tendered',
            key: 'amount_tendered',
            type: 'currency',
            className: 'p-4 border text-right',
            isTotalable: true,
        },
        {
            label: 'Change Given',
            key: 'change_given',
            type: 'currency',
            className: 'p-4 border text-right text-orange-600',
            isTotalable: true,
        },
        {
            label: 'Net Received',
            key: 'net_amount',
            type: 'currency',
            className: 'p-4 border text-right font-bold text-emerald-700',
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
