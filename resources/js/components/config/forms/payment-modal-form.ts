// Re-export interface for consistency
export interface FieldGroup {
    header: string;
    fields: Array<{
        id: string;
        key: string;
        name: string;
        label: string;
        type: 'text';
        colSpan?: number;
        disabled?: boolean;
    }>;
    columns: number;
}

export const PaymentFormConfig = {
    moduleTitle: 'Payments',
    title: 'Payment Details',
    description: 'Read-only view of the transaction.',
    addButton: null,

    fields: [
        // 1. PAYMENT DETAILS
        {
            header: 'Transaction Info',
            columns: 2,
            fields: [
                {
                    id: 'trans-ref',
                    key: 'transaction_ref',
                    name: 'transaction_ref',
                    label: 'Reference / Code',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'payment-date',
                    key: 'payment_date',
                    name: 'payment_date',
                    label: 'Date Received',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'method',
                    key: 'method',
                    name: 'method',
                    label: 'Payment Method',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'status',
                    key: 'status',
                    name: 'status',
                    label: 'Status',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
            ],
        },

        // 2. CONTEXT
        {
            header: 'Source & Allocation',
            columns: 2,
            fields: [
                {
                    id: 'customer',
                    key: 'customer_name',
                    name: 'customer_name',
                    label: 'Payer (Customer)',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'payable',
                    key: 'payable_type_label',
                    name: 'payable_type_label',
                    label: 'Payment For',
                    type: 'text', // e.g., "Invoice #INV-2024-001"
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'store',
                    key: 'store_name',
                    name: 'store_name',
                    label: 'Received At (Store)',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'user',
                    key: 'user_name',
                    name: 'user_name',
                    label: 'Received By',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
            ],
        },

        // 3. AMOUNT
        {
            header: 'Financials',
            columns: 1,
            fields: [
                {
                    id: 'amount',
                    key: 'amount',
                    name: 'amount',
                    label: 'Amount Received',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
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
    ],
};
