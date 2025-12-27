// resources/js/config/tables/new-stock-entry-table.ts

import { Eye, FileSpreadsheet, FileText, Pencil, Trash, Check, } from "lucide-react";

export const NewStockEntryTableConfig = {
  columns: [
    // Core Identity
    {
        label: 'Invoice #',
        key: 'invoice_number',
        className: 'p-4 border text-center font-semibold'
    },

    // Relationships
    {
        label: 'Product Name',
        key: 'product_name',
        className: 'p-4 border text-left font-semibold'
    },
    {
        label: 'Supplier',
        key: 'supplier_name',
        className: 'p-4 border text-center'
    },
    {
        label: 'Receiving Store',
        key: 'store_name',
        className: 'p-4 border text-center'
    },

    // Quantity & Status
    {
        label: 'Qty Received',
        key: 'quantity_received',
        type: 'number',
        className: 'p-4 border text-right font-bold text-lg'
    },
    {
        label: 'Qty Transferred',
        key: 'quantity_transferred',
        type: 'number',
        className: 'p-4 border text-right',
        defaultHidden: true,
    },
    {
        label: 'Available Qty',
        key: 'available_to_transfer',
        type: 'number',
        className: 'p-4 border text-right font-bold text-blue-600'
    },
    {
        label: 'Status',
        key: 'status',
        type: 'tag-status',
        className: 'p-4 border text-center font-medium bg'
    },

    // Audit Trail
    {
        label: 'Recorded By',
        key: 'user_name',
        className: 'p-4 border text-center text-sm',
        defaultHidden: true,
    },
    {
        label: 'Recorded Date',
        key: 'created_at',
        className: 'p-4 border text-center text-xs'
    },

    // Actions
    {
        label: 'Actions',
        key: 'actions',
        isAction: true,
        isMandatory: true,
        className: 'p-4 border text-center w-48'
    },
  ],

  // Actions: CONDITIONALS REMOVED to show all buttons for Super Admin view
  actions: [
    {
      label: 'Post Stock',
      icon: Check,
      className: 'flex items-center gap-1 bg-green-600 hover:bg-green-800 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
      permission: 'post-new-stock-entry',
      conditionKey: 'status',
      conditionValue: 'pending',
      tooltip: 'Post stock to be live in system',
      // conditionKey and conditionValue/conditionExclude removed.

    },
    {
      label: 'View',
      icon: Eye,
      className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
      permission: 'view-new-stock-entry',
    },
    {
      label: 'Edit',
      icon: Pencil,
      className: 'flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
      permission: 'edit-new-stock-entry',
      // conditionKey and conditionValue removed.
    },
    {
      label: 'Delete',
      icon: Trash,
      className:
        'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
      permission: 'delete-new-stock-entry',
      // conditionKey and conditionValue removed.
    },
    {
      label: 'Export PDF',
      icon: FileText,
      permission: 'export-pdf-new-stock',
    },
    {
      label: 'Export Excel',
      icon: FileSpreadsheet,
      permission: 'export-excel-new-stock',
    },
  ],
};
