/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    FileText,
    FileSpreadsheet,
    TrendingUp,
    History,
    AlertTriangle,
} from "lucide-react";

// 1. CURRENT VALUATION LENS
export const ValuationTableConfig = {
    moduleName: "Inventory Valuation",
    columns: [
        { label: 'Product', key: 'product_name', className: 'p-4 border font-bold text-gray-800', sortable: true },
        { label: 'SKU', key: 'product.sku', className: 'p-4 border text-center font-mono', sortable: true },
        { label: 'Store', key: 'store.name', className: 'p-4 border text-sm', sortable: true },
        { label: 'Category', key: 'product.category.name', className: 'p-4 border text-sm', defaultHidden: true },
        {
            label: 'Qty on Hand',
            key: 'current_stock',
            className: 'p-4 border text-center font-semibold',
            sortable: true,
            isTotalable: true
        },
        { label: 'Buying Price', key: 'product.buying_price', type: 'currency', className: 'p-4 border text-right' },
        {
            label: 'Asset Value',
            key: 'asset_value',
            type: 'currency',
            className: 'p-4 border text-right font-bold text-blue-700',
            isTotalable: true
        },
    ],
    actions: [
        { label: 'Export PDF', icon: FileText, permission: 'export-valuation-report' },
        { label: 'Export Excel', icon: FileSpreadsheet, permission: 'export-valuation-report' },
    ]
};

// 2. STOCK MOVEMENT LENS (The "Flow")
export const MovementTableConfig = {
    moduleName: "Stock Movement History",
    columns: [
        { label: 'Date', key: 'created_at', type: 'date-time', className: 'p-4 border text-center' },
        { label: 'Product', key: 'product_name', className: 'p-4 border font-medium' },
        { label: 'Source/Target', key: 'reference_location', className: 'p-4 border text-sm' },
        { label: 'Type', key: 'movement_type', type: 'tag-status', className: 'p-4 border text-center' },
        {
            label: 'Qty',
            key: 'quantity',
            className: 'p-4 border text-center font-bold',
            isTotalable: true
        },
        { label: 'User', key: 'user.name', className: 'p-4 border text-sm' },
    ],
    actions: [
        { label: 'View Reference', icon: History, className: 'bg-slate-700 text-white p-1 rounded' }
    ]
};

// 3. STOCK ADJUSTMENT LENS (The "Leaks")
export const AdjustmentTableConfig = {
    moduleName: "Inventory Adjustments",
    columns: [
        { label: 'Date', key: 'created_at', type: 'date-time', className: 'p-4 border text-center' },
        { label: 'Product', key: 'product_name', className: 'p-4 border font-medium' },
        { label: 'Reason', key: 'reason', className: 'p-4 border text-sm' },
        {
            label: 'Qty Adj',
            key: 'adjusted_qty',
            className: 'p-4 border text-center text-red-600 font-bold',
            isTotalable: true
        },
        {
            label: 'Value Impact',
            key: 'value_impact',
            type: 'currency',
            className: 'p-4 border text-right',
            isTotalable: true
        },
    ],
    actions: [
        { label: 'View Audit', icon: AlertTriangle, className: 'bg-orange-600 text-white p-1 rounded' }
    ]
};
