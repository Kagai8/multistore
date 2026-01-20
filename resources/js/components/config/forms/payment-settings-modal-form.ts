import { Settings } from 'lucide-react';

export const PaymentSettingsModalFormConfig = {
  title: 'Payment Configuration',
  description: 'Manage M-Pesa Paybills or Tills for this store.',

  fields: [
    // --- Row 1: Provider (e.g. M-Pesa) ---
    {
      id: 'provider',
      key: 'provider',
      name: 'provider',
      label: 'Provider',
      type: 'select',
      options: [
        { value: 'mpesa', label: 'M-Pesa (Safaricom)' },
        // Add Stripe/PayPal later
      ],
      placeholder: 'Select Provider',
      colSpan: 2,
    },

    // --- Row 2: The Critical Check (Paybill vs Till) ---
    {
      id: 'type',
      key: 'type',
      name: 'type',
      label: 'Account Type',
      type: 'select', // Or 'radio' if your form supports it
      options: [
        { value: 'paybill', label: 'Paybill (Requires Account No.)' },
        { value: 'till', label: 'Till Number (Buy Goods)' },
      ],
      placeholder: 'Select Type',
      colSpan: 1,
    },
    {
      id: 'business_number',
      key: 'business_number',
      name: 'business_number',
      label: 'Business Number',
      type: 'text',
      placeholder: 'Paybill or Till Number',
      colSpan: 1,
    },

    // --- Row 3: Account Number (Specific to Paybill) ---
    {
      id: 'account_number',
      key: 'account_number',
      name: 'account_number',
      label: 'Default Account Number',
      type: 'text',
      // Helper text to explain this is ignored for Tills
      placeholder: 'Required for Paybill (e.g. RENT). Leave empty for Till.',
      colSpan: 2,
    },

    // --- Row 4: Credentials ---
    {
      id: 'consumer_key',
      key: 'consumer_key',
      name: 'consumer_key',
      label: 'Consumer Key',
      type: 'text',
      placeholder: 'From Safaricom Dev Portal',
      colSpan: 1,
    },
    {
      id: 'consumer_secret',
      key: 'consumer_secret',
      name: 'consumer_secret',
      label: 'Consumer Secret',
      type: 'password',
      placeholder: 'From Safaricom Dev Portal',
      colSpan: 1,
    },
    {
      id: 'passkey',
      key: 'passkey',
      name: 'passkey',
      label: 'LNM Passkey',
      type: 'password',
      placeholder: 'Used for STK Push',
      colSpan: 2,
    },

    // --- Row 5: Active Status ---
    {
      id: 'is_active',
      key: 'is_active',
      name: 'is_active',
      label: 'Enable this Payment Method',
      type: 'checkbox',
      colSpan: 2,
    },
  ],

  buttons: [
    { key: 'cancel', label: 'Cancel', type: 'button', variant: 'outline' },
    { key: 'submit', label: 'Save Configuration', type: 'submit', variant: 'default' },
  ],

  addButton: {
    id: 'add-setting',
    label: 'Add Configuration',
    icon: Settings,
    type: 'button',
    variant: 'default',
    className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white',
    permission: 'manage-payment-settings',
  },
};
