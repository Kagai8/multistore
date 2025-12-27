/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// 🟢 New Imports for New Stock Entry Configuration
import { NewStockEntryTableConfig } from '@/components/config/tables/newstockentry-table';
import { NewStockEntryModalFormConfig } from '@/components/config/forms/newstockentry-modal-form';
import CustomModalForm from '@/components/complex-modal-form';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PackagePlusIcon, X } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import ComplexTable from '@/components/complex-table';



// --- CONFIGURATION & TYPES ---

// 🟢 NEW: Define the expected structure for the usePage() props
interface AuthPageProps {
    [key: string]: any;
    auth: {
        permissions: string[];
    };
    flash?: { success?: string; error?: string; warning?: string };
}

// 🟢 Updated Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'New Stock Entries', href: '/new-stock-entries' },
  { title: 'New Stock Entry', href: '/new-stock-entries' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

// ✅ NewStockEntry Interface - Data structure returned from Laravel
interface NewStockEntry {
  id: number;
  invoice_number: string | null;
  quantity_received: number;
  quantity_transferred: number;
  available_to_transfer: number; // Accessor value
  status: 'pending' | 'partially_sent' | 'completed'; // Matches model constants
  product_id: number | string;
  supplier_id: number | string;
  store_id: number | string;
  product_name: string;
  supplier_name: string;
  store_name: string; // Should be the Warehouse name
  user_name: string;
  created_at: string;
}

// 🟢 NewStockEntryForm interface - The data structure sent to Inertia/Laravel
interface NewStockEntryForm {
  invoice_number: string;
  product_id: string;
  supplier_id: string;
  store_id: string; // The Warehouse ID
  quantity_received: number;
  _method?: 'POST' | 'PUT';
}

interface NewStockEntryPagination {
  data: NewStockEntry[];
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
    products: Array<{ id: number; name: string }>;
    suppliers: Array<{ id: number; name: string }>;
    // CRITICAL: We pass the single warehouse store object here
    warehouseStore: { id: number; name: string } | null;
}

interface IndexProps {
  entries: NewStockEntryPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
  lookupData: LookupData;
}

// --- END CONFIGURATION & TYPES ---


// 🟢 Updated component name
export default function Index({ entries, filters, totalCount, filteredCount, lookupData }: IndexProps) {
  // 🟢 FIX: Use AuthPageProps generic to safely access auth and flash
  const { auth, flash } = usePage<AuthPageProps>().props;
  const flashMessage = flash?.success || flash?.error || flash?.warning;

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedEntry, setSelectedEntry] = useState<NewStockEntry | null>(null);

  // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<NewStockEntry | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [entriesToBulkDeleteIds, setEntriesToBulkDeleteIds] = useState<number[]>([]);

  // 🟢 useForm Initialization
  const { data, setData, reset, errors, processing, post, put } = useForm<NewStockEntryForm>({
    invoice_number: '',
    product_id: '',
    supplier_id: '',
    // CRITICAL: Auto-set the store_id to the warehouse store ID on initialization
    store_id: String(lookupData.warehouseStore?.id || ''),
    quantity_received: 0,
    _method: 'POST',
  });

  // Filter form (search and perPage)
  const { data: filtersForm, setData: setFilterData } = useForm<FilterProps>({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });


  // 🟢 Centralized Data Handler - Simpler as no files
const handleSetData = (key: string, value: any) => {

    const isNumericField = [
        'quantity_received',
    ].includes(key);

    // 1. Handle Numeric Fields
    if (isNumericField) {
        const numericValue = value === '' || value === null ? 0 : Number(value);
        setData(key as 'quantity_received', numericValue);
    }
    // 2. For all other fields (foreign keys, text, etc.)
    else {
        setData(key as keyof NewStockEntryForm, value);
    }
};

  // Handle flash messages
  useEffect(() => {
    if (flashMessage) {
        const type = flash.success ? 'success' : flash.error ? 'error' : 'warning';
        toast[type](flashMessage);
    }
  }, [flashMessage, flash]);

  // ✅ openModal function with explicit, type-safe data mapping
const openModal = (m: 'create' | 'view' | 'edit', entry?: NewStockEntry) => {
    setMode(m);
    setSelectedEntry(null);

    if (entry) {
      setSelectedEntry(entry);

      // Map DB data to form data
      setData((prev) => ({
        ...prev,
        invoice_number: entry.invoice_number || '',
        quantity_received: entry.quantity_received,

        // Foreign Key IDs
        product_id: String(entry.product_id || ''),
        supplier_id: String(entry.supplier_id || ''),
        store_id: String(entry.store_id || ''), // Should be the warehouse ID
        _method: 'PUT',
      } as NewStockEntryForm));

    } else {
        // Create mode setup: Use reset() to clear any previous edit/view data.
        reset();
        // Ensure store_id is set to the warehouse ID for new creation
        setData('store_id', String(lookupData.warehouseStore?.id || ''));
        setData('_method', 'POST' as any);
    }

    setModalOpen(true);
};

  const closeModal = () => {
    setMode('create');
    setSelectedEntry(null);
    reset();
    setModalOpen(false);
  };

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "edit" && selectedEntry) {
        // Data already set to PUT from openModal
        post(route("new-stock-entries.update", selectedEntry.id), {
            forceFormData: true,

            onSuccess: () => {
                toast.success("Stock receipt updated");
                closeModal();
            },

            onError: () => {
                toast.error("Failed to update stock receipt");
            },
        });
    } else {
        post(route("new-stock-entries.store"), {
            forceFormData: true,

            onSuccess: () => {
                toast.success("New stock receipt recorded");
                closeModal();
            },

            onError: () => {
                toast.error("Failed to record new stock receipt");
            },
        });
    }
};


