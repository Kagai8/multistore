import { FilterDefinition } from '@/types/reports';

export const ProfitLossFilters: FilterDefinition[] = [
    {
        id: 'date_range',
        label: 'Period',
        type: 'date-range',
        fields: ['start_date', 'end_date'],
    },
    {
        id: 'store_id',
        label: 'Store Location',
        type: 'select',
        lookupKey: 'stores',
        placeholder: 'All Stores',
    },
    {
        id: 'customer_id',
        label: 'Customer',
        type: 'select',
        lookupKey: 'customers',
        placeholder: 'All Customers',
    },
    {
        id: 'price_category',
        label: 'Price Used',
        type: 'select',
        lookupKey: 'price_categories',
        placeholder: 'Any Price Level',
    },
    {
        id: 'product_id',
        label: 'Product',
        type: 'select',
        lookupKey: 'products',
        placeholder: 'Search Product...',
    },
    {
        id: 'brand_id',
        label: 'Brand',
        type: 'select',
        lookupKey: 'brands',
        placeholder: 'Select Brand',
    },
];
