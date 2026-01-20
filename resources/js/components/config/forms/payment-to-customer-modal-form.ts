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

export const PaymentToCustomerFormConfig = {
    moduleTitle: 'Outgoing Payments',
    title: 'Transaction Details',
    description: 'Details of money returned to customer.',
    addButton: null,

    fields: [
        // 1. MAIN INFO
        {
            header: 'Transaction Info',
            columns: 2,
            fields: [
                {
                    id: 'date',
                    key: 'payment_date',
                    name: 'payment_date',
                    label: 'Date',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'type',
                    key: 'type',
                    name: 'type',
                    label: 'Type (Reason)',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'method',
                    key: 'method',
                    name: 'method',
                    label: 'Method',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'amount',
                    key: 'amount',
                    name: 'amount',
                    label: 'Amount Paid',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
            ],
        },

        // 2. CONTEXT
        {
            header: 'Context',
            columns: 2,
            fields: [
                {
                    id: 'customer',
                    key: 'customer_name',
                    name: 'customer_name',
                    label: 'Customer',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'source',
                    key: 'source_label',
                    name: 'source_label',
                    label: 'Source Reference',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'store',
                    key: 'store_name',
                    name: 'store_name',
                    label: 'Store',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'user',
                    key: 'user_name',
                    name: 'user_name',
                    label: 'Processed By',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
            ],
        },

        // 3. NOTES
        {
            header: 'Notes',
            columns: 1,
            fields: [
                {
                    id: 'notes',
                    key: 'notes',
                    name: 'notes',
                    label: 'Notes',
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
