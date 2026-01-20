import { ShoppingCart } from "lucide-react";

// Re-export interface
export interface FieldGroup {
    header: string;
    fields: Array<{
        id: string;
        key: string;
        name: string;
        label: string;
        type: 'text' | 'number' | 'email' | 'textarea' | 'single-select' | 'date';
        placeholder?: string;
        tabIndex?: number;
        autoFocus?: boolean;
        rows?: number;
        optionsSource?: string; // 'suppliers', 'stores'
        colSpan?: number;
        disabled?: boolean | ((mode: 'create' | 'view' | 'edit') => boolean);
    }>;
    columns: number;
}

export const PurchaseOrderFormConfig = {
    moduleTitle: 'Procurement',
    title: 'Purchase Order',
    description: 'Create a request to purchase stock from a supplier.',

    addButton: {
        id: 'create-po',
        label: 'Create Purchase Order',
        className: 'flex items-center gap-2 bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 cursor-pointer',
        icon: ShoppingCart,
        type: 'button',
        variant: 'default',
        permission: 'create-purchase-order',
    },

    fields: [
        // 1. ORDER DETAILS
        {
            header: 'Order Details',
            columns: 2,
            fields: [
                {
                    id: 'supplier',
                    key: 'supplier_id',
                    name: 'supplier_id',
                    label: 'Supplier *',
                    type: 'single-select',
                    optionsSource: 'suppliers',
                    placeholder: 'Select Supplier',
                    tabIndex: 1,
                    autoFocus: true,
                    colSpan: 1,
                    disabled: (mode) => mode !== 'create' && mode !== 'edit',
                },
                {
                    id: 'store',
                    key: 'store_id',
                    name: 'store_id',
                    label: 'Destination Store *',
                    type: 'single-select',
                    optionsSource: 'stores',
                    placeholder: 'Receiving Warehouse/Store',
                    tabIndex: 2,
                    colSpan: 1,
                    disabled: (mode) => mode !== 'create' && mode !== 'edit',
                },
                {
                    id: 'order-date',
                    key: 'order_date',
                    name: 'order_date',
                    label: 'Order Date *',
                    type: 'date',
                    tabIndex: 3,
                    colSpan: 1,
                },
                {
                    id: 'expected-date',
                    key: 'expected_delivery_date',
                    name: 'expected_delivery_date',
                    label: 'Expected Delivery',
                    type: 'date',
                    tabIndex: 4,
                    colSpan: 1,
                },
                {
                    id: 'po-number',
                    key: 'po_number',
                    name: 'po_number',
                    label: 'PO Number',
                    type: 'text',
                    placeholder: 'Auto-generated',
                    colSpan: 2,
                    disabled: true,
                },
            ],
        },

        // 2. NOTES
        {
            header: 'Instructions',
            columns: 1,
            fields: [
                {
                    id: 'notes',
                    key: 'notes',
                    name: 'notes',
                    label: 'Notes / Payment Terms',
                    type: 'textarea',
                    placeholder: 'E.g., Payment due 30 days after delivery...',
                    rows: 2,
                    colSpan: 1,
                },
            ],
        },

        // 3. AUDIT TRAIL (View Mode Only)
        {
            header: 'Workflow Audit',
            columns: 3,
            fields: [
                // Created
                {
                    id: 'created-by',
                    key: 'created_by',
                    name: 'created_by',
                    label: 'Created By',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                // Approved/Ordered
                {
                    id: 'approved-by',
                    key: 'approved_by',
                    name: 'approved_by',
                    label: 'Approved/Ordered By',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
                // Received
                {
                    id: 'received-by',
                    key: 'received_by',
                    name: 'received_by',
                    label: 'Received By',
                    type: 'text',
                    colSpan: 1,
                    disabled: true,
                },
            ],
        }
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
            label: 'Save Draft', // Clarifies that this doesn't send it yet
            variant: 'default',
            className: 'cursor-pointer bg-orange-600',
        },
    ],
};
