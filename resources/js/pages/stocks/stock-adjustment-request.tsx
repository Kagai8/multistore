/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

import { StockAdjustmentRequestsTableConfig } from '@/components/config/tables/stock-adjustment-request-table';
import { StockAdjustmentRequestFormConfig } from '@/components/config/forms/stock-adjustment-request-modal-form';

import ComplexModalForm from '@/components/complex-modal-form';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, ClipboardListIcon } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory', href: '/inventory' },
  { title: 'Adjustment Requests', href: '/stock-adjustment-requests' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface StockAdjustmentRequest {
  id: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  type: 'in' | 'out';
  quantity: number;
  notes: string | null;
  requested_at: string;
  approved_at: string | null;

  product: { id: number; name: string; sku: string };
  store: { id: number; name: string };
  requester: { name: string };
  approver: { name: string } | null;
  reason: { id: number; name: string };

  is_requester: boolean;
}

interface UserContext {
  store_id: number | null;
  is_global_user: boolean;
}

interface PagePropsWithConfig extends IndexProps {
  inventoryConfig: {
    userContext: UserContext | null;
  };
}

interface StockAdjustmentRequestForm {
  store_id: string;
  product_id: string;
  adjustment_reason_id: string;
  quantity: number;
  notes: string;
  _method?: 'PUT';
  // Allow dynamic keys for view mode mapping
  [key: string]: any;
}

interface StockAdjustmentRequestPagination {
  data: StockAdjustmentRequest[];
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

interface LookupData {
  stores: Array<{ id: number; name: string }>;
  products: Array<{ id: number; name: string; sku: string }>;
  adjustmentReasons: Array<{ id: number; name: string }>;
  productStocksArray: Record<string, Record<string, number>>;
}

interface IndexProps {
  requests: StockAdjustmentRequestPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
  lookupData: LookupData;
  [key: string]: any;
}

export default function Index({ requests, filters, totalCount, filteredCount, lookupData }: IndexProps) {
  const { inventoryConfig } = usePage<PagePropsWithConfig>().props;
  const currentUserContext = inventoryConfig?.userContext || null;
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
  const flashMessage = flash?.success || flash?.error;

  const defaultStoreId = currentUserContext && !currentUserContext.is_global_user
    ? String(currentUserContext.store_id)
    : '';

  const initialRequestData: StockAdjustmentRequestForm = {
    store_id: defaultStoreId,
    product_id: '',
    adjustment_reason_id: '',
    quantity: 0,
    notes: '',
    current_stock_display: '---',
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedRequest, setSelectedRequest] = useState<StockAdjustmentRequest | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<StockAdjustmentRequest | null>(null);

  const { data, setData, reset, errors, processing, post, put } = useForm<StockAdjustmentRequestForm>(initialRequestData);

  const { data: filtersForm, setData: setFilterData } = useForm({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  const handleSetData = (key: string, value: any) => {
    // 1. Update the field being changed (standard behavior)
    setData((previousData) => {
      const newData = { ...previousData, [key]: value };

      // 2. LOGIC: If Store or Product changed, look up the stock
      if (key === 'store_id' || key === 'product_id') {
        // Get the IDs from the *new* state we are building
        const storeId = key === 'store_id' ? value : newData.store_id;
        const productId = key === 'product_id' ? value : newData.product_id;

        if (storeId && productId) {
          // Access the lookup array passed from the Controller
          // Structure: [productId][storeId] => quantity
          const stock = lookupData.productStocksArray?.[productId]?.[storeId] ?? 0;

          // Update the display field
          newData.current_stock_display = String(stock);
        } else {
          newData.current_stock_display = '---';
        }
      }

      return newData;
    });
  };

  useEffect(() => {
    if (flashMessage) {
      // Handled by CustomToast
    }
  }, [flashMessage]);

  const handleOpenEditViewModal = (m: 'view' | 'edit', request: StockAdjustmentRequest) => {
    setMode(m);
    setSelectedRequest(request);

    // 🟢 FIX: Explicitly map the nested fields to flat keys so the Form Config can find them
    setData({
      // 1. Standard Editable Fields
      store_id: String(request.store.id),
      product_id: String(request.product.id),
      adjustment_reason_id: String(request.reason.id),
      quantity: request.type === 'out' ? -request.quantity : request.quantity,
      notes: request.notes || '',
      _method: 'PUT',

      // 2. View-Only Audit Fields (Explicitly Mapped)
      'requester.name': request.requester?.name || 'N/A',
      'created_at': request.requested_at, // Mapping requested_at to created_at
      'status': request.status,
      'approver.name': request.approver?.name || '-',
      'approved_at': request.approved_at || '-',
      'type': request.type,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setMode('create');
    setSelectedRequest(null);
    reset();
    setModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.product_id || !data.store_id || !data.adjustment_reason_id || data.quantity === 0) {
      return toast.error('Please fill all required fields and ensure quantity is not zero.');
    }

    if (mode === 'edit' && selectedRequest) {
      put(route('stock-adjustment-requests.update', selectedRequest.id), {
        onSuccess: () => {
          toast.success('Adjustment request updated');
          closeModal();
        },
        onError: () => toast.error('Failed to update request'),
      });
    } else {
      post(route('stock-adjustment-requests.store'), {
        forceFormData: true,
        onSuccess: () => {
          toast.success('Adjustment request saved as draft');
          closeModal();
        },
        onError: () => toast.error('Failed to create request'),
      });
    }
  };

  const handleCustomAction = (label: string, request: StockAdjustmentRequest) => {
    switch (label) {
      case 'Submit for Approval':
        router.post(route('stock-adjustment-requests.submit', request.id), {}, {
          onSuccess: () => {
            toast.success('Request submitted for approval');
            router.reload({ preserveState: true });
          },
          onError: (e: any) => toast.error(e.message || 'Failed to submit for approval'),
        });
        break;

      case 'Approve':
        router.post(route('stock-adjustment-requests.approve', request.id), {}, {
          onSuccess: () => {
            toast.success('Adjustment approved and stock updated');
            router.reload({ preserveState: true });
          },
          onError: (e: any) => toast.error(e.message || 'Failed to approve adjustment'),
        });
        break;

      case 'Reject':
        router.post(route('stock-adjustment-requests.reject', request.id), {}, {
          onSuccess: () => {
            toast.success('Adjustment request rejected');
            router.reload({ preserveState: true });
          },
          onError: (e: any) => toast.error(e.message || 'Failed to reject request'),
        });
        break;

      default:
        toast.error(`Action "${label}" not configured.`);
    }
  };

  const handleDelete = (request: StockAdjustmentRequest) => {
    if (request.status !== 'draft') {
      return toast.error('Only draft requests can be deleted.');
    }
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!requestToDelete) return;
    router.delete(route('stock-adjustment-requests.destroy', requestToDelete.id), {
      onSuccess: () => {
        toast.success('Adjustment request deleted');
        setShowDeleteModal(false);
        setRequestToDelete(null);
      },
      onError: () => toast.error('Failed to delete request'),
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterData('search', value);
    const query = {
      ...(value && { search: value }),
      ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
    };
    router.get(route('stock-adjustment-requests.index'), query, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    router.get(route('stock-adjustment-requests.index'), {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePerPageChange = (value: string) => {
    setFilterData('perPage', value);
    const query = {
      ...(filtersForm.search && { search: filtersForm.search }),
      ...(value && { perPage: value }),
    };
    router.get(route('stock-adjustment-requests.index'), query, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleDateFilterChange = (dateFrom: string | null, dateTo: string | null) => {
    setFilterData({ dateFrom, dateTo });
    const query = {
      ...(filtersForm.search && { search: filtersForm.search }),
      ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    };
    router.get(route('stock-adjustment-requests.index'), query, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleExportPDF = (request: StockAdjustmentRequest) => {
    window.open(route('stock-adjustment-requests.export.pdf.single', request.id), '_blank');
  };

  const handleExportExcel = (request: StockAdjustmentRequest) => {
    window.open(route('stock-adjustment-requests.export.excel.single', request.id), '_blank');
  };

  const handleBulkExportPDF = (ids: number[]) => {
    if (!ids.length) return toast.error('No requests selected');
    window.open(route('stock-adjustment-requests.bulk-export.pdf', { ids: ids.join(',') }), '_blank');
  };

  const handleBulkExportExcel = (ids: number[]) => {
    if (!ids.length) return toast.error('No requests selected');
    window.open(route('stock-adjustment-requests.bulk-export.excel', { ids: ids.join(',') }), '_blank');
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Stock Adjustment Requests" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
          <ClipboardListIcon size={26} className="text-orange-600 mr-1" />
          Stock Adjustment Requests
        </h2>
        <p className="text-sm text-gray-600">
          Request inventory adjustments. Drafts can be edited until submitted for approval.
        </p>

        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
          <Input
            type="text"
            value={filtersForm.search}
            onChange={handleSearchChange}
            className="h-10 w-full sm:w-1/2"
            placeholder="Search by product, store, or status..."
            name="search"
          />

          <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
            <X size={20} />
          </Button>

          <div className="ml-auto">
            <ComplexModalForm
              key={selectedRequest ? `request-edit-${selectedRequest.id}` : 'request-create'}
              title={
                mode === 'view'
                  ? 'View Adjustment Request'
                  : mode === 'edit'
                  ? 'Edit Adjustment Request'
                  : StockAdjustmentRequestFormConfig.title
              }
              description={StockAdjustmentRequestFormConfig.description}
              fields={StockAdjustmentRequestFormConfig.fields}
              buttons={StockAdjustmentRequestFormConfig.buttons}
              data={data}
              setData={handleSetData}
              processing={processing}
              handleSubmit={handleSubmit}
              errors={errors}
              open={modalOpen}
              onOpenChange={(open: boolean) => {
                if (open && mode !== 'edit' && mode !== 'view') {
                  setMode('create');
                  reset();
                }
                if (!open) closeModal();
                else setModalOpen(open);
              }}
              mode={mode}
              extraData={lookupData}
              currentUserContext={currentUserContext}
              addButton={StockAdjustmentRequestFormConfig.addButton}
            />
          </div>
        </div>

        <ComplexTable
          moduleName={StockAdjustmentRequestsTableConfig.moduleName}
          columns={StockAdjustmentRequestsTableConfig.columns}
          actions={StockAdjustmentRequestsTableConfig.actions}
          data={requests.data}
          from={requests.from}
          onView={(r: any) => handleOpenEditViewModal('view', r)}
          onEdit={(r: any) => handleOpenEditViewModal('edit', r)}
          onDelete={handleDelete}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          onCustomAction={handleCustomAction}
          isModal
          onDateFilterChange={handleDateFilterChange}
          onBulkExportPDF={handleBulkExportPDF}
          onBulkExportExcel={handleBulkExportExcel}
        />

        {requests.data && requests.data.length > 0 && (
          <Pagination
            products={requests}
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
              Are you sure you want to delete adjustment request{' '}
              <span className="font-semibold text-gray-800">#{requestToDelete?.id}</span>?
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
