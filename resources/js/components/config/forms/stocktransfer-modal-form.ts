// resources/js/config/forms/stock-transfer-form.ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CirclePlus, ArrowLeftRight } from "lucide-react";

// Re-export the new FieldGroup interface for use in the component
export interface FieldGroup {
    header: string;
    fields: Array<{
        id: string;
        key: string;
        name: string;
        label: string;
        type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'file' | 'multi-file' | 'single-select' | 'multi-select' | 'checkbox' | 'tag-input' | 'hidden' | 'date'; // Added 'date' type
        placeholder?: string;
        autocomplete?: string;
        tabIndex?: number;
        autoFocus?: boolean;
        rows?: number;
        accept?: string;
        className?: string;
        optionsSource?: string; // Used for lookups like 'stores'
        colSpan?: number;
        // 💡 Ensure the FieldProps interface in ComplexModalForm.tsx accepts this type
        disabled?: boolean | ((mode: 'create' | 'view' | 'edit') => boolean);
    }>;
    columns: number;
}


export const StockTransferFormConfig = {
    moduleTitle: 'Stock Management',
    title: 'Create New Stock Transfer',
    description: 'Initiate a movement of inventory from one storage location to another.',
    addButton: {
        id: 'add-transfer',
        label: 'Initiate Transfer',
        className: 'flex items-center gap-2 bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 cursor-pointer',
        icon: ArrowLeftRight, // Changed icon to reflect transfer
        type: 'button',
        variant: 'default',
        permission: 'create-stock-transfer',
    },

    fields: [
        // 1. Core Transfer Details (Source/Destination/Date)
        {
            header: 'Transfer Header Details',
            columns: 3,
            fields: [
                {
                    id: 'transfer-source',
                    key: 'source_store_id',
                    name: 'source_store_id',
                    label: 'Source Store (Sending From) *',
                    type: 'single-select',
                    optionsSource: 'stores', // Assuming lookup data key is 'stores'
                    placeholder: 'Select the store sending stock',
                    tabIndex: 1,
                    autoFocus: true,
                    colSpan: 1,
                    disabled: (mode: 'create' | 'view' | 'edit', userContext) => {
        // Use the snake_case attribute name
        const isGlobalUser = userContext?.is_global_user ?? false;

        // Disable if: 1) We are creating AND 2) The user is NOT global
        return mode === 'create' && !isGlobalUser;
    },
                },
                {
                    id: 'transfer-destination',
                    key: 'destination_store_id',
                    name: 'destination_store_id',
                    label: 'Destination Store(Receiving To) ',
                    type: 'single-select',
                    optionsSource: 'stores',
                    placeholder: 'Select the store receiving stock',
                    tabIndex: 2,
                    colSpan: 1,
                    // Note: Front-end validation must ensure source != destination
                },
                {
                    id: 'transfer-date',
                    key: 'transfer_date',
                    name: 'transfer_date',
                    label: 'Transfer Date *',
                    type: 'date', // Use the date type
                    placeholder: 'Select transfer date',
                    tabIndex: 3,
                    colSpan: 1,
                    className: 'max-w-[200px]',
                    // Set default to today's date in your component state
                },
                {
                    id: 'transfer-reference',
                    key: 'reference',
                    name: 'reference',
                    label: 'External Reference / Tracking ID (Optional)',
                    type: 'text',
                    placeholder: 'e.g., manifest or tracking number',
                    tabIndex: 4,
                    colSpan: 3, // Spans all 3 columns
                    disabled: true, // Always read-only
                },
            ],
        },



        // 3. Notes
        {
            header: 'Notes',
            columns: 1,
            fields: [
                {
                    id: 'transfer-notes',
                    key: 'notes',
                    name: 'notes',
                    label: 'Internal Notes',
                    type: 'textarea',
                    placeholder: 'Any instructions or notes for the transfer process',
                    tabIndex: 5,
                    rows: 3,
                    colSpan: 1,
                },
            ],
        },

        // 🟢 COMPLETE WORKFLOW & AUDIT DETAILS (VIEW MODE ONLY)
        {
            header: 'Transfer Workflow & Audit',
            columns: 3,
            fields: [
                // 1. INITIATION AUDIT
                {
                    id: 'user-name',
                    key: 'user_name', // Maps to the accessor for the initiator's name
                    name: 'user_name',
                    label: 'Initiated By',
                    type: 'text',
                    colSpan: 1,
                    disabled: true, // Read-only
                },
                {
                    id: 'created-at',
                    key: 'created_at',
                    name: 'created_at',
                    label: 'Initiated At',
                    type: 'text', // Display date-time as text
                    colSpan: 1,
                    disabled: true, // Read-only
                },
                {
                    id: 'status',
                    key: 'status',
                    name: 'status',
                    label: 'Current Status',
                    type: 'text',
                    colSpan: 1,
                    disabled: true, // Read-only
                },

                // 2. APPROVAL AUDIT
                {
                    id: 'approved-status',
                    key: 'approved_status',
                    name: 'approved_status',
                    label: 'Approval Status',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'approved-by',
                    key: 'approved_by',
                    name: 'approved_by',
                    label: 'Approved By',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'approved-at',
                    key: 'approved_at',
                    name: 'approved_at',
                    label: 'Approved At',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },

                // 3. RECEIPT AUDIT
                {
                    id: 'received-by',
                    key: 'received_by',
                    name: 'received_by',
                    label: 'Received By',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'received-at',
                    key: 'received_at',
                    name: 'received_at',
                    label: 'Received At',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                // Placeholder for alignment if needed, or just let the columns wrap naturally
            ],
        },
        // ✅ 4. NEW: Delivery Details
    {
        header: 'Delivery Details',
        columns: 2,
        fields: [
            {
                id: 'delivery-type',
                key: 'delivery_type',
                name: 'delivery_type',
                label: 'Delivery Type',
                type: 'text',
                colSpan: 2,
                disabled: true,
            },
            {
                id: 'assigned-driver',
                key: 'assigned_to_user_name',
                name: 'assigned_to_user_name',
                label: 'Assigned Driver',
                type: 'text',
                colSpan: 1,
                disabled: true,
            },
            {
                id: 'carrier-name',
                key: 'carrier_name',
                name: 'carrier_name',
                label: 'Carrier Name',
                type: 'text',
                colSpan: 1,
                disabled: true,
            },
            {
                id: 'contact-number',
                key: 'contact_number',
                name: 'contact_number',
                label: 'Contact Number',
                type: 'text',
                colSpan: 1,
                disabled: true,
            },
            {
                id: 'tracking-reference',
                key: 'tracking_reference',
                name: 'tracking_reference',
                label: 'Tracking / Reference ID',
                type: 'text',
                colSpan: 1,
                disabled: true,
            },
            {
                id: 'delivery-time',
                key: 'delivery_time',
                name: 'delivery_time',
                label: 'Delivery Time',
                type: 'text',
                colSpan: 2,
                disabled: true,
            },
        ],
    },

    ] as FieldGroup[],

    buttons: [
        {
            key: 'cancel',
            type: 'button',
            label: 'Cancel',
            variant: 'ghost',
            className: 'cursor-pointer',
        },
        {
            key: 'submit',
            type: 'submit',
            label: 'Save as Draft',
            variant: 'default',
            className: 'cursor-pointer bg-orange-600',
        },
    ],
};
