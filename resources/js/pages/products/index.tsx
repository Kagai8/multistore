/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// 🟢 New Imports for Product Configuration
import { ProductTableConfig } from '@/components/config/tables/product-table';
import { ProductModalFormConfig } from '@/components/config/forms/product-modal-form';
import CustomModalForm from '@/components/complex-modal-form';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, CirclePlus, Package } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import ComplexTable from '@/components/complex-table';
// 🟢 NEW: Import hasPermission utility
import { hasPermission } from '@/utilis/authorization';


// --- CONFIGURATION & TYPES ---

// 🟢 NEW: Define the expected structure for the usePage() props
interface AuthPageProps {
    [key: string]: any;
    auth: {
        permissions: string[];
    };
    flash?: { success?: string; error?: string; warning?: string };
}

// 🟢 Updated Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Manage Products', href: '/products' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

// ✅ Product Interface - Data structure returned from Laravel
interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  weight: number | null;
  retail_price: number;
  special_price: number | null;
  wholesale_price: number | null;
  buying_price: number;
  discount: number | null;
  is_purchasable: boolean;
  category_id: number | string;
  brand_id: number | string;
  unit_id: number | string;
  supplier_id: number | string;
  category: string;
  brand: string;
  unit: string;
  supplier: string;
  is_active: boolean;
  // File fields (URLs from controller)
  main_image: string | null;
  multi_images: string[] | null;
  colors: string[] | null;
  description: string | null;
  created_at: string;
}

// 🟢 ProductForm interface - The data structure sent to Inertia/Laravel
interface ProductForm {
  name: string;
  sku: string;
  barcode: string;
  category_id: string;
  brand_id: string;
  unit_id: string;
  supplier_id: string;
  retail_price: number;
  special_price: number;
  wholesale_price: number;
  buying_price: number;
  discount: number;
  colors: string[];
  weight: number;
  description: string;
  is_active: boolean;
  is_purchasable: boolean;

  // File fields
  new_main_image: File | null;
  new_multi_images: File[];

  // Existing image paths to keep
  existing_multi_images: string[];

  // Forcing main image deletion
  main_image_cleared: boolean;

  _method?: 'POST' | 'PUT';
}

interface ProductPagination {
  data: Product[];
  links: LinkProps[];
  from: number;
  to: number;
  total: number;
}

interface FilterProps {
  search: string;
  perPage: string;
  dateFrom?: string | null;
  dateTo?: string | null;
}

// 🟢 Lookup data provided by the controller
interface LookupData {
    categories: Array<{ id: number; name: string }>;
    brands: Array<{ id: number; name: string }>;
    units: Array<{ id: number; name: string }>;
    suppliers: Array<{ id: number; name: string }>;
}

interface IndexProps {
  products: ProductPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
  lookupData: LookupData;
}
// --- END CONFIGURATION & TYPES ---

