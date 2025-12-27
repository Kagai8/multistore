// resources/js/config/forms/stock-adjustment-request-modal-form.ts
import { PlusCircle } from 'lucide-react';

// Re-use the same FieldGroup interface pattern
export interface FieldGroup {
  header: string;
  fields: Array<{
    id: string;
    key: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'file' | 'multi-file' | 'single-select' | 'multi-select' | 'checkbox' | 'tag-input' | 'hidden' | 'date';
    placeholder?: string;
    autocomplete?: string;
    tabIndex?: number;
    autoFocus?: boolean;
    rows?: number;
    accept?: string;
    className?: string;
    optionsSource?: string;
    colSpan?: number;
    disabled?: boolean | ((mode: 'create' | 'view' | 'edit', userContext?: { store_id: number | null; is_global_user: boolean } | null) => boolean);
  }>;
  columns: number;
}

export const StockAdjustmentRequestFormConfig = {
  moduleTitle: 'Stock Management',
  title: 'Request Manual Stock Adjustment',
  description: 'Submit a request to adjust inventory levels for a product in a store. Requires approval before stock is updated.',
  addButton: {
    id: 'add-adjustment-request',
    label: 'Request Stock Adjustment',
    className: 'flex items-center gap-2 bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 cursor-pointer',
    icon: PlusCircle,
    type: 'button',
    variant: 'default',
    permission: 'create-stock-adjustment-request',
  },

  fields: [
    // 1. Adjustment Core Details
    {
      header: 'Adjustment Details',
      columns: 2,
      fields: [
        {
          id: 'adjustment-store',
          key: 'store_id',
          name: 'store_id',
          label: 'Store *',
          type: 'single-select',
          optionsSource: 'stores',
          placeholder: 'Select store',
          tabIndex: 1,
          autoFocus: true,
          colSpan: 1,
          disabled: (mode, userContext) => {
            const isGlobalUser = userContext?.is_global_user ?? false;
            return mode === 'create' && !isGlobalUser;
          },
        },
        {
          id: 'adjustment-product',
          key: 'product_id',
          name: 'product_id',
          label: 'Product *',
          type: 'single-select',
          optionsSource: 'products',
          placeholder: 'Select product',
          tabIndex: 2,
          colSpan: 1,
        },
        // 🟢 NEW: Read-Only Current Stock Field
        {
            id: 'current-stock-display',
            key: 'current_stock_display', // We will populate this in React
            name: 'current_stock_display',
            label: 'Current Stock On Hand',
            type: 'text',
            placeholder: '---',
            disabled: true, // Always disabled, just for viewing
            className: 'bg-gray-100 font-bold text-gray-700', // Make it look like a stat
            colSpan: 1,
        },
        {
          id: 'adjustment-reason',
          key: 'adjustment_reason_id',
          name: 'adjustment_reason_id',
          label: 'Adjustment Reason *',
          type: 'single-select',
          optionsSource: 'adjustmentReasons',
          placeholder: 'Select reason',
          tabIndex: 3,
          colSpan: 1,
        },
        {
          id: 'adjustment-quantity',
          key: 'quantity',
          name: 'quantity',
          label: 'Quantity *',
          type: 'number',
          placeholder: 'Enter quantity (use negative for reduction)',
          tabIndex: 4,
          colSpan: 1,
        },
      ],
    },

    // 2. Notes
    {
      header: 'Notes',
      columns: 1,
      fields: [
        {
          id: 'adjustment-notes',
          key: 'notes',
          name: 'notes',
          label: 'Internal Notes',
          type: 'textarea',
          placeholder: 'e.g., spoilage, theft, miscount, etc.',
          tabIndex: 5,
          rows: 3,
          colSpan: 1,
        },
      ],
    },

    // 3. Workflow & Audit (View Mode Only)
    {
      header: 'Workflow & Audit',
      columns: 3,
      fields: [
        {
          id: 'requester-name',
          key: 'requester.name',
          name: 'requester.name',
          label: 'Requested By',
          type: 'text',
          colSpan: 1,
          disabled: true,
        },
        {
          id: 'requested-at',
          key: 'created_at',
          name: 'created_at',
          label: 'Requested At',
          type: 'text',
          colSpan: 1,
          disabled: true,
        },
        {
          id: 'current-status',
          key: 'status',
          name: 'status',
          label: 'Current Status',
          type: 'text',
          colSpan: 1,
          disabled: true,
        },
        {
          id: 'approver-name',
          key: 'approver.name',
          name: 'approver.name',
          label: 'Approved By',
          type: 'text',
          colSpan: 1,
          disabled: true,
        },
        {
          id: 'approved-at',
          key: 'approved_at',
          name: 'approved_at',
          label: 'Approved At',
          type: 'text',
          colSpan: 1,
          disabled: true,
        },
        {
          id: 'adjustment-type',
          key: 'type',
          name: 'type',
          label: 'Adjustment Type',
          type: 'text',
          colSpan: 1,
          disabled: true,
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
      label: 'Submit Request',
      variant: 'default',
      className: 'cursor-pointer bg-orange-600 hover:bg-orange-700',
    },
  ],
};
