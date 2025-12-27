// resources/js/components/config/forms/brand-modal-form.ts

import { CirclePlus } from 'lucide-react';


export const BrandModalFormConfig = {
  title: 'Create New Brand',
  description: 'Add or update brand details.',

  // ✅ UPDATED FIELD ORDER FOR CLEAN 2-COLUMN LAYOUT
  fields: [
    {
      id: 'name',
      key: 'name',
      name: 'name',
      label: 'Brand Name',
      type: 'text',
      placeholder: 'Enter brand name',
      autoFocus: true,
      colSpan: 2,
    },
    // The description field (colSpan: 2) should go here to ensure the name field is filled before it takes the full row.
    {
      id: 'description',
      key: 'description',
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional: Describe the brand',
      rows: 3,
      colSpan: 2, // Takes the full width of the 2-column grid
    },
    // The file field (logo) is now LAST, as requested.
    {
      id: 'logo',
      key: 'logo',
      name: 'logo',
      label: 'Brand Logo',
      type: 'file',
      placeholder: 'Upload logo image',
      accept: 'image/*',
      colSpan: 2, // File fields often look better taking full width
    },
  ],

  buttons: [
    { key: 'cancel', label: 'Cancel', type: 'button', variant: 'outline' },
    { key: 'submit', label: 'Save Brand', type: 'submit', variant: 'default', className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white' },
  ],

  addButton: {
    id: 'add-brand',
    label: 'Add Brand',
    icon: CirclePlus,
    type: 'button',
    variant: 'default',
    className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white',
    permission: 'create-brand',
  },
};
