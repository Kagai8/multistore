import { FileSpreadsheet, FileText } from 'lucide-react';

export const RefundsTableConfig = {
    moduleName: 'Refunds & Voids Audit',
    columns: [
        {
            label: 'Original Ref',
            key: 'reference_no',
            className: 'p-4 border font-mono',
        },
        {
            label: 'Type',
            key: 'void_type',
            type: 'badge',
            className: 'p-4 border text-center',
        },
        {
            label: 'Amount',
            key: 'amount',
            type: 'currency',
            className: 'p-4 border text-right font-bold text-gray-700',
            isTotalable: true,
        },
        {
            label: 'Reason',
            key: 'reason_note',
            className: 'p-4 border text-sm italic',
        },
        {
            label: 'Processed By',
            key: 'staff_name',
            className: 'p-4 border text-sm',
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
