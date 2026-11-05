import { FileSpreadsheet, FileText } from 'lucide-react';

export const TaxTableConfig = {
    moduleName: 'Tax & VAT Summary',
    columns: [
        {
            label: 'Date',
            key: 'invoice_date',
            className: 'p-4 border',
            sortable: true,
        },
        {
            label: 'Invoice No.',
            key: 'reference_no',
            className: 'p-4 border font-mono',
            sortable: true,
        },
        {
            label: 'Customer',
            key: 'customer_name',
            className: 'p-4 border text-sm',
        },
        {
            label: 'Taxable Amt',
            key: 'sub_total',
            type: 'currency',
            className: 'p-4 border text-right',
            isTotalable: true,
        },
        {
            label: 'VAT (16%)',
            key: 'tax_amount',
            type: 'currency',
            className: 'p-4 border text-right font-semibold text-red-600',
            isTotalable: true,
        },
        {
            label: 'Total Payable',
            key: 'total_payable',
            type: 'currency',
            className: 'p-4 border text-right font-bold',
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
