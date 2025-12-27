import { Eye, FileSpreadsheet, FileText, Pencil, Trash } from "lucide-react";

export const UserTableConfig = {
  columns: [
    // Core Identity
    {
        label: 'ID',
        key: 'id',
        className: 'p-4 border text-center font-bold w-12'
    },
    {
        label: 'Name',
        key: 'name',
        className: 'p-4 border text-left font-semibold w-1/4'
    },
    {
        label: 'Email',
        key: 'email',
        className: 'p-4 border text-left text-sm w-1/4'
    },
    {
        label: 'Email Verified',
        key: 'email_verified_at',
        type: 'boolean-with-date', // Custom type to show checkmark or date
        className: 'p-4 border text-center w-32'
    },

    // Relationships
    {
        label: 'Role',
        key: 'role_name', // We will load the role name via relationship
        className: 'p-4 border text-center font-medium'
    },
    {
        label: 'Store',
        key: 'store_name', // We will load the store name via relationship
        className: 'p-4 border text-center font-medium'
    },

    // Status & Dates
    {
        label: '2FA',
        key: 'two_factor_confirmed',
        type: 'boolean',
        className: 'p-4 border text-center w-16'
    },
    {
        label: 'Created Date',
        key: 'created_at',
        type: 'date-time',
        className: 'p-4 border text-center text-xs w-32'
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
      permission: 'view-user',
    },
    {
      label: 'Edit',
      icon: Pencil,
      className: 'flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
      permission: 'edit-user',
      // Condition: Prevent editing the user who is currently logged in (ID = currentUserId)

    },
    {
      label: 'Delete',
      icon: Trash,
      className:
        'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
      permission: 'delete-user',
      // Condition: Prevent deleting the user who is currently logged in (ID = currentUserId)

    },
    {
      label: 'Export PDF',
      icon: FileText,
      permission: 'export-user',
    },
    {
      label: 'Export Excel',
      icon: FileSpreadsheet,
      permission: 'export-user',
    },
  ],
};
