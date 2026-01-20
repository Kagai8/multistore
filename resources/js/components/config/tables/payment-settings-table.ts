import { Badge } from '@/components/ui/badge';
import { Smartphone, CreditCard, Banknote, Pencil, Trash2 } from 'lucide-react'; // 🟢 1. Import Icons

export const PaymentSettingsTableConfig = {
  moduleName: 'Payment Method',

  columns: [
    {
      key: 'provider',
      label: 'Provider',
      sortable: true,
    },
    {
      key: 'business_number',
      label: 'Business / Paybill No.',
      sortable: true
    },
    {
      key: 'account_type',
      label: 'Type',
      sortable: true
    },
    {
      key: 'environment',
      label: 'Env',
      sortable: true,
      render: (value: string) => value === 'live' ? 'Production' : 'Sandbox'
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      type: 'boolean'
    },
    // 🟢 2. ADD THIS COLUMN (This tells the table where to put the buttons)
    {
      key: 'actions',
      label: 'Actions',
      isAction: true,
    }
  ],

  actions: [
    // 🟢 3. ADD ICONS & STYLING
    {
      label: 'Edit',
      icon: Pencil,
     className: 'flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
      action: 'edit'
    },
    {
      label: 'Delete',
      icon: Trash2,
      className: 'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
      action: 'delete'
    },
  ],
};
