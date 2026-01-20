/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Eye,
    FileSpreadsheet,
    FileText,
} from "lucide-react";

export const PosSessionTableConfig = {
    moduleName: "POS Sessions",

    columns: [
        {
            label: 'ID',
            key: 'id',
            className: 'p-4 border text-center font-mono w-16 text-gray-500',
            sortable: true
        },
        {
            label: 'Cashier',
            key: 'user_name',
            className: 'p-4 border font-medium text-gray-800',
            sortable: true
        },
        {
            label: 'Store',
            key: 'store_name',
            className: 'p-4 border text-sm text-gray-600',
            sortable: true
        },
        {
            label: 'Opened',
            key: 'start_time',
            className: 'p-4 border text-sm'
        },
        {
            label: 'Status',
            key: 'status',
            className: 'p-4 border text-center font-bold capitalize',
            conditionalClass: (row: any) =>
                row.status === 'open' ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
        },
        {
            label: 'Opening',
            key: 'opening_cash',
            type: 'currency',
            className: 'p-4 border text-right font-mono'
        },
        {
            label: 'Closing',
            key: 'closing_cash',
            type: 'currency',
            className: 'p-4 border text-right font-mono'
        },
        {
            label: 'Diff',
            key: 'cash_difference',
            type: 'currency',
            className: 'p-4 border text-right font-bold',
            conditionalClass: (row: any) =>
                row.cash_difference < 0 ? 'text-red-600 bg-red-50' :
                row.cash_difference > 0 ? 'text-green-600 bg-green-50' : 'text-gray-400',
            sortable: true,
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
            permission: 'view-pos-reports',
        },
        {
            label: 'Export Z-Report',
            icon: FileText,
            permission: 'export-pos-reports',
            className: 'flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
        },
        {
            label: 'Export Excel',
            icon: FileSpreadsheet,
            permission: 'export-pos-reports',
        },
    ],
};
