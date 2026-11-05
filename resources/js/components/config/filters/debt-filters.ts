import { FilterDefinition } from '@/types/reports';

export const DebtFilters: FilterDefinition[] = [
    {
        id: 'customer_id',
        label: 'Customer',
        type: 'select',
        lookupKey: 'customers',
        placeholder: 'Search Debtor...',
    },
    {
        id: 'aging_bucket',
        label: 'Aging Period',
        type: 'select',
        lookupKey: 'aging_buckets',
        placeholder: 'Select Period',
    },
    {
        id: 'store_id',
        label: 'Origin Store',
        type: 'select',
        lookupKey: 'stores',
        placeholder: 'All Stores',
    },
];
