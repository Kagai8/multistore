// resources/js/components/config/forms/store-modal-form.ts
import { CirclePlus } from 'lucide-react';
import { permission } from 'process';

export const StoreModalFormConfig = {
  title: 'Create New Store/Location',
  description: 'Add or update store details. A unique code will be automatically generated.',

  fields: [
    {
      id: 'name',
      key: 'name',
      name: 'name',
      label: 'Store Name (Required)',
      type: 'text',
      placeholder: 'e.g., Main Street Branch',
      autoFocus: true,
      colSpan: 1,
    },
    {
      id: 'type',
      key: 'type',
      name: 'type',
      label: 'Store Type (Required) *',
      type: 'single-select', // Use single-select for controlled options
      placeholder: 'Select Store Type',
      // CRITICAL: Explicitly define options for the enum
      options: [
          { id: 'warehouse', name: 'Warehouse/Inventory Hub' },
          { id: 'retail', name: 'Retail Outlet/Shop' },
      ],
      colSpan: 1,
    },
    {
      id: 'phone',
      key: 'phone',
      name: 'phone',
      label: 'Contact Number (Optional)',
      type: 'text',
      placeholder: 'Store phone number',
      colSpan: 1,
    },
    {
      id: 'email',
      key: 'email',
      name: 'email',
      label: 'Email Address (Optional)',
      type: 'email',
      placeholder: 'store@example.com',
      colSpan: 1,
    },
    {
      id: 'address',
      key: 'address',
      name: 'address',
      label: 'Physical Address (Optional)',
      type: 'textarea', // Use textarea for multi-line address
      placeholder: 'Full physical address',
      colSpan: 2, // Span two columns for the address
    },
  ],

  buttons: [
    { key: 'cancel', label: 'Cancel', type: 'button', variant: 'outline' },
    { key: 'submit', label: 'Save Store', type: 'submit', variant: 'default', className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white' },
  ],

  addButton: {
    id: 'add-store',
    label: 'Add Store',
    icon: CirclePlus,
    type: 'button',
    variant: 'default',
    className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white',
    permission: 'create-store',
  },
};
