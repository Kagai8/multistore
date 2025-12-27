import { CirclePlus } from "lucide-react";
// Assuming FieldGroup is imported from the ComplexModalForm component or defined nearby
import { FieldGroup } from "@/components/complex-modal-form";

export const UserModalFormConfig = {
    moduleTitle: 'Manage Users',
    title: 'Create New User',
    description: 'Provide core user credentials and assign their system role and store location.',
    addButton: {
        id: 'add-user',
        label: 'Add User',
        className: 'flex items-center gap-2 bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 cursor-pointer',
        icon: CirclePlus,
        type: 'button',
        variant: 'default',
        permission: 'create-user',
    },

    fields: [
        // 1. Core Identity & Credentials
        {
            header: 'Core Details & Authentication',
            columns: 2,
            fields: [
                {
                    id: 'user-name',
                    key: 'name',
                    name: 'name',
                    label: 'Full Name',
                    type: 'text',
                    placeholder: 'Enter user full name',
                    autocomplete: 'name',
                    tabIndex: 1,
                    autoFocus: true,
                    colSpan: 1,
                },
                {
                    id: 'user-email',
                    key: 'email',
                    name: 'email',
                    label: 'Email Address',
                    type: 'email',
                    placeholder: 'Enter unique email address',
                    autocomplete: 'email',
                    tabIndex: 2,
                    colSpan: 1,
                },
                {
                    id: 'user-password',
                    key: 'password',
                    name: 'password',
                    label: 'Password',
                    type: 'password',
                    placeholder: 'Only required for creation or if resetting',
                    autocomplete: 'new-password',
                    tabIndex: 3,
                    colSpan: 1,
                    // Hide password field in edit/view modes (default practice)
                    disabled: (mode) => mode !== 'create',
                },
                {
                    id: 'user-password-confirmation',
                    key: 'password_confirmation',
                    name: 'password_confirmation',
                    label: 'Confirm Password',
                    type: 'password',
                    placeholder: 'Confirm new password',
                    autocomplete: 'new-password',
                    tabIndex: 4,
                    colSpan: 1,
                    // Hide password confirmation field in edit/view modes
                    disabled: (mode) => mode !== 'create',
                },
            ],
        },

        // 2. Organization & Authorization
        {
            header: 'Role and Location',
            columns: 2,
            fields: [
                {
                    id: 'user-role',
                    key: 'role_id',
                    name: 'role_id',
                    label: 'Assigned Role *',
                    type: 'single-select',
                    optionsSource: 'roles', // Will fetch roles from the API
                    placeholder: 'Select User Role',
                    tabIndex: 5,
                    colSpan: 1,
                    // 🛑 SECURITY: Prevent changing the role of the Super Admin (ID 1)
                    disabled: (mode, data) => mode === 'edit' && data?.id === 1,
                },
                {
                    id: 'user-store',
                    key: 'store_id',
                    name: 'store_id',
                    label: 'Assigned Store *',
                    type: 'single-select',
                    optionsSource: 'stores', // Will fetch stores from the API
                    placeholder: 'Select Default Store',
                    tabIndex: 6,
                    colSpan: 1,
                    // 🛑 SECURITY: Prevent changing the store of the Super Admin (ID 1)
                    disabled: (mode, data) => mode === 'edit' && data?.id === 1,
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
            label: 'Save User',
            variant: 'default',
            className: 'cursor-pointer bg-orange-600',
        },
    ],
};
