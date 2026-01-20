/* eslint-disable @typescript-eslint/no-explicit-any */
import { Wallet } from "lucide-react";

// Re-export interface for consistency (Mirrored from InvoiceFormConfig)
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

export const DebtFormConfig = {
    moduleTitle: 'Finance Management',
    title: 'Record Debt Repayment',
    description: 'Record a payment received from a customer to clear outstanding debts.',

    addButton: {
        id: 'create-repayment',
        label: 'Quick Repayment',
        className: 'flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700 cursor-pointer',
        icon: Wallet,
        type: 'button',
        variant: 'default',
        permission: 'create-debt-repayment', // Ensure permission exists
    },

    fields: [
        // 1. PAYMENT HEADER
        {
            header: 'Repayment Details',
            columns: 2,
            fields: [
                // 🟢 CREATE: Search Customer
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
                    // Disabled if we passed a specific customer in (e.g. from Customer Statement page)
                    disabled: (mode, context, data) => !!data?.fixed_customer,
                    hidden: (mode) => mode === 'view',
                },
                // 🟢 VIEW: Customer Name
                {
                    id: 'view-customer-name',
                    key: 'customer_name',
                    name: 'customer_name',
                    label: 'Customer',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                    hidden: (mode) => mode !== 'view',
                },
                {
                    id: 'receipt-number',
                    key: 'receipt_number',
                    name: 'receipt_number',
                    label: 'Receipt #',
                    type: 'text',
                    placeholder: 'Auto-generated',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'payment-date',
                    key: 'payment_date',
                    name: 'payment_date',
                    label: 'Payment Date *',
                    type: 'date',
                    tabIndex: 2,
                    colSpan: 1,
                },
                {
                    id: 'amount-paid',
                    key: 'amount',
                    name: 'amount',
                    label: 'Amount Received (KSh) *',
                    type: 'number',
                    placeholder: '0.00',
                    tabIndex: 3,
                    colSpan: 1,
                    className: 'font-bold text-lg',
                },
                {
                    id: 'payment-method',
                    key: 'method',
                    name: 'method',
                    label: 'Payment Method *',
                    type: 'single-select',
                    optionsSource: 'payment_methods', // Ensure this is passed in extraData
                    placeholder: 'Select Method',
                    tabIndex: 4,
                    colSpan: 1,
                },
                {
                    id: 'transaction-ref',
                    key: 'transaction_ref',
                    name: 'transaction_ref',
                    label: 'Transaction Ref / Code',
                    type: 'text',
                    placeholder: 'e.g. QK73...',
                    tabIndex: 5,
                    colSpan: 1,
                },
            ],
        },

        // 2. NOTES
        {
            header: 'Notes',
            columns: 1,
            fields: [
                {
                    id: 'repayment-notes',
                    key: 'notes',
                    name: 'notes',
                    label: 'Internal Notes',
                    type: 'textarea',
                    placeholder: 'Any comments regarding this payment...',
                    rows: 2,
                    colSpan: 1,
                },
            ],
        },

        // 3. AUDIT (View Only)
        {
            header: 'System Info',
            columns: 2,
            fields: [
                {
                    id: 'created-by',
                    key: 'user_name',
                    name: 'user_name',
                    label: 'Received By',
                    type: 'text',
                    disabled: true,
                    hidden: (mode) => mode !== 'view',
                },
                {
                    id: 'store-name',
                    key: 'store_name',
                    name: 'store_name',
                    label: 'Store Branch',
                    type: 'text',
                    disabled: true,
                    hidden: (mode) => mode !== 'view',
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
            label: 'Confirm Payment',
            variant: 'default',
            className: 'cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white',
            hidden: (mode) => mode === 'view',
        },
    ],
};
