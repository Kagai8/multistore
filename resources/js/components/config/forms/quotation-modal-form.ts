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

export const QuotationFormConfig = {
    moduleTitle: 'Quotation Management',
    title: 'Create New Quotation',
    description: 'Generate a sales quote. Select a customer and add items below.',
    addButton: {
        id: 'create-quotation',
        label: 'Create Quote',
        className: 'flex items-center gap-2 bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 cursor-pointer',
        icon: FileText,
        type: 'button',
        variant: 'default',
        permission: 'create-quotation',
    },

    fields: [
        // 1. QUOTATION HEADER
        {
            header: 'Quotation Details',
            columns: 3,
            fields: [
                // 🟢 CREATE/EDIT: Show Searchable Select
                {
                    id: 'customer',
                    key: 'customer_id',
                    name: 'customer_id',
                    label: 'Customer *',
                    type: 'searchable-select',
                    optionsSource: 'customers',
                    placeholder: 'Search Customer...',
                    tabIndex: 1,
                    autoFocus: true,
                    colSpan: 1,
                    // Hide in View mode
                    hidden: (mode) => mode === 'view',
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
                    id: 'quotation-date',
                    key: 'quotation_date',
                    name: 'quotation_date',
                    label: 'Quotation Date *',
                    type: 'date',
                    placeholder: 'Select Date',
                    tabIndex: 2,
                    colSpan: 1,
                },
                {
                    id: 'valid-until',
                    key: 'valid_until', // Replaces 'due_date'
                    name: 'valid_until',
                    label: 'Valid Until',
                    type: 'date',
                    placeholder: 'Expiration Date',
                    tabIndex: 3,
                    colSpan: 1,
                },
                {
                    id: 'quotation-number',
                    key: 'quotation_number',
                    name: 'quotation_number',
                    label: 'Quote #',
                    type: 'text',
                    placeholder: 'Auto-generated',
                    tabIndex: 4,
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
                    tabIndex: 5,
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
                    id: 'quote-notes',
                    key: 'notes',
                    name: 'notes',
                    label: 'Internal Notes / Terms',
                    type: 'textarea',
                    placeholder: 'Proposal details, terms of service, etc.',
                    tabIndex: 6,
                    rows: 2,
                    colSpan: 1,
                },
            ],
        },

        // 3. FINANCIAL SUMMARY (Read Only)
        // Note: Removed 'Paid Amount' and 'Balance' as Quotes don't take payment.
        {
            header: 'Financial Summary',
            columns: 3,
            fields: [
                {
                    id: 'total-amount',
                    key: 'total_amount',
                    name: 'total_amount',
                    label: 'Total Estimate',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
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
            ],
        },
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
