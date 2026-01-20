

// Re-export interface for consistency
export interface FieldGroup {
    header: string;
    fields: Array<{
        id: string;
        key: string;
        name: string;
        label: string;
        type: 'text' | 'date';
        colSpan?: number;
        disabled?: boolean;
    }>;
    columns: number;
}

export const SalesFormConfig = {
    moduleTitle: 'Sales Ledger',
    title: 'View Sale Record',
    description: 'Detailed view of the sales transaction.',
    // No Add Button (Read Only)
    addButton: null,

    fields: [
        // 1. HEADER
        {
            header: 'Transaction Details',
            columns: 3,
            fields: [
                {
                    id: 'reference-no',
                    key: 'reference_no',
                    name: 'reference_no',
                    label: 'Reference #',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'date',
                    key: 'created_at_formatted',
                    name: 'created_at',
                    label: 'Date',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'source',
                    key: 'source_type_label',
                    name: 'source_type_label',
                    label: 'Source',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
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
                    label: 'Served By',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
            ],
        },

        // 2. FINANCIALS
        {
            header: 'Financial Summary',
            columns: 3,
            fields: [
                {
                    id: 'total',
                    key: 'total_amount',
                    name: 'total_amount',
                    label: 'Total Amount',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'paid',
                    key: 'paid_amount',
                    name: 'paid_amount',
                    label: 'Paid Amount',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'status',
                    key: 'payment_status',
                    name: 'payment_status',
                    label: 'Status',
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
        // No Submit Button
    ],
};
