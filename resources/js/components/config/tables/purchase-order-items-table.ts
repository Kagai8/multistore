export const PurchaseOrderItemTableConfig = {
    moduleName: 'Purchase Order Items',
    columns: [
        { key: 'po_date', label: 'Date', sortable: true },
        { key: 'po_number', label: 'PO Ref', sortable: true, className: 'font-mono text-xs' },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            type: 'tag-status',
        },
        { key: 'supplier', label: 'Supplier', sortable: true },
        { key: 'store', label: 'Store', sortable: true },
        { key: 'product_name', label: 'Product', sortable: true },
        { key: 'sku', label: 'SKU', sortable: true },
        { key: 'quantity', label: 'Qty', sortable: true, className: 'text-right font-bold' },
        { key: 'unit_cost', label: 'Cost', sortable: true, type: 'currency' },
        { key: 'total_cost', label: 'Total', sortable: true, type: 'currency', className: 'font-bold' },
    ],
    actions: [] // Read-only view
};
