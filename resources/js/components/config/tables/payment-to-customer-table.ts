
import {
    Eye,
    FileText,
} from "lucide-react";

export const PaymentToCustomerTableConfig = {
    moduleName: "Outgoing Payments",

    columns: [
        {
            label: 'ID',
            key: 'id',
            className: 'p-4 border text-center font-mono w-16 text-gray-500',
            sortable: true
        },
        {
            label: 'Date',
            key: 'payment_date',
            type: 'date',
            className: 'p-4 border text-center whitespace-nowrap',
            sortable: true
        },
        {
            label: 'Customer',
            key: 'customer_name',
            className: 'p-4 border font-medium',
            sortable: true
        },
        {
            label: 'Type',
            key: 'type', // 'change', 'refund', 'loyalty'
            type: 'tag-status', // We will map colors in backend or use a custom render if needed
            className: 'p-4 border text-center font-bold capitalize w-24',
            // Simple logic for colors if your tag-status supports generic strings,
            // otherwise the backend transformer usually handles the "status color" logic.
        },
        {
            label: 'Method',
            key: 'method',
            className: 'p-4 border text-center capitalize text-gray-600'
        },
        {
            label: 'Reference Source',
            key: 'source_label', // "Invoice #123"
            className: 'p-4 border text-sm text-gray-500'
        },
        {
            label: 'Amount',
            key: 'amount',
            type: 'currency',
            className: 'p-4 border text-right font-bold text-red-600', // Red because money is leaving
            sortable: true
        },

        // Actions
        {
            label: 'Actions',
            key: 'actions',
            isAction: true,
            isMandatory: true,
            className: 'p-4 border text-center w-32'
        },
    ],

    actions: [
        {
            label: 'View',
            icon: Eye,
            className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'view-payment', // Reusing payment permission
        },
        {
            label: 'Export PDF',
            icon: FileText,
            className: 'flex items-center gap-1 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'export-payments',
        },

    ],
};
