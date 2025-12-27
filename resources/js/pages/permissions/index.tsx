/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// 🟢 Module-Specific Imports
import { PermissionsTableConfig } from '@/components/config/tables/permission-table';
import { PermissionModalFormConfig } from '@/components/config/forms/permissions-modal-form';
// 🟢 FIX 1: Import SimpleModalForm and hasPermission
import SimpleModalForm from '@/components/simple-custom-modal-form'; // Using Simple Modal
import { hasPermission } from '@/utilis/authorization';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, CirclePlus, ShieldCheckIcon } from 'lucide-react'; // Ensure CirclePlus is available for the modal config
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import ComplexTable from '@/components/complex-table';

// --- CONFIGURATION & TYPES ---

// 🟢 FIX 2: Define the expected structure for the usePage() props
interface AuthPageProps {
    [key: string]: any;
    auth: {
        permissions: string[];
    };
    flash?: { success?: string; error?: string; warning?: string };
}


// 🟢 Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Manage Permissions', href: '/permissions' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

// ✅ Permission Interface - Data structure returned from Laravel
interface Permission {
  id: number;
  module: string;
  label: string;
  name: string; // The slug/name (e.g., create-user)
  description: string | null;
  is_active: boolean;
  created_at: string;
  // Extra data for conditional deletion:
  role_count: number;
}

// 🟢 PermissionForm interface - The data structure sent to Inertia/Laravel
interface PermissionForm {
  module: string;
  label: string;
  description: string;
  is_active: boolean;
  // Inertia HTTP method spoofing
  _method?: 'POST' | 'PUT';
}

interface PermissionPagination {
  data: Permission[];
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
  module?: string | null; // Added module filter
}

interface IndexProps {
  permissions: PermissionPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}
// --- END CONFIGURATION & TYPES ---

