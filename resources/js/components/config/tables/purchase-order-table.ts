/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Eye,
    FileSpreadsheet,
    FileText,
    Pencil,
    Trash2,
    Send,
    PackageCheck,
    Ban,
    
} from "lucide-react";

export const PurchaseOrderTableConfig = {
    moduleName: "Purchase Orders",

    columns: [
        // 1. IDENTITY
        {
            label: 'PO #',
            key: 'po_number',
            className: 'p-4 border font-bold text-gray-800 font-mono w-32'
        },

        // 2. CORE INFO
        {
            label: 'Supplier',
            key: 'supplier_name',
            className: 'p-4 border font-medium'
        },
        {
            label: 'Destination',
            key: 'store_name',
            className: 'p-4 border text-sm text-gray-600'
        },

        // 3. DATES
        {
            label: 'Order Date',
            key: 'order_date',
            className: 'p-4 border text-center whitespace-nowrap text-sm'
        },
        {
            label: 'Expected',
            key: 'expected_date',
            className: 'p-4 border text-center whitespace-nowrap text-xs text-gray-500',
            defaultHidden: true
        },

        // 4. FINANCIALS
        {
            label: 'Total Amount',
            key: 'total_amount',
            type: 'currency',
            className: 'p-4 border text-right font-bold text-emerald-700'
        },

        // 5. STATUS
        {
            label: 'Status',
            key: 'status',
            type: 'tag-status', // draft=gray, ordered=blue, received=green, cancelled=red
            className: 'p-4 border text-center font-bold w-28'
        },

        // 6. AUDIT TRAIL (Hidden by default)
        {
            label: 'Created By',
            key: 'created_by',
            className: 'p-4 border text-sm text-gray-500',
            defaultHidden: true
        },
        {
            label: 'Approved By',
            key: 'approved_by',
            className: 'p-4 border text-sm text-gray-500',
            defaultHidden: true
        },
        {
            label: 'Received By',
            key: 'received_by',
            className: 'p-4 border text-sm text-gray-500',
            defaultHidden: true
        },

        // 7. ACTIONS
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
            permission: 'view-purchase-order',
        },

        // 2. MARK ORDERED (Draft -> Ordered)
        {
            label: 'Mark Ordered',
            icon: Send,
            className: 'flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'edit-purchase-order',
            conditionKey: 'status',
            conditionValue: 'draft',
            tooltip: 'Finalize and mark as sent to supplier.',
        },

        // 3. RECEIVE STOCK (Ordered/Partial -> Received)
        {
            label: 'Receive Goods',
            icon: PackageCheck,
            className: 'flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'receive-purchase-order',
            condition: (po: any) => ['ordered', 'partial'].includes(po.status),
            tooltip: 'Confirm arrival of goods and update inventory.',
        },

        // 4. CANCEL (Draft/Ordered -> Cancelled)
        {
            label: 'Cancel Order',
            icon: Ban,
            className: 'flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'edit-purchase-order',
            // Can cancel unless already received or already cancelled
            condition: (po: any) => !['received', 'cancelled'].includes(po.status),
            tooltip: 'Cancel this order.',
        },

        // 5. EDIT (Draft Only)
        {
            label: 'Edit',
            icon: Pencil,
            className: 'flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            permission: 'edit-purchase-order',
            conditionKey: 'status',
            conditionValue: 'draft',
        },

        // 6. DELETE (Draft Only)
        {
            label: 'Delete',
            icon: Trash2,
            className: 'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            permission: 'delete-purchase-order',
            conditionKey: 'status',
            conditionValue: 'draft',
        },

        // 7. EXPORTS
        {
            label: 'Export PDF',
            icon: FileText,
            permission: 'export-purchase-order',
        },
        {
            label: 'Export Excel',
            icon: FileSpreadsheet,
            permission: 'export-purchase-order',
        },
    ],
};
