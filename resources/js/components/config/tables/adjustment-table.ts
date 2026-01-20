import { Eye, FileSpreadsheet, FileText, Pencil, Trash } from "lucide-react";

export const AdjustmentReasonTableConfig = {
  columns: [
    { label: 'Reason Name', key: 'name', className: 'p-4 border', sortable: true },
    { label: 'Description', key: 'description', className: 'p-4 border' },
    { label: 'Status', key: 'is_active', isBoolean: true, className: 'p-4 border text-center' },
    { label: 'Created Date', key: 'created_at', className: 'p-4 border text-center', sortable: true },
    { label: 'Actions', key: 'actions', isAction: true, className: 'p-4 border text-center' },
  ],
  actions: [
    {
      label: 'View',
      icon: Eye,
      className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-sm transition-all duration-150',
      permission: 'view-adjustment-reason',
    },
    {
      label: 'Edit',
      icon: Pencil,
      className: 'flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-sm transition-all duration-150 ms-2',
      permission: 'edit-adjustment-reason',
    },
    {
      label: 'Delete',
      icon: Trash,
      className:
        'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-sm transition-all duration-150 ms-2',
      permission: 'delete-adjustment-reason',
    },
    {
      label: 'Export PDF',
      icon: FileText,
      permission: 'export-adjustmentreason',
    },
    {
      label: 'Export Excel',
      icon: FileSpreadsheet,
      permission: 'export-adjustmentreason',
    },
  ],
};
