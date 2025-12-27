/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// 🟢 Imports for User Configuration
import { UserTableConfig } from '@/components/config/tables/user-table';
import { UserModalFormConfig } from '@/components/config/forms/user-modal-form';
import ComplexModalForm from '@/components/complex-modal-form';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserRoundPlus, X } from 'lucide-react'; // Removed CirclePlus since it's now inside the modal config
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import ComplexTable from '@/components/complex-table';

// 🟢 Updated Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Manage Users', href: '/users' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

// ✅ User Interface - Data structure returned from Laravel
interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  store_id: number;
  role_name: string;
  store_name: string;
  email_verified_at: string | null;
  two_factor_confirmed: boolean;
  created_at: string;
}

// 🟢 UserForm interface - The data structure sent to Inertia/Laravel
interface UserForm {
  name: string;
  email: string;
  password?: string; // Optional for edit mode
  password_confirmation?: string; // Optional for edit mode
  role_id: string;
  store_id: string;

  _method?: 'POST' | 'PUT';
}

interface UserPagination {
  data: User[];
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
    roles: Array<{ id: number; name: string }>;
    stores: Array<{ id: number; name: string }>;
}

interface IndexProps {
  users: UserPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
  lookupData: LookupData;
  currentUserId: number; // For conditional logic (e.g., preventing self-delete)
}

export default function Index({ users, filters, totalCount, filteredCount, lookupData, currentUserId }: IndexProps) {
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
  const flashMessage = flash?.success || flash?.error;

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [usersToBulkDeleteIds, setUsersToBulkDeleteIds] = useState<number[]>([]);

  // 🟢 useForm Initialization
  const { data, setData, reset, errors, processing, post, put } = useForm<UserForm>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role_id: '',
    store_id: '',
  });

  // Filter form (search and perPage)
  const { data: filtersForm, setData: setFilterData } = useForm({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  // 🟢 Centralized Data Handler
const handleSetData = (key: string, value: any) => {
    setData(key as keyof UserForm, value);
};

  // Auto-hide toast after 3s
  useEffect(() => {
    if (flashMessage) {
        toast[flash?.success ? 'success' : 'error'](flashMessage);
    }
  }, [flashMessage, flash]);

  // 🔑 FIX 1: Renamed function to handle Open for Edit/View only
const handleOpenEditViewModal = (m: 'view' | 'edit', user: User) => {
    setMode(m);

    // Reset form before setting new data
    reset();

    if (user) {
      setSelectedUser(user);

      // Load data from existing user object
      setData({
        name: user.name,
        email: user.email,
        role_id: String(user.role_id),
        store_id: String(user.store_id),
        // Password fields are intentionally left blank for security/UI
        password: '',
        password_confirmation: '',
      } as UserForm);

    } else {
        // This path should ideally not be hit
        reset();
    }

    setModalOpen(true);
};

  const closeModal = () => {
    setMode('create');
    setSelectedUser(null);
    reset();
    setModalOpen(false);
  };

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "edit" && selectedUser) {
        // Use put() for updates
        put(route("users.update", selectedUser.id), {
            onSuccess: () => {
                toast.success("User updated");
                closeModal();
            },

            onError: (errors) => {
                // Controller handles Super Admin security errors and sends them back as flash
                if (!Object.keys(errors).length) {
                    // If errors object is empty, rely on flash message from server
                    return;
                }
                toast.error("Failed to update user");
            },
        });
    } else {
        // Use post() for creation
        post(route("users.store"), {
            onSuccess: () => {
                toast.success("User created");
                closeModal();
            },

            onError: () => {
                toast.error("Failed to create user");
            },
        });
    }
};

// --- Table Handlers (Filtering, Actions, Bulk) ---

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterData('search', value);
    const query = {
      ...(value && { search: value }),
      ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
    };
    router.get(route('users.index'), query, { preserveState: true, preserveScroll: true });
};

const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    router.get(route('users.index'), {}, { preserveState: true, preserveScroll: true });
};

const handlePerPageChange = (value: string) => {
    setFilterData('perPage', value);
    const query = {
      ...(filtersForm.search && { search: filtersForm.search }),
      ...(value && { perPage: value }),
    };
    router.get(route('users.index'), query, { preserveState: true, preserveScroll: true });
};

const handleDelete = (user: User) => {
    if (user.id === 1 || user.id === currentUserId) {
        return toast.error("Cannot delete the Super Admin or yourself.");
    }
    setUserToDelete(user);
    setShowDeleteModal(true);
};

const confirmDelete = () => {
    if (!userToDelete) return;
    router.delete(route('users.destroy', userToDelete.id), {
        onSuccess: (resp: any) => {
            const msg = resp?.props?.flash?.success || 'User deleted successfully';
            toast.success(msg);
            setShowDeleteModal(false);
            setUserToDelete(null);
        },
        onError: () => toast.error('Failed to delete user'),
    });
};

