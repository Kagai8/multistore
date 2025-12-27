// resources/js/config/forms/product-modal-form.ts
import { CirclePlus } from "lucide-react";

// 🟢 Re-export the new FieldGroup interface for use in the component
export interface FieldGroup {
    header: string;
    fields: Array<{
        id: string;
        key: string;
        name: string;
        label: string;
        type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'file' | 'multi-file' | 'single-select' | 'multi-select' | 'checkbox' | 'tag-input' | 'hidden';
        placeholder?: string;
        autocomplete?: string;
        tabIndex?: number;
        autoFocus?: boolean;
        rows?: number;
        accept?: string;
        className?: string;
        optionsSource?: string;
        colSpan?: number;
    }>;
    columns: number;
}


export const ProductModalFormConfig = {
    moduleTitle: 'Manage Products',
    title: 'Create New Product',
    description: 'Provide core details, relationships, pricing, and media for the product.',
    addButton: {
        id: 'add-product',
        label: 'Add Product',
        className: 'flex items-center gap-2 bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 cursor-pointer',
        icon: CirclePlus,
        type: 'button',
        variant: 'default',
        permission: 'create-product',
    },

    // 🟢 Fields are now grouped
    fields: [
        // 1. Core Identity
        {
            header: 'Core Details',
            columns: 3,
            fields: [
                {
                    id: 'product-name',
                    key: 'name',
                    name: 'name',
                    label: 'Product Name',
                    type: 'text',
                    placeholder: 'Enter product name',
                    autocomplete: 'off',
                    tabIndex: 1,
                    autoFocus: true,
                    colSpan: 2, // Spans 2 columns
                },
                {
                    id: 'product-sku',
                    key: 'sku',
                    name: 'sku',
                    label: 'SKU (Stock Keeping Unit)',
                    type: 'text',
                    placeholder: 'This will be auto-generated upon creation',
                    autocomplete: 'off',
                    tabIndex: 2,
                    colSpan: 1,
                    disabled: () => true,
                },
                {
                    id: 'product-barcode',
                    key: 'barcode',
                    name: 'barcode',
                    label: 'Barcode (optional)',
                    type: 'text',
                    placeholder: 'Enter barcode number',
                    autocomplete: 'off',
                    tabIndex: 3,
                    colSpan: 1,
                },
                {
                    id: 'product-weight',
                    key: 'weight',
                    name: 'weight',
                    label: 'Weight (kg)',
                    type: 'number',
                    placeholder: 'e.g., 0.5',
                    tabIndex: 4,
                    colSpan: 1,
                },
                {
                    id: 'product-colors',
                    key: 'colors',
                    name: 'colors',
                    label: 'Colors (comma or enter)',
                    type: 'tag-input', // We'll use this custom type later
                    placeholder: 'e.g., red, blue',
                    tabIndex: 5,
                    colSpan: 1,
                },
            ],
        },

        // 2. Relationships
        {
            header: 'Relationships',
            columns: 4,
            fields: [
                {
                    id: 'product-category',
                    key: 'category_id',
                    name: 'category_id',
                    label: 'Category',
                    type: 'single-select',
                    optionsSource: 'categories',
                    placeholder: 'Select Category',
                    tabIndex: 6,
                },
                {
                    id: 'product-brand',
                    key: 'brand_id',
                    name: 'brand_id',
                    label: 'Brand',
                    type: 'single-select',
                    optionsSource: 'brands',
                    placeholder: 'Select Brand',
                    tabIndex: 7,
                },
                {
                    id: 'product-unit',
                    key: 'unit_id',
                    name: 'unit_id',
                    label: 'Unit',
                    type: 'single-select',
                    optionsSource: 'units',
                    placeholder: 'Select Unit',
                    tabIndex: 8,
                },
                {
                    id: 'product-supplier',
                    key: 'supplier_id',
                    name: 'supplier_id',
                    label: 'Supplier',
                    type: 'single-select',
                    optionsSource: 'suppliers',
                    placeholder: 'Select Supplier',
                    tabIndex: 9,
                },
            ],
        },

        // 3. Pricing
        {
            header: 'Pricing & Discounts',
            columns: 4,
            fields: [
                {
                    id: 'product-buying-price',
                    key: 'buying_price',
                    name: 'buying_price',
                    label: 'Buying Price (Cost)',
                    type: 'number',
                    placeholder: 'e.g., 50.00',
                    tabIndex: 10,
                },
                {
                    id: 'product-retail-price',
                    key: 'retail_price',
                    name: 'retail_price',
                    label: 'Retail Price *',
                    type: 'number',
                    placeholder: 'e.g., 100.00',
                    tabIndex: 11,
                },
                {
                    id: 'product-special-price', // 🟢 ADDED
                    key: 'special_price', // 🟢 ADDED
                    name: 'special_price',
                    label: 'Special Price (Optional)',
                    type: 'number',
                    placeholder: 'e.g., 450.00',
                },
                {
                    id: 'product-wholesale-price',
                    key: 'wholesale_price',
                    name: 'wholesale_price',
                    label: 'Wholesale Price (optional)',
                    type: 'number',
                    placeholder: 'e.g., 80.00',
                    tabIndex: 12,
                },
                {
                    id: 'product-discount',
                    key: 'discount',
                    name: 'discount',
                    label: 'Discount Amount/Rate',
                    type: 'number',
                    placeholder: 'e.g., 10.00',
                    tabIndex: 13,
                },
            ],
        },

        // 4. Description and Status
        {
            header: 'Description and Status',
            columns: 3,
            fields: [
                {
                    id: 'product-description',
                    key: 'description',
                    name: 'description',
                    label: 'Description',
                    type: 'textarea',
                    placeholder: 'Detailed product description (optional)',
                    tabIndex: 14,
                    rows: 5,
                    colSpan: 3,
                },
                {
                    id: 'product-is-active',
                    key: 'is_active',
                    name: 'is_active',
                    label: 'Is Active?',
                    type: 'checkbox',
                    placeholder: 'Product is visible and purchasable',
                    tabIndex: 15,
                },
                {
                    id: 'product-is-purchasable',
                    key: 'is_purchasable',
                    name: 'is_purchasable',
                    label: 'Is Purchasable?',
                    type: 'checkbox',
                    placeholder: 'Can be added to a sales order',
                    tabIndex: 16,
                },
                {
                    id: 'existing-multi-images-hidden',
                    key: 'existing_multi_images',
                    name: 'existing_multi_images',
                    label: 'Existing Images',
                    type: 'hidden',
                    // This is a placeholder for the component to pass the existing image URLs back to the controller during an update.
                    // The main component handles setting this in 'edit' mode.
                },
            ],
        },

        // 5. Images
        {
            header: 'Product Media',
            columns: 2,
            fields: [
                {
                    id: 'product-main-image',
                    key: 'main_image',
                    name: 'main_image',
                    label: 'Main Image (required for listing)',
                    type: 'file',
                    accept: 'image/*',
                    tabIndex: 17,
                },
                {
                    id: 'product-multi-images',
                    key: 'multi_images',
                    name: 'multi_images',
                    label: 'Additional Images (optional)',
                    type: 'multi-file',
                    accept: 'image/*',
                    tabIndex: 18,
                },
            ],
        },

    ] as FieldGroup[], // Assertion for TypeScript

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
            label: 'Save Product',
            variant: 'default',
            className: 'cursor-pointer bg-orange-600',
        },
    ],
};
