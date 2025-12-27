import { CirclePlus } from 'lucide-react';

export const RoleModalFormConfig = {
    moduleTitle: 'Manage Roles',
    title: 'Create New Role',
    description: 'Define a new user role and assign specific permissions.',
    addButton: {
        id: 'add-role',
        label: 'Add Role',
        className: 'flex items-center gap-2 bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 cursor-pointer',
        icon: CirclePlus,
        type: 'button',
        variant: 'default',
        permission: 'create-role',
    },

    // 🛑 1. FLAT ARRAY OF FIELDS REQUIRED FOR SimpleModalForm
    fields: [
        // --- Role Definition ---
        {
            id: 'role-label',
            key: 'label',
            name: 'label',
            label: 'Role Label *',
            type: 'text',
            placeholder: 'e.g., Administrator, Staff, Viewer',
            autocomplete: 'off',
            tabIndex: 1,
            autoFocus: true,
            colSpan: 1, // Half width
            
        },
        {
            id: 'role-name',
            key: 'name',
            name: 'name',
            label: 'Unique Key (Slug)',
            type: 'text',
            placeholder: 'Auto-generated',
            tabIndex: 2,
            colSpan: 1, // Half width
            disabled: () => true, // Unique key/slug is always disabled/read-only
        },

        // --- Status and Description (Full Width) ---
        {
            id: 'role-is-active',
            key: 'is_active',
            name: 'is_active',
            label: 'Is Active?',
            type: 'checkbox',
            placeholder: 'Role is currently assignable to users',
            tabIndex: 3,
            colSpan: 2, // Full width (span 2 columns)
            // 🛑 SECURITY: Prevent disabling the Super Admin role

        },
        // 🟢 NEW: All Store Access Checkbox
        {
            id: 'role-all-store-access',
            key: 'all_store_access',
            name: 'all_store_access',
            label: 'All Store Access (Bypass Scope)?',
            type: 'checkbox',
            placeholder: 'Grants access to data across all stores (e.g., Accountant, General Manager).',
            tabIndex: 5, // Adjust tab index
            colSpan: 2, // Full width
            // 🛑 SECURITY: The Super Admin role MUST always have all store access, and this field should be disabled for them to prevent accidental removal.

            // 🟢 HINT: If disabled for super-admin, its default value must be TRUE in the backend seed/database if that role exists.
        },
        {
            id: 'role-description',
            key: 'description',
            name: 'description',
            label: 'Description (Optional)',
            type: 'textarea',
            placeholder: 'Briefly describe the role’s permissions or function.',
            tabIndex: 4,
            rows: 3,
            colSpan: 2, // Full width (span 2 columns)
        },

        // --- 🛡️ Permissions Matrix ---
        {
            id: 'role-permissions',
            key: 'permissions',
            name: 'permissions',
            label: 'Assign Permissions',
            type: 'grouped-checkboxes', // ⬅️ Custom render type
            // ✅ FIX: Match the key passed from RoleController
            optionsSource: 'permissionsGrouped',
            colSpan: 2, // Full width for the checkboxes layout
            tabIndex: 5,

        },
    ],

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
            label: 'Save Role',
            variant: 'default',
            className: 'cursor-pointer bg-orange-600',
        },
    ],
};
