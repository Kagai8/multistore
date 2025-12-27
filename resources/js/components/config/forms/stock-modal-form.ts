// resources/js/config/forms/stock-modal-form.ts
import { FieldGroup } from "./product-modal-form"; // Reusing the FieldGroup interface

export const StockModalFormConfig = {
    moduleTitle: 'Manage Inventory Levels',
    // 💡 No Add Button (CREATE is done via Purchase Receipt)
    title: 'Update Reorder Policy',
    description: 'Adjust the minimum stock threshold and replenishment quantity for this location/product.',

    // Fields are now grouped
    fields: [
        // 1. Core Identity (Read-only display of location and product)
        {
            header: 'Inventory Location',
            columns: 2,
            fields: [
                {
                    id: 'stock-store-name',
                    key: 'store_name',
                    name: 'store_name',
                    label: 'Store Name (Read-Only)',
                    type: 'text',
                    disabled: () => true, // Always disabled
                    colSpan: 1,
                },
                {
                    id: 'stock-product-name',
                    key: 'product_name',
                    name: 'product_name',
                    label: 'Product Name (Read-Only)',
                    type: 'text',
                    disabled: () => true, // Always disabled
                    colSpan: 1,
                },
                {
                    id: 'stock-current-stock',
                    key: 'current_stock',
                    name: 'current_stock',
                    label: 'Current Quantity (Read-Only)',
                    type: 'number',
                    disabled: () => true, // Always disabled
                    colSpan: 2,
                    className: 'font-bold text-blue-600'
                },
            ],
        },

        // 2. Editable Policy Fields
        {
            header: 'Reorder Policy Settings',
            columns: 2,
            fields: [
                {
                    id: 'stock-reorder-level',
                    key: 'reorder_level',
                    name: 'reorder_level',
                    label: 'Reorder Level (Units)',
                    type: 'number',
                    placeholder: 'Minimum stock count to trigger an alert.',
                    tabIndex: 1,
                    autoFocus: true,
                    colSpan: 1,
                },
                {
                    id: 'stock-reorder-qty',
                    key: 'reorder_quantity',
                    name: 'reorder_quantity',
                    label: 'Reorder Quantity (Batch Size)',
                    type: 'number',
                    placeholder: 'How many units to order/transfer.',
                    tabIndex: 2,
                    colSpan: 1,
                },
                // Hidden fields to send the FKs back to the controller for update logic
                {
                    id: 'stock-id',
                    key: 'id',
                    name: 'id',
                    label: 'ID',
                    type: 'hidden',
                },
            ],
        },

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
            label: 'Save Policy',
            variant: 'default',
            className: 'cursor-pointer bg-green-600',
        },
    ],
};
