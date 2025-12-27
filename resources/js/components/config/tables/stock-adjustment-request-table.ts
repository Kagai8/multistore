// resources/js/config/tables/stock-adjustment-requests-table.ts
import { Eye, FileSpreadsheet, FileText, Trash2, CheckCircle, XCircle, Upload, Pencil } from 'lucide-react';

export const StockAdjustmentRequestsTableConfig = {
  moduleName: 'Stock Adjustment Requests',

  columns: [
    // Core Identity
    {
      label: 'ID',
      key: 'id',
      className: 'p-4 border text-center font-mono w-16',
    },
    {
      label: 'Product',
      key: 'product.name',
      className: 'p-4 border font-semibold',
    },
    {
      label: 'SKU',
      key: 'product.sku',
      className: 'p-4 border text-sm text-gray-600',
      defaultHidden: true,
    },
    {
      label: 'Store',
      key: 'store.name',
      className: 'p-4 border text-left',
    },

    // Adjustment Details
    {
      label: 'Type',
      key: 'type',
      className: 'p-4 border text-center capitalize',
    },
    {
      label: 'Quantity',
      key: 'quantity',
      className: 'p-4 border text-center font-mono',
    },
    {
      label: 'Reason',
      key: 'reason.name',
      className: 'p-4 border text-center text-sm',
      defaultHidden: true,
    },

    // Workflow Status
    {
      label: 'Status',
      key: 'status',
      type: 'tag-status',
      className: 'p-4 border text-center font-bold w-32',
    },

    // Relationships
    {
      label: 'Requested By',
      key: 'requester.name',
      className: 'p-4 border text-center text-sm',
    },
    {
      label: 'Approved By',
      key: 'approver.name',
      className: 'p-4 border text-center text-sm',
      defaultHidden: true,
    },

    // Audit Timestamps
    {
      label: 'Requested At',
      key: 'requested_at',
      type: 'date-time',
      className: 'p-4 border text-center text-xs',
    },
    {
      label: 'Approved At',
      key: 'approved_at',
      type: 'date-time',
      className: 'p-4 border text-center text-xs',
      defaultHidden: true,
    },

    // Notes
    {
      label: 'Notes',
      key: 'notes',
      className: 'p-4 border text-left text-sm italic text-gray-600 max-w-xs truncate',
      defaultHidden: true,
    },

    // Actions
    {
      label: 'Actions',
      key: 'actions',
      isAction: true,
      isMandatory: true,
      className: 'p-4 border text-center w-48',
    },
  ],

  actions: [
    // View (any status)
    {
      label: 'View',
      icon: Eye,
      className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
      permission: 'view-stock-adjustment-request',
    },

    // Edit Draft (only for requester)
    {
      label: 'Edit',
      icon: Pencil,
      className: 'flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
      permission: 'edit-stock-adjustment-request',
      conditionKeys: ['status', 'is_requester'],
      conditionValues: ['draft', true],
      tooltip: 'Edit your draft adjustment request.',
    },

    // Delete Draft (only for requester)
    {
      label: 'Delete',
      icon: Trash2,
      className: 'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
      permission: 'delete-stock-adjustment-request',
      conditionKeys: ['status', 'is_requester'],
      conditionValues: ['draft', true],
      tooltip: 'Delete this draft request.',
    },

    // Submit for Approval (only for requester, from draft)
    {
      label: 'Submit for Approval',
      icon: Upload,
      className: 'flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
      permission: 'edit-stock-adjustment-request', // reuse edit permission
      conditionKeys: ['status', 'is_requester'],
      conditionValues: ['draft', true],
      tooltip: 'Submit this draft for manager approval.',
    },

    // Approve (only for approvers, on pending)
    {
      label: 'Approve',
      icon: CheckCircle,
      className: 'flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
      permission: 'approve-stock-adjustment-request',
      conditionKey: 'status',
      conditionValue: 'pending_approval',
      tooltip: 'Approve this adjustment to update stock levels.',
    },

    // Reject (only for approvers, on pending)
    {
      label: 'Reject',
      icon: XCircle,
      className: 'flex items-center gap-1 bg-red-800 hover:bg-red-900 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
      permission: 'approve-stock-adjustment-request',
      conditionKey: 'status',
      conditionValue: 'pending_approval',
      tooltip: 'Reject this adjustment request.',
    },

    // Export PDF (approved only)
    {
      label: 'Export PDF',
      icon: FileText,
      permission: 'export-pdf-stock-adjustment-request',
      conditionKey: 'status',
      conditionValue: 'approved',
    },

    // Export Excel (approved only)
    {
      label: 'Export Excel',
      icon: FileSpreadsheet,
      permission: 'export-excel-stock-adjustment-request',
      conditionKey: 'status',
      conditionValue: 'approved',
    },
  ],
};
