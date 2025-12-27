/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';

import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
// Import the Adjustment Reasons config files
import { AdjustmentReasonTableConfig } from '@/components/config/tables/adjustment-table';
import { AdjustmentReasonModalFormConfig } from '@/components/config/forms/adjustment-reason-modal-form';
// Assuming these custom components exist and match the Brands page needs
import CustomTable from '@/components/custom-table';
import SimpleModalForm from '@/components/simple-custom-modal-form';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, CirclePlus, CheckCircle, Ban, ListCheck } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
// 🟢 NEW: Import hasPermission utility
import { hasPermission } from '@/utilis/authorization';


// --- CONFIGURATION & TYPES ---

// 🟢 NEW: Define the expected structure for the usePage() props
interface AuthPageProps {
    auth: {
        permissions: string[];
    };
    flash?: { success?: string; error?: string; warning?: string };
}


const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Master Control', href: '/master-control' },
  { title: 'Adjustment Reasons', href: '/adjustmentreasons' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface AdjustmentReason {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  is_active: boolean; // New key
  created_at: string;
}

interface AdjustmentReasonPagination {
  data: AdjustmentReason[];
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
  reasons: AdjustmentReasonPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}

// --- CUSTOM RENDERER for Status ---
const CustomTableCellRenderer: React.FC<{ item: AdjustmentReason; column: any }> = ({ item, column }) => {
    if (column.key === 'is_active') {
        const isActive = item.is_active;
        return (
            <div className="flex justify-center">
                <Badge
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        isActive ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'
                    }`}
                >
                    {isActive ? (
                        <CheckCircle className="h-3 w-3 me-1" />
                    ) : (
                        <Ban className="h-3 w-3 me-1" />
                    )}
                    {isActive ? 'Active' : 'Inactive'}
                </Badge>
            </div>
        );
    }
    // Render other data normally
    return <span>{item[column.key as keyof AdjustmentReason] as React.ReactNode}</span>;
};


export default function Index({ reasons, filters, totalCount, filteredCount }: IndexProps) {
  // 🟢 FIX: Use AuthPageProps generic to safely access auth and flash
  const { auth, flash } = usePage<AuthPageProps>().props;
  const flashMessage = flash?.success || flash?.error || flash?.warning;
  const permissions = auth.permissions || []; // Safely get permissions

  // 🧹 CLEANUP: Get the permission slug directly from the config
  const CREATE_PERMISSION_SLUG = AdjustmentReasonModalFormConfig.addButton.permission;
  // 🧹 CLEANUP: Check permission only if we need it for a custom handler (like openModal)
  const canCreate = hasPermission(permissions, [CREATE_PERMISSION_SLUG]);

  const MODULE_SLUG = 'adjustmentreason'; // Lowercase singular module name
  const BULK_DELETE_SLUG = `bulk-delete-${MODULE_SLUG}`;

  // 🟢 CRITICAL CHANGE: Split bulk export into two unique slugs
  const BULK_EXPORT_PDF_SLUG = `bulk-export-pdf-${MODULE_SLUG}`;
  const BULK_EXPORT_EXCEL_SLUG = `bulk-export-excel-${MODULE_SLUG}`;

  console.log('Index Page Permissions Array:', permissions);
console.log('Bulk Export PDF Slug:', BULK_EXPORT_PDF_SLUG);
console.log('Bulk Export Excel Slug:', BULK_EXPORT_EXCEL_SLUG);
console.log('Bulk Delete Slug:', BULK_DELETE_SLUG);


  // --- STATE ---
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedReason, setSelectedReason] = useState<AdjustmentReason | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reasonToDelete, setReasonToDelete] = useState<AdjustmentReason | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [reasonsToBulkDeleteIds, setReasonsToBulkDeleteIds] = useState<number[]>([]);

  // Form for creating/editing
  const { data, setData, reset, errors, processing, post } = useForm({
    name: '',
    description: '',
    is_active: true, // Default to true
    _method: 'POST',
  });

  // Filter form (search and perPage)
  const { data: filtersForm, setData: setFilterData } = useForm<FilterProps>({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  // --- EFFECTS & HANDLERS ---

  // Handle flash messages
  useEffect(() => {
    if (flashMessage) {
      const type = flash.success ? 'success' : flash.warning ? 'warning' : 'error';
      toast[type](flashMessage);
    }
  }, [flashMessage, flash]);

  // Set Data wrapper (simplified, no file upload needed)
  const handleSetData = (key: string, value: any) => {
    setData(key, value);
  };

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

    router.get(route('adjustmentreasons.index'), query, { preserveState: true, preserveScroll: true });
  };

  // Reset Filters
  const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    router.get(route('adjustmentreasons.index'), {}, { preserveState: true, preserveScroll: true });
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
    router.get(route('adjustmentreasons.index'), query, { preserveState: true, preserveScroll: true });
  };

  // Date Filter Handler (Matches the Brands logic)
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

    router.get(route('adjustmentreasons.index'), query, { preserveState: true, preserveScroll: true });
  };

  // Open modal (create, view, edit)
  const openModal = (m: 'create' | 'view' | 'edit', reason?: AdjustmentReason) => {

    // 🛑 SAFETY CHECK: Use the correct slug from the config
    if (m === 'create' && !hasPermission(permissions, [CREATE_PERMISSION_SLUG])) {
        return toast.error("You do not have permission to create adjustment reasons.");
    }
    // 🛑 SAFETY CHECK: View and Edit also need permission checks here
    if (m === 'edit' && !hasPermission(permissions, [`edit-${MODULE_SLUG}`])) {
        return toast.error("You do not have permission to edit adjustment reasons.");
    }
    if (m === 'view' && !hasPermission(permissions, [`view-${MODULE_SLUG}`])) {
        return toast.error("You do not have permission to view adjustment reasons.");
    }

    setMode(m);

    if (reason) {
      // Map reason data to form data
      setData({
        ...data,
        id: reason.id as any,
        name: reason.name,
        description: reason.description || '',
        is_active: reason.is_active,
        _method: 'PUT',
      });
      setSelectedReason(reason);
    } else {
      reset();
      setData('is_active', true); // Default for create mode
      setSelectedReason(null);
      setData('_method', 'POST' as any);
    }

    setModalOpen(true);
  };

  const closeModal = () => {
    setMode('create');
    setSelectedReason(null);
    reset();
    setModalOpen(false);
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🛑 CRITICAL: Permission check before submit
    const requiredPermission = selectedReason ? `edit-${MODULE_SLUG}` : `create-${MODULE_SLUG}`;
    if (!hasPermission(permissions, [requiredPermission])) {
        return toast.error(`You do not have permission to ${selectedReason ? 'update' : 'create'} this resource.`);
    }

    if (mode === 'edit' && selectedReason) {
      post(route('adjustmentreasons.update', selectedReason.id), {
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || 'Reason updated successfully.';
          toast.success(msg);
          closeModal();
        },
        onError: () => toast.error('Failed to update reason.'),
      });
    } else {
      post(route('adjustmentreasons.store'), {
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || 'Reason created successfully.';
          toast.success(msg);
          closeModal();
        },
        onError: () => toast.error('Failed to create reason.'),
      });
    }
  };

  // --- SINGLE ACTIONS ---
  const handleDelete = (reason: AdjustmentReason) => {
    // 🛑 PERMISSION CHECK
    if (!hasPermission(permissions, [`delete-${MODULE_SLUG}`])) {
        return toast.error("You do not have permission to delete adjustment reasons.");
    }

    setReasonToDelete(reason);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    // 🛑 PERMISSION CHECK (redundant but safe)
    if (!hasPermission(permissions, [`delete-${MODULE_SLUG}`])) return;

    if (!reasonToDelete) return;

    router.delete(route('adjustmentreasons.destroy', reasonToDelete.id), {
      onSuccess: (resp: any) => {
        // Flash messages handled by useEffect, just close modal
        setShowDeleteModal(false);
        setReasonToDelete(null);
      },
      onError: () => toast.error('Failed to delete reason.'),
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleExportPDF = (reason: AdjustmentReason) => {
    // 🛑 PERMISSION CHECK
    // NOTE: This uses a generic 'export' permission. This is fine if single export isn't split.
    if (!hasPermission(permissions, [`export-${MODULE_SLUG}`])) {
        return toast.error("You do not have permission to export PDF.");
    }
    window.open(route('adjustmentreasons.exportSinglePdf', reason.id), '_blank');
  };

  const handleExportExcel = (reason: AdjustmentReason) => {
    // 🛑 PERMISSION CHECK
    // NOTE: This uses a generic 'export' permission. This is fine if single export isn't split.
    if (!hasPermission(permissions, [`export-${MODULE_SLUG}`])) {
        return toast.error("You do not have permission to export Excel.");
    }
    window.open(route('adjustmentreasons.exportSingleExcel', reason.id), '_blank');
  };

  // --- BULK ACTIONS ---
  const handleBulkDelete = (ids: number[]) => {
    // 🛑 PERMISSION CHECK
    if (!hasPermission(permissions, [BULK_DELETE_SLUG])) {
        return toast.error("You do not have permission for bulk delete.");
    }
    if (!ids.length) return toast.error('No reasons selected');

    setReasonsToBulkDeleteIds(ids);
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    // 🛑 PERMISSION CHECK (redundant but safe)
    if (!hasPermission(permissions, [BULK_DELETE_SLUG])) return;

    const ids = reasonsToBulkDeleteIds;
    if (!ids.length) return;

    router.post(
      route('adjustmentreasons.bulk-delete'),
      { ids },
      {
        preserveScroll: true,
        onSuccess: () => {
          // Flash messages handled by useEffect, just close modal
          setShowBulkDeleteModal(false);
          setReasonsToBulkDeleteIds([]);
        },
        onError: () => toast.error('Failed to delete selected reasons.'),
      }
    );
  };

  const handleBulkExportPDF = (ids: number[]) => {
    // 🛑 PERMISSION CHECK
    // ✅ FIXED: Use the specific PDF slug
    if (!hasPermission(permissions, [BULK_EXPORT_PDF_SLUG])) {
        return toast.error("You do not have permission for bulk PDF export.");
    }
    if (!ids.length) return toast.error('No reasons selected');
    const url = route('adjustmentreasons.bulk-export-pdf') + `?ids=${ids.join(',')}`;
    window.open(url, '_blank');
  };

  const handleBulkExportExcel = (ids: number[]) => {
    // 🛑 PERMISSION CHECK
    // ✅ FIXED: Use the specific Excel slug
    if (!hasPermission(permissions, [BULK_EXPORT_EXCEL_SLUG])) {
        return toast.error("You do not have permission for bulk Excel export.");
    }
    if (!ids.length) return toast.error('No reasons selected');
    const url = route('adjustmentreasons.bulk-export-excel') + `?ids=${ids.join(',')}`;
    window.open(url, '_blank');
  };

  // --- RENDERING FORM FIELDS ---

  // 🔎 CRITICAL DEBUGGING LOGS FOR INDEX PAGE 🔎
  console.log('--- ADJUSTMENT REASONS INDEX DEBUG START ---');
  console.log('Index Page Permissions Array:', permissions);
  console.log('Create Permission Slug (Config):', CREATE_PERMISSION_SLUG);
  console.log('Can Create (Index Check):', canCreate);
  console.log('Bulk Delete Slug:', BULK_DELETE_SLUG);
  // console.log('Bulk Export Slug:', BULK_EXPORT_SLUG); // ❌ REMOVED
  console.log('Bulk Export PDF Slug:', BULK_EXPORT_PDF_SLUG); // ✅ ADDED
  console.log('Bulk Export Excel Slug:', BULK_EXPORT_EXCEL_SLUG); // ✅ ADDED
  console.log('--- ADJUSTMENT REASONS INDEX DEBUG END ---');
  // 🔎 END DEBUGGING LOGS 🔎


return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Adjustment Reasons" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
            <ListCheck size={26} className="text-orange-600 mr-1" />
            Adjustment Reasons Hub
        </h2>
        <p className="text-sm text-gray-600 max-w-2xxl">
            Here you can create adjustment reasons and update or view existing ones. Use the controls below to manage your reasons effectively.
        </p>
        {/* Filters */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search Reason..."
            name="search"
          />

          <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
            <X size={20} />
          </Button>

          {/* 🟢 CRITICAL FIX: The SimpleModalForm call must be moved HERE to render the button in this spot. */}
          <div className="ml-auto">
            <SimpleModalForm
                title={
                    mode === 'view'
                    ? 'View Adjustment Reason'
                    : mode === 'edit'
                    ? 'Update Adjustment Reason'
                    : AdjustmentReasonModalFormConfig.title
                }
                description={AdjustmentReasonModalFormConfig.description}
                fields={AdjustmentReasonModalFormConfig.fields}
                buttons={AdjustmentReasonModalFormConfig.buttons}
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
                // The SimpleModalForm will now render the DialogTrigger (button) here:
                addButton={AdjustmentReasonModalFormConfig.addButton}
            />
          </div>
        </div>

        {/* Table */}
        <CustomTable
          moduleName='AdjustmentReason' // 💡 Ensure moduleName is used for table/bulk actions
          columns={AdjustmentReasonTableConfig.columns}
          actions={AdjustmentReasonTableConfig.actions}
          data={reasons.data}
          from={reasons.from}
          onView={(r: any) => openModal('view', r)}
          onEdit={(r: any) => openModal('edit', r)}
          onDelete={handleDelete}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          onBulkDelete={handleBulkDelete}
          onBulkExportPDF={handleBulkExportPDF}
          onBulkExportExcel={handleBulkExportExcel}
          // 🟢 CRITICAL CHANGE: Use the specific slugs here
          bulkDeletePermission={BULK_DELETE_SLUG} // 💡 Make sure this is passed too
          bulkExportPdfPermission={BULK_EXPORT_PDF_SLUG}
          bulkExportExcelPermission={BULK_EXPORT_EXCEL_SLUG}
          // Remove file/template related props since Adjustment Reasons don't have them
          isModal
          onDateFilterChange={handleDateFilterChange}
          CustomRenderer={CustomTableCellRenderer} // Pass the custom renderer for the 'is_active' badge
        />

        {/* Pagination — only show when data exists */}
        {reasons.data && reasons.data.length > 0 && (

          <Pagination
            products={reasons} // Renamed to 'products' in your component, but passing the 'reasons' structure
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
                <span className="font-semibold text-gray-800">{reasonToDelete?.name}</span>?
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

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-red-700">Confirm Bulk Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-red-700">{reasonsToBulkDeleteIds.length} selected adjustment reason(s)</span>?
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
