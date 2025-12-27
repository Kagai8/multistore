// resources/js/config/tables/stock-adjustment-table.ts

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FileSpreadsheet, FileText, TrendingDown, TrendingUp, User } from "lucide-react";

export const StockAdjustmentTableConfig = {
  moduleName: "Stock Adjustment History (Audit Log)",
  columns: [
    // Core Identity
    {
        label: 'ID',
        key: 'id',
        className: 'p-4 border text-center text-sm font-mono'
    },
    {
        label: 'Date & Time',
        key: 'created_at',
        className: 'p-4 border text-center text-xs font-medium',
        type: 'date-time',
    },

    // Relationships
    {
        label: 'Product',
        key: 'product_name',
        className: 'p-4 border text-left font-semibold'
    },
    {
        label: 'Store',
        key: 'store_name',
        className: 'p-4 border text-center'
    },

    // Adjustment Details
    {
        label: 'Type',
        key: 'type', // 'in' or 'out'
        className: 'p-4 border text-center font-bold',
        // This column will require custom rendering to show IN/OUT badges
    },
    {
        label: 'Reason',
        key: 'reason', // AdjustmentReason name
        className: 'p-4 border text-center text-gray-700'
    },
    {
        label: 'Quantity',
        key: 'quantity',
        className: 'p-4 border text-center font-bold text-lg text-red-600'
    },

    // Stock Levels
    {
        label: 'Stock Before',
        key: 'old_stock',
        className: 'p-4 border text-center text-sm text-gray-600',
        defaultHidden: true,
    },
    {
        label: 'Stock After',
        key: 'new_stock',
        className: 'p-4 border text-center font-bold text-green-700'
    },

    // Audit Trail
    {
        label: 'Adjusted By',
        key: 'adjusted_by',
        className: 'p-4 border text-center text-xs',
        defaultHidden: true,
    },
    {
        label: 'Notes',
        key: 'notes',
        className: 'p-4 border text-left text-sm',
        defaultHidden: true,
    },

    {
        label: 'Actions',
        key: 'actions',
        isAction: true,
        isMandatory: true,
        className: 'p-4 border text-center w-24'
    },

  ],
  actions: [
    // For an audit log, we primarily need export options for the record.
    // Edit/Delete are usually forbidden for stock adjustment history.
    
    {
      label: 'Export PDF',
      icon: FileText,
      permission: 'export-stock-adjustment',
    },
    {
      label: 'Export Excel',
      icon: FileSpreadsheet,
      permission: 'export-stock-adjustment',
    },
  ],
};