const handleExportPDF = (user: User) => {
    window.open(route('users.export.pdf.single', user.id), '_blank');
};

const handleExportExcel = (user: User) => {
    window.open(route('users.export.excel.single', user.id), '_blank');
};

const handleBulkDelete = (ids: number[]) => {
    if (!ids.length) return toast.error('No users selected');
    setUsersToBulkDeleteIds(ids);
    setShowBulkDeleteModal(true);
};

const confirmBulkDelete = () => {
    const ids = usersToBulkDeleteIds;
    // The controller will filter out protected IDs (1 and currentUserId)
    if (!ids.length) return;

    router.post(
        route('users.bulk-delete'),
        { ids },
        {
            preserveScroll: true,
            onSuccess: (resp: any) => {
                const msg = resp?.props?.flash?.success || `${ids.length} user(s) deleted`;
                toast.success(msg);
                setShowBulkDeleteModal(false);
                setUsersToBulkDeleteIds([]);
            },
            onError: () => {
                toast.error('Failed to delete selected users');
                setShowBulkDeleteModal(false);
                setUsersToBulkDeleteIds([]);
            }
        }
    );
};

const handleBulkExportPDF = (ids: number[]) => {
    if (!ids.length) return toast.error('No users selected');
    const url = route('users.bulk-export-pdf', { ids: ids.join(',') });
    window.open(url, '_blank');
};

const handleBulkExportExcel = (ids: number[]) => {
    if (!ids.length) return toast.error('No users selected');
    const url = route('users.bulk-export-excel', { ids: ids.join(',') });
    window.open(url, '_blank');
};

const handleDownloadTemplate = () => {
    try {
        window.open(route('users.download-template'), '_blank');
    } catch (error) {
        toast.error('Failed to download template');
    }
};

const handleFileSelected = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    router.post(route('users.import'), formData, {
        forceFormData: true,
        onStart: () => toast.loading('Importing...', { id: 'import' }),
        onSuccess: (resp: any) => {
            toast.success(resp?.props?.flash?.success || 'Users imported successfully', { id: 'import' });
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

    router.get(route('users.index'), query, { preserveState: true, preserveScroll: true });
};


return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Users" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
            <UserRoundPlus size={26} className="text-orange-600 mr-1" />
            User Management Hub
        </h2>
        <p className="text-sm text-gray-600 max-w-2xxl">
            Here you can manage users. Create new users, view details, update information, and handle deletions. Use the filters to quickly find specific users.
        </p>
        {/* Filters */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search User by name, email, role, or store..."
            name="search"
          />

          <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
            <X size={20} />
          </Button>

          {/* 🔑 FIX 2 & 3: Moved ComplexModalForm here and passed addButton config (Delegation) */}
          <div className="ml-auto">
             <ComplexModalForm
                key={selectedUser ? `user-edit-${selectedUser.id}` : 'user-create'}
                title={
                    mode === 'view'
                    ? 'View User'
                    : mode === 'edit'
                    ? 'Update User'
                    : UserModalFormConfig.title
                }
                description={UserModalFormConfig.description}
                fields={UserModalFormConfig.fields}
                buttons={UserModalFormConfig.buttons}
                data={data}
                setData={handleSetData}
                processing={processing}
                handleSubmit={handleSubmit}
                errors={errors}
                open={modalOpen}
                onOpenChange={(open: boolean) => {
                    // Logic to handle opening via delegated button (Create mode setup)
                    if (open && mode !== 'edit' && mode !== 'view') {
                        setMode('create');
                        reset();
                    }
                    if (!open) closeModal();
                    else setModalOpen(open);
                }}
                mode={mode}
                extraData={lookupData}
                // 🔑 CRITICAL: Pass the addButton config to trigger the delegation pattern
                addButton={UserModalFormConfig.addButton}
            />
          </div>
        </div>

        {/* Table */}
        <ComplexTable
          moduleName="Users"
          columns={UserTableConfig.columns}
          actions={UserTableConfig.actions}
          data={users.data}
          from={users.from}
          // 🔑 FIX 1: Use the refactored handler for table actions
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
        {users.data && users.data.length > 0 && (

          <Pagination
            products={users} // Renamed prop to 'data' in a real scenario, keeping it 'products' for consistency with your existing component
            perPage={filtersForm.perPage}
            onPerPageChange={handlePerPageChange}
            totalCount={totalCount}
            filteredCount={filteredCount}
            search={filtersForm.search}
          />

        )}
      </div>

      {/* Delete Confirmation Modal (Unchanged) */}
        {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-800">{userToDelete?.name}</span>?
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
                <span className="font-semibold text-red-700">{usersToBulkDeleteIds.length} selected user(s)</span>?
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

