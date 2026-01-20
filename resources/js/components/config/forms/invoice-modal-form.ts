import { FileText } from "lucide-react";

// Re-export interface for consistency
export interface FieldGroup {
    header: string;
    fields: Array<{
        id: string;
        key: string;
        name: string;
        label: string;
        type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'file' | 'multi-file' | 'single-select' | 'multi-select' | 'searchable-select' | 'radio-group' | 'checkbox' | 'tag-input' | 'hidden' | 'date';
        placeholder?: string;
        autocomplete?: string;
        tabIndex?: number;
        autoFocus?: boolean;
        rows?: number;
        accept?: string;
        className?: string;
        optionsSource?: string;
        colSpan?: number;
        disabled?: boolean | ((mode: 'create' | 'view' | 'edit', userContext?: any, data?: any) => boolean);
        // 🟢 Controls visibility
        hidden?: boolean | ((mode: 'create' | 'view' | 'edit', data?: any) => boolean);
    }>;
    columns: number;
}

export const InvoiceFormConfig = {
    moduleTitle: 'Finance Management',
    title: 'Create New Invoice',
    description: 'Generate a sales invoice. Select a customer and add items below.',
    addButton: {
        id: 'create-invoice',
        label: 'Create Invoice',
        className: 'flex items-center gap-2 bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 cursor-pointer',
        icon: FileText,
        type: 'button',
        variant: 'default',
        permission: 'create-invoice',
    },

    fields: [
        // 1. INVOICE HEADER
        {
            header: 'Invoice Header Details',
            columns: 3,
            fields: [
                {
                    id: 'is-walkin',
                    key: 'is_walkin',
                    name: 'is_walkin',
                    label: 'Walk-in Customer?',
                    type: 'checkbox',
                    placeholder: 'Yes, unregistered client',
                    tabIndex: 1,
                    colSpan: 1,
                    // Hide in View mode (it's confusing to see a checkbox for a finalized invoice)
                    hidden: (mode) => mode === 'view',
                },
                // 🟢 CREATE/EDIT: Show Searchable Select
                {
                    id: 'customer',
                    key: 'customer_id',
                    name: 'customer_id',
                    label: 'Customer *',
                    type: 'searchable-select',
                    optionsSource: 'customers',
                    placeholder: 'Search Customer...',
                    tabIndex: 2,
                    autoFocus: true,
                    colSpan: 1,
                    // Hide in View mode
                    hidden: (mode) => mode === 'view',
                    disabled: (mode, context, data) => !!data?.is_walkin,
                },
                // 🟢 VIEW ONLY: Show Customer Name as Text
                {
                    id: 'view-customer-name',
                    key: 'customer_name',
                    name: 'customer_name',
                    label: 'Customer',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                    // Only show in View mode
                    hidden: (mode) => mode !== 'view',
                },
                {
                    id: 'payment-arrangement',
                    key: 'payment_arrangement',
                    name: 'payment_arrangement',
                    label: 'Payment Arrangement *',
                    type: 'radio-group',
                    optionsSource: 'payment_arrangements',
                    placeholder: 'Select Arrangement',
                    tabIndex: 3,
                    colSpan: 1,
                    disabled: (mode, context, data) => !!data?.is_walkin,
                },
                {
                    id: 'invoice-date',
                    key: 'invoice_date',
                    name: 'invoice_date',
                    label: 'Invoice Date *',
                    type: 'date',
                    placeholder: 'Select Date',
                    tabIndex: 4,
                    colSpan: 1,
                },
                {
                    id: 'due-date',
                    key: 'due_date',
                    name: 'due_date',
                    label: 'Due Date',
                    type: 'date',
                    placeholder: 'Optional',
                    tabIndex: 5,
                    colSpan: 1,
                    disabled: (mode, context, data) => data?.payment_arrangement === 'full',
                },
                {
                    id: 'invoice-number',
                    key: 'invoice_number',
                    name: 'invoice_number',
                    label: 'Invoice #',
                    type: 'text',
                    placeholder: 'Auto-generated',
                    tabIndex: 6,
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'status',
                    key: 'status',
                    name: 'status',
                    label: 'Status',
                    type: 'text',
                    placeholder: 'Draft',
                    tabIndex: 7,
                    colSpan: 1,
                    disabled: true,
                },
            ],
        },

        // 2. NOTES
        {
            header: 'Notes & Terms',
            columns: 1,
            fields: [
                {
                    id: 'invoice-notes',
                    key: 'notes',
                    name: 'notes',
                    label: 'Internal Notes / Terms',
                    type: 'textarea',
                    placeholder: 'Payment terms, delivery instructions, etc.',
                    tabIndex: 8,
                    rows: 2,
                    colSpan: 1,
                },
            ],
        },

        // 3. FINANCIAL SUMMARY (Read Only)
        {
            header: 'Financial Summary',
            columns: 3,
            fields: [
                {
                    id: 'total-amount',
                    key: 'total_amount',
                    name: 'total_amount',
                    label: 'Total Amount',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'paid-amount',
                    key: 'paid_amount',
                    name: 'paid_amount',
                    label: 'Amount Paid',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'balance-due',
                    key: 'balance_due',
                    name: 'balance_due',
                    label: 'Balance Due',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
            ],
        },

        // 4. AUDIT & HISTORY (🟢 VISIBLE ONLY IN VIEW MODE)
        {
            header: 'Audit Trail & History',
            columns: 3,
            fields: [
                // -- CREATION INFO --
                {
                    id: 'created-by',
                    key: 'user_name',
                    name: 'user_name',
                    label: 'Created By',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                    hidden: (mode) => mode !== 'view',
                },
                {
                    id: 'store-name',
                    key: 'store_name',
                    name: 'store_name',
                    label: 'Store Branch',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                    hidden: (mode) => mode !== 'view',
                },
                {
                    id: 'payment-status',
                    key: 'payment_status',
                    name: 'payment_status',
                    label: 'Payment Status',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                    hidden: (mode) => mode !== 'view',
                },

                // -- 🔴 VOID LOGIC (Who, When, Why) --
                {
                    id: 'voided-at',
                    key: 'voided_at',
                    name: 'voided_at',
                    label: 'Voided On',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                    hidden: (mode, data) => mode !== 'view' || !data?.voided_at,
                    className: 'text-red-600 font-bold',
                },
                {
                    id: 'voided-by',
                    key: 'voided_by_name',
                    name: 'voided_by_name',
                    label: 'Voided By', // 🟢 WHO
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                    hidden: (mode, data) => mode !== 'view' || !data?.voided_at,
                    className: 'text-red-600',
                },
                {
                    id: 'void-reason',
                    key: 'void_reason',
                    name: 'void_reason',
                    label: 'Reason',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                    hidden: (mode, data) => mode !== 'view' || !data?.voided_at,
                    className: 'text-red-600 italic',
                },

                // -- 🟣 REFUND LOGIC (Who, When) --
                {
                    id: 'refunded-at',
                    key: 'refunded_at',
                    name: 'refunded_at',
                    label: 'Refunded On',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                    hidden: (mode, data) => mode !== 'view' || !data?.refunded_at,
                    className: 'text-purple-600 font-bold',
                },
                {
                    id: 'refunded-by',
                    key: 'refunded_by_name',
                    name: 'refunded_by_name',
                    label: 'Refunded By', // 🟢 WHO
                    type: 'text',
                    colSpan: 2,
                    disabled: true,
                    hidden: (mode, data) => mode !== 'view' || !data?.refunded_at,
                    className: 'text-purple-600',
                },
            ]
        }

    ] as FieldGroup[],

    buttons: [
        {
            key: 'cancel',
            type: 'button',
            label: 'Close',
            variant: 'ghost',
            className: 'cursor-pointer',
        },
        {
            key: 'submit',
            type: 'submit',
            label: 'Save Draft',
            variant: 'default',
            className: 'cursor-pointer bg-orange-600',
            // Hide submit button in View mode
            hidden: (mode) => mode === 'view',
        },
    ],
};
