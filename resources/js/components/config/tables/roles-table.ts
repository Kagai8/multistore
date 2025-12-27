import { Eye, FileSpreadsheet, FileText, Pencil, Trash } from "lucide-react";

export const RoleTableConfig = {
  columns: [
    // Core Identity
    {
        label: 'Role Label', // ⬅️ UPDATED LABEL
        key: 'label',        // ⬅️ UPDATED KEY
        className: 'p-4 border text-left font-bold w-1/3'
    },
    {
        label: 'Unique Key (Name)', // ⬅️ UPDATED LABEL
        key: 'name',             // ⬅️ UPDATED KEY (This holds the slug)
        className: 'p-4 border text-center text-sm w-1/4'
    },
    {
        label: 'Description',
        key: 'description',
        className: 'p-4 border text-left text-sm'
    },

    // Status
    {
        label: 'Active',
        key: 'is_active',
        type: 'boolean',
        className: 'p-4 border text-center w-24'
    },

    {
        label: 'All Store Access',
        key: 'all_store_access',
        type: 'boolean',
        className: 'p-4 border text-center w-24'
    },

    // Date
    {
        label: 'Created Date',
        key: 'created_at',
        type: 'date-time',
        className: 'p-4 border text-center text-xs w-28'
    },

    // Actions
    {
        label: 'Actions',
        key: 'actions',
        isAction: true,
        isMandatory: true,
        className: 'p-4 border text-center w-32'
    },

  ],
  actions: [
    {
      label: 'View',
      icon: Eye,
      className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
      permission: 'view-role',
    },
    {
      label: 'Edit',
      icon: Pencil,
      className: 'flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
      permission: 'edit-role',
    },
    {
      label: 'Delete',
      icon: Trash,
      className:
        'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
      permission: 'delete-role',
    },
    {
      label: 'Export PDF',
      icon: FileText,
      permission: 'export-role',
    },
    {
      label: 'Export Excel',
      icon: FileSpreadsheet,
      permission: 'export-role',
    },
  ],
};
