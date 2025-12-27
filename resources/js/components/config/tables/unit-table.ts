// resources/js/config/tables/unit-table.ts
import { Eye, FileSpreadsheet, FileText, Pencil, Trash } from "lucide-react";
import { CirclePlus } from 'lucide-react';

export const UnitTableConfig = {
  columns: [

    { label: 'Unit Name', key: 'name', className: 'p-4 border' },
    { label: 'Unit Code', key: 'code', className: 'p-4 border' },
    { label: 'Created Date', key: 'created_at', className: 'p-4 border text-center' },
    { label: 'Actions', key: 'actions', isAction: true, className: 'p-4 border text-center' },
  ],
  actions: [
    {
      label: 'View',
      icon: Eye,
      className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-sm transition-all duration-150',
      permission: 'view-unit',
    },
    {
      label: 'Edit',
      icon: Pencil,
      className: 'flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-sm transition-all duration-150 ms-2',
      permission: 'edit-unit',
    },
    {
      label: 'Delete',
      icon: Trash,
      className:
        'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-sm transition-all duration-150 ms-2',
      permission: 'delete-unit',
    },
    {
      label: 'Export PDF',
      icon: FileText,
      permission: 'export-unit',
    },
    {
      label: 'Export Excel',
      icon: FileSpreadsheet,
      permission: 'export-unit',
    },
    
  ],
};
