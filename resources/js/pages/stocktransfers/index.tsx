/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState, useCallback } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

import { StockTransferTableConfig } from '@/components/config/tables/stocktransfer-table';
import { StockTransferFormConfig } from '@/components/config/forms/stocktransfer-modal-form';
import { StockTransferDeliveryFormConfig } from '@/components/config/forms/stock-transfer-delivery-modal-form';
import { TransferItemEditor } from './TransferItemEditor';

import ComplexModalForm from '@/components/complex-modal-form';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// 🟢 ADDED ICONS: Truck, Clock, CheckCircle
import { X, ArrowLeftRightIcon, Truck, Clock, CheckCircle } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory', href: '/inventory' },
  { title: 'Stock Transfers', href: '/stock-transfers' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface StockTransfer {
    id: number;
    reference: string;
    source_store: string;
    destination_store: string;
    source_store_id: number;
    destination_store_id: number;
    transfer_date: string;
    status: 'draft' | 'accepted' | 'sent' | 'received';
    approved_status: 'pending' | 'approved' | 'rejected';
    approved_by: string | null;
    approved_at: string | null;
    received_by: string | null;
    received_at: string | null;
    user_name: string;
    notes: string | null;
    created_at: string;
    delivery_type: string | null;
    assigned_to_user_name: string | null;
    carrier_name: string | null;
    contact_number: string | null;
    tracking_reference: string | null;
    delivery_time: string | null;
    items: Array<{
        product_id: number;
        quantity: number;
        product_name?: string;
        product_sku?: string;
    }>;
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

interface StockTransferForm {
    source_store_id: string;
    destination_store_id: string;
    transfer_date: string;
    reference: string;
    notes: string;
    items: Array<{ product_id: number; quantity: number }>;
}

interface StockTransferDeliveryForm {
    delivery_type: 'internal' | 'external';
    assigned_to_user_id: string;
    carrier_name: string;
    contact_number: string;
    tracking_reference: string;
    delivery_time: string;
}

interface StockTransferPagination {
    data: StockTransfer[];
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
    deliveryUsers: Array<{ id: number; name: string }>;
    deliveryTypes: Array<{ id: string; name: string }>;
    productStocksArray: Record<string, Record<string, number>>;
}

// 🟢 NEW: Stats Interface
interface TransferStats {
    pending_approval: number;
    in_transit: number;
    completed: number;
}

interface IndexProps {
    transfers: StockTransferPagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
    lookupData: LookupData;
    stats: TransferStats; // 🟢 Receive Stats
    [key: string]: any;
}

// 🟢 NEW: StatCard Component
const StatCard = ({ title, value, icon: Icon, colorClass, subText }: any) => (
    <div className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{title}</span>
            <div className={`rounded-full p-2 ${colorClass} bg-opacity-10`}>
                <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
            </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-gray-800">{value}</div>
        {subText && <span className="text-xs text-gray-400 mt-1">{subText}</span>}
    </div>
);

export default function Index({ transfers, filters, totalCount, filteredCount, lookupData, stats }: IndexProps) {
    const { inventoryConfig } = usePage<PagePropsWithConfig>().props;
    const currentUserContext = inventoryConfig?.userContext || null;
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const flashMessage = flash?.success || flash?.error;

    const defaultSourceStoreId = currentUserContext && !currentUserContext.is_global_user
        ? String(currentUserContext.store_id)
        : '';

    const initialTransferData: StockTransferForm = {
        source_store_id: defaultSourceStoreId,
        destination_store_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: '',
        items: [],
    };

    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
    const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

    const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
    const [transferToDeliver, setTransferToDeliver] = useState<StockTransfer | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [transferToDelete, setTransferToDelete] = useState<StockTransfer | null>(null);

    const transferForm = useForm<StockTransferForm>(initialTransferData);
    const deliveryForm = useForm<StockTransferDeliveryForm>({
        delivery_type: 'internal',
        assigned_to_user_id: '',
        carrier_name: '',
        contact_number: '',
        tracking_reference: '',
        delivery_time: '',
    });
    const filterForm = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
        dateFrom: filters.dateFrom || null,
        dateTo: filters.dateTo || null,
    });

    const handleSetData = (key: string, value: any) => {
        transferForm.setData(key, value);
    };

    const handleItemUpdate = useCallback((newItems: Array<{ product_id: number; quantity: number }>) => {
        transferForm.setData('items', newItems);
    }, [transferForm]);

    useEffect(() => {
        if (flashMessage) {
            const timer = setTimeout(() => {}, 0);
            return () => clearTimeout(timer);
        }
    }, [flashMessage]);

    const handleOpenEditViewModal = (m: 'view' | 'edit', transfer: StockTransfer) => {
        setMode(m);
        setSelectedTransfer(transfer);
        transferForm.setData({
            ...transfer,
            items: transfer.items,
        } as any);
        setModalOpen(true);
    };

    const closeModal = () => {
        setMode('create');
        setSelectedTransfer(null);
        transferForm.reset();
        setModalOpen(false);
    };

    const closeDeliveryModal = () => {
        setDeliveryModalOpen(false);
        setTransferToDeliver(null);
        deliveryForm.reset();
    };

    const checkStockAvailability = (): boolean => {
        const sourceStoreId = transferForm.data.source_store_id;
        if (!sourceStoreId) return true;

        const stockData = lookupData.productStocksArray;

        for (const item of transferForm.data.items) {
            const productId = String(item.product_id);
            const currentStock = stockData[productId]?.[sourceStoreId] ?? 0;

            if (currentStock <= 0) {
                const product = lookupData.products.find(p => String(p.id) === productId);
                const productName = product ? product.name : `Product #${productId}`;
                toast.error(`Cannot transfer item below 0! (${productName} has 0 stock)`);
                return false;
            }

            if (item.quantity > currentStock) {
                 const product = lookupData.products.find(p => String(p.id) === productId);
                 const productName = product ? product.name : `Product #${productId}`;
                 toast.error(`Insufficient stock for ${productName}. Available: ${currentStock}, Requested: ${item.quantity}`);
                 return false;
            }
        }
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (transferForm.data.items.length === 0) {
            return toast.error("Transfer must contain at least one item.");
        }
        if (transferForm.data.source_store_id === transferForm.data.destination_store_id) {
            return toast.error("Source and Destination stores cannot be the same.");
        }
        if (!checkStockAvailability()) {
            return;
        }

        if (mode === "edit" && selectedTransfer) {
            transferForm.put(route("stock-transfers.update", selectedTransfer.id), {
                onSuccess: () => {
                    toast.success("Stock Transfer updated");
                    closeModal();
                },
                onError: () => {
                    toast.error("Failed to update Stock Transfer");
                },
            });
        } else {
            transferForm.post(route("stock-transfers.store"), {
                forceFormData: true,
                onSuccess: () => {
                    toast.success("Stock Transfer created as draft");
                    closeModal();
                },
                onError: () => {
                    toast.error("Failed to create Stock Transfer");
                },
            });
        }
    };

    const handleSendTransfer = (transfer: StockTransfer) => {
        setTransferToDeliver(transfer);
        deliveryForm.setData({
            delivery_type: 'internal',
            assigned_to_user_id: '',
            carrier_name: '',
            contact_number: '',
            tracking_reference: '',
            delivery_time: '',
        });
        setDeliveryModalOpen(true);
    };

    const handleDeliverySubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (deliveryForm.data.delivery_type === 'internal' && !deliveryForm.data.assigned_to_user_id) {
            return toast.error('Please assign a delivery staff member.');
        }
        if (deliveryForm.data.delivery_type === 'external' && !deliveryForm.data.carrier_name) {
            return toast.error('Please enter carrier name.');
        }

        deliveryForm.post(route('stock-transfers.send', transferToDeliver!.id), {
            forceFormData: true,
            onSuccess: () => {
                toast.success(`Transfer ${transferToDeliver!.reference} sent successfully!`);
                closeDeliveryModal();
                router.reload({ preserveState: true });
            },
            onError: (errors) => {
                const errorMsg = errors?.message || 'Failed to send transfer. Check delivery details.';
                toast.error(errorMsg);
            },
        });
    };

    const handleCustomAction = (label: string, transfer: StockTransfer) => {
        switch (label) {
            case 'Submit for Review':
                router.post(route('stock-transfers.initiate', transfer.id), {}, {
                    onSuccess: () => {
                        toast.success(`Transfer ${transfer.reference} submitted for review (Status: INITIATED).`);
                        router.reload({ preserveState: true });
                    },
                    onError: (e: any) => toast.error(e.message || 'Failed to submit transfer for review. Check permissions/status.'),
                });
                break;
            case 'Send Transfer': handleSendTransfer(transfer); break;
            case 'Approve Transfer':
                router.post(route('stock-transfers.approve', transfer.id), {}, {
                    onSuccess: () => {
                        toast.success(`Transfer ${transfer.reference} approved!`);
                        router.reload({ preserveState: true });
                    },
                    onError: (e: any) => toast.error(e.message || 'Failed to approve transfer. Check permissions/status.'),
                });
                break;
            case 'Reject Transfer':
                router.post(route('stock-transfers.reject', transfer.id), {}, {
                    onSuccess: () => {
                        toast.success(`Transfer ${transfer.reference} rejected and moved to Draft!`);
                        router.reload({ preserveState: true });
                    },
                    onError: (e: any) => toast.error(e.message || 'Failed to reject transfer. Check permissions/status.'),
                });
                break;
            case 'Receive Transfer':
                router.post(route('stock-transfers.receive', transfer.id), {}, {
                    onSuccess: () => {
                        toast.success(`Transfer ${transfer.reference} received and stock updated!`);
                        router.reload({ preserveState: true });
                    },
                    onError: (e: any) => toast.error(e.message || 'Failed to receive transfer. Check approval/status.'),
                });
                break;
            default: toast.error(`Action "${label}" not configured.`);
        }
    };

    const handleDelete = (transfer: StockTransfer) => {
        if (transfer.status !== 'draft') {
            return toast.error('Only Draft transfers can be deleted.');
        }
        setTransferToDelete(transfer);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!transferToDelete) return;
        router.delete(route('stock-transfers.destroy', transferToDelete.id), {
            onSuccess: (resp: any) => {
                const msg = resp?.props?.flash?.success || 'Transfer deleted successfully';
                toast.success(msg);
                setShowDeleteModal(false);
                setTransferToDelete(null);
            },
            onError: () => toast.error('Failed to delete transfer'),
        });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        filterForm.setData('search', value);
        const query = {
            ...(value && { search: value }),
            ...(filterForm.data.perPage && { perPage: filterForm.data.perPage }),
        };
        router.get(route('stock-transfers.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        filterForm.setData('search', '');
        filterForm.setData('perPage', '10');
        filterForm.setData('dateFrom', null);
        filterForm.setData('dateTo', null);
        router.get(route('stock-transfers.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (value: string) => {
        filterForm.setData('perPage', value);
        const query = {
            ...(filterForm.data.search && { search: filterForm.data.search }),
            ...(value && { perPage: value }),
        };
        router.get(route('stock-transfers.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleDateFilterChange = (dateFrom: string | null, dateTo: string | null) => {
        filterForm.setData('dateFrom', dateFrom);
        filterForm.setData('dateTo', dateTo);

        const query = {
            ...(filterForm.data.search && { search: filterForm.data.search }),
            ...(filterForm.data.perPage && { perPage: filterForm.data.perPage }),
            ...(dateFrom && { dateFrom: dateFrom }),
            ...(dateTo && { dateTo: dateTo }),
        };
        router.get(route('stock-transfers.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleExportPDF = (transfer: StockTransfer) => {
        window.open(route('stock-transfers.export.pdf.single', transfer.id), '_blank');
    };

    const handleExportExcel = (transfer: StockTransfer) => {
        window.open(route('stock-transfers.export.excel.single', transfer.id), '_blank');
    };

    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No stock records selected');
        const url = route('stock-transfers.bulk-export.pdf', { ids: ids.join(',') });
        window.open(url, '_blank');
    };

    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No stock records selected');
        const url = route('stock-transfers.bulk-export.excel', { ids: ids.join(',') });
        window.open(url, '_blank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Transfers" />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                    <ArrowLeftRightIcon size={26} className="text-orange-600 mr-1" />
                    Stock Transfer Hub
                </h2>

                {/* 🟢 STAT TABS GRID - Dashboard Style */}
                <div className="grid gap-4 md:grid-cols-3 mb-2">
                    <StatCard
                        title="Pending Approval"
                        value={stats?.pending_approval || 0}
                        icon={Clock}
                        colorClass="text-orange-600 bg-orange-100"
                        subText="Awaiting authorization"
                    />
                    <StatCard
                        title="In Transit"
                        value={stats?.in_transit || 0}
                        icon={Truck}
                        colorClass="text-blue-600 bg-blue-100"
                        subText="Dispatched to destination"
                    />
                    <StatCard
                        title="Completed"
                        value={stats?.completed || 0}
                        icon={CheckCircle}
                        colorClass="text-green-600 bg-green-100"
                        subText="Successfully received"
                    />
                </div>

                <p className="text-sm text-gray-600 max-w-2xxl">
                    Here you can request for stock transfers. Use the controls below to filter and get accurate reports.
                </p>
                <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <Input
                        type="text"
                        value={filterForm.data.search}
                        onChange={handleSearchChange}
                        className="h-10 w-full sm:w-1/2"
                        placeholder="Search Transfer by reference, store, or status..."
                        name="search"
                    />
                    <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
                        <X size={20} />
                    </Button>
                    <div className="ml-auto">
                        <ComplexModalForm
                            key={selectedTransfer ? `transfer-edit-${selectedTransfer.id}` : 'transfer-create'}
                            title={
                                mode === 'view'
                                    ? 'View Stock Transfer'
                                    : mode === 'edit'
                                    ? 'Update Stock Transfer'
                                    : StockTransferFormConfig.title
                            }
                            description={StockTransferFormConfig.description}
                            fields={StockTransferFormConfig.fields}
                            buttons={StockTransferFormConfig.buttons}
                            data={transferForm.data}
                            setData={handleSetData}
                            processing={transferForm.processing}
                            handleSubmit={handleSubmit}
                            errors={transferForm.errors}
                            open={modalOpen}
                            onOpenChange={(open: boolean) => {
                                if (open && mode !== 'edit' && mode !== 'view') {
                                    setMode('create');
                                    transferForm.reset();
                                }
                                if (!open) closeModal();
                                else setModalOpen(open);
                            }}
                            mode={mode}
                            extraData={lookupData}
                            currentUserContext={currentUserContext}
                            addButton={StockTransferFormConfig.addButton}
                        >
                            <div className="space-y-3 p-4 border rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold border-b pb-2 mb-3 text-orange-600 dark:text-orange-400">
                                    Transfer Line Items
                                </h3>
                                <TransferItemEditor
                                    data={transferForm.data.items}
                                    onUpdate={handleItemUpdate}
                                    products={lookupData.products}
                                    sourceStoreId={transferForm.data.source_store_id}
                                    mode={mode}
                                    productStocks={lookupData.productStocksArray}
                                />
                            </div>
                        </ComplexModalForm>
                    </div>
                </div>

                <ComplexModalForm
                    key={transferToDeliver?.id || 'delivery-modal'}
                    title="Confirm Dispatch & Add Delivery Info"
                    description="Provide delivery details before dispatching this transfer."
                    fields={StockTransferDeliveryFormConfig.fields}
                    buttons={StockTransferDeliveryFormConfig.buttons}
                    data={deliveryForm.data}
                    setData={(key, value) => {
                                deliveryForm.setData((prev) => ({
                                    ...prev,
                                    [key]: value,
                                }));
                            }}
                    processing={deliveryForm.processing}
                    handleSubmit={handleDeliverySubmit}
                    errors={deliveryForm.errors}
                    open={deliveryModalOpen}
                    onOpenChange={setDeliveryModalOpen}
                    mode="create"
                    extraData={lookupData}
                    currentUserContext={currentUserContext}
                />

                <ComplexTable
                    moduleName={StockTransferTableConfig.moduleName}
                    columns={StockTransferTableConfig.columns}
                    actions={StockTransferTableConfig.actions}
                    data={transfers.data}
                    from={transfers.from}
                    onView={(t: any) => handleOpenEditViewModal('view', t)}
                    onEdit={(t: any) => handleOpenEditViewModal('edit', t)}
                    onDelete={handleDelete}
                    onExportPDF={(t: any) => handleExportPDF(t)}
                    onExportExcel={(t: any) => handleExportExcel(t)}
                    onCustomAction={handleCustomAction}
                    isModal
                    onDateFilterChange={handleDateFilterChange}
                    onBulkExportPDF={handleBulkExportPDF}
                    onBulkExportExcel={handleBulkExportExcel}
                />

                {transfers.data && transfers.data.length > 0 && (
                    <Pagination
                        products={transfers}
                        perPage={filterForm.data.perPage}
                        onPerPageChange={handlePerPageChange}
                        totalCount={totalCount}
                        filteredCount={filteredCount}
                        search={filterForm.data.search}
                    />
                )}
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
                        <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to delete Transfer{' '}
                            <span className="font-semibold text-gray-800">{transferToDelete?.reference}</span>?
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
