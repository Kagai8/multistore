import { FilterDefinition } from '@/types/reports';

export const AdjustmentFilters: FilterDefinition[] = [
    {
        id: 'store_id',
        label: 'Warehouse/Store',
        type: 'select',
        lookupKey: 'stores',
        placeholder: 'Select Location',
    },
    {
        id: 'product_id',
        label: 'Product',
        type: 'select',
        lookupKey: 'products',
        placeholder: 'Filter by Product',
    },
    {
        id: 'adjustment_reason_id',
        label: 'Reason',
        type: 'select',
        lookupKey: 'adjustment_reasons',
        placeholder: 'Select Reason',
    },
    {
        id: 'user_id',
        label: 'Adjusted By',
        type: 'select',
        lookupKey: 'users',
        placeholder: 'Select Staff',
    },
    {
        id: 'date_range',
        label: 'Period',
        type: 'date-range',
        fields: ['start_date', 'end_date'],
    },
    {
        id: 'stock_range',
        label: 'Qty Adjusted Range',
        type: 'range',
        fields: ['stock_min', 'stock_max'],
    },
    {
        id: 'search',
        label: 'Notes Search',
        type: 'text',
        placeholder: 'Search notes...',
    },
];
