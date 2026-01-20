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
import { Folder, X, AlertTriangle } from 'lucide-react'; // 🟢 Added AlertTriangle
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

// --- CONFIGURATION & TYPES ---

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
  products_count?: number; // 🟢 Added for Smart Delete
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
  const { auth, flash } = usePage<AuthPageProps>().props;
  const flashMessage = flash?.success || flash?.error;

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

  // Filter form
  const { data: filtersForm, setData: setFilterData } = useForm<FilterProps>({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  // Handle File Input Correctly
  const handleSetData = (key: string, value: any) => {
    setData(key, value);
    if (key === 'logo' && value instanceof File) {
        const url = URL.createObjectURL(value);
        setMainImagePreview(url);
    } else if (key === 'logo' && value === null) {
        setMainImagePreview(null);
    }
  };

  // Handle flash messages (Global Listener)
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
    setFilterData((prev) => ({ ...prev, dateFrom, dateTo }));
    const query = {
      ...(filtersForm.search && { search: filtersForm.search }),
      ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
      ...(dateFrom && { dateFrom: dateFrom }),
      ...(dateTo && { dateTo: dateTo }),
    };
    router.get(route('categories.index'), query, { preserveState: true, preserveScroll: true });
  };

  // Open modal logic
  const openModal = (m: 'create' | 'view' | 'edit', category?: Category) => {
    setMode(m);
    if (category) {
        setData((prev) => ({
            ...prev,
            id: category.id as any,
            name: category.name,
            description: category.description || '',
            logo: null,
            _method: 'PUT',
        }));
        setSelectedCategory(category);
        setMainImagePreview(category.logo || null);
    } else {
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
        onSuccess: () => {
          // 🟢 FIX: Removed manual toast to prevent double notification
          closeModal();
        },
        onError: (err: any) => {
          const msg = err?.message || (selectedCategory ? 'Failed to update category.' : 'Failed to create category.');
          toast.error(msg);
        },
    });
  };

  // Delete handlers
  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

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

  // Export handlers
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

  // 🟢 Helper to calculate total products affected by bulk selection
  const getBulkAffectedCount = () => {
    return categories.data
        .filter((c) => categoriesToBulkDeleteIds.includes(c.id))
        .reduce((sum, c) => sum + (c.products_count || 0), 0);
  };

  const confirmBulkDelete = () => {
    const ids = categoriesToBulkDeleteIds;
    if (!ids.length) return;

    router.post(route('categories.bulk-delete'), { ids }, {
        preserveScroll: true,
        onSuccess: () => {
          // 🟢 FIX: Removed manual toast
          setShowBulkDeleteModal(false);
          setCategoriesToBulkDeleteIds([]);
        },
        onError: () => {
          toast.error('Failed to delete selected categories');
          setShowBulkDeleteModal(false);
          setCategoriesToBulkDeleteIds([]);
        }
    });
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

  const handleDownloadTemplate = () => {
    window.open(route('categories.download-template'), '_blank');
  };

  const handleFileSelected = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    router.post(route('categories.import'), formData, {
      forceFormData: true,
      onStart: () => toast.loading('Importing...', { id: 'import' }),
      onSuccess: () => {
        // 🟢 FIX: Dismiss loading toast, let global listener handle success
        toast.dismiss('import');
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

          <div className="ml-auto">
            <SimpleModalForm
                title={mode === 'view' ? 'View Category' : mode === 'edit' ? 'Update Category' : CategoryModalFormConfig.title}
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
                addButton={CategoryModalFormConfig.addButton}
            />
          </div>
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

        {/* Pagination */}
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

      {/* 🟢 SMART DELETE MODAL */}
        {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <AlertTriangle className="h-6 w-6" />
                    <h2 className="text-lg font-semibold">Confirm Deletion</h2>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                    <p>Are you sure you want to delete <span className="font-bold text-gray-800">{categoryToDelete?.name}</span>?</p>

                    {/* Warning Block */}
                    {(categoryToDelete?.products_count || 0) > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-orange-800">
                            <span className="font-bold">Warning:</span> This category is currently assigned to
                            <span className="font-bold text-lg mx-1">{categoryToDelete?.products_count}</span>
                            products. Deleting it may cause data issues.
                        </div>
                    )}

                    <p>This action cannot be undone.</p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Delete</Button>
                </div>
            </div>
        </div>
        )}

        {/* 🟢 SMART BULK DELETE MODAL */}
        {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <AlertTriangle className="h-6 w-6" />
                    <h2 className="text-lg font-semibold">Bulk Delete Warning</h2>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                    <p>You are about to delete <span className="font-bold text-gray-800">{categoriesToBulkDeleteIds.length} categories</span>.</p>

                    {/* Bulk Warning Block */}
                    {getBulkAffectedCount() > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
                            <span className="font-bold">CRITICAL:</span> These categories affect a total of
                            <span className="font-bold text-lg mx-1">{getBulkAffectedCount()}</span>
                            products. This could significantly impact your inventory.
                        </div>
                    )}

                    <p>Are you absolutely sure?</p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)}>Cancel</Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmBulkDelete}>Yes, Delete Selected</Button>
                </div>
            </div>
        </div>
        )}

    </AppLayout>
  );
}