// 🟢 Updated component name
export default function Index({ products, filters, totalCount, filteredCount, lookupData }: IndexProps) {
  // 🟢 Access flash and auth props securely
  const { flash } = usePage<AuthPageProps>().props;
  const flashMessage = flash?.success || flash?.error;

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 🟢 State for image previews
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [multiImagePreviews, setMultiImagePreviews] = useState<string[]>([]);

  // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [productsToBulkDeleteIds, setProductsToBulkDeleteIds] = useState<number[]>([]);

  // 🟢 useForm Initialization
  const { data, setData, reset, errors, processing, post, put } = useForm<ProductForm>({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    brand_id: '',
    unit_id: '',
    supplier_id: '',
    retail_price: 0,
    special_price: 0,
    wholesale_price: 0,
    buying_price: 0,
    discount: 0,
    colors: [] as string[],
    weight: 0,
    description: '',
    is_active: true,
    is_purchasable: true,

    // CRITICAL: File fields and metadata fields
    new_main_image: null,
    new_multi_images: [],
    existing_multi_images: [],
    main_image_cleared: false,
  });

  // Filter form (search and perPage)
  const { data: filtersForm, setData: setFilterData } = useForm<FilterProps>({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  // 🟢 CRITICAL FIX #1: Dedicated handler for TagInput (JSON string)
  const handleTagInputChange = (key: 'colors', jsonString: string) => {
    try {
        // The component passes a JSON string from the TagInput field
        const parsedArray = jsonString ? JSON.parse(jsonString) as string[] : [];
        setData(key, parsedArray);
    } catch (error) {
        console.error(`Failed to parse ${key} JSON string:`, error);
        setData(key, []);
    }
  };


  // 🟢 Centralized Data Handler - CRITICAL for file handling
const handleSetData = (key: string, value: any) => {

    const isNumericField = [
        'retail_price',
        'special_price',
        'wholesale_price',
        'buying_price',
        'discount',
        'weight',
    ].includes(key);

    // 1. Handle single file (must be 'new_main_image')
    if (key === 'new_main_image' && value instanceof File) {
        setMainImagePreview(URL.createObjectURL(value));
        setData(key, value);
        setData('main_image_cleared', false); // New file means it wasn't cleared
    }
    // 1b. Handle single file CLEAR button
    else if (key === 'main_image_cleared' && value === true) {
        setMainImagePreview(null);
        setData('new_main_image', null); // Ensure no old file is left hanging
        setData(key, true);
    }
    // 2. Handle multi files (must be 'new_multi_images')
    else if (key === 'new_multi_images' && Array.isArray(value) && value.every((v) => v instanceof File)) {
        setData(key, value);
    }

    // 3. Handle boolean fields
    else if (key === 'is_active' || key === 'is_purchasable') {
        setData(key, Boolean(value));
    }
    // 4. Handle Numeric Fields (including 'weight')
    else if (isNumericField) {
        // Ensure values like '' or null become 0 for number inputs
        const numericValue = value === '' || value === null ? 0 : Number(value);
        setData(key as any, numericValue);
    }
    // 5. For all other fields (foreign keys, text, etc., and existing_multi_images array)
    else {
        setData(key as any, value);
    }
};

  // Auto-hide toast after 3s
  useEffect(() => {
    if (flashMessage) {
      if (flash.success) toast.success(flash.success);
      if (flash.error) toast.error(flash.error);
    }
  }, [flashMessage, flash]);

  // ✅ openModal function with explicit, type-safe data mapping
const openModal = (m: 'create' | 'view' | 'edit', product?: Product) => {
    setMode(m);

    // Clear the form and previews before setting new data
    setMainImagePreview(null);
    setMultiImagePreviews([]);

    if (product) {
      setSelectedProduct(product);

      setData((prev) => ({
        ...prev,
        // Core fields
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        weight: product.weight || 0,
        colors: product.colors || [],
        description: product.description || '',

        // Status fields
        is_active: product.is_active,
        is_purchasable: product.is_purchasable,

        // Foreign Key IDs (ensure they are strings for select components)
        category_id: String(product.category_id || ''),
        brand_id: String(product.brand_id || ''),
        unit_id: String(product.unit_id || ''),
        supplier_id: String(product.supplier_id || ''),

        // Pricing fields
        retail_price: product.retail_price,
        special_price: product.special_price || 0,
        wholesale_price: product.wholesale_price || 0,
        buying_price: product.buying_price,
        discount: product.discount || 0,

        // CRITICAL: File/Method fields for EDIT mode
        new_main_image: null,
        new_multi_images: [],
        existing_multi_images: product.multi_images || [],
        main_image_cleared: false,
        _method: 'PUT', // Explicitly set for PUT spoofing
      } as ProductForm));

      // 🟢 Set Image Previews for display
      setMainImagePreview(product.main_image || null);
      setMultiImagePreviews(product.multi_images || []);

    } else {
        // Create mode setup
        reset();
        setData('_method', 'POST' as any);
        // Ensure colors array is empty and other defaults are correct
        setData({
             ...data, // Use existing defaults
             colors: [],
             existing_multi_images: [],
             _method: 'POST',
        } as ProductForm);
    }

    setModalOpen(true);
};

  const closeModal = () => {
    setMode('create');
    setSelectedProduct(null);
    setMainImagePreview(null);
    setMultiImagePreviews([]);
    reset();
    setModalOpen(false);
  };

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "edit" && selectedProduct) {
        // Data._method is already set to "PUT" in openModal

        post(route("products.update", selectedProduct.id), {
            forceFormData: true,

            onSuccess: () => {
                toast.success("Product updated");
                closeModal();
            },

            onError: () => {
                toast.error("Failed to update product");
            },
        });
    } else {
        // Data._method is "POST"
        post(route("products.store"), {
            forceFormData: true,

            onSuccess: () => {
                toast.success("Product created");
                closeModal();
            },

            onError: () => {
                toast.error("Failed to create product");
            },
        });
    }
};


// ... (Standard Table Handlers)

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterData('search', value);
    const query = {
      ...(value && { search: value }),
      ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
      ...(filtersForm.dateFrom && { dateFrom: filtersForm.dateFrom }),
      ...(filtersForm.dateTo && { dateTo: filtersForm.dateTo }),
    };
    router.get(route('products.index'), query, { preserveState: true, preserveScroll: true });
};

