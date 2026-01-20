/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Eye,
    FileSpreadsheet,
    FileText,
} from "lucide-react";

export const PaymentTableConfig = {
    moduleName: "Payments Received",

    columns: [
        {
            label: 'ID',
            key: 'id',
            className: 'p-4 border text-center font-mono w-16 text-gray-500',
            sortable: true
        },
        {
            label: 'Trans Ref',
            key: 'transaction_ref', // The M-Pesa code or Bank Ref
            className: 'p-4 border font-bold text-gray-800 font-mono'
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
            label: 'Paid For',
            key: 'payable_type_label', // "Invoice #100" or "POS #888"
            className: 'p-4 border text-sm text-gray-600'
        },
        {
            label: 'Method',
            key: 'method', // Cash, Mpesa, etc
            className: 'p-4 border text-center capitalize font-semibold',
            conditionalClass: (row: any) =>
                row.method === 'mpesa' ? 'text-green-600 bg-green-50' :
                row.method === 'cash' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
        },
        {
            label: 'Amount',
            key: 'amount',
            type: 'currency',
            className: 'p-4 border text-right font-bold text-emerald-700',
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
        // 1. VIEW
        {
            label: 'View',
            icon: Eye,
            className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'view-payment',
        },

        // 2. EXPORTS
        {
            label: 'Export PDF',
            icon: FileText,
            permission: 'export-payments',
        },
        {
            label: 'Export Excel',
            icon: FileSpreadsheet,
            permission: 'export-payments',
        },
    ],
};
