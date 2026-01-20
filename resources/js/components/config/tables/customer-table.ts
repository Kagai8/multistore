import { Eye, FileSpreadsheet, FileText, Pencil, Trash } from "lucide-react";

export const CustomerTableConfig = {
  columns: [
    {
        label: 'Name',
        key: 'name',
        className: 'p-4 border text-left font-semibold',
        isMandatory: true,
        sortable: true
    },
    {
        label: 'Contact Number',
        key: 'number',
        className: 'p-4 border text-center text-sm',
    },
    {
        label: 'Email',
        key: 'email',
        className: 'p-4 border text-left text-sm',
    },
    {
        label: 'Credit Limit',
        key: 'credit_limit',
        type: 'currency', // Use the new currency type for formatting
        className: 'p-4 border text-center text-sm font-mono',
    },
    {
        label: 'Created Date',
        key: 'created_at',
        className: 'p-4 border text-center text-xs',
        sortable: true,
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
    { label: 'View', icon: Eye, permission: 'view-customer' },
    { label: 'Edit', icon: Pencil, permission: 'edit-customer' },
    { label: 'Delete', icon: Trash, permission: 'delete-customer' },
    { label: 'Export PDF', icon: FileText, permission: 'export-customer-pdf' },
    { label: 'Export Excel', icon: FileSpreadsheet, permission: 'export-customer-excel' },
  ].map(a => ({
        ...a,
        className: a.label === 'View' ? 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150' : a.label === 'Edit' ? 'flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1' : a.label === 'Delete' ? 'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1' : ''
    })),
};
