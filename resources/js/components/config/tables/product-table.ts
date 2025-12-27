// resources/js/config/tables/product-table.ts
import { Eye, FileSpreadsheet, FileText, Pencil, Trash } from "lucide-react";

export const ProductTableConfig = {
  columns: [
    // Core Identity
    {
        label: 'Main Image',
        key: 'main_image',
        isImage: true, // Optional Image field (Can be hidden)
        className: 'p-4 border text-center w-24'
    },
    {
        label: 'Product Name',
        key: 'name',
        className: 'p-4 border text-left font-semibold'
    },
    {
        label: 'SKU',
        key: 'sku',
        className: 'p-4 border text-center text-sm'
    },
    {
        label: 'Barcode', // ➕ Added missing field
        key: 'barcode',
        className: 'p-4 border text-center text-sm'
    },

    // Relationships
    {
        label: 'Category',
        key: 'category',
        className: 'p-4 border text-center'
    },
    {
        label: 'Brand',
        key: 'brand',
        className: 'p-4 border text-center'
    },
    {
        label: 'Supplier',
        key: 'supplier',
        className: 'p-4 border text-center'
    },
    {
        label: 'Unit', // ➕ Added missing field
        key: 'unit',
        className: 'p-4 border text-center'
    },
    {
        label: 'Colors', // ➕ Added missing field (using multi-values for JSON array)
        key: 'colors',
        type: 'tag-array',
        className: 'p-4 border text-center'
    },

    // Pricing
    {
        label: 'Retail Price',
        key: 'retail_price',
        type: 'currency',
        className: 'p-4 border text-right font-bold text-green-700'
    },
    {
        label: 'Special Price', // ➕ Added missing field
        key: 'special_price',
        type: 'currency',
        className: 'p-4 border text-right'
    },
    {
        label: 'Wholesale Price', // ➕ Added missing field
        key: 'wholesale_price',
        type: 'currency',
        className: 'p-4 border text-right'
    },
    {
        label: 'Buying Price',
        key: 'buying_price',
        type: 'currency',
        className: 'p-4 border text-right'
    },
    {
        label: 'Discount', // ➕ Added missing field
        key: 'discount',
        className: 'p-4 border text-right'
    },

    // Status & Logistics
    {
        label: 'Weight', // ➕ Added missing field
        key: 'weight',
        className: 'p-4 border text-center text-sm',
        defaultHidden: true,
    },
    {
        label: 'Active',
        key: 'is_active',
        type: 'boolean',
        className: 'p-4 border text-center'
    },
    {
        label: 'Purchasable', // ➕ Added missing field
        key: 'is_purchasable',
        type: 'boolean',
        className: 'p-4 border text-center',
        defaultHidden: true,
    },

    {
        label: 'Created Date',
        key: 'created_at',
        className: 'p-4 border text-center text-xs'
    },
    {
        label: 'Actions',
        key: 'actions',
        isAction: true,
        isMandatory: true, // 💡 NEW: Actions must be mandatory
        className: 'p-4 border text-center w-32'
    },

  ],
  actions: [
    {
      label: 'View',
      icon: Eye,
      className: 'flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150',
      permission: 'view-product',
    },
    {
      label: 'Edit',
      icon: Pencil,
      className: 'flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
      permission: 'edit-product',
    },
    {
      label: 'Delete',
      icon: Trash,
      className:
        'flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-2 py-1 rounded-lg shadow-sm transition-all duration-150 ms-1',
      permission: 'delete-product',
    },
    {
      label: 'Export PDF',
      icon: FileText,
      permission: 'export-pdf-product',
    },
    {
      label: 'Export Excel',
      icon: FileSpreadsheet,
      permission: 'export-excel-product',
    },
  ],
};
