import { CirclePlus } from "lucide-react";

// 🛑 STEP 1: Define the complete list of modules manually (as requested)
const ALL_MODULES = [
    // Core Admin
    {label: 'Users', value: 'users', key: 'users'},
    {label: 'Roles', value: 'roles', key: 'roles'},
    {label: 'Permissions', value: 'permissions', key: 'permissions'},

    // Inventory Management Goal Modules
    {label: 'Stores', value: 'stores', key: 'stores'},
    {label: 'Customers', value: 'customers', key: 'customers'},
    {label: 'Suppliers', value: 'suppliers', key: 'suppliers'},
    {label: 'Products', value: 'products', key: 'products'},
    {label: 'Categories', value: 'categories', key: 'categories'},
    {label: 'Brands', value: 'brands', key: 'brands'},
    {label: 'Units', value: 'units', key: 'units'},
    {label: 'Stocks', value: 'stocks', key: 'stocks'},
    {label: 'New Stock Entries', value: 'new-stock', key: 'new-stock'},
    {label: 'Stock Adjustments', value: 'stock-adjustments', key: 'stock-adjustments'},
    {label: 'Adjustment Reasons', value: 'adjustment-reasons', key: 'adjustment-reasons'},
    {label: 'Stock Transfers', value: 'stock-transfers', key: 'stock-transfers'},
    {label: 'Stock Transfer Items', value: 'transfer-items', key: 'transfer-items'},
];


export const PermissionModalFormConfig = {
    moduleTitle: 'Manage Permissions',
    title: 'Create Permission',
    description: 'Define a new permission by linking it to a module and giving it a label.',
    addButton: {
        id: 'add-permission',
        label: 'Add Permission',
        className: 'bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 cursor-pointer flex items-center gap-2',
        icon: CirclePlus,
        type: 'button',
        variant: 'default',
        permission: 'create-permission',
    },
    fields: [
        {
            id: 'module',
            key: 'module',
            name: 'module',
            label: 'Associated Module',
            type: 'single-select',
            placeholder: 'Select module name',
            tabIndex: 1,
            autoFocus: true,
            // 🛑 STEP 2: Use the complete, hardcoded options list
            options: ALL_MODULES.map(m => ({ id: m.value, name: m.label })),
        },
        {
            id: 'permission-label',
            key: 'label',
            name: 'label',
            label: 'Permission Label (e.g., Create User)',
            type: 'text',
            placeholder: 'Enter permission label',
            tabIndex: 2,
        },
        {
            id: 'is_active',
            key: 'is_active',
            name: 'is_active',
            label: 'Active Permission',
            type: 'switch', // Use the new 'switch' type
            tabIndex: 3,
            colSpan: 1, // Ensures it doesn't take the full row width
        },
        {
            id: 'description',
            key: 'description',
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter Permission Description',
            tabIndex: 4,
            rows: 2,
            colSpan: 2, // Take up the full width of the row
        },
    ],
    buttons: [
        {
            key: 'cancel',
            type:'button',
            label: 'Cancel',
            variant: 'ghost',
            className: 'cursor-pointer',
        },
        {
            key: 'submit',
            type:'submit',
            label:'Save Permission',
            variant: 'default',
            className: 'cursor-pointer bg-orange-600 hover:bg-orange-700',
        }
    ]
}
