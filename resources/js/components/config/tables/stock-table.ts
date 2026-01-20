// resources/js/config/tables/stock-table.ts
import { FileSpreadsheet, FileText, Pencil } from "lucide-react";
import StockStatusIcon from '@/components/ui/stock-status-icon';

export const StockTableConfig = {
  columns: [
    // Store Location
    {
        label: 'Store Name',
        key: 'store.name', // Accessing the related store's name
        className: 'p-4 border text-left font-semibold w-1/5',
        sortable: true
    },
    {
        label: 'Store Code',
        key: 'store.code', // Accessing the related store's code
        className: 'p-4 border text-center text-sm',
        sortable: true
    },
    // Product Details
    {
        label: 'Product Name',
        key: 'product.name', // Accessing the related product's name
        className: 'p-4 border text-left',
        sortable: true
    },
    {
        label: 'Product SKU',
        key: 'product.sku', // Accessing the related product's SKU
        className: 'p-4 border text-center text-sm',
        sortable: true
    },

    // Inventory Data (The core metrics)
    {
        label: 'Current Stock',
        key: 'current_stock',
        type: 'number',
        className: 'p-4 border text-center font-bold text-lg text-blue-600'
    },

    // Policy Data (Editable fields)
    {
        label: 'Reorder Level',
        key: 'reorder_level',
        type: 'number',
        className: 'p-4 border text-center text-red-600',
        // 💡 Conditional class to highlight if stock is below reorder level


    },
    {
        label: 'R/O Status',
        key: 'current_stock', // Using current_stock as the key for data access
        component: StockStatusIcon, // ⬅️ Reference to the custom component
        className: 'p-4 border text-center w-20'
    },
    {
        label: 'Reorder Qty',
        key: 'reorder_quantity',
        type: 'number',
        className: 'p-4 border text-center text-sm'
    },

    // Audit
    {
        label: 'Last Updated',
        key: 'updated_at',
        className: 'p-4 border text-center text-xs',
        sortable: true
    },
    {
        label: 'Actions',
        key: 'actions',
        isAction: true,
        isMandatory: true,
        className: 'p-4 border text-center w-28'
    },

  ],
  actions: [
    // We only allow EDIT for reorder policy and EXPORT. No View/Delete/Create on this table.
    {
      label: 'Edit Policy',
      icon: Pencil,
      className: 'flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
      permission: 'edit-stock-policy', // Specific permission for policy update
    },
    {
      label: 'Export PDF',
      icon: FileText,
      permission: 'export-stock-list',
    },
    {
      label: 'Export Excel',
      icon: FileSpreadsheet,
      permission: 'export-stock-list',
    },
  ],
};
