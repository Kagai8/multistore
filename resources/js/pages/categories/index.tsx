/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';

import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { CategoryTableConfig } from '@/components/config/tables/category-table';
import { CategoryModalFormConfig } from '@/components/config/forms/category-modal-form';
import CustomTable from '@/components/custom-table';
import SimpleModalForm from '@/components/simple-custom-modal-form';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Folder, X } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';




// --- CONFIGURATION & TYPES ---

// 🟢 NEW: Define the expected structure for the usePage() props
interface AuthPageProps {
    [key: string]: any;
    auth: {
        permissions: string[];
    };
    flash?: { success?: string; error?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Categories', href: '/categories' },
  { title: 'Manage Categories', href: '/categories' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  logo?: string | null;
  created_at: string;
}

interface CategoryPagination {
  data: Category[];
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

interface IndexProps {
  categories: CategoryPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}

// --- END CONFIGURATION & TYPES ---


export default function Index({ categories, filters, totalCount, filteredCount }: IndexProps) {
  // 🟢 FIX: Use AuthPageProps generic to safely access auth and flash
  const { auth, flash } = usePage<AuthPageProps>().props;
  const flashMessage = flash?.success || flash?.error;
  // const permissions = auth?.permissions || []; // Available for checks if needed

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [categoriesToBulkDeleteIds, setCategoriesToBulkDeleteIds] = useState<number[]>([]);

  // Form for creating/editing
  const { data, setData, reset, errors, processing, post } = useForm({
    name: '',
    description: '',
    logo: null as File | null,
    _method: 'POST',
  });

  // Filter form (search and perPage)
  const { data: filtersForm, setData: setFilterData } = useForm<FilterProps>({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  // 🧹 CLEANUP: Simplified handleSetData
  const handleSetData = (key: string, value: any) => {
    setData(key, value);

    if (key === 'logo' && value instanceof File) {
        const url = URL.createObjectURL(value);
        setMainImagePreview(url);
    } else if (key === 'logo' && value === null) {
        setMainImagePreview(null);
    }
  };

  // Handle flash messages
  useEffect(() => {
    if (flashMessage) {
        const type = flash.success ? 'success' : flash.error ? 'error' : 'warning';
        toast[type](flashMessage);
    }
  }, [flashMessage, flash]);

  // Search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterData('search', value);

    const query = {
      ...(value && { search: value }),
      ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
      ...(filtersForm.dateFrom && { dateFrom: filtersForm.dateFrom }),
      ...(filtersForm.dateTo && { dateTo: filtersForm.dateTo }),
    };

    router.get(route('categories.index'), query, { preserveState: true, preserveScroll: true });
  };

  // Reset
  const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    router.get(route('categories.index'), {}, { preserveState: true, preserveScroll: true });
  };

  // Per page change
  const handlePerPageChange = (value: string) => {
    setFilterData('perPage', value);
    const query = {
      ...(filtersForm.search && { search: filtersForm.search }),
      ...(value && { perPage: value }),
      ...(filtersForm.dateFrom && { dateFrom: filtersForm.dateFrom }),
      ...(filtersForm.dateTo && { dateTo: filtersForm.dateTo }),
    };
    router.get(route('categories.index'), query, { preserveState: true, preserveScroll: true });
  };

  // Date Filter Handler
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

    router.get(route('categories.index'), query, { preserveState: true, preserveScroll: true });
  };


  // Open modal (create, view, edit)
  const openModal = (m: 'create' | 'view' | 'edit', category?: Category) => {
    setMode(m);

    if (category) {
        // Map category data to form data
        setData((prev) => ({
            ...prev,
            id: category.id as any,
            name: category.name,
            description: category.description || '',
            logo: null, // Always set logo File to null for edit, use logo URL for preview
            _method: 'PUT',
        }));
        setSelectedCategory(category);
        setMainImagePreview(category.logo || null); // Set preview URL from DB path
    } else {
        // Create mode
        reset();
        setSelectedCategory(null);
        setMainImagePreview(null);
        setData('_method', 'POST' as any);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setMode('create');
    setSelectedCategory(null);
    setMainImagePreview(null);
    reset();
    setModalOpen(false);
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const actionRoute = selectedCategory ? route('categories.update', selectedCategory.id) : route('categories.store');

    post(actionRoute, {
        forceFormData: true,
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || (selectedCategory ? 'Category updated successfully.' : 'Category created successfully.');
          toast.success(msg);
          closeModal();
        },
        onError: (err: any) => {
          const msg = err?.message || (selectedCategory ? 'Failed to update category.' : 'Failed to create category.');
          toast.error(msg);
        },
    });
  };

  // Open delete confirmation modal
  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  // Confirm delete when user clicks "Delete" in modal
  const confirmDelete = () => {
    if (!categoryToDelete) return;

    router.delete(route('categories.destroy', categoryToDelete.id), {
      onSuccess: () => {
        setShowDeleteModal(false);
        setCategoryToDelete(null);
      },
      onError: () => toast.error('Failed to delete category'),
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleExportPDF = (category: Category) => {
    window.open(route('categories.exportSinglePdf', category.id), '_blank');
  };

  const handleExportExcel = (category: Category) => {
    window.open(route('categories.exportSingleExcel', category.id), '_blank');
  };

  // BULK ACTIONS
  const handleBulkDelete = (ids: number[]) => {
    if (!ids.length) return toast.error('No categories selected');
    setCategoriesToBulkDeleteIds(ids);
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    const ids = categoriesToBulkDeleteIds;
    if (!ids.length) return;

    router.post(
      route('categories.bulk-delete'),
      { ids },
      {
        preserveScroll: true,
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || `${ids.length} category(s) deleted`;
          toast.success(msg);
          setShowBulkDeleteModal(false);
          setCategoriesToBulkDeleteIds([]);
        },
        onError: () => {
          toast.error('Failed to delete selected categories');
          setShowBulkDeleteModal(false);
          setCategoriesToBulkDeleteIds([]);
        }
      }
    );
  };

  const handleBulkExportPDF = (ids: number[]) => {
    if (!ids.length) return toast.error('No categories selected');
    const url = route('categories.bulk-export-pdf') + `?ids=${ids.join(',')}`;
    window.open(url, '_blank');
  };

  const handleBulkExportExcel = (ids: number[]) => {
    if (!ids.length) return toast.error('No categories selected');
    const url = route('categories.bulk-export-excel') + `?ids=${ids.join(',')}`;
    window.open(url, '_blank');
  };

  // Download Template handler
  const handleDownloadTemplate = () => {
    window.open(route('categories.download-template'), '_blank');
  };

  // Import File handler
  const handleFileSelected = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    router.post(route('categories.import'), formData, {
      forceFormData: true,
      onStart: () => toast.loading('Importing...', { id: 'import' }),
      onSuccess: (resp: any) => {
        toast.success(resp?.props?.flash?.success || 'Categories imported successfully', { id: 'import' });
      },
      onError: (errors: any) => {
        const errorMessage = errors?.file || 'Failed to import file. Check file format.';
        toast.error(errorMessage, { id: 'import' });
      },
    });
  };


return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Categories" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
            <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                <Folder size={26} className="text-orange-600 mr-1" />
                Category Management Hub
            </h2>
            <p className="text-sm text-gray-600 max-w-2xxl">
                Create new categories, update and view existing ones, and organize your category information efficiently. Use the filters to get reporting data as needed.
            </p>
        {/* Filters */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search Category..."
            name="search"
          />

          <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
            <X size={20} />
          </Button>

          {/* 🟢 CRITICAL FIX: Replace manual button with SimpleModalForm component */}
          <div className="ml-auto">
            <SimpleModalForm
                title={
                    mode === 'view'
                        ? 'View Category'
                        : mode === 'edit'
                        ? 'Update Category'
                        : CategoryModalFormConfig.title
                }
                description={CategoryModalFormConfig.description}
                fields={CategoryModalFormConfig.fields}
                buttons={CategoryModalFormConfig.buttons}
                data={data}
                setData={handleSetData}
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
                // 🟢 THIS PROP RENDERS THE BUTTON WITH SECURITY CHECK
                addButton={CategoryModalFormConfig.addButton}
            />
          </div>
          {/* ❌ REMOVED: The manual Button component that called openModal('create') was here */}
        </div>

        {/* Table */}
        <CustomTable
            moduleName="Category"
            importPermission="import-category"
            downloadTemplatePermission="download-template-category"
            columns={CategoryTableConfig.columns}
            actions={CategoryTableConfig.actions}
            data={categories.data}
            from={categories.from}
            onView={(b: any) => openModal('view', b)}
            onEdit={(b: any) => openModal('edit', b)}
            onDelete={handleDelete}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            onBulkDelete={handleBulkDelete}
            onBulkExportPDF={handleBulkExportPDF}
            onBulkExportExcel={handleBulkExportExcel}
            isModal
            onDownloadTemplate={handleDownloadTemplate}
            onFileSelected={handleFileSelected}
            onDateFilterChange={handleDateFilterChange}
        />

        {/* Pagination — only show when data exists */}
        {categories.data && categories.data.length > 0 && (

          <Pagination
            products={categories}
            perPage={filtersForm.perPage}
            onPerPageChange={handlePerPageChange}
            totalCount={totalCount}
            filteredCount={filteredCount}
            search={filtersForm.search}
          />

        )}
      </div>

      {/* ❌ REMOVED: The SimpleModalForm component call was here, it's now in the header */}

      {/* Delete Confirmation Modal */}
        {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-800">{categoryToDelete?.name}</span>?
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
                <span className="font-semibold text-red-700">{categoriesToBulkDeleteIds.length} selected category(s)</span>?
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