// 🟢 CUSTOM ACTIONS HANDLERS (Post Stock & Create Transfer)
const handlePostStock = (entry: NewStockEntry) => {
    if (entry.status !== 'pending') {
        return toast.error("Only pending entries can be posted.");
    }
    router.post(route('new-stock-entries.post', entry.id), {}, {
        preserveScroll: true,
        onStart: () => toast.loading(`Posting stock for Invoice #${entry.invoice_number}...`, { id: 'post-stock' }),
        onSuccess: (resp: any) => {
            const msg = resp?.props?.flash?.success || 'Stock posted successfully';
            toast.success(msg, { id: 'post-stock' });
        },
        onError: () => toast.error('Failed to post stock', { id: 'post-stock' }),
    });
};

const handleCreateTransfer = (entry: NewStockEntry) => {
    if (entry.available_to_transfer <= 0) {
        return toast.error("No stock is available to transfer for this entry.");
    }
    // 🛑 FUTURE FEATURE: Redirect to the Stock Transfer creation form, pre-filled
    toast.info(`Starting new transfer for ${entry.product_name} (Qty: ${entry.available_to_transfer})...`);

    // Actual redirection (to be implemented later in Flow 3):
    // router.visit(route('stock-transfers.create', { entry_id: entry.id }));
};


// ... (Standard Table Handlers)

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterData('search', value);
    const query = {
      ...(value && { search: value }),
      ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
      ...(filtersForm.dateFrom && { dateFrom: filtersForm.dateFrom }),
      ...(filtersForm.dateTo && { dateTo: filtersForm.dateTo }),
    };
    router.get(route('new-stock-entries.index'), query, { preserveState: true, preserveScroll: true });
};

const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    router.get(route('new-stock-entries.index'), {}, { preserveState: true, preserveScroll: true });
};

const handlePerPageChange = (value: string) => {
    setFilterData('perPage', value);
    const query = {
      ...(filtersForm.search && { search: filtersForm.search }),
      ...(value && { perPage: value }),
      ...(filtersForm.dateFrom && { dateFrom: filtersForm.dateFrom }),
      ...(filtersForm.dateTo && { dateTo: filtersForm.dateTo }),
    };
    router.get(route('new-stock-entries.index'), query, { preserveState: true, preserveScroll: true });
};

const handleDelete = (entry: NewStockEntry) => {
    if (entry.status !== 'pending') {
        return toast.error("Only PENDING entries can be deleted.");
    }
    setEntryToDelete(entry);
    setShowDeleteModal(true);
};

const confirmDelete = () => {
    if (!entryToDelete) return;
    router.delete(route('new-stock-entries.destroy', entryToDelete.id), {
        onSuccess: () => {
            setShowDeleteModal(false);
            setEntryToDelete(null);
        },
        onError: () => toast.error('Failed to delete receipt (Check status)'),
        preserveScroll: true,
        preserveState: true,
    });
};

const handleExportPDF = (entry: NewStockEntry) => {
    window.open(route('new-stock-entries.export.pdf.single', entry.id), '_blank');
};

const handleExportExcel = (entry: NewStockEntry) => {
    window.open(route('new-stock-entries.export.excel.single', entry.id), '_blank');
};

const handleBulkDelete = (ids: number[]) => {
    if (!ids.length) return toast.error('No receipts selected');
    setEntriesToBulkDeleteIds(ids);
    setShowBulkDeleteModal(true);
};

const confirmBulkDelete = () => {
    const ids = entriesToBulkDeleteIds;
    if (!ids.length) return;

    router.post(
        route('new-stock-entries.bulk-delete'),
        { ids },
        {
            preserveScroll: true,
            onSuccess: (resp: any) => {
                const msg = resp?.props?.flash?.success || `${ids.length} receipt(s) deleted`;
                toast.success(msg);
                setShowBulkDeleteModal(false);
                setEntriesToBulkDeleteIds([]);
            },
            onError: () => {
                toast.error('Failed to delete selected receipts (Check statuses)');
                setShowBulkDeleteModal(false);
                setEntriesToBulkDeleteIds([]);
            }
        }
    );
};

