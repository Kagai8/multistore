/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';

import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { UnitTableConfig } from '@/components/config/tables/unit-table';
import { UnitModalFormConfig } from '@/components/config/forms/unit-modal-form'; // Assuming the config exists
import CustomTable from '@/components/custom-table';
import SimpleModalForm from '@/components/simple-custom-modal-form';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, CirclePlus, Scale } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Units', href: '/units' },
    { title: 'Manage Units', href: '/units' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface Unit {
  id: number;
  name: string;
  slug?: string;
  code: string;
  created_at: string;
}

interface UnitPagination {
  data: Unit[];
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
  units: UnitPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}

export default function Index({ units, filters, totalCount, filteredCount }: IndexProps) {
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
  const flashMessage = flash?.success || flash?.error;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [unitsToBulkDeleteIds, setUnitsToBulkDeleteIds] = useState<number[]>([]);

  // Form for creating/editing
  const { data, setData, reset, errors, processing, post } = useForm({
    name: '',
    code: '',
    _method: 'POST',
  });

  // Filter form (search and perPage)
  const { data: filtersForm, setData: setFilterData } = useForm({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  const handleSetData = (key: string, value: any) => {
    // For all fields, just update the data
    setData(key, value);
  };

  // Auto-hide toast after 3s
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

    router.get('/units', query, { preserveState: true, preserveScroll: true });
  };

  // Reset
  const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    router.get('/units', {}, { preserveState: true, preserveScroll: true });
  };

  // Per page change
  const handlePerPageChange = (value: string) => {
    setFilterData('perPage', value);
    const query = {
      ...(filtersForm.search && { search: filtersForm.search }),
      ...(value && { perPage: value }),
    };
    router.get('/units', query, { preserveState: true, preserveScroll: true });
  };

  // 🔑 CRITICAL FIX: Rename/Refactor openModal to only handle edit/view from table actions
  const handleOpenEditViewModal = (m: 'view' | 'edit', unit: Unit) => {
    setMode(m);

    // 🟢 Load data
    if (unit) {
        Object.entries(unit).forEach(([key, value]) => {
        setData(key as any, value as any);
        });
        setSelectedUnit(unit);
    } else {
        // This path should ideally not be hit since this function is only for view/edit
        reset();
        setSelectedUnit(null);
    }

    setModalOpen(true);
  };

  const closeModal = () => {
    setMode('create');
    setSelectedUnit(null);
    reset();
    setModalOpen(false);
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'edit' && selectedUnit) {
      data._method = 'PUT';
      post(`/units/${selectedUnit.id}`, {
        forceFormData: true,
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || 'Unit updated';
          toast.success(msg);
          closeModal();
        },
        onError: (err: any) => {
          const msg = err?.message || 'Failed to update';
          toast.error(msg);
        },
      });
    } else {
      post('/units', {
        forceFormData: true,
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || 'Unit created';
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
const handleDelete = (unit: Unit) => {
  setUnitToDelete(unit);
  setShowDeleteModal(true);
};

// Confirm delete when user clicks "Delete" in modal
const confirmDelete = () => {
  if (!unitToDelete) return;

  router.delete(`/units/${unitToDelete.id}`, {
    onSuccess: (resp: any) => {
      const msg = resp?.props?.flash?.success || 'Unit deleted successfully';
      toast.success(msg);
      setShowDeleteModal(false);
      setUnitToDelete(null);
    },
    onError: () => toast.error('Failed to delete unit'),
  });
};
const handleExportPDF = (unit: Unit) => {
  window.open(`/units/${unit.id}/export-pdf`, '_blank');
};

const handleExportExcel = (unit: Unit) => {
  window.open(`/units/${unit.id}/export-excel`, '_blank');
};

// ✅ BULK ACTIONS
const handleBulkDelete = (ids: number[]) => {
  if (!ids.length) return toast.error('No units selected');
  setUnitsToBulkDeleteIds(ids);
  setShowBulkDeleteModal(true);
};

const confirmBulkDelete = () => {
  const ids = unitsToBulkDeleteIds;
  if (!ids.length) return;

  router.post(
    route('units.bulk-delete'),
    { ids },
    {
      preserveScroll: true,
      onSuccess: (resp: any) => {
        const msg = resp?.props?.flash?.success || `${ids.length} unit(s) deleted`;
        toast.success(msg);
        setShowBulkDeleteModal(false);
        setUnitsToBulkDeleteIds([]);
      },
      onError: () => {
        toast.error('Failed to delete selected units');
        setShowBulkDeleteModal(false);
        setUnitsToBulkDeleteIds([]);
      }
    }
  );
};

const handleBulkExportPDF = (ids: number[]) => {
  if (!ids.length) return toast.error('No units selected');
  const url = `/units/bulk-export-pdf?ids=${ids.join(',')}`;
  window.open(url, '_blank');
};

const handleBulkExportExcel = (ids: number[]) => {
  if (!ids.length) return toast.error('No units selected');
  const url = `/units/bulk-export-excel?ids=${ids.join(',')}`;
  window.open(url, '_blank');
};

// ✅ Download Template handler
const handleDownloadTemplate = () => {
  try {
    window.open(route('units.download-template'), '_blank');
  } catch (error) {
    toast.error('Failed to download template');
  }
};

// ✅ Import File handler
const handleFileSelected = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  router.post(route('units.import'), formData, {
    forceFormData: true,
    onStart: () => toast.loading('Importing...', { id: 'import' }),
    onSuccess: (resp: any) => {
      toast.success(resp?.props?.flash?.success || 'Units imported successfully', { id: 'import' });
    },
    onError: () => toast.error('Failed to import file', { id: 'import' }),
  });
};
// 🟢 NEW: Date Filter Handler (Calls the parent component logic)
const handleDateFilterChange = (dateFrom: string | null, dateTo: string | null) => {
  // 1. Update the local form state first
  setFilterData((prev) => ({
    ...prev,
    dateFrom: dateFrom,
    dateTo: dateTo,
  }));

  // 2. Prepare the query object, merging existing filters
  const query = {
    ...(filtersForm.search && { search: filtersForm.search }),
    ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
    // Use the new values being passed (dateFrom/dateTo)
    ...(dateFrom && { dateFrom: dateFrom }),
    ...(dateTo && { dateTo: dateTo }),
  };

  // 3. Trigger the Inertia request
  router.get(route('units.index'), query, { preserveState: true, preserveScroll: true });
};




return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Units" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
            <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                <Scale size={26} className="text-orange-600 mr-1" />
                Unit Management Hub
            </h2>
            <p className="text-sm text-gray-600 max-w-2xxl">
                Create new units, update and view existing ones, and organize your unit information efficiently. Use the filters to get reporting data as needed.
            </p>
        {/* Filters and Delegated Add Button */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search Unit..."
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
                    ? 'View Unit'
                    : mode === 'edit'
                    ? 'Update Unit'
                    : UnitModalFormConfig.title
                }
                fields={UnitModalFormConfig.fields}
                buttons={UnitModalFormConfig.buttons}
                data={data}
                setData={handleSetData}
                processing={processing}
                handleSubmit={handleSubmit}
                errors={errors}
                open={modalOpen}
                onOpenChange={(open: boolean) => {
                  // 💡 If opened via the delegated button, reset state to 'create' first
                  if (open && mode !== 'edit' && mode !== 'view') {
                      setMode('create');
                      reset();
                  }
                  if (!open) closeModal();
                  else setModalOpen(open);
                }}
                mode={mode}
                // 🔑 DELEGATION: Pass the config object to render the secured button
                addButton={UnitModalFormConfig.addButton}
            />
          </div>
        </div>

        {/* Table */}
        <CustomTable
          columns={UnitTableConfig.columns}
          actions={UnitTableConfig.actions}
          data={units.data}
          from={units.from}
          // 🔑 FIX: Use the refactored handler for table actions
          onView={(b: any) => handleOpenEditViewModal('view', b)}
          onEdit={(b: any) => handleOpenEditViewModal('edit', b)}
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
        {units.data && units.data.length > 0 && (

          <Pagination
            products={units}
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
                <span className="font-semibold text-gray-800">{unitToDelete?.name}</span>?
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
                <span className="font-semibold text-red-700">{unitsToBulkDeleteIds.length} selected unit(s)</span>?
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
