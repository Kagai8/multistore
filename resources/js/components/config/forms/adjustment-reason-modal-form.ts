import { CirclePlus } from 'lucide-react';

export const AdjustmentReasonModalFormConfig = {
  title: 'Create New Adjustment Reason',
  description: 'Define the reason for the stock change (e.g., Damage, Count Error).',

  fields: [
    {
      id: 'name',
      key: 'name',
      name: 'name',
      label: 'Reason Name',
      type: 'text',
      placeholder: 'e.g., Spoilage, Theft, Cycle Count Error',
      autoFocus: true,
      colSpan: 2,
    },
    {
      id: 'description',
      key: 'description',
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional: Provide a detailed explanation of when this reason should be used',
      rows: 3,
      colSpan: 2,
    },
    // Added the boolean field for status tracking
    {
      id: 'is_active',
      key: 'is_active',
      name: 'is_active',
      label: 'Active Status',
      type: 'switch',
      colSpan: 2,
    },
  ],

  buttons: [
    { key: 'cancel', label: 'Cancel', type: 'button', variant: 'outline' },
    { key: 'submit', label: 'Save Reason', type: 'submit', variant: 'default', className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white' },
  ],

  addButton: {
    id: 'add-reason',
    label: 'Add Reason',
    icon: CirclePlus,
    type: 'button',
    variant: 'default',
    className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white',
    permission: 'create-adjustment-reason', // Add the permission key here
  },
};
