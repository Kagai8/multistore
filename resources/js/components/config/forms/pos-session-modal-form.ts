// Re-export interface for consistency
export interface FieldGroup {
    header: string;
    fields: Array<{
        id: string;
        key: string;
        name: string;
        label: string;
        type: 'text' | 'textarea';
        colSpan?: number;
        disabled?: boolean;
    }>;
    columns: number;
}

export const PosSessionFormConfig = {
    moduleTitle: 'POS Sessions',
    title: 'Shift Details',
    description: 'Audit log of cash drawer activity.',
    addButton: null,

    fields: [
        // 1. SESSION INFO
        {
            header: 'Session Info',
            columns: 2,
            fields: [
                {
                    id: 'session-id',
                    key: 'id',
                    name: 'id',
                    label: 'Session ID',
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
                {
                    id: 'user',
                    key: 'user_name',
                    name: 'user_name',
                    label: 'Cashier',
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
                    id: 'start',
                    key: 'start_time',
                    name: 'start_time',
                    label: 'Opened At',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'end',
                    key: 'end_time',
                    name: 'end_time',
                    label: 'Closed At',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
            ],
        },

        // 2. CASH RECONCILIATION
        {
            header: 'Cash Drawer Audit',
            columns: 3,
            fields: [
                {
                    id: 'opening',
                    key: 'opening_cash',
                    name: 'opening_cash',
                    label: 'Opening Float',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'closing',
                    key: 'closing_cash',
                    name: 'closing_cash',
                    label: 'Closing Count',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                {
                    id: 'diff',
                    key: 'cash_difference',
                    name: 'cash_difference',
                    label: 'Discrepancy (+/-)',
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
                    label: 'Closing Notes / Reasons',
                    type: 'textarea',
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
