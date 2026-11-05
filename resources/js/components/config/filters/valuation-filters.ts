import { FilterDefinition } from '@/types/reports';

export const ValuationFilters: FilterDefinition[] = [
    {
        id: 'store_id',
        label: 'Store Location',
        type: 'select',
        lookupKey: 'stores',
        placeholder: 'Select Store',
    },
    {
        id: 'brand_id',
        label: 'Brand',
        type: 'select',
        lookupKey: 'brands',
        placeholder: 'Select Brand',
    },
    {
        id: 'category_id',
        label: 'Category',
        type: 'select',
        lookupKey: 'categories',
        placeholder: 'Select Category',
    },
    {
        id: 'product_id',
        label: 'Specific Product',
        type: 'select',
        lookupKey: 'products',
        placeholder: 'Search Product...',
    },
    {
        id: 'price_range',
        label: 'Buying Price',
        type: 'range',
        fields: ['min_price', 'max_price'],
    },
    {
        id: 'stock_range',
        label: 'Stock Levels',
        type: 'range',
        fields: ['stock_min', 'stock_max'],
    },
];
