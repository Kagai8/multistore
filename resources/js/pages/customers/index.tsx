/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useState, useEffect } from 'react'; // 🟢 ADDED useEffect for flash messages
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { CustomerTableConfig } from '@/components/config/tables/customer-table';
import { CustomerModalFormConfig } from '@/components/config/forms/customer-modal-form';
import CustomTable from '@/components/custom-table';
import SimpleModalForm from '@/components/simple-custom-modal-form';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Package, Users2, X } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';



// --- CONFIGURATION & TYPES ---

// 🟢 NEW: Define the expected structure for the usePage() props
interface AuthPageProps {
    [key: string]: any;
    auth: {
        permissions: string[];
    };
    flash?: { success?: string; error?: string; warning?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Manage Customers', href: '/customers' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface Customer {
  id: number;
  name: string;
  number?: string | null;
  email?: string | null;
  credit_limit: number;
  created_at: string;
}

interface CustomerPagination {
  data: Customer[];
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
  customers: CustomerPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}

// --- END CONFIGURATION & TYPES ---


export default function Index({ customers, filters, totalCount, filteredCount }: IndexProps) {
  // 🟢 FIX: Use AuthPageProps generic to safely access auth and flash
  const { auth, flash } = usePage<AuthPageProps>().props;
  const flashMessage = flash?.success || flash?.error || flash?.warning;
  // const permissions = auth?.permissions || []; // Available for checks if needed

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [customersToBulkDeleteIds, setCustomersToBulkDeleteIds] = useState<number[]>([]);

  // Form for creating/editing
  const { data, setData, reset, errors, processing, post, put } = useForm({
    name: '',
    number: '',
    email: '',
    credit_limit: 0.00,
    _method: 'POST',
  });

  // Filter form
  const { data: filtersForm, setData: setFilterData } = useForm<FilterProps>({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  // Simple handler for all non-file fields
  const handleSetData = (key: string, value: any) => {
    setData(key, value);
  };

  // Handle flash messages
  useEffect(() => {
    if (flashMessage) {
        const type = flash.success ? 'success' : flash.error ? 'error' : 'warning';
        toast[type](flashMessage);
    }
  }, [flashMessage, flash]);

  // Filter helper
  const handleFilterRequest = (query: Record<string, any>) => {
    router.get(route('customers.index'), query, { preserveState: true, preserveScroll: true });
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


  // Open modal (create, view, edit)
  const openModal = (m: 'create' | 'view' | 'edit', customer?: Customer) => {
    setMode(m);

    if (customer) {
        // Map customer data to form data
        setData((prev) => ({
            ...prev,
            id: customer.id as any,
            name: customer.name,
            number: customer.number || '',
            email: customer.email || '',
            // Ensure credit_limit is handled as a number/string for the input
            credit_limit: customer.credit_limit.toFixed(2) as any,
            _method: 'PUT',
        }));
        setSelectedCustomer(customer);
    } else {
        // Create mode
        reset();
        setSelectedCustomer(null);
        setData('_method', 'POST' as any);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setMode('create');
    setSelectedCustomer(null);
    reset();
    setModalOpen(false);
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🟢 FIX: Ensure PUT method is correctly handled via useForm put helper
    if (mode === 'edit' && selectedCustomer) {
      put(route('customers.update', selectedCustomer.id), {
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || 'Customer updated successfully.';
          toast.success(msg);
          closeModal();
        },
        onError: () => toast.error('Failed to update customer.'),
      });
    } else {
      post(route('customers.store'), {
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || 'Customer created successfully.';
          toast.success(msg);
          closeModal();
        },
        onError: () => toast.error('Failed to create customer.'),
      });
    }
  };

  // Single Delete
  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!customerToDelete) return;

    router.delete(route('customers.destroy', customerToDelete.id), {
      onSuccess: () => {
        setShowDeleteModal(false);
        setCustomerToDelete(null);
      },
      onError: () => toast.error('Failed to delete customer'),
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleExportPDF = (customer: Customer) => {
     window.open(route('customers.export.pdf.single', customer.id), '_blank');
  };

  const handleExportExcel = (customer: Customer) => {
    window.open(route('customers.export.excel.single', customer.id), '_blank');
  };

  // BULK ACTIONS
  const handleBulkDelete = (ids: number[]) => {
    if (!ids.length) return toast.error('No customers selected');
    setCustomersToBulkDeleteIds(ids);
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    const ids = customersToBulkDeleteIds;
    if (!ids.length) return;

    router.post(
      route('customers.bulk-delete'),
      { ids },
      {
        preserveScroll: true,
        onSuccess: (resp: any) => {
          const msg = resp?.props?.flash?.success || `${ids.length} customer(s) deleted`;
          toast.success(msg);
          setShowBulkDeleteModal(false);
          setCustomersToBulkDeleteIds([]);
        },
        onError: () => {
          toast.error('Failed to delete selected customers');
          setShowBulkDeleteModal(false);
          setCustomersToBulkDeleteIds([]);
        }
      }
    );
  };

  const handleBulkExportPDF = (ids: number[]) => {
    if (!ids.length) return toast.error('No customers selected');
    const url = route('customers.bulk-export-pdf') + `?ids=${ids.join(',')}`;
    window.open(url, '_blank');
  };

  const handleBulkExportExcel = (ids: number[]) => {
    if (!ids.length) return toast.error('No customers selected');
    const url = route('customers.bulk-export-excel') + `?ids=${ids.join(',')}`;
    window.open(url, '_blank');
  };

  // Download Template handler
  const handleDownloadTemplate = () => {
    try {
      window.open(route('customers.download-template'), '_blank');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  // Import File handler
  const handleFileSelected = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    router.post(route('customers.import'), formData, {
      forceFormData: true,
      onStart: () => toast.loading('Importing...', { id: 'import' }),
      onSuccess: (resp: any) => {
        toast.success(resp?.props?.flash?.success || 'Customers imported successfully', { id: 'import' });
      },
      onError: (errors: any) => {
        const errorMessage = errors?.file || 'Failed to import file. Check file format.';
        toast.error(errorMessage, { id: 'import' });
      },
    });
  };


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Customers" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
            <Users2 size={26} className="text-orange-600" />
            Customer Management Hub
        </h2>
        <p className="text-sm text-gray-600 max-w-2xxl">
            Create new customers, update and view existing ones, and organize your customer information efficiently. Use the filters to get reporting data as needed.
        </p>
        {/* Filters and Secured Add Button */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search Customer..."
            name="search"
          />

          <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
            <X size={20} />
          </Button>

          {/* 🟢 CRITICAL FIX: SimpleModalForm call moved HERE to render the button in the header */}
          <div className="ml-auto">
             <SimpleModalForm
                title={
                    mode === 'view'
                        ? 'View Customer'
                        : mode === 'edit'
                        ? 'Update Customer'
                        : CustomerModalFormConfig.title
                }
                description={CustomerModalFormConfig.description}
                fields={CustomerModalFormConfig.fields}
                buttons={CustomerModalFormConfig.buttons}

                // 🟢 This prop is crucial: it defines the button and triggers the internal security check
                addButton={CustomerModalFormConfig.addButton}

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
        <CustomTable
          moduleName="Customer"
            importPermission="import-customer"
            downloadTemplatePermission="download-template-customer"
          columns={CustomerTableConfig.columns}
          actions={CustomerTableConfig.actions}
          data={customers.data}
          from={customers.from}
          onView={(u: Customer) => openModal('view', u)}
          onEdit={(u: Customer) => openModal('edit', u)}
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
        {customers.data && customers.data.length > 0 && (

          <Pagination
            products={customers}
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
                <span className="font-semibold text-gray-800">{customerToDelete?.name}</span>?
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
                <span className="font-semibold text-red-700">{customersToBulkDeleteIds.length} selected customer(s)</span>?
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