const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    router.get(route('products.index'), {}, { preserveState: true, preserveScroll: true });
};

const handlePerPageChange = (value: string) => {
    setFilterData('perPage', value);
    const query = {
      ...(filtersForm.search && { search: filtersForm.search }),
      ...(value && { perPage: value }),
      ...(filtersForm.dateFrom && { dateFrom: filtersForm.dateFrom }),
      ...(filtersForm.dateTo && { dateTo: filtersForm.dateTo }),
    };
    router.get(route('products.index'), query, { preserveState: true, preserveScroll: true });
};

const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
};

const confirmDelete = () => {
    if (!productToDelete) return;
    router.delete(route('products.destroy', productToDelete.id), {
        onSuccess: () => {
            setShowDeleteModal(false);
            setProductToDelete(null);
        },
        onError: () => toast.error('Failed to delete product'),
        preserveScroll: true,
        preserveState: true,
    });
};

const handleExportPDF = (product: Product) => {
    window.open(route('products.export.pdf.single', product.id), '_blank');
};

const handleExportExcel = (product: Product) => {
    window.open(route('products.export.excel.single', product.id), '_blank');
};

const handleBulkDelete = (ids: number[]) => {
    if (!ids.length) return toast.error('No products selected');
    setProductsToBulkDeleteIds(ids);
    setShowBulkDeleteModal(true);
};

const confirmBulkDelete = () => {
    const ids = productsToBulkDeleteIds;
    if (!ids.length) return;
    router.post(
        route('products.bulk-delete'),
        { ids },
        {
            preserveScroll: true,
            onSuccess: (resp: any) => {
                const msg = resp?.props?.flash?.success || `${ids.length} product(s) deleted`;
                toast.success(msg);
                setShowBulkDeleteModal(false);
                setProductsToBulkDeleteIds([]);
            },
            onError: () => {
                toast.error('Failed to delete selected products');
                setShowBulkDeleteModal(false);
                setProductsToBulkDeleteIds([]);
            }
        }
    );
};

const handleBulkExportPDF = (ids: number[]) => {
    if (!ids.length) return toast.error('No products selected');
    const url = route('products.bulk-export-pdf') + `?ids=${ids.join(',')}`;
    window.open(url, '_blank');
};

const handleBulkExportExcel = (ids: number[]) => {
    if (!ids.length) return toast.error('No products selected');
    const url = route('products.bulk-export-excel') + `?ids=${ids.join(',')}`;
    window.open(url, '_blank');
};

const handleDownloadTemplate = () => {
    try {
        window.open(route('products.download-template'), '_blank');
    } catch (error) {
        toast.error('Failed to download template');
    }
};

const handleFileSelected = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    router.post(route('products.import'), formData, {
        forceFormData: true,
        onStart: () => toast.loading('Importing...', { id: 'import' }),
        onSuccess: (resp: any) => {
            toast.success(resp?.props?.flash?.success || 'Products imported successfully', { id: 'import' });
        },
        onError: () => toast.error('Failed to import file', { id: 'import' }),
    });
};

const handleDateFilterChange = (dateFrom: string | null, dateTo: string | null) => {
    setFilterData((prev) => ({
        ...prev,
        dateFrom: dateFrom,
        dateTo: dateTo,
    }));

    const query = {
        ...(filtersForm.search && { search: filtersForm.search }),
        ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
        ...(dateFrom && { dateFrom: dateFrom }),
        ...(dateTo && { dateTo: dateTo }),
    };

    router.get(route('products.index'), query, { preserveState: true, preserveScroll: true });
};


