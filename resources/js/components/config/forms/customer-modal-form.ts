// resources/js/components/config/forms/customer-modal-form.ts
import { CirclePlus } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { permission } from 'process';

// Define the field type to ensure literal types
interface CustomerField {
  id: string;
  key: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email';
  placeholder: string;
  autoFocus?: boolean;
  colSpan: number;
}

export const CustomerModalFormConfig = {
  title: 'Create New Customer',
  description: 'Add or update customer details, including contact info and credit limit.',

  fields: [
    {
      id: 'name',
      key: 'name',
      name: 'name',
      label: 'Customer Name',
      type: 'text' as const,
      placeholder: 'Enter full customer name (Required)',
      autoFocus: true,
      colSpan: 1,
    },
    {
      id: 'number',
      key: 'number',
      name: 'number',
      label: 'Contact Number (Optional)',
      type: 'text' as const,
      placeholder: 'e.g., +1234567890',
      colSpan: 1,
    },
    {
      id: 'email',
      key: 'email',
      name: 'email',
      label: 'Email Address (Optional)',
      type: 'email' as const,
      placeholder: 'e.g., customer@example.com',
      colSpan: 1,
    },
    {
      id: 'credit_limit',
      key: 'credit_limit',
      name: 'credit_limit',
      label: 'Credit Limit (Optional)',
      type: 'number' as const,
      placeholder: 'e.g., 5000.00',
      colSpan: 1,
    },
  ] as CustomerField[],

  buttons: [
    { key: 'cancel', label: 'Cancel', type: 'button', variant: 'outline' },
    { key: 'submit', label: 'Save Customer', type: 'submit', variant: 'default', className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white' },
  ],

  addButton: {
    id: 'add-customer',
    label: 'Add Customer',
    icon: CirclePlus,
    type: 'button',
    variant: 'default',
    className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white',
    permission: 'create-customer',
  },
};
