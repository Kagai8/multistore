/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Eye,
    FileSpreadsheet,
    FileText,
} from "lucide-react";

export const SalesTableConfig = {
    moduleName: "Sales Ledger",

    columns: [
        {
            label: 'ID',
            key: 'id',
            className: 'p-4 border text-center font-mono w-16 text-gray-500'
        },
        {
            label: 'Reference #',
            key: 'reference_no',
            className: 'p-4 border font-bold text-gray-800 font-mono'
        },
        {
            label: 'Date',
            key: 'created_at',
            type: 'date-time',
            className: 'p-4 border text-center whitespace-nowrap'
        },
        {
            label: 'Customer',
            key: 'customer_name',
            className: 'p-4 border font-medium'
        },
        // 🟢 ADDED STORE COLUMN
        {
            label: 'Store',
            key: 'store_name',
            className: 'p-4 border font-medium text-gray-600'
        },
        {
            label: 'Source',
            key: 'source_type_label',
            className: 'p-4 border text-center text-sm font-semibold',
            conditionalClass: (row: any) => row.source_type_label === 'POS' ? 'text-blue-600' : 'text-orange-600'
        },
        {
            label: 'Total',
            key: 'total_amount',
            type: 'currency',
            className: 'p-4 border text-right font-semibold'
        },
        {
            label: 'Paid',
            key: 'paid_amount',
            type: 'currency',
            className: 'p-4 border text-right text-emerald-600'
        },
        {
            label: 'Status',
            key: 'payment_status',
            type: 'tag-status',
            className: 'p-4 border text-center font-bold w-24'
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
            permission: 'view-sale',
        },
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
