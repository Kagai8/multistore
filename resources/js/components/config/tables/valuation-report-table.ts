import { FileSpreadsheet, FileText } from 'lucide-react';

/**
 * VALUATION LENS
 * Dedicated to current inventory asset standing.
 */
export const ValuationTableConfig = {
    moduleName: 'Inventory Valuation',
    columns: [
        {
            label: 'Product',
            key: 'product_name',
            className: 'p-4 border font-bold text-gray-800',
            sortable: true,
        },
        // 🟢 ADDED: Brand column using nested Eloquent relationship
        {
            label: 'Brand',
            key: 'product.brand.name',
            className: 'p-4 border text-sm text-gray-600',
            sortable: true,
        },
        {
            label: 'SKU',
            key: 'product.sku',
            className: 'p-4 border text-center font-mono',
            sortable: true,
        },
        {
            label: 'Store',
            key: 'store.name',
            className: 'p-4 border text-sm',
            sortable: true,
        },
        {
            label: 'Category',
            key: 'product.category.name',
            className: 'p-4 border text-sm',
            defaultHidden: true,
        },
        {
            label: 'Qty on Hand',
            key: 'current_stock',
            className: 'p-4 border text-center font-semibold',
            sortable: true,
            isTotalable: true,
        },
        {
            label: 'Buying Price',
            key: 'buying_price',
            type: 'currency',
            className: 'p-4 border text-right',
        },
        {
            label: 'Asset Value',
            key: 'asset_value',
            type: 'currency',
            className: 'p-4 border text-right font-bold text-blue-700',
            isTotalable: true,
        },
    ],
    actions: [
        {
            label: 'Export PDF',
            icon: FileText,
            permission: 'export-valuation-report',
        },
        {
            label: 'Export Excel',
            icon: FileSpreadsheet,
            permission: 'export-valuation-report',
        },
    ],
};
