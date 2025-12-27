// resources/js/components/config/forms/stock-correction-modal-form.ts

import { RotateCw } from 'lucide-react';
import { permission } from 'process';

/**
 * Configuration for the Manual Stock Correction (Adjustment) Form.
 * This form uses the SimpleModalForm component.
 */
export const StockCorrectionModalFormConfig = {
  title: 'Manual Stock Correction',
  description: 'Enter positive or negative quantity adjustments for inventory audit reasons (e.g., loss, damage, count error).',

  fields: [
    // 1. STORE SELECT (Source: extraData.stores) - Left Column
    {
      id: 'store_id',
      key: 'store_id',
      name: 'store_id',
      label: 'Store',
      type: 'single-select',
      placeholder: 'Select affected store',
      autoFocus: true,
      optionsSource: 'stores', // Assumes you pass 'stores' in extraData
      colSpan: 1,
    },

    // 2. PRODUCT SELECT (Source: extraData.products) - Right Column
    {
      id: 'product_id',
      key: 'product_id',
      name: 'product_id',
      label: 'Product',
      type: 'single-select',
      placeholder: 'Select product to adjust',
      optionsSource: 'products', // Assumes you pass 'products' in extraData
      colSpan: 1,
    },

    // 3. REASON SELECT (Source: extraData.adjustmentReasons) - Left Column
    {
      id: 'adjustment_reason_id',
      key: 'adjustment_reason_id',
      name: 'adjustment_reason_id',
      label: 'Adjustment Reason',
      type: 'single-select',
      placeholder: 'Select audit reason (e.g., Damage, Loss)',
      optionsSource: 'adjustmentReasons', // Assumes you pass 'adjustmentReasons' in extraData
      colSpan: 1,
    },

    // 4. QUANTITY INPUT (Numeric, handles +/- sign) - Right Column
    {
      id: 'quantity',
      key: 'quantity',
      name: 'quantity',
      label: 'Quantity (Positive for Gain, Negative for Loss)',
      type: 'number',
      placeholder: 'Enter quantity (e.g., 10 or -5)',
      colSpan: 1,
    },

    // 5. NOTES (Full Width)
    {
      id: 'notes',
      key: 'notes',
      name: 'notes',
      label: 'Audit Notes',
      type: 'textarea',
      placeholder: 'Mandatory: Explain the reason for this adjustment',
      rows: 3,
      colSpan: 2,
    },
  ],

  buttons: [
    { key: 'cancel', label: 'Cancel', type: 'button', variant: 'outline' },
    { key: 'submit', label: 'Process Adjustment', type: 'submit', variant: 'default', className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white' },
  ],

  addButton: {
    id: 'add-adjustment',
    label: 'Manual Adjustment',
    icon: RotateCw,
    type: 'button',
    variant: 'default',
    className: 'flex items-center bg-orange-600 hover:bg-orange-500 text-white',
    permission: 'create-stock-correction',
  },
};
