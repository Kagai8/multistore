import { FilterDefinition } from '@/types/reports';

export const RefundsFilters: FilterDefinition[] = [
    {
        id: 'date_range',
        label: 'Audit Period',
        type: 'date-range',
        fields: ['start_date', 'end_date'],
    },
    {
        id: 'void_type',
        label: 'Type',
        type: 'select',
        lookupKey: 'void_types',
        placeholder: 'All Types',
    },
    {
        id: 'user_id',
        label: 'Authorized By',
        type: 'select',
        lookupKey: 'users',
        placeholder: 'All Managers',
    },
];
