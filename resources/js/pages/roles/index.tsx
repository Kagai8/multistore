/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// ✅ Use SimpleModalForm and Correct Config Path
import SimpleModalForm from '@/components/simple-custom-modal-form';
import { RoleTableConfig } from '@/components/config/tables/roles-table';
import { RoleModalFormConfig } from '@/components/config/forms/roles-modal-form';

import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldPlusIcon, X } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import ComplexTable from '@/components/complex-table';

// 🟢 Fixed/Updated Interfaces

interface Permission {
    id: number;
    name: string;
    label: string;
    module: string;
}

interface Role {
    id: number;
    label: string; // Human-readable name
    name: string; // Slug/Key (Spatie uses this)
    description: string | null;
    is_active?: boolean;
    // 🟢 NEW: Store Access Flag
    all_store_access: boolean; // Must be defined for the form to populate
    created_at: string;
    permissions_ids: string[]; // Array of permission names (slugs) attached
    user_count: number; // For delete safety check
}

interface RoleForm {
    label: string;
    name: string;
    description: string;
    is_active: boolean;
    // 🟢 NEW: Store Access Flag for Form
    all_store_access: boolean;
    permissions: string[]; // Array of selected permission slugs
    _method?: 'POST' | 'PUT';
}

interface RolePagination {
    data: Role[];
    links: any[];
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

interface PermissionsGrouped {
    [module: string]: Permission[];
}

interface IndexProps {
    roles: RolePagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
    permissionsGrouped: PermissionsGrouped;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Manage Roles', href: '/roles' },
];


export default function Index({ roles, filters, totalCount, filteredCount, permissionsGrouped }: IndexProps) {
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
  const flashMessage = flash?.success || flash?.error;

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [rolesToBulkDeleteIds, setRolesToBulkDeleteIds] = useState<number[]>([]);

  // 🟢 useForm Initialization (Adapted fields)
  const { data, setData, reset, errors, processing, post } = useForm<RoleForm>({
    label: '',
    name: '',
    description: '',
    is_active: true,
    // 🟢 NEW: Initialize all_store_access
    all_store_access: false,
    permissions: [],
  });

  // Filter form (search and perPage)
  const { data: filtersForm, setData: setFilterData } = useForm({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  // 🟢 Centralized Data Handler (Handles permissions array and slug generation)
  const handleSetData = (key: string, value: any) => {
    // 🟢 NEW/FIXED: Handle all_store_access boolean conversion (for checkboxes/toggles)
    if (key === 'is_active' || key === 'all_store_access') {
        setData(key, Boolean(value));
    }
    else if (key === 'permissions') {
        // Handle array update from grouped-checkboxes
        setData(key, value);
    }
    // 🛑 SLUG FIX: Only auto-generate name if in CREATE mode and input key is 'label'
    else if (key === 'label' && mode === 'create') {
        setData('label', value);
        setData('name', value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
    // 🛑 SLUG FIX: If in EDIT mode, only update the label, do not touch the name (slug)
    else if (key === 'label' && mode === 'edit') {
        setData('label', value);
    }
    else {
        setData(key, value);
    }
  };

  useEffect(() => {
    if (flashMessage) {
      if (flash.success) toast.success(flash.success);
      if (flash.error) toast.error(flash.error);
    }
  }, [flashMessage, flash]);

  // 🛠️ REPLACEMENT/ADJUSTMENT: create a handler that sets the state and opens the modal for VIEW/EDIT
  const handleOpenEditViewModal = (m: 'view' | 'edit', role: Role) => {
    setMode(m);
    setSelectedRole(role);

    setData({
        label: role.label,
        name: role.name,
        description: role.description || '',
        is_active: Boolean(role.is_active ?? true),
        // 🟢 NEW/FIXED: Populate all_store_access from the role object (safe default to false)
        all_store_access: Boolean(role.all_store_access ?? false),
        permissions: role.permissions_ids || [],
        _method: m === 'edit' ? 'PUT' : undefined
    } as RoleForm);

    setModalOpen(true);
  };


  const closeModal = () => {
    setMode('create');
    setSelectedRole(null);
    reset();
    setModalOpen(false);
    setData('_method', 'POST' as any); // Ensure POST is reset for next creation
  };

  // 🛑 Corrected handleSubmit function
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "edit" && selectedRole) {
        // data._method is set to "PUT" in handleOpenEditViewModal
        post(route("roles.update", selectedRole.id), {
            forceFormData: true,
            onSuccess: () => {
                //toast.success("Role updated");
                closeModal();
            },
            onError: (err: any) => {
                 // Check if the error object contains a detailed message
                 const errorMessages = errors && Object.values(errors).flat();
                 const msg = errorMessages?.length ? errorMessages.join(', ') : 'Failed to update role';
                toast.error(msg);
            },
        });
    } else {
        // data._method is implicitly POST
        post(route("roles.store"), {
            forceFormData: true,
            onSuccess: () => {
                //toast.success("Role created");
                closeModal();
            },
            onError: (err: any) => {
                const errorMessages = errors && Object.values(errors).flat();
                const msg = errorMessages?.length ? errorMessages.join(', ') : 'Failed to create role';
                toast.error(msg);
            },
        });
    }
  };


  // 🟢 ALL FILTER METHODS ARE BACK (Retained from original)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterData('search', value);
    const query = {
      ...(value && { search: value }),
      ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
    };
    router.get(route('roles.index'), query, { preserveState: true, preserveScroll: true });
  };

  const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    router.get(route('roles.index'), {}, { preserveState: true, preserveScroll: true });
  };

  const handlePerPageChange = (value: string) => {
    setFilterData('perPage', value);
    const query = {
      ...(filtersForm.search && { search: filtersForm.search }),
      ...(value && { perPage: value }),
    };
    router.get(route('roles.index'), query, { preserveState: true, preserveScroll: true });
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

    router.get(route('roles.index'), query, { preserveState: true, preserveScroll: true });
  };

  // 🟢 ALL DELETE METHODS ARE BACK (Retained from original)
  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!roleToDelete) return;
    if (roleToDelete.user_count > 0) {
         toast.error(`Cannot delete role: ${roleToDelete.label} is assigned to ${roleToDelete.user_count} user(s).`);
         setShowDeleteModal(false);
         setRoleToDelete(null);
         return;
    }
    router.delete(route('roles.destroy', roleToDelete.id), {
        onSuccess: (resp: any) => {
            const msg = resp?.props?.flash?.success || 'Role deleted successfully';
            toast.success(msg);
            setShowDeleteModal(false);
            setRoleToDelete(null);
        },
        onError: (errs) => {
            const errorMsg = errs.error || errs.name || 'Failed to delete role';
            toast.error(errorMsg);
        },
    });
  };

  const handleBulkDelete = (ids: number[]) => {
    if (!ids.length) return toast.error('No roles selected');
    setRolesToBulkDeleteIds(ids);
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    const ids = rolesToBulkDeleteIds;
    if (!ids.length) return;
    router.post(
        route('roles.bulk-delete'),
        { ids },
        {
            preserveScroll: true,
            onSuccess: (resp: any) => {
                const msg = resp?.props?.flash?.success || `${ids.length} role(s) deleted`;
                toast.success(msg);
                setShowBulkDeleteModal(false);
                setRolesToBulkDeleteIds([]);
            },
            onError: (errs) => {
                const errorMsg = errs.error || 'Failed to delete selected roles. Check if roles are assigned to users.';
                toast.error(errorMsg);
                setShowBulkDeleteModal(false);
                setRolesToBulkDeleteIds([]);
            }
        }
    );
  };

  // 🟢 ALL EXPORT METHODS ARE BACK (Retained from original)
  const handleExportPDF = (role: Role) => {
    window.open(route('roles.export.pdf.single', role.id), '_blank');
  };

  const handleExportExcel = (role: Role) => {
    window.open(route('roles.export.excel.single', role.id), '_blank');
  };

  const handleBulkExportPDF = (ids: number[]) => {
    if (!ids.length) return toast.error('No roles selected');
    const url = route('roles.bulk-export-pdf', { ids: ids.join(',') });
    window.open(url, '_blank');
  };

  const handleBulkExportExcel = (ids: number[]) => {
    if (!ids.length) return toast.error('No roles selected');
    const url = route('roles.bulk-export-excel', { ids: ids.join(',') });
    window.open(url, '_blank');
  };

  // 🟢 ALL IMPORT METHODS ARE BACK (Retained from original)
  const handleDownloadTemplate = () => {
    try {
        window.open(route('roles.download-template'), '_blank');
    } catch (error) {
        toast.error('Failed to download template');
    }
  };

  const handleFileSelected = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    router.post(route('roles.import'), formData, {
        forceFormData: true,
        onStart: () => toast.loading('Importing...', { id: 'import' }),
        onSuccess: (resp: any) => {
            toast.success(resp?.props?.flash?.success || 'Roles imported successfully', { id: 'import' });
        },
        onError: () => toast.error('Failed to import file', { id: 'import' }),
    });
  };


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Roles" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
            <ShieldPlusIcon size={26} className="text-orange-600 mr-1" />
            Roles Management Hub
        </h2>
        <p className="text-sm text-gray-600 max-w-2xxl">
            Here you can manage roles. Create new roles, view details, update information, and handle deletions. Use the filters to quickly find specific roles.
        </p>
        {/* Filters and Secured Add Button */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search Role by label, key, or description..."
            name="search"
          />

          <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
            <X size={20} />
          </Button>

          {/* 1. 🖼️ Move Modal Component to Header */}
          <div className="ml-auto">
             <SimpleModalForm
                // CRITICAL: Key to force component reset on open/edit
                key={selectedRole ? `role-edit-${selectedRole.id}` : 'role-create'}
                title={
                    mode === 'view'
                        ? 'View Role'
                        : mode === 'edit'
                        ? 'Update Role'
                        : RoleModalFormConfig.title
                }
                description={RoleModalFormConfig.description}
                fields={RoleModalFormConfig.fields}
                buttons={RoleModalFormConfig.buttons}
                // 2. 🛡️ DELEGATE BUTTON RENDERING AND SECURITY CHECK
                addButton={RoleModalFormConfig.addButton}

                data={data}
                setData={handleSetData}
                processing={processing}
                handleSubmit={handleSubmit}
                errors={errors}
                // ⚠️ NOTE: Since the button is delegated, we control visibility here.
                open={modalOpen}
                // When the modal closes (via button or ESC), it calls onOpenChange
                onOpenChange={(open: boolean) => {
                    if (!open) closeModal();
                    // When the modal opens via the delegated button, this is called.
                    else {
                        setModalOpen(true);
                        setMode('create'); // Ensure we start in create mode when triggered via the Add Button
                        reset(); // Reset form data
                        setData('_method', 'POST' as any);
                    }
                }}
                mode={mode}
                extraData={permissionsGrouped as any}
            />
          </div>
          {/* ❌ REMOVED: The manual Button component that called openModal('create') was here */}
        </div>

        {/* Table */}
        <ComplexTable
          moduleName="Roles"
          columns={RoleTableConfig.columns}
          actions={RoleTableConfig.actions}
          data={roles.data}
          from={roles.from}
          // 🛠️ Update actions to use the new handler
          onView={(r: any) => handleOpenEditViewModal('view', r)}
          onEdit={(r: any) => handleOpenEditViewModal('edit', r)}
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
        {roles.data && roles.data.length > 0 && (

          <Pagination
            products={roles}
            perPage={filtersForm.perPage}
            onPerPageChange={handlePerPageChange}
            totalCount={totalCount}
            filteredCount={filteredCount}
            search={filtersForm.search}
          />

        )}
      </div>

      {/* Delete Confirmation Modal (Retained) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-800">{roleToDelete?.label}</span>?
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

      {/* Bulk Delete Confirmation Modal (Retained) */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
             <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-red-700">Confirm Bulk Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-red-700">{rolesToBulkDeleteIds.length} selected role(s)</span>?
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