export default function Index({ permissions, filters, totalCount, filteredCount }: IndexProps) {
  // 🟢 FIX 3: Use AuthPageProps generic to safely access auth and flash
  const { auth, flash } = usePage<AuthPageProps>().props;
  const flashMessage = flash?.success || flash?.error || flash?.warning;
  // const permissionsList = auth?.permissions || []; // Available for checks if needed

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [permissionsToBulkDeleteIds, setPermissionsToBulkDeleteIds] = useState<number[]>([]);

  // 🟢 useForm Initialization
  const { data, setData, reset, errors, processing, post } = useForm<PermissionForm>({
    module: '',
    label: '',
    description: '',
    is_active: true,
    _method: 'POST',
  });

  // Filter form (search and perPage)
  const { data: filtersForm, setData: setFilterData } = useForm<FilterProps>({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
    module: filters.module || null,
  });

  // Centralized Data Handler
  const handleSetData = (key: string, value: any) => {
    if (key === 'is_active') {
        setData(key, Boolean(value));
    } else {
        setData(key as keyof PermissionForm, value);
    }
  };

  useEffect(() => {
    if (flashMessage) {
      const type = flash.success ? 'success' : flash.error ? 'error' : 'warning';
      toast[type](flashMessage);
    }
  }, [flashMessage, flash]);

  // ✅ openModal function with explicit, type-safe data mapping
  const openModal = (m: 'create' | 'view' | 'edit', permission?: Permission) => {
    setMode(m);

    if (permission) {
      setSelectedPermission(permission);

      setData((prev) => ({
        ...prev,
        module: permission.module,
        label: permission.label,
        description: permission.description || '',
        is_active: permission.is_active,
        _method: 'PUT', // Explicitly set for PUT request
      } as PermissionForm));
    } else {
      reset();
      setData('_method', 'POST' as any);
    }

    setModalOpen(true);
  };

  const closeModal = () => {
    setMode('create');
    setSelectedPermission(null);
    reset();
    setModalOpen(false);
  };

  // 🛑 Submission Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "edit" && selectedPermission) {
        // Use Inertia's post method with _method spoofing for update
        post(route("permissions.update", selectedPermission.id), {
            onSuccess: () => {
                toast.success("Permission updated");
                closeModal();
            },
            onError: () => {
                toast.error("Failed to update permission");
            },
        });
    } else {
        // Use Inertia's post method for create
        post(route("permissions.store"), {
            onSuccess: () => {
                toast.success("Permission created");
                closeModal();
            },
            onError: () => {
                toast.error("Failed to create permission");
            },
        });
    }
  };

  // --- Filtering and Actions ---

  const handleFilterChange = (key: keyof FilterProps, value: string | null) => {
    setFilterData(key as any, value);
    const newFilters = {
        ...filtersForm,
        [key]: value,
    };

    // Construct the query object, omitting null/empty values
    const query = Object.fromEntries(
        Object.entries(newFilters).filter(([_, v]) => v !== null && v !== '' && v !== '0' && v !== 0)
    ) as Record<string, string>;

    router.get(route('permissions.index'), query, { preserveState: true, preserveScroll: true });
  };


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', e.target.value);
  };

  const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    setFilterData('module', null);
    router.get(route('permissions.index'), {}, { preserveState: true, preserveScroll: true });
  };

  const handlePerPageChange = (value: string) => {
    handleFilterChange('perPage', value);
  };

  const handleDateFilterChange = (dateFrom: string | null, dateTo: string | null) => {
      handleFilterChange('dateFrom', dateFrom);
      handleFilterChange('dateTo', dateTo);
  };

  const handleDelete = (permission: Permission) => {
      // Conditional check before opening modal (matches table conditional logic)
      if (permission.role_count > 0) {
          return toast.error("Cannot delete: This permission is assigned to one or more roles.");
      }
      setPermissionToDelete(permission);
      setShowDeleteModal(true);
  };

  const confirmDelete = () => {
      if (!permissionToDelete) return;
      router.delete(route('permissions.destroy', permissionToDelete.id), {
          onSuccess: () => {
              setShowDeleteModal(false);
              setPermissionToDelete(null);
          },
          onError: () => toast.error('Failed to delete permission'),
          preserveScroll: true,
          preserveState: true,
      });
  };

  const handleExportPDF = (permission: Permission) => {
      window.open(route('permissions.exportSinglePdf', permission.id), '_blank');
  };

  const handleExportExcel = (permission: Permission) => {
      window.open(route('permissions.exportSingleExcel', permission.id), '_blank');
  };

  const handleBulkDelete = (ids: number[]) => {
      if (!ids.length) return toast.error('No permissions selected');
      setPermissionsToBulkDeleteIds(ids);
      setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
      const ids = permissionsToBulkDeleteIds;
      if (!ids.length) return;
      router.post(
          route('permissions.bulk-delete'),
          { ids },
          {
              preserveScroll: true,
              onSuccess: (resp: any) => {
                  const msg = resp?.props?.flash?.success || `${ids.length} permission(s) deleted`;
                  toast.success(msg);
                  setShowBulkDeleteModal(false);
                  setPermissionsToBulkDeleteIds([]);
              },
              onError: () => {
                  toast.error('Failed to delete selected permissions');
                  setShowBulkDeleteModal(false);
                  setPermissionsToBulkDeleteIds([]);
              }
          }
      );
  };

  const handleBulkExportPDF = (ids: number[]) => {
      if (!ids.length) return toast.error('No permissions selected');
      const url = route('permissions.bulk-export-pdf') + `?ids=${ids.join(',')}`;
      window.open(url, '_blank');
  };

  const handleBulkExportExcel = (ids: number[]) => {
      if (!ids.length) return toast.error('No permissions selected');
      const url = route('permissions.bulk-export-excel') + `?ids=${ids.join(',')}`;
      window.open(url, '_blank');
  };

  const handleDownloadTemplate = () => {
      try {
          window.open(route('permissions.download-template'), '_blank');
      } catch (error) {
          toast.error('Failed to download template');
      }
  };

  const handleFileSelected = (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      router.post(route('permissions.import'), formData, {
          forceFormData: true,
          onStart: () => toast.loading('Importing...', { id: 'import' }),
          onSuccess: (resp: any) => {
              toast.success(resp?.props?.flash?.success || 'Permissions imported successfully', { id: 'import' });
          },
          onError: () => toast.error('Failed to import file', { id: 'import' }),
      });
  };


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Permissions" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
         <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
            <ShieldCheckIcon size={26} className="text-orange-600 mr-1" />
            Permissions Management Hub
        </h2>
        <p className="text-sm text-gray-600 max-w-2xxl">
            Here you can manage permissions. Create new permissions, view details, update information, and handle deletions. Use the filters to quickly find specific permissions.
        </p>
        {/* Filters and Secured Add Button */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search Permission by name or module..."
            name="search"
          />

          <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
            <X size={20} />
          </Button>

          {/* 🟢 CRITICAL FIX: The SimpleModalForm is now called here to securely render the button */}
          <div className="ml-auto">
             <SimpleModalForm
                // CRITICAL: Key to force component reset on open/edit
                key={selectedPermission ? `permission-edit-${selectedPermission.id}` : 'permission-create'}
                title={
                    mode === 'view'
                        ? 'View Permission'
                        : mode === 'edit'
                        ? 'Update Permission'
                        : PermissionModalFormConfig.title
                }
                description={PermissionModalFormConfig.description}
                fields={PermissionModalFormConfig.fields}
                buttons={PermissionModalFormConfig.buttons}

                // 🟢 THIS PROP RENDERS THE SECURED BUTTON
                addButton={PermissionModalFormConfig.addButton}

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
            />
          </div>
          {/* ❌ REMOVED: The manual Button component that called openModal('create') was here */}
        </div>

        {/* Table */}
        <ComplexTable
          moduleName="Permissions"
          columns={PermissionsTableConfig.columns}
          actions={PermissionsTableConfig.actions}
          data={permissions.data}
          from={permissions.from}
          onView={(p: any) => openModal('view', p)}
          onEdit={(p: any) => openModal('edit', p)}
          onDelete={handleDelete}
          onExportPDF={(p: any) => handleExportPDF(p)}
          onExportExcel={(p: any) => handleExportExcel(p)}
          onBulkDelete={handleBulkDelete}
          onBulkExportPDF={handleBulkExportPDF}
          onBulkExportExcel={handleBulkExportExcel}
          isModal
          onDownloadTemplate={handleDownloadTemplate}
          onFileSelected={handleFileSelected}
          onDateFilterChange={handleDateFilterChange}
        />

        {/* Pagination — only show when data exists */}
        {permissions.data && permissions.data.length > 0 && (
          <Pagination
            products={permissions} // Note: Passed as 'products' but handles generic pagination
            perPage={filtersForm.perPage}
            onPerPageChange={handlePerPageChange}
            totalCount={totalCount}
            filteredCount={filteredCount}
            search={filtersForm.search}
          />
        )}
      </div>

      {/* ❌ REMOVED: The SimpleModalForm call was here. It's now in the header. */}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete permission{' '}
                <span className="font-semibold text-gray-800">{permissionToDelete?.label}</span>?
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
                <span className="font-semibold text-red-700">{permissionsToBulkDeleteIds.length} selected permission(s)</span>?
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
