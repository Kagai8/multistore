/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Eye,
    FileSpreadsheet,
    FileText,
    Pencil,
    Trash2,
    CheckCircle,
    Ban,
    DollarSign,
    RotateCcw, // 🟢 New Icon for Refund
    Printer
} from "lucide-react";

export const InvoiceTableConfig = {
    moduleName: "Invoices",

    columns: [
        // Core Identity
        {
            label: 'ID',
            key: 'id',
            className: 'p-4 border text-center font-mono w-16 text-gray-500',
            sortable: true
        },
        {
            label: 'Invoice #',
            key: 'invoice_number',
            className: 'p-4 border font-bold text-gray-800',
            sortable: true
        },
        {
            label: 'Date',
            key: 'invoice_date',
            className: 'p-4 border text-center whitespace-nowrap',
            sortable: true,
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
            defaultHidden: true,
            sortable: true
        },

        // Financials
        {
            label: 'Total Amount',
            key: 'total_amount',
            type: 'currency',
            className: 'p-4 border text-right font-semibold',
            sortable: true
        },
        {
            label: 'Balance Due',
            key: 'balance_due',
            type: 'currency',
            className: 'p-4 border text-right font-bold text-red-600',
            sortable: true
        },

        // Status Flags
        {
            label: 'Status',
            key: 'status', // draft, posted, void, refunded
            type: 'tag-status',
            className: 'p-4 border text-center font-bold w-24'
        },
        {
            label: 'Payment',
            key: 'payment_status', // paid, unpaid, partial
            type: 'tag-status',
            className: 'p-4 border text-center font-bold w-24'
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
        // 1. VIEW
        {
            label: 'View',
            icon: Eye,
            className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'view-invoice',
        },

        // 2. POST (Draft Only)
        {
            label: 'Post Invoice',
            icon: CheckCircle,
            className: 'flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'post-invoice',
            conditionKey: 'status',
            conditionValue: 'draft',
            tooltip: 'Finalize this invoice.',
        },

        // 3. EDIT (Draft Only)
        {
            label: 'Edit',
            icon: Pencil,
            permission: 'edit-invoice',
            className: 'flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            conditionKey: 'status',
            conditionValue: 'draft',
        },

        // 4. VOID (Posted Only)
        {
            label: 'Void',
            icon: Ban,
            permission: 'void-invoice',
            className: 'flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            conditionKey: 'status',
            conditionValue: 'posted',
            tooltip: 'Void this invoice.',
        },

        // 5. DELETE (Draft Only)
        {
            label: 'Delete',
            icon: Trash2,
            permission: 'delete-invoice',
            className: 'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            conditionKey: 'status',
            conditionValue: 'draft',
        },

        // 6. ADD PAYMENT (Posted & Not Paid)
        {
            label: 'Add Payment',
            icon: DollarSign,
            permission: 'create-payment',
            className: 'flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            condition: (row: any) => row.status === 'posted' && row.payment_status !== 'paid',
            tooltip: 'Record a payment.',
        },

        // 7. 🟢 REFUND (Paid/Partial Only)
        // Only visible if invoice is 'posted' and has payments ('paid' or 'partial')
        {
            label: 'Refund',
            icon: RotateCcw,
            permission: 'refund-invoice', // Ensure permission exists
            className: 'flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            condition: (row: any) => row.status === 'posted' && (row.payment_status === 'paid' || row.payment_status === 'partial'),
            tooltip: 'Issue a refund to the customer.',
        },
        {
            label: 'Print Receipt',
            icon: Printer,
            permission: 'view-invoice', // Basic view permission is usually enough
            className: 'flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            condition: (row: any) => row.status !== 'draft', // Drafts don't have receipts
            tooltip: 'Print official payment receipt for customer.',
        },

        // 8. EXPORTS
        {
            label: 'Export PDF',
            icon: FileText,
            permission: 'export-pdf-invoice',
        },
        {
            label: 'Export Excel',
            icon: FileSpreadsheet,
            permission: 'export-pdf-invoice',
        },
    ],
};
