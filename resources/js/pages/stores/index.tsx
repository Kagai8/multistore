/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout'; // Assuming this is your main layout
import { StoreTableConfig } from '@/components/config/tables/store-table';
import { StoreModalFormConfig } from '@/components/config/forms/store-modal-form';
import CustomTable from '@/components/custom-table';
import { SimpleModalForm } from '@/components/simple-custom-modal-form'; // Note: Use named import if SimpleModalForm is not default export
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, CirclePlus, Package, StoreIcon } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Manage Stores', href: '/stores' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface Store {
  id: number;
  name: string;
  type: 'warehouse' | 'retail';
  code: string; // System generated
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  created_at: string;
}

interface StorePagination {
  data: Store[];
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
  stores: StorePagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}

export default function Index({ stores, filters, totalCount, filteredCount }: IndexProps) {
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
  const moduleName = 'stores';
  const routePrefix = 'stores';
  const modalConfig = StoreModalFormConfig;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [storesToBulkDeleteIds, setStoresToBulkDeleteIds] = useState<number[]>([]);

  // Form for creating/editing
  const { data, setData, reset, errors, processing, post, put } = useForm({
    name: '',
    type: 'retail' as 'warehouse' | 'retail',
    phone: '',
    email: '',
    address: '',
    // NOTE: 'code' is intentionally excluded from the form data as it is system-generated
    _method: 'POST',
  });

  // Filter form
  const { data: filtersForm, setData: setFilterData } = useForm({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  // Simple handler for all non-file fields
  const handleSetData = (key: string, value: any) => {
    setData(key, value);
  };

  // Filter helper
  const handleFilterRequest = (query: Record<string, any>) => {
    router.get(route(`${routePrefix}.index`), query, { preserveState: true, preserveScroll: true });
  }

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

    handleFilterRequest(query);
  };

  // Reset
  const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    handleFilterRequest({});
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
    handleFilterRequest(query);
  };

  // Open modal (view, edit) - Create mode is now handled by the addButton delegation
  const handleOpenEditViewModal = (m: 'view' | 'edit', store: Store) => {
    setMode(m);

    // Load all data fields into the form state, excluding code if not editable in form
    setData({
      name: store.name,
      type: store.type,
      phone: store.phone || '',
      email: store.email || '',
      address: store.address || '',
      _method: 'PUT' as any // Important for PUT request
    });
    setSelectedStore(store);
    setModalOpen(true);
  };

  const closeModal = () => {
    setMode('create');
    setSelectedStore(null);
    reset();
    setModalOpen(false);
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'edit' && selectedStore) {
      put(route(`${routePrefix}.update`, selectedStore.id), {
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || 'Store updated';
          toast.success(msg);
          closeModal();
        },
        onError: () => toast.error('Failed to update store'),
      });
    } else {
      post(route(`${routePrefix}.store`), {
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || 'Store created';
          toast.success(msg);
          closeModal();
        },
        onError: () => toast.error('Failed to create store'),
      });
    }
  };

  // Single Delete
  const handleDelete = (store: Store) => {
    setStoreToDelete(store);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!storeToDelete) return;

    router.delete(route(`${routePrefix}.destroy`, storeToDelete.id), {
      onSuccess: (resp: any) => {
        const msg = resp?.props?.flash?.success || 'Store deleted successfully';
        toast.success(msg);
        setShowDeleteModal(false);
        setStoreToDelete(null);
      },
      onError: () => toast.error('Failed to delete store'),
    });
  };

  const handleExportPDF = (store: Store) => {
    toast.info(`Exporting ${store.name} (PDF)...`);
     // ✅ Direct route string
     window.open(route('stores.export.pdf.single', store.id), '_blank');
  };

  const handleExportExcel = (store: Store) => {
    toast.info(`Exporting ${store.name} (Excel)...`);
    // ✅ Direct route string
    window.open(route('stores.export.excel.single', store.id), '_blank');
  };

  // BULK ACTIONS
  const handleBulkDelete = (ids: number[]) => {
    if (!ids.length) return toast.error('No stores selected');
    setStoresToBulkDeleteIds(ids);
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    const ids = storesToBulkDeleteIds;
    if (!ids.length) return;

    router.post(
      route(`${routePrefix}.bulk-delete`),
      { ids },
      {
        preserveScroll: true,
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || `${ids.length} store(s) deleted`;
          toast.success(msg);
          setShowBulkDeleteModal(false);
          setStoresToBulkDeleteIds([]);
        },
        onError: () => {
          toast.error('Failed to delete selected stores');
          setShowBulkDeleteModal(false);
          setStoresToBulkDeleteIds([]);
        }
      }
    );
  };

  const handleBulkExportPDF = (ids: number[]) => {
    if (!ids.length) return toast.error('No stores selected');
    toast.info(`Bulk exporting ${ids.length} stores (PDF)...`);
    const url = route(`${routePrefix}.bulk-export-pdf`) + `?ids=${ids.join(',')}`;
     window.open(url, '_blank');
  };

  const handleBulkExportExcel = (ids: number[]) => {
    if (!ids.length) return toast.error('No stores selected');
    toast.info(`Bulk exporting ${ids.length} stores (Excel)...`);
    const url = route(`${routePrefix}.bulk-export-excel`) + `?ids=${ids.join(',')}`;
    window.open(url, '_blank');
  };

  // Download Template handler
  const handleDownloadTemplate = () => {
    try {
      window.open(route(`${routePrefix}.download-template`), '_blank');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  // Import File handler (Note: Import is disabled in controller, but handler is present for consistency)
  const handleFileSelected = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    router.post(route(`${routePrefix}.import`), formData, {
      forceFormData: true,
      onStart: () => toast.loading('Importing...', { id: 'import' }),
      onSuccess: (resp: any) => {
        toast.success(resp?.props?.flash?.success || 'Stores imported successfully', { id: 'import' });
      },
      onError: (errors) => {
        const errorMsg = errors.file?.[0] || errors.name?.[0] || 'Failed to import file (Store creation should be manual).';
        toast.error(errorMsg, { id: 'import' });
      },
    });
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

    handleFilterRequest(query);
  };


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Stores" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
            <StoreIcon size={26} className="text-orange-600" />
            Store Management
        </h2>
        <p className="text-sm text-gray-600 max-w-2xxl">
            Create new stores, update and view existing ones, and organize your retail and warehouse locations efficiently. Use the filters to get reporting data as needed.
        </p>
        {/* Filters and Delegated Add Button */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search Store by Name, Code, or Email..."
            name="search"
          />

          <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
            <X size={20} />
          </Button>

          {/* 🔑 CRITICAL FIX: Delegation Pattern - Modal moved here to render the button */}
          <div className="ml-auto">
            <SimpleModalForm
              title={
                mode === 'view'
                  ? `View Store: ${selectedStore?.name}`
                  : mode === 'edit'
                  ? `Update Store: ${selectedStore?.name}`
                  : modalConfig.title
              }
              description={
                  mode === 'view'
                  ? `Code: ${selectedStore?.code}` // Display Code in View Mode
                  : modalConfig.description
              }
              fields={modalConfig.fields}
              buttons={modalConfig.buttons}
              data={data}
              setData={handleSetData}
              processing={processing}
              handleSubmit={handleSubmit}
              errors={errors}
              open={modalOpen}
              onOpenChange={(open: boolean) => {
                // 💡 When opened via the delegated button, reset state to 'create' first
                if (open && mode !== 'edit' && mode !== 'view') {
                    setMode('create');
                    reset();
                }
                if (!open) closeModal();
                else setModalOpen(open);
              }}
              mode={mode}
              // 🔑 DELEGATION: Pass the config object to render the secured button
              addButton={modalConfig.addButton}
            />
          </div>
        </div>

        {/* Table */}
        <CustomTable
          moduleName="Stores"
          columns={StoreTableConfig.columns}
          actions={StoreTableConfig.actions}
          data={stores.data}
          from={stores.from}
          // 🟢 CRITICAL: Use the combined handler for table actions
          onView={(s: Store) => handleOpenEditViewModal('view', s)}
          onEdit={(s: Store) => handleOpenEditViewModal('edit', s)}
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
        {stores.data && stores.data.length > 0 && (

          <Pagination
            products={stores}
            perPage={filtersForm.perPage}
            onPerPageChange={handlePerPageChange}
            totalCount={totalCount}
            filteredCount={filteredCount}
            search={filtersForm.search}
          />

        )}
      </div>

      {/* Delete Confirmation Modal (Single) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete Store{' '}
                <span className="font-semibold text-gray-800">{storeToDelete?.name}</span> (Code: {storeToDelete?.code})?
                This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Delete</Button>
            </div>
            </div>
        </div>
        )}
        {/* Delete Confirmation Modal (Bulk) */}
        {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-red-700">Confirm Bulk Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-red-700">{storesToBulkDeleteIds.length} selected store(s)</span>?
                This action cannot be undone.
            </p>

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
