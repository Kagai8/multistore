// resources/js/config/forms/new-stock-entry-modal-form.ts
import { CirclePlus } from "lucide-react";
import { FieldGroup } from "./product-modal-form"; // Use the same FieldGroup interface

export const NewStockEntryModalFormConfig = {
    moduleTitle: 'Manage New Stock Receipts',
    title: 'Record New Stock Receipt',
    description: 'Log the arrival of stock from a supplier into the designated warehouse.',
    addButton: {
        id: 'add-new-stock-entry',
        label: 'Record New Receipt',
        className: 'flex items-center gap-2 bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 cursor-pointer',
        icon: CirclePlus,
        type: 'button',
        variant: 'default',
        permission: 'create-new-stock-entry',
    },

    // Fields are grouped to align with the Product form structure
    fields: [
        // 1. Receipt Details
        {
            header: 'Receipt & Destination Details',
            columns: 3,
            fields: [
                {
                    id: 'entry-invoice-number',
                    key: 'invoice_number',
                    name: 'invoice_number',
                    label: 'Invoice/Reference Number (Optional)',
                    type: 'text',
                    placeholder: 'Enter supplier invoice or reference number',
                    autocomplete: 'off',
                    tabIndex: 1,
                    autoFocus: true,
                    colSpan: 2,
                },
                {
                    // This is the store where the stock is received (the Warehouse)
                    id: 'entry-store',
                    key: 'store_id',
                    name: 'store_id',
                    label: 'Receiving Store',
                    type: 'single-select',
                    optionsSource: 'warehouseStore', // Custom source holding only the warehouse store
                    placeholder: 'Select Warehouse',
                    tabIndex: 2,
                    colSpan: 1,

                },
            ],
        },

        // 2. Product and Quantity
        {
            header: 'Product & Quantity Received',
            columns: 3,
            fields: [
                {
                    id: 'entry-product',
                    key: 'product_id',
                    name: 'product_id',
                    label: 'Product *',
                    type: 'single-select',
                    optionsSource: 'products',
                    placeholder: 'Select Product',
                    tabIndex: 3,
                    colSpan: 1,
                },
                {
                    id: 'entry-supplier',
                    key: 'supplier_id',
                    name: 'supplier_id',
                    label: 'Supplier *',
                    type: 'single-select',
                    optionsSource: 'suppliers',
                    placeholder: 'Select Supplier',
                    tabIndex: 4,
                    colSpan: 1,
                },
                {
                    id: 'entry-quantity',
                    key: 'quantity_received',
                    name: 'quantity_received',
                    label: 'Quantity Received *',
                    type: 'number',
                    placeholder: 'e.g., 100',
                    tabIndex: 5,
                    colSpan: 1,
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
            label: 'Save Receipt',
            variant: 'default',
            className: 'cursor-pointer bg-green-600',
        },
    ],
};
