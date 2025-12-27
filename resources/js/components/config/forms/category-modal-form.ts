// resources/js/components/config/forms/category-modal-form.ts

import { CirclePlus } from 'lucide-react';

export const CategoryModalFormConfig = {
  title: 'Create New Category',
  description: 'Organize your products by category.',

  // ✅ CORRECT STRUCTURE FOR SimpleModalForm (Flat Array)
  fields: [
    {
      id: 'name',
      key: 'name',
      name: 'name',
      label: 'Category Name',
      type: 'text',
      placeholder: 'e.g., Electronics, Groceries',
      autoFocus: true,
      colSpan: 2, // Full width for the main name field
    },
    {
      id: 'description',
      key: 'description',
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional: Describe the category',
      rows: 3,
      colSpan: 2, // Full width for the textarea
    },
    {
      id: 'logo',
      key: 'logo',
      name: 'logo',
      label: 'Category Logo (Optional)',
      type: 'file',
      placeholder: 'Upload category image',
      accept: 'image/*',
      colSpan: 2, // Full width, placed last
    },
  ],

  buttons: [
    { key: 'cancel', label: 'Cancel', type: 'button', variant: 'outline' },
    { key: 'submit', label: 'Save Category', type: 'submit', variant: 'default' },
  ],

  addButton: {
    id: 'add-category',
    label: 'Add Category',
    icon: CirclePlus,
    type: 'button',
    variant: 'default',
    className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white',
    permission: 'create-category',
  },
};
