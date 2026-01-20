/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Eye,
    FileText,
    Pencil,
    Trash2,
    XCircle,
    Send,
    ArrowRightCircle, // Icon for Conversion
} from "lucide-react";

export const QuotationTableConfig = {
    moduleName: "Quotations",

    columns: [
        // Core Identity
        {
            label: 'ID',
            key: 'id',
            className: 'p-4 border text-center font-mono w-16 text-gray-500',
            sortable: true
        },
        {
            label: 'Quote #',
            key: 'quotation_number',
            className: 'p-4 border font-bold text-gray-800',
            sortable: true
        },
        {
            label: 'Date',
            key: 'quotation_date',
            className: 'p-4 border text-center whitespace-nowrap',
            sortable: true
        },
        {
            label: 'Valid Until',
            key: 'valid_until',
            className: 'p-4 border text-center whitespace-nowrap text-sm text-gray-600'
        },

        // Customer & Context
        {
            label: 'Customer',
            key: 'customer_name',
            className: 'p-4 border font-medium',
            sortable: true
        },
        {
            label: 'Store',
            key: 'store_name',
            className: 'p-4 border text-sm text-gray-600',
            defaultHidden: true
        },

        // Financials
        {
            label: 'Total Estimate',
            key: 'total_amount',
            type: 'currency',
            className: 'p-4 border text-right font-semibold',
            sortable: true
        },

        // Status Flags
        {
            label: 'Status',
            key: 'status', // draft, sent, accepted, rejected, expired
            type: 'tag-status',
            className: 'p-4 border text-center font-bold w-24'
        },

        // Actions
        {
            label: 'Actions',
            key: 'actions',
            isAction: true,
            isMandatory: true,
            className: 'p-4 border text-center w-64' // Slightly wider to fit buttons
        },
    ],

    actions: [
        // 1. VIEW
        {
            label: 'View',
            icon: Eye,
            className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'view-quotation',
        },

        // 2. CONVERT TO INVOICE (The Magic Button)
        // Visible for Draft or Sent quotes. Not Accepted/Rejected.
        {
            label: 'Convert to Invoice',
            icon: ArrowRightCircle,
            className: 'flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            permission: 'convert-invoice', // Requires invoice creation permission
            condition: (row: any) => ['draft', 'sent'].includes(row.status),
            tooltip: 'Accept quote and generate invoice.',
        },

        // 3. MARK SENT (Draft Only)
        {
            label: 'Mark Sent',
            icon: Send,
            className: 'flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            permission: 'edit-quotation',
            conditionKey: 'status',
            conditionValue: 'draft',
            tooltip: 'Mark as sent to customer.',
        },

        // 4. REJECT (Draft/Sent)
        {
            label: 'Reject',
            icon: XCircle,
            className: 'flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            permission: 'edit-quotation',
            condition: (row: any) => ['draft', 'sent'].includes(row.status),
            tooltip: 'Mark quote as rejected.',
        },

        // 5. EDIT (Draft Only)
        {
            label: 'Edit',
            icon: Pencil,
            permission: 'edit-quotation',
            className: 'flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            conditionKey: 'status',
            conditionValue: 'draft',
        },

        // 6. DELETE (Draft/Rejected Only)
        // Accepted quotes cannot be deleted (history integrity)
        {
            label: 'Delete',
            icon: Trash2,
            permission: 'delete-quotation',
            className: 'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            condition: (row: any) => ['draft', 'rejected', 'expired'].includes(row.status),
        },

        // 7. EXPORTS
        {
            label: 'Export PDF',
            icon: FileText,
            permission: 'export-pdf-quotation',
        },
        // Excel export usually less critical for single quotes, but good for bulk.
    ],
};

