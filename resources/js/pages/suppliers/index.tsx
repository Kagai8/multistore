/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';

import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
// 🟢 Update Config Imports
import { SupplierTableConfig } from '@/components/config/tables/supplier-table';
import { SupplierModalFormConfig } from '@/components/config/forms/supplier-modal-form';
import CustomTable from '@/components/custom-table';
import SimpleModalForm from '@/components/simple-custom-modal-form';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Package, Truck, X } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

// 🟢 Update Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Manage Suppliers', href: '/suppliers' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

// 🟢 Update Data Model
interface Supplier {
  id: number;
  name: string;
  slug?: string;
  contact_person?: string | null; // 🟢 New Field
  phone?: string | null;          // 🟢 New Field
  email?: string | null;          // 🟢 New Field
  address?: string | null;        // 🟢 New Field
  is_active: boolean;             // 🟢 New Field
  created_at: string;
}

// 🟢 Update Pagination Model
interface SupplierPagination {
  data: Supplier[];
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

// 🟢 Update Index Props
interface IndexProps {
  suppliers: SupplierPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}

export default function Index({ suppliers, filters, totalCount, filteredCount }: IndexProps) {
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
  const flashMessage = flash?.success || flash?.error;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  // 🟢 Update selected entity state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    // 🟢 Update delete entity state
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    // 🟢 Update bulk delete IDs state
    const [suppliersToBulkDeleteIds, setSuppliersToBulkDeleteIds] = useState<number[]>([]);

  // Form for creating/editing
  const { data, setData, reset, errors, processing, post } = useForm({
    name: '',
    // 🟢 Update fields
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    is_active: true,
    _method: 'POST',
  });

  // Filter form (search and perPage)
  const { data: filtersForm, setData: setFilterData } = useForm({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  // 🟢 Simplified handleSetData
  const handleSetData = (key: string, value: any) => {
    setData(key, value);
  };

  // Auto-hide toast after 3s (Logic remains the same)
  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => {}, 0);
      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  // Search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterData('search', value);

    const query = {
      ...(value && { search: value }),
      ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
    };

    // 🟢 Update route
    router.get('/suppliers', query, { preserveState: true, preserveScroll: true });
  };

  // Reset
  const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    // 🟢 Update route
    router.get('/suppliers', {}, { preserveState: true, preserveScroll: true });
  };

  // Per page change
  const handlePerPageChange = (value: string) => {
    setFilterData('perPage', value);
    const query = {
      ...(filtersForm.search && { search: filtersForm.search }),
      ...(value && { perPage: value }),
    };
    // 🟢 Update route
    router.get('/suppliers', query, { preserveState: true, preserveScroll: true });
  };

  // 🔑 CRITICAL FIX: Rename/Refactor openModal to only handle edit/view from table actions
  const handleOpenEditViewModal = (m: 'view' | 'edit', supplier: Supplier) => {
    setMode(m);

    // 🟢 Load data
    Object.entries(supplier).forEach(([key, value]) => {
      setData(key as any, value as any);
    });
    setSelectedSupplier(supplier);

    setModalOpen(true);
  };

