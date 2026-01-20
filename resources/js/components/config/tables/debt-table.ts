
import {
    Eye,
    FileText,
    Wallet,
} from "lucide-react";

export const DebtTableConfig = {
    moduleName: "Debtors List",

    columns: [
        // Identity
        {
            label: 'Customer Name',
            key: 'name',
            className: 'p-4 border font-bold text-gray-800',
            sortable: true,
        },
        {
            label: 'Phone',
            key: 'phone',
            className: 'p-4 border text-center font-mono text-gray-600'
        },

        // Financials
        {
            label: 'Total Outstanding',
            key: 'total_debt',
            type: 'currency',
            className: 'p-4 border text-right font-black text-red-600 text-lg'
        },
        {
            label: 'Credit Limit',
            key: 'credit_limit',
            type: 'currency',
            className: 'p-4 border text-right font-medium text-gray-500',
            sortable: true,
        },

        // Health Indicator (Custom Logic handled in Controller or Component, here assume tag-status for simplicity or custom component)
        {
            label: 'Usage %',
            key: 'usage_percent',
            className: 'p-4 border text-center font-bold',
            sortable: true,
            // We can treat this as a status tag in the table component if we map values,
            // or just render text. For now, text is fine.
        },

        // Actions
        {
            label: 'Actions',
            key: 'actions',
            isAction: true,
            isMandatory: true,
            className: 'p-4 border text-center w-48'
        },
    ],

    actions: [
        // 1. VIEW STATEMENT (Primary)
        {
            label: 'View Statement',
            icon: Eye,
            className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'view-debt-statement', // Ensure permission exists
        },

        // 2. QUICK PAY (Optional but handy)
        {
            label: 'Record Payment',
            icon: Wallet,
            className: 'flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            permission: 'create-debt-repayment',
            tooltip: 'Record a lump sum payment.',
        },

        // 3. EXPORTS
        {
            label: 'Export Statement (PDF)',
            icon: FileText,
            permission: 'export-debt-statement',
            tooltip: 'Export the debt statement as a PDF document.',
            className: 'flex items-center gap-1 bg-teal-800 hover:bg-teal-900 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
        },

    ],
};
