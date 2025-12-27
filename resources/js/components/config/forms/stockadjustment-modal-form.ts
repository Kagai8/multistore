// resources/js/config/forms/stock-adjustment-form.ts

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Repeat2 } from "lucide-react";
import { FieldGroup } from './product-modal-form'; // Re-use the interface

export const StockAdjustmentFormConfig = {
    moduleTitle: 'Manage Inventory',
    title: 'New Stock Adjustment Transaction',
    description: 'Log an increase (IN) or decrease (OUT) to the current stock level. This action is irreversible.',

    // Note: This form is typically opened from the Stock Index table via an action button,
    // so it doesn't need a standalone 'addButton' config.

    fields: [
        // 1. Transaction Details
        {
            header: 'Transaction Details',
            columns: 3,
            fields: [
                {
                    id: 'current-stock-level',
                    key: 'current_stock_display',
                    name: 'current_stock',
                    label: 'Current Stock Level',
                    type: 'number',
                    placeholder: 'N/A',
                    colSpan: 1,
                    // The component will display the current value, but the field itself should be disabled.
                    disabled: () => true,
                },
                {
                    id: 'adjustment-type',
                    key: 'type',
                    name: 'type',
                    label: 'Adjustment Type',
                    type: 'single-select',
                    optionsSource: 'adjustmentTypes', // Hardcoded options
                    placeholder: 'Select IN or OUT',
                    colSpan: 1,
                },
                {
                    id: 'adjustment-quantity',
                    key: 'quantity',
                    name: 'quantity',
                    label: 'Adjustment Quantity *',
                    type: 'number',
                    placeholder: 'Enter quantity',
                    colSpan: 1,
                },
                {
                    id: 'adjustment-reason',
                    key: 'adjustment_reason_id',
                    name: 'adjustment_reason_id',
                    label: 'Reason for Adjustment *',
                    type: 'single-select',
                    optionsSource: 'adjustmentReasons', // Will be passed from the controller via Inertia props
                    placeholder: 'Select Reason',
                    colSpan: 3,
                },
                {
                    id: 'adjustment-notes',
                    key: 'notes',
                    name: 'notes',
                    label: 'Notes / Explanation',
                    type: 'textarea',
                    placeholder: 'Provide detailed notes (e.g., reason for damage, inventory count variance)',
                    rows: 3,
                    colSpan: 3,
                },
            ],
        },
    ] as FieldGroup[], // Assertion for TypeScript

    // Hardcoded options for Adjustment Type (IN/OUT)
    extraData: {
        adjustmentTypes: [
            { id: 'in', name: 'IN (Increase Stock)' },
            { id: 'out', name: 'OUT (Decrease Stock)' },
        ],
    },

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
            label: 'Process Adjustment',
            variant: 'default',
            className: 'cursor-pointer bg-purple-600 hover:bg-purple-700',
        },
    ],
};
