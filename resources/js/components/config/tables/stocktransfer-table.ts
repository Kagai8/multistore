import { Eye, FileSpreadsheet, FileText, Pencil, Trash2, Truck, CheckCircle, Upload, XCircle } from "lucide-react";

export const StockTransferTableConfig = {
    // 💡 Essential for clarity in the UI header
    moduleName: "Stock Transfers",

    columns: [
        // Core Identity
        {
            label: 'ID',
            key: 'id',
            className: 'p-4 border text-center font-mono w-16'
        },
        {
            label: 'Reference',
            key: 'reference',
            className: 'p-4 border font-semibold'
        },
        {
            label: 'Transfer Date',
            key: 'transfer_date',
            className: 'p-4 border text-center'
        },

        // Workflow Status (draft, initiated, accepted, denied, sent, received)
        {
            label: 'Status',
            key: 'status',
            type: 'tag-status',
            className: 'p-4 border text-center font-bold w-32'
        },

        // 🟢 APPROVAL WORKFLOW COLUMNS
        {
            label: 'Approval Status',
            key: 'approved_status', // pending, approved, rejected
            type: 'tag-status',
            className: 'p-4 border text-center font-bold w-32'
        },
        {
            label: 'Approved By',
            key: 'approved_by', // Maps to the approver's name
            className: 'p-4 border text-center text-sm',
            defaultHidden: true
        },
        {
            label: 'Approved At',
            key: 'approved_at', // Maps to the approval timestamp
            type: 'date-time',
            className: 'p-4 border text-center text-xs',
            defaultHidden: true
        },

        // 🟢 RECEIPT WORKFLOW COLUMN
        {
            label: 'Received By',
            key: 'received_by', // Maps to the receiver's name
            className: 'p-4 border text-center text-sm',
            defaultHidden: true
        },
        {
            label: 'Received At',
            key: 'received_at', // Maps to the receipt timestamp
            type: 'date-time',
            className: 'p-4 border text-center text-xs',
            defaultHidden: true
        },

        // Relationships (Eager loaded via Controller)
        {
            label: 'Source Store',
            key: 'source_store', // Maps to the transformed 'source_store' property
            className: 'p-4 border text-left'
        },
        {
            label: 'Destination Store',
            key: 'destination_store', // Maps to the transformed 'destination_store' property
            className: 'p-4 border text-left'
        },
        {
            label: 'Initiated By',
            key: 'user_name', // Maps to the transformed 'user_name' property
            className: 'p-4 border text-center text-sm',
            defaultHidden: true
        },

        // Audit
        {
            label: 'Created At',
            key: 'created_at',
            type: 'date-time',
            className: 'p-4 border text-center text-xs'
        },

        // Actions (Mandatory as defined in your component)
        {
            label: 'Actions',
            key: 'actions',
            isAction: true,
            isMandatory: true,
            className: 'p-4 border text-center w-48'
        },
    ],

    actions: [
        // 1. VIEW ACTION
        {
            label: 'View',
            icon: Eye,
            className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'view-stock-transfer',
        },

        // 🟢 NEW: INITIATE ACTION (Draft -> Initiated)
        {
            label: 'Submit for Review',
            icon: Upload,
            className: 'flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'edit-stock-transfer', // Use edit permission to submit a draft
            conditionKey: 'status',
            conditionValue: 'draft',
            tooltip: 'Submit this draft transfer for manager review and approval.',
        },

        // 2. APPROVE ACTION (Initiated/Pending -> Accepted/Approved)
        {
            label: 'Approve Transfer',
            icon: CheckCircle,
            className: 'flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'approve-stock-transfer',

            // 🛑 FIX: Must be INITIATED AND PENDING
            conditionKeys: ['approved_status', 'status'],
            conditionValues: ['pending', 'initiated'],

            tooltip: 'Approve this transfer to allow the source store to send the items.',
        },

        // 3. REJECT ACTION (Initiated/Pending -> Denied/Rejected)
        {
            label: 'Reject Transfer',
            icon: XCircle, // Changed icon to XCircle for Denied/Rejected clarity
            className: 'flex items-center gap-1 bg-red-800 hover:bg-red-900 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'approve-stock-transfer',

            // 🛑 FIX: Must be INITIATED AND PENDING
            conditionKeys: ['approved_status', 'status'],
            conditionValues: ['pending', 'initiated'],

            tooltip: 'Deny this transfer, setting its final status to DENIED.',
        },

        // 4. SEND ACTION (Accepted -> Sent)
        {
            label: 'Send Transfer',
            icon: Truck,
            className: 'flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
            permission: 'send-stock-transfer',

            // 🛑 FIX: Condition: ONLY visible AND enabled if status is 'accepted'
            conditionKey: 'status',
            conditionValue: 'accepted',

            tooltip: 'Mark as sent, deducting stock from the source store.',
        },

        // 5. RECEIVE ACTION (Sent -> Received)
{
    label: 'Receive Transfer',
    icon: CheckCircle,
    className: 'flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
    permission: 'receive-stock-transfer',
    // ✅ NEW: Custom condition function
    condition: (transfer: any, currentUserContext: any) => {
        // If user has global access, always show
        if (currentUserContext?.is_global_user) {
            return transfer.status === 'sent';
        }
        // Otherwise, only show if user's store is the destination
        return transfer.status === 'sent' &&
               String(transfer.destination_store_id) === String(currentUserContext?.store_id);
    },
    tooltip: 'Mark as received, adding stock to the destination store.',
},

        // 6. EDIT (Standard CRUD)
        {
            label: 'Edit',
            icon: Pencil,
            permission: 'edit-stock-transfer',
            className: 'flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            // Condition: ONLY visible AND enabled if status is 'draft' (Correct)
            conditionKey: 'status',
            conditionValue: 'draft',
        },

        // 7. DELETE (Standard CRUD)
        {
            label: 'Delete',
            icon: Trash2,
            permission: 'delete-stock-transfer',
            className: 'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
            // Condition: ONLY visible AND enabled if status is 'draft' (Correct)
            conditionKey: 'status',
            conditionValue: 'draft',
        },

        // 8. EXPORTS (Hidden in More menu)
        {
            label: 'Export PDF',
            icon: FileText,
            permission: 'export-pdf-stock-transfer',
        },
        {
            label: 'Export Excel',
            icon: FileSpreadsheet,
            permission: 'export-excel-stock-transfer',
        },
    ],
};