return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Products" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                <Package size={26} className="text-orange-600 mr-1" />
                Product Management Hub
            </h2>
            <p className="text-sm text-gray-600 max-w-2xxl">
                Create new products, update and view existing ones, and organize your product information efficiently. Use the filters to get reporting data as needed.
            </p>
        {/* Filters and Secured Add Button */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search Product by name, SKU, or related entity..."
            name="search"
          />

          <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
            <X size={20} />
          </Button>

          {/* 🟢 CRITICAL FIX: CustomModalForm call moved here to render the secure button */}
          <div className="ml-auto">
            <CustomModalForm
                // CRITICAL: Key to force component reset on open/edit
                key={selectedProduct ? `product-edit-${selectedProduct.id}` : 'product-create'}
                title={
                    mode === 'view'
                        ? 'View Product'
                        : mode === 'edit'
                        ? 'Update Product'
                        : ProductModalFormConfig.title
                }
                description={ProductModalFormConfig.description}
                fields={ProductModalFormConfig.fields}
                buttons={ProductModalFormConfig.buttons}
                // 🟢 THIS PROP RENDERS THE SECURED BUTTON
                addButton={ProductModalFormConfig.addButton}

                data={data}
                // 🛑 Interceptor to handle TagInput (colors) safely
                setData={(key, value) => {
                    if (key === 'colors' && typeof value === 'string') {
                        handleTagInputChange('colors', value);
                    } else {
                        handleSetData(key, value);
                    }
                }}
                processing={processing}
                handleSubmit={handleSubmit}
                errors={errors}
                open={modalOpen}
                onOpenChange={(open: boolean) => {
                    if (!open) closeModal();
                    else setModalOpen(open);
                }}
                mode={mode}
                mainImagePreview={mainImagePreview}
                multiImagePreviews={multiImagePreviews}
                setMultiImagePreviews={setMultiImagePreviews}
                extraData={lookupData}
            />
          </div>
          {/* ❌ REMOVED: The manual Button component that called openModal('create') was here */}
        </div>

        {/* Table */}
        <ComplexTable
          moduleName="Product"
          importPermission="import-category"
            downloadTemplatePermission="download-template-category"
          columns={ProductTableConfig.columns}
          actions={ProductTableConfig.actions}
          data={products.data}
          from={products.from}
          onView={(b: any) => openModal('view', b)}
          onEdit={(b: any) => openModal('edit', b)}
          onDelete={handleDelete}
          onExportPDF={(b: any) => handleExportPDF(b)}
            onExportExcel={(b: any) => handleExportExcel(b)}
            onBulkDelete={handleBulkDelete}
            onBulkExportPDF={handleBulkExportPDF}
            onBulkExportExcel={handleBulkExportExcel}
          isModal
            onDownloadTemplate={handleDownloadTemplate}
            onFileSelected={handleFileSelected}
            onDateFilterChange={handleDateFilterChange}
        />

        {/* Pagination — only show when data exists */}
        {products.data && products.data.length > 0 && (

          <Pagination
            products={products}
            perPage={filtersForm.perPage}
            onPerPageChange={handlePerPageChange}
            totalCount={totalCount}
            filteredCount={filteredCount}
            search={filtersForm.search}
          />

        )}
      </div>

      {/* Delete Confirmation Modal */}
        {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-800">{productToDelete?.name}</span>?
                This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
                <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => setShowDeleteModal(false)}
                >
                Cancel
                </Button>
                <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDelete}
                >
                Delete
                </Button>
            </div>
            </div>
        </div>
        )}
        {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-red-700">Confirm Bulk Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-red-700">{productsToBulkDeleteIds.length} selected product(s)</span>?
                This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
                <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => setShowBulkDeleteModal(false)}
                >
                Cancel
                </Button>
                <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmBulkDelete}
                >
                Yes, Delete Selected
                </Button>
            </div>
            </div>
        </div>
        )}

    </AppLayout>
  );
}
