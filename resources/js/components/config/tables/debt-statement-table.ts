/* eslint-disable @typescript-eslint/no-explicit-any */
export const DebtStatementTableConfig = {
    moduleName: "Statement",

    columns: [
        {
            label: 'Date',
            key: 'date',
            type: 'date-time',
            className: 'p-4 border text-center text-gray-600',
            sortable: true
        },
        {
            label: 'Reference',
            key: 'source_ref',
            className: 'p-4 border font-mono font-bold text-gray-800'
        },
        {
            label: 'Due Date',
            key: 'due_date',
            type: 'date-time',
            className: 'p-4 border text-center text-gray-500'
        },
        {
            label: 'Overdue (Days)',
            key: 'days_overdue',
            className: 'p-4 border text-center font-semibold',
            // Simple conditional styling for overdue items
            conditionalClass: (row: any) => row.days_overdue > 0 ? 'text-red-600 bg-red-50' : 'text-green-600'
        },
        {
            label: 'Original Amount',
            key: 'original_amount',
            type: 'currency',
            className: 'p-4 border text-right text-gray-500'
        },
        {
            label: 'Balance Remaining',
            key: 'balance',
            type: 'currency',
            className: 'p-4 border text-right font-black text-gray-800'
        },
        {
            label: 'Status',
            key: 'status', // active, cleared
            type: 'tag-status',
            className: 'p-4 border text-center font-bold'
        },
    ],

    actions: [
        // We can add "View Source Invoice" later if needed
    ],
};
