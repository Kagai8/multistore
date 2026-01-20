// resources/js/config/tables/supplier-table.ts
import { Eye, FileSpreadsheet, FileText, Pencil, Trash } from "lucide-react";

export const SupplierTableConfig = {
  columns: [
    { label: 'Supplier Name', key: 'name', className: 'p-4 border', sortable: true },
    { label: 'Contact Person', key: 'contact_person', className: 'p-4 border', sortable: true }, // 🟢 New Column
    { label: 'Email', key: 'email', className: 'p-4 border', sortable: true },                     // 🟢 New Column
    { label: 'Phone', key: 'phone', className: 'p-4 border', sortable: true },                     // 🟢 New Column
    // ❌ Removed Logo column
    { label: 'Created Date', key: 'created_at', className: 'p-4 border text-center' },
    { label: 'Actions', key: 'actions', isAction: true, className: 'p-4 border text-center' },
  ],
  actions: [
    {
      label: 'View',
      icon: Eye,
      className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-sm transition-all duration-150',
        permission: 'view-supplier', // 🟢 Updated Permission

    },
    {
      label: 'Edit',
      icon: Pencil,
      className: 'flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-sm transition-all duration-150 ms-2',
      permission: 'edit-supplier', // 🟢 Updated Permission
    },
    {
      label: 'Delete',
      icon: Trash,
      className:
        'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-sm transition-all duration-150 ms-2',
      permission: 'delete-supplier', // 🟢 Updated Permission
    },
    {
      label: 'Export PDF',
      icon: FileText,
      permission: 'export-pdf-supplier', // 🟢 Updated Permission
    },
    {
      label: 'Export Excel',
      icon: FileSpreadsheet,
      permission: 'export-excel-supplier', // 🟢 Updated Permission
    },
  ],
};
