import { FilterDefinition } from '@/types/reports';

export const PerformanceFilters: FilterDefinition[] = [
    {
        id: 'date_range',
        label: 'Analysis Period',
        type: 'date-range',
        fields: ['start_date', 'end_date'],
    },
    {
        id: 'store_id',
        label: 'Store',
        type: 'select',
        lookupKey: 'stores',
        placeholder: 'All Stores',
    },
    {
        id: 'category_id',
        label: 'Category',
        type: 'select',
        lookupKey: 'categories',
        placeholder: 'All Categories',
    },
    {
        id: 'brand_id',
        label: 'Brand',
        type: 'select',
        lookupKey: 'brands',
        placeholder: 'All Brands',
    },
    {
        id: 'limit',
        label: 'Show Top',
        type: 'select',
        lookupKey: 'report_limits',
        placeholder: 'All Products',
    },
];
