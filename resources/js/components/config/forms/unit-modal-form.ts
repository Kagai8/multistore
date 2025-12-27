// resources/js/components/config/forms/unit-modal-form.ts
import { CirclePlus } from 'lucide-react';
import { permission } from 'process';

export const UnitModalFormConfig = {
  title: 'Create New Unit',
  description: 'Define a unit of measure (e.g., kg, dozen, item).',

  // ✅ CORRECT STRUCTURE FOR SimpleModalForm (Flat Array)
  fields: [
    {
      id: 'name',
      key: 'name',
      name: 'name',
      label: 'Unit Name',
      type: 'text',
      placeholder: 'e.g., Kilogram (KG)',
      autoFocus: true,
      colSpan: 2, // Take full width
    },
    {
      id: 'code',
      key: 'code',
      name: 'code',
      label: 'Unit Code',
      type: 'text',
      placeholder: 'e.g., KG, DZ, PCS',
      autoFocus: false, // Only one field should be autoFocus
      colSpan: 2, // Take full width
    },
  ],

  buttons: [
    { key: 'cancel', label: 'Cancel', type: 'button', variant: 'outline' },
    { key: 'submit', label: 'Save Unit', type: 'submit', variant: 'default' },
  ],

  addButton: {
    id: 'add-unit',
    label: 'Add Unit',
    icon: CirclePlus,
    type: 'button',
    variant: 'default',
    className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white',
    permission: 'create-unit',
  },
};
