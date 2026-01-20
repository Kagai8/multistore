/* eslint-disable @typescript-eslint/no-explicit-any */
import { CheckCircle } from 'lucide-react';

export const CompanySettingTableConfig = {
    moduleName: "Company Profiles",

    columns: [
        {
            label: 'Profile Name',
            key: 'name',
            className: 'p-4 border font-bold text-gray-800'
        },
        {
            label: 'Status',
            key: 'is_default',
            type: 'boolean',
            className: 'p-4 border text-center',
            render: (val: boolean) => val ? 'Default' : '-',
            conditionalClass: (row: any) => row.is_default ? 'text-green-600 font-bold bg-green-50 rounded px-2' : 'text-gray-400'
        },
        {
            label: 'Phone',
            key: 'phone',
            className: 'p-4 border text-sm'
        },
        {
            label: 'City',
            key: 'city',
            className: 'p-4 border text-sm'
        },
        {
            label: 'Tax/PIN',
            key: 'tax_pin',
            className: 'p-4 border text-sm font-mono'
        },
        {
            label: 'Actions',
            key: 'actions',
            isAction: true,
            className: 'p-4 border text-center w-32'
        },
    ],

    actions: [
        {
            label: 'Set Default',
            icon: CheckCircle,
            className: 'text-emerald-600 hover:text-emerald-700',
            // Only show if not already default
            showCondition: (row: any) => !row.is_default
        }
    ],
};
