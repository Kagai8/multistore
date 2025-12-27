import { Trash2, FileText, FileSpreadsheet, Download, Upload, Pencil, Eye } from "lucide-react";

// Modules list repeated here to ensure the filter dropdown works correctly
const ALL_MODULES = [
    {label: 'Users', value: 'users', key: 'users'},
    {label: 'Roles', value: 'roles', key: 'roles'},
    {label: 'Permissions', value: 'permissions', key: 'permissions'},
    {label: 'Stores', value: 'stores', key: 'stores'},
    {label: 'Customers', value: 'customers', key: 'customers'},
    {label: 'Suppliers', value: 'suppliers', key: 'suppliers'},
    {label: 'Products', value: 'products', key: 'products'},
    {label: 'Categories', value: 'categories', key: 'categories'},
    {label: 'Brands', value: 'brands', key: 'brands'},
    {label: 'Units', value: 'units', key: 'units'},
    {label: 'Stocks', value: 'stocks', key: 'stocks'},
    {label: 'New Stock Entries', value: 'new-stock', key: 'new-stock'},
    {label: 'Stock Adjustments', value: 'stock-adjustments', key: 'stock-adjustments'},
    {label: 'Adjustment Reasons', value: 'adjustment-reasons', key: 'adjustment-reasons'},
    {label: 'Stock Transfers', value: 'stock-transfers', key: 'stock-transfers'},
    {label: 'Stock Transfer Items', value: 'transfer-items', key: 'transfer-items'},
];


export const PermissionsTableConfig = {
    // 🛑 1. Filterable Columns
    columns: [
        {label: 'Permission Name', key: 'label', className: 'p-4 border', isSortable: true},
        {label: 'Module', key: 'module', className: 'capitalize p-4 border', isSortable: true},
        {label: 'Slug (Name)', key: 'name', className: 'p-4 border text-sm text-gray-500', isHidden: true},
        {label: 'Description', key: 'description', className:'w-90 p-4 border'},
        // Using the 'boolean' type from your ComplexTable component for Active/Inactive status
        {label: 'Status', key: 'is_active', className:'p-4 border', type: 'boolean'},
        {label: 'Created', key: 'created_at', className:'p-4 border', isSortable: true},
        {label: 'Actions', key: 'actions', isAction: true, className: 'p-4 border'},
    ],

    // 🛑 2. Row Actions
    actions: [
        {
            label: 'View',
            icon: Eye, // ✅ Added View action
            // Consistent small size class
            className: 'bg-blue-600 text-white p-1 rounded-lg cursor-pointer hover:bg-blue-700',
             // Assuming a 'view-permission' permission exists
            actionType: 'view'
        },
        {
            label: 'Edit',
            icon: Pencil,
            // Consistent small size class
            className: 'bg-orange-600 text-white p-1 rounded-lg cursor-pointer hover:bg-orange-700',

            actionType: 'edit'
        },
        {
            label: 'Delete',
            icon: Trash2,
            // Consistent small size class
            className: 'bg-red-600 text-white p-1 rounded-lg cursor-pointer hover:opacity-90',
            
            actionType: 'delete',

        },
        // Optional: Export single permission details
        {label: 'Export PDF', icon: FileText, className: 'ms-2 bg-gray-600 text-white p-1 rounded-lg cursor-pointer hover:opacity-90', permission:'export-permission', actionType: 'export-pdf'},
        {label: 'Export Excel', icon: FileSpreadsheet, className: 'ms-2 bg-gray-600 text-white p-1 rounded-lg cursor-pointer hover:opacity-90', permission:'export-permission', actionType: 'export-excel'},
    ],

    // 🛑 3. Bulk Actions (matching the Brand template)
    bulkActions: [
        {label: 'Delete Selected', icon: Trash2, permission: 'bulk-delete-permission', className: 'bg-red-600 text-white hover:bg-red-700', actionType: 'bulk-delete', endpoint: 'permissions.bulk-delete'},
        {label: 'Export to PDF', icon: FileText, permission: 'export-permission', className: 'bg-gray-600 text-white hover:bg-gray-700', actionType: 'bulk-export-pdf', endpoint: 'permissions.bulk-export-pdf'},
        {label: 'Export to Excel', icon: FileSpreadsheet, permission: 'export-permission', className: 'bg-gray-600 text-white hover:bg-gray-700', actionType: 'bulk-export-excel', endpoint: 'permissions.bulk-export-excel'},
    ],

    // 🛑 4. Context Actions (Template, Import/Export)
    contextActions: [
        {label: 'Download Template', icon: Download, permission: 'import-permission', className: 'bg-sky-600 text-white hover:bg-sky-700', actionType: 'download-template', endpoint: 'permissions.download-template'},
        {label: 'Import Permissions', icon: Upload, permission: 'import-permission', className: 'bg-sky-600 text-white hover:bg-sky-700', actionType: 'import', endpoint: 'permissions.import'},
    ],

    // 🛑 5. Searchable fields for Controller
    searchFields: ['label', 'module', 'name', 'description'],

    // 🛑 6. Filters (to use in the table header)
    filters: [
        // Filter by the module dropdown (manual list)
        { key: 'module', label: 'Filter by Module', type: 'select', options: ALL_MODULES },

        // Date range filter
        { key: 'dateFrom', label: 'Date From', type: 'date', className: 'w-48' },
        { key: 'dateTo', label: 'Date To', type: 'date', className: 'w-48' },

        // Status filter (Active/Inactive)
        { key: 'is_active', label: 'Status', type: 'select', options: [
            { id: '1', name: 'Active' },
            { id: '0', name: 'Inactive' }
        ] }
    ]
}
