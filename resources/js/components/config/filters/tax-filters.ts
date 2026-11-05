import { FilterDefinition } from '@/types/reports';

export const TaxFilters: FilterDefinition[] = [
    {
        id: 'date_range',
        label: 'Tax Period',
        type: 'date-range',
        fields: ['start_date', 'end_date'],
    },
    {
        id: 'store_id',
        label: 'Branch',
        type: 'select',
        lookupKey: 'stores',
        placeholder: 'All Branches',
    },
    {
        id: 'tax_status',
        label: 'Status',
        type: 'select',
        lookupKey: 'tax_statuses',
        placeholder: 'All Statuses',
    },
];
