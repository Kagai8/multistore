import { FilterDefinition } from '@/types/reports';

export const MovementFilters: FilterDefinition[] = [
    {
        id: 'store_id',
        label: 'Location (Source/Dest)',
        type: 'select',
        lookupKey: 'stores',
        placeholder: 'Filter by Store',
    },
    {
        id: 'product_id',
        label: 'Product',
        type: 'select',
        lookupKey: 'products',
        placeholder: 'Filter by Product',
    },
    {
        id: 'user_id',
        label: 'Initiated By',
        type: 'select',
        lookupKey: 'users',
        placeholder: 'Select Staff',
    },
    // 🟢 FIXED: type is 'date-range' and requires the 'fields' array
    {
        id: 'date_filter',
        label: 'Movement Period',
        type: 'date-range',
        fields: ['start_date', 'end_date'],
    },
    {
        id: 'reference',
        label: 'Reference Number',
        type: 'select',
        lookupKey: 'references',
        placeholder: 'Select Reference',
    },
];
