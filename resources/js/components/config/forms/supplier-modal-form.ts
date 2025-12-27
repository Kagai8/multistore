// resources/js/components/config/forms/supplier-modal-form.ts
import { CirclePlus } from 'lucide-react';

export const SupplierModalFormConfig = {
  title: 'Create New Supplier',
  description: 'Add a new supplier/vendor to your list.',

  // ✅ CORRECT STRUCTURE FOR SimpleModalForm (Flat Array)
  fields: [
    // --- Row 1 & 2: Main Details (2 Columns) ---
    {
      id: 'name',
      key: 'name',
      name: 'name',
      label: 'Supplier Name',
      type: 'text',
      placeholder: 'Enter company name',
      autoFocus: true,
      colSpan: 2, // Half width
    },
    {
      id: 'contact_person',
      key: 'contact_person',
      name: 'contact_person',
      label: 'Contact Person',
      type: 'text',
      placeholder: 'Enter primary contact name',
      colSpan: 2, // Half width
    },
    {
      id: 'phone',
      key: 'phone',
      name: 'phone',
      label: 'Phone Number',
      type: 'text',
      placeholder: 'e.g., 555-123-4567',
      colSpan: 2, // Half width
    },
    {
      id: 'email',
      key: 'email',
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter contact email',
      colSpan: 2, // Half width
    },

    // --- Row 3: Address (Full Width) ---
    {
      id: 'address',
      key: 'address',
      name: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Street, City, Zip/Postal Code',
      rows: 3,
      colSpan: 2, // Full width for address
    },

    // --- Row 4: Status (Full Width, Last Field) ---
    {
      id: 'is_active',
      key: 'is_active',
      name: 'is_active',
      label: 'Active Status',
      type: 'checkbox', // Renders as a checkbox
      placeholder: 'Supplier is currently active and available',
      colSpan: 2, // Full width, placed last
    },

    // --- Hidden Fields (No UI) ---
    {
      id: 'slug',
      key: 'slug',
      name: 'slug',
      label: 'Slug',
      type: 'hidden' // Exclude from UI
    }
  ],

  buttons: [
    { key: 'cancel', label: 'Cancel', type: 'button', variant: 'outline' },
    { key: 'submit', label: 'Save Supplier', type: 'submit', variant: 'default' },
  ],

  addButton: {
    id: 'add-supplier',
    label: 'Add Supplier',
    icon: CirclePlus,
    type: 'button',
    variant: 'default',
    className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white',
    permission: 'create-supplier',
  },
};