  const closeModal = () => {
    setMode('create');
    setSelectedSupplier(null);
    reset();
    setModalOpen(false);
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'edit' && selectedSupplier) {
      data._method = 'PUT';
      // 🟢 Update route
      post(`/suppliers/${selectedSupplier.id}`, {
        forceFormData: true,
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || 'Supplier updated';
          toast.success(msg);
          closeModal();
        },
        onError: (err: any) => {
          const msg = err?.message || 'Failed to update';
          toast.error(msg);
        },
      });
    } else {
      // 🟢 Update route
      post('/suppliers', {
        forceFormData: true,
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || 'Supplier created';
          toast.success(msg);
          closeModal();
        },
        onError: (err: any) => {
          const msg = err?.message || 'Failed to create';
          toast.error(msg);
        },
      });
    }
  };

  // Open delete confirmation modal
  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier); // 🟢 Update entity
    setShowDeleteModal(true);
  };

  // Confirm delete when user clicks "Delete" in modal
  const confirmDelete = () => {
    if (!supplierToDelete) return; // 🟢 Update entity

    // 🟢 Update route
    router.delete(`/suppliers/${supplierToDelete.id}`, {
      onSuccess: (resp: any) => {
        const msg = resp?.props?.flash?.success || 'Supplier deleted successfully';
        toast.success(msg);
        setShowDeleteModal(false);
        setSupplierToDelete(null); // 🟢 Update entity
      },
      onError: () => toast.error('Failed to delete supplier'),
    });
  };
  const handleExportPDF = (supplier: Supplier) => {
    // 🟢 Update route
    window.open(`/suppliers/${supplier.id}/export-pdf`, '_blank');
  };

  const handleExportExcel = (supplier: Supplier) => {
    // 🟢 Update route
    window.open(`/suppliers/${supplier.id}/export-excel`, '_blank');
  };

  // ✅ BULK ACTIONS
  // 🟢 AFTER (Only opens the custom modal)
  const handleBulkDelete = (ids: number[]) => {
    if (!ids.length) return toast.error('No suppliers selected'); // 🟢 Update message

    // 🟢 Store the IDs and show the custom confirmation modal
    setSuppliersToBulkDeleteIds(ids); // 🟢 Update entity
    setShowBulkDeleteModal(true);
  };
  // 🟢 INSERT NEW CONFIRMATION FUNCTION HERE
  const confirmBulkDelete = () => {
    const ids = suppliersToBulkDeleteIds; // 🟢 Update entity
    if (!ids.length) return;

    router.post(
      route('suppliers.bulk-delete'), // 🟢 Update route
      { ids },
      {
        preserveScroll: true,
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || `${ids.length} supplier(s) deleted`; // 🟢 Update message
          toast.success(msg);
          setShowBulkDeleteModal(false);
          setSuppliersToBulkDeleteIds([]);
        },
        onError: () => {
          toast.error('Failed to delete selected suppliers'); // 🟢 Update message
          setShowBulkDeleteModal(false);
          setSuppliersToBulkDeleteIds([]);
        }
      }
    );
  };

  const handleBulkExportPDF = (ids: number[]) => {
    if (!ids.length) return toast.error('No suppliers selected'); // 🟢 Update message
    // 🟢 Update route
    const url = `/suppliers/bulk-export-pdf?ids=${ids.join(',')}`;
    window.open(url, '_blank');
  };

  const handleBulkExportExcel = (ids: number[]) => {
    if (!ids.length) return toast.error('No suppliers selected'); // 🟢 Update message
    // 🟢 Update route
    const url = `/suppliers/bulk-export-excel?ids=${ids.join(',')}`;
    window.open(url, '_blank');
  };

  // ✅ Download Template handler
  const handleDownloadTemplate = () => {
    try {
      // 🟢 Update route
      window.open(route('suppliers.download-template'), '_blank');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  // ✅ Import File handler
  const handleFileSelected = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // 🟢 Update route
    router.post(route('suppliers.import'), formData, {
      forceFormData: true,
      onStart: () => toast.loading('Importing...', { id: 'import' }),
      onSuccess: (resp: any) => {
        // 🟢 Update message
        toast.success(resp?.props?.flash?.success || 'Suppliers imported successfully', { id: 'import' });
      },
      onError: () => toast.error('Failed to import file', { id: 'import' }),
    });
  };
  // 🟢 NEW: Date Filter Handler (Calls the parent component logic)
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

    // 🟢 Update route
    router.get(route('suppliers.index'), query, { preserveState: true, preserveScroll: true });
  };


return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Suppliers" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
            <Truck size={26} className="text-orange-600" />
            Supplier Management Hub
        </h2>
        <p className="text-sm text-gray-600 max-w-2xxl">
            Create new suppliers, update and view existing ones, and organize your supplier information efficiently. Use the filters to get reporting data as needed.
        </p>

        {/* Filters and Delegated Add Button */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search Supplier..."
            name="search"
          />

          <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
            <X size={20} />
          </Button>

          {/* 🔑 CRITICAL FIX: Delegation Pattern - Modal moved here to render the button */}
          <div className="ml-auto">
            {/* Modal Form */}
            <SimpleModalForm
                title={
                  mode === 'view'
                    ? 'View Supplier'
                    : mode === 'edit'
                    ? 'Update Supplier'
                    : SupplierModalFormConfig.title
                }
                description={SupplierModalFormConfig.description}
                fields={SupplierModalFormConfig.fields}
                buttons={SupplierModalFormConfig.buttons}
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
                addButton={SupplierModalFormConfig.addButton}
            />
          </div>
        </div>

        {/* Table */}
        <CustomTable
            moduleName="Supplier"
            importPermission="import-supplier"
            downloadTemplatePermission="download-template-supplier"
          columns={SupplierTableConfig.columns}
          actions={SupplierTableConfig.actions}
          data={suppliers.data}
          from={suppliers.from}
          // 🔑 FIX: Use the refactored handler for table actions
          onView={(s: any) => handleOpenEditViewModal('view', s)}
          onEdit={(s: any) => handleOpenEditViewModal('edit', s)}
          onDelete={handleDelete}
          onExportPDF={(s: any) => handleExportPDF(s)}
          onExportExcel={(s: any) => handleExportExcel(s)}
          onBulkDelete={handleBulkDelete}
          onBulkExportPDF={handleBulkExportPDF}
          onBulkExportExcel={handleBulkExportExcel}
          isModal
          onDownloadTemplate={handleDownloadTemplate}
          onFileSelected={handleFileSelected}
          onDateFilterChange={handleDateFilterChange}
        />

        {/* Pagination — only show when data exists */}
        {suppliers.data && suppliers.data.length > 0 && (

          <Pagination
            products={suppliers}
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
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-800">{supplierToDelete?.name}</span>?
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
        {/* Delete Confirmation Modal (Bulk) */}
        {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-red-700">Confirm Bulk Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-red-700">{suppliersToBulkDeleteIds.length} selected supplier(s)</span>?
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