const handleBulkExportPDF = (ids: number[]) => {
    if (!ids.length) return toast.error('No receipts selected');
    const url = route('new-stock-entries.bulk-export-pdf') + `?ids=${ids.join(',')}`;
    window.open(url, '_blank');
};

const handleBulkExportExcel = (ids: number[]) => {
    if (!ids.length) return toast.error('No receipts selected');
    const url = route('new-stock-entries.bulk-export-excel') + `?ids=${ids.join(',')}`;
    window.open(url, '_blank');
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

    router.get(route('new-stock-entries.index'), query, { preserveState: true, preserveScroll: true });
};


// 🟢 Function to handle custom action buttons in the ComplexTable
const handleAction = (label: string, row: NewStockEntry) => {
    switch (label) {
        case 'Post Stock':
            handlePostStock(row);
            break;
        case 'Create Transfer':
            handleCreateTransfer(row);
            break;
        case 'Edit':
            openModal('edit', row);
            break;
        case 'Delete':
            handleDelete(row);
            break;
        case 'Export PDF':
            handleExportPDF(row);
            break;
        case 'Export Excel':
            handleExportExcel(row);
            break;
        case 'View':
            openModal('view', row);
            break;
        default:
            console.warn(`Unknown action: ${label}`);
            break;
    }
};


return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="New Stock Receipts" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
            <PackagePlusIcon size={26} className="text-orange-600 mr-1" />
            New Stock Entry Registration
        </h2>
        <p className="text-sm text-gray-600 max-w-2xxl">
            Here you register a product's first ever stock into the system. Once confirmed you can post it live into the system from "draft" to "completed". Use the filters to get reporting data as needed.
        </p>
        {/* Filters */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search Receipt by invoice number or product name..."
            name="search"
          />

          <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
            <X size={20} />
          </Button>

          {/* 🟢 CRITICAL FIX: The CustomModalForm is now called here to securely render the button */}
          <div className="ml-auto">
            <CustomModalForm
                // CRITICAL: Key to force component reset on open/edit
                key={selectedEntry ? `entry-edit-${selectedEntry.id}` : 'entry-create'}
                title={
                    mode === 'view'
                        ? 'View Stock Receipt'
                        : mode === 'edit'
                        ? 'Update Stock Receipt'
                        : NewStockEntryModalFormConfig.title
                }
                description={NewStockEntryModalFormConfig.description}
                fields={NewStockEntryModalFormConfig.fields}
                buttons={NewStockEntryModalFormConfig.buttons}

                // 🟢 THIS PROP RENDERS THE SECURED BUTTON
                addButton={NewStockEntryModalFormConfig.addButton}

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
                extraData={{
                    products: lookupData.products,
                    suppliers: lookupData.suppliers,
                    warehouseStore: lookupData.warehouseStore ? [
                        { id: lookupData.warehouseStore.id, name: lookupData.warehouseStore.name }
                    ] : [],
                }}
            />
          </div>
          {/* ❌ REMOVED: The manual Button component was here */}
        </div>

        {/* Table */}
        <ComplexTable
          moduleName="New Stock Receipts"
          columns={NewStockEntryTableConfig.columns}
          actions={NewStockEntryTableConfig.actions}
          data={entries.data}
          from={entries.from}
          // Delegating all individual row actions to handleAction
          onView={(b: any) => handleAction('View', b)}
          onEdit={(b: any) => handleAction('Edit', b)}
          onDelete={(b: any) => handleAction('Delete', b)}
          onExportPDF={(b: any) => handleAction('Export PDF', b)}
          onExportExcel={(b: any) => handleAction('Export Excel', b)}
          onBulkDelete={handleBulkDelete}
          onBulkExportPDF={handleBulkExportPDF}
          onBulkExportExcel={handleBulkExportExcel}
          // The Post Stock and Create Transfer actions are routed via this general action handler
          onCustomAction={handleAction}
          isModal
          onDateFilterChange={handleDateFilterChange}
        />

        {/* Pagination — only show when data exists */}
        {entries.data && entries.data.length > 0 && (

          <Pagination
            products={entries}
            perPage={filtersForm.perPage}
            onPerPageChange={handlePerPageChange}
            totalCount={totalCount}
            filteredCount={filteredCount}
            search={filtersForm.search}
          />

        )}
      </div>

      {/* ❌ REMOVED: The CustomModalForm was here previously. It is now in the header div. */}

      {/* Delete Confirmation Modal (Entry) */}
        {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete receipt{' '}
                <span className="font-semibold text-gray-800">{entryToDelete?.invoice_number || entryToDelete?.id}</span>?
                This action is only allowed if the stock has NOT been posted.
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
        {/* Bulk Delete Confirmation Modal (Entries) */}
        {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-red-700">Confirm Bulk Deletion</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-red-700">{entriesToBulkDeleteIds.length} selected receipt(s)</span>?
                This action is only allowed if the stock has NOT been posted for the selected entries.
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
