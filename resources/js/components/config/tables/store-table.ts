// resources/js/config/tables/store-table.ts
import { Eye, FileSpreadsheet, FileText, Pencil, Trash } from "lucide-react";

export const StoreTableConfig = {
  columns: [
    {
        label: 'Name',
        key: 'name',
        className: 'p-4 border text-left font-semibold',
        isMandatory: true,
    },
    {
        label: 'Type',
        key: 'type',
        className: 'p-4 border text-center font-medium capitalize', // Capitalize for better display
    },
    {
        label: 'Code',
        key: 'code',
        className: 'p-4 border text-center text-sm font-mono' // Highlight the code
    },
    {
        label: 'Contact Number',
        key: 'phone',
        className: 'p-4 border text-center text-sm'
    },
    {
        label: 'Email',
        key: 'email',
        className: 'p-4 border text-left text-sm',
    },
    {
        label: 'Address',
        key: 'address',
        className: 'p-4 border text-left text-xs',
    },
    {
        label: 'Created Date',
        key: 'created_at',
        className: 'p-4 border text-center text-xs'
    },
    {
        label: 'Actions',
        key: 'actions',
        isAction: true,
        isMandatory: true,
        className: 'p-4 border text-center w-32'
    },
  ],
  actions: [
    { label: 'View', icon: Eye, permission: 'view-store' },
    { label: 'Edit', icon: Pencil, permission: 'edit-store' },
    { label: 'Delete', icon: Trash, permission: 'delete-store' },
    { label: 'Export PDF', icon: FileText, permission: 'export-pdf-store' },
    { label: 'Export Excel', icon: FileSpreadsheet, permission: 'export-excel-store' },
  ].map(a => ({
        ...a,
        className: a.label === 'View' ? 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150' : a.label === 'Edit' ? 'flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1' : a.label === 'Delete' ? 'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1' : ''
    })),
};
