import { FilterDefinition } from '@/types/reports';

export const PaymentsFilters: FilterDefinition[] = [
    {
        id: 'date_range',
        label: 'Shift Date',
        type: 'date-range',
        fields: ['start_date', 'end_date'],
    },
    {
        id: 'store_id',
        label: 'Location',
        type: 'select',
        lookupKey: 'stores',
        placeholder: 'All Locations',
    },
    {
        id: 'payment_method',
        label: 'Method',
        type: 'select',
        lookupKey: 'payment_methods',
        placeholder: 'All Methods',
    },
    {
        id: 'user_id',
        label: 'Cashier/Staff',
        type: 'select',
        lookupKey: 'users',
        placeholder: 'All Staff',
    },
];
