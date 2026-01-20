/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState, useCallback } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// Configs
import { PurchaseOrderTableConfig } from '@/components/config/tables/purchase-order-table';
import { PurchaseOrderFormConfig } from '@/components/config/forms/purchase-order-modal-form';

// Components
import { PurchaseOrderItemEditor } from './PurchaseOrderItemEditor';
import ComplexModalForm from '@/components/complex-modal-form';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/ui/pagination';
import { X, ShoppingCart, Truck, CheckCircle, FileText, AlertTriangle } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory', href: '/inventory' },
  { title: 'Procurement', href: '/purchase-orders' },
];

interface Stats {
    draft_count: number;
    pending_value: number;
    received_count: number;
}

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

export default function PurchaseOrderIndex({ purchaseOrders, filters, totalCount, filteredCount, stats, lookupData }: any) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    // --- State ---
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
    const [selectedPO, setSelectedPO] = useState<any>(null);

    // 🟢 Modals State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [poToDelete, setPoToDelete] = useState<any>(null);
    const [showCancelModal, setShowCancelModal] = useState(false); // New State
    const [poToCancel, setPoToCancel] = useState<any>(null);     // New State

    // --- Forms ---
    const poForm = useForm({
        supplier_id: '',
        store_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        notes: '',
        items: [] as any[],
        po_number: '',
        created_by: '',
        approved_by: '',
        received_by: '',
    });

    const filterForm = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
        dateFrom: filters.dateFrom || null,
        dateTo: filters.dateTo || null,
    });

    // --- Effects ---
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // --- Handlers ---
    const handleSetData = (key: string, value: any) => {
        poForm.setData(key as any, value);
    };

    const handleItemUpdate = useCallback((newItems: any[]) => {
        poForm.setData('items', newItems);
    }, [poForm]);

    const handleOpenModal = (m: 'create' | 'view' | 'edit', po?: any) => {
        setMode(m);
        if (po) {
            setSelectedPO(po);
            poForm.setData({
                supplier_id: po.supplier_id || '',
                store_id: po.store_id || '',
                order_date: po.order_date,
                expected_delivery_date: po.expected_date === '-' ? '' : po.expected_date,
                notes: po.notes || '',
                items: po.items || [],
                po_number: po.po_number,
                created_by: po.created_by,
                approved_by: po.approved_by || '-',
                received_by: po.received_by || '-',
            } as any);
        } else {
            poForm.reset();
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setMode('create');
        setSelectedPO(null);
        poForm.reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (poForm.data.items.length === 0) {
            return toast.error("Please add at least one product.");
        }

        const options = {
            onSuccess: (page: any) => {
                const flashError = page.props.flash?.error;
                if (flashError) {
                    console.error("❌ Backend Error:", flashError);
                    return;
                }
                toast.success(mode === 'edit' ? 'PO Updated' : 'PO Created');
                closeModal();
            },
            onError: (errors: any) => {
                console.error("❌ Validation Error:", errors);
                const first = Object.values(errors)[0] as string;
                toast.error(first || "Validation failed");
            }
        };

        if (mode === 'edit' && selectedPO) {
            poForm.put(route('purchase-orders.update', selectedPO.id), options);
        } else {
            poForm.post(route('purchase-orders.store'), options);
        }
    };

    // --- Workflow Actions ---
    const handleCustomAction = (label: string, po: any) => {
        switch (label) {
            case 'Mark Ordered':
                router.post(route('purchase-orders.mark-ordered', po.id), {}, {
                    onSuccess: () => toast.success(`PO #${po.po_number} marked as Ordered`),
                });
                break;
            case 'Receive Goods':
                router.post(route('purchase-orders.receive', po.id), {}, {
                    onSuccess: () => toast.success(`Stock received for PO #${po.po_number}`),
                });
                break;
            case 'Cancel Order':
                // 🟢 FIX: Open Custom Modal instead of browser alert
                setPoToCancel(po);
                setShowCancelModal(true);
                break;
            case 'Export PDF':
                window.open(route('purchase-orders.export.pdf.single', po.id), '_blank');
                break;
            case 'Export Excel':
                window.open(route('purchase-orders.export.excel.single', po.id), '_blank');
                break;
            default:
                break;
        }
    };

    // --- Deletion Handlers ---
    const handleDelete = (po: any) => {
        setPoToDelete(po);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!poToDelete) return;
        router.delete(route('purchase-orders.destroy', poToDelete.id), {
            onSuccess: () => { toast.success('Draft PO Deleted'); setShowDeleteModal(false); },
            onError: () => toast.error('Failed to delete PO'),
        });
    };

    // 🟢 Cancellation Handler
    const confirmCancel = () => {
        if (!poToCancel) return;
        router.post(route('purchase-orders.cancel', poToCancel.id), {}, {
            onSuccess: () => {
                toast.success(`PO #${poToCancel.po_number} cancelled`);
                setShowCancelModal(false);
            },
            onError: () => toast.error('Failed to cancel PO'),
        });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        filterForm.setData('search', e.target.value);
    };

    const triggerSearch = () => {
        router.get(route('purchase-orders.index'), filterForm.data as any, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Orders" />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                    <ShoppingCart size={26} className="text-orange-600 mr-1" />
                    Procurement Hub
                </h2>

                <div className="grid gap-4 md:grid-cols-3 mb-2">
                    <StatCard title="Draft Requests" value={stats?.draft_count || 0} icon={FileText} colorClass="text-gray-600 bg-gray-100" subText="Working orders" />
                    <StatCard title="Pending Arrival (Value)" value={new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(stats?.pending_value || 0)} icon={Truck} colorClass="text-blue-600 bg-blue-100" subText="Stock currently on order" />
                    <StatCard title="Completed Orders" value={stats?.received_count || 0} icon={CheckCircle} colorClass="text-green-600 bg-green-100" subText="Total received" />
                </div>

                <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <div className="flex w-full sm:w-1/2 items-center gap-2">
                        <Input
                            placeholder="Search PO #, Supplier, or Store..."
                            value={filterForm.data.search}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
                            className="h-10 w-full"
                        />
                        <Button onClick={() => { filterForm.reset(); triggerSearch(); }} className="h-10 px-3 bg-orange-600">
                            <X size={20} />
                        </Button>
                    </div>

                    <ComplexModalForm
                        key={selectedPO ? `po-edit-${selectedPO.id}` : 'po-create'}
                        title={mode === 'create' ? 'Create Purchase Order' : mode === 'edit' ? 'Edit Purchase Order' : 'View Purchase Order'}
                        description="Manage your stock procurement."
                        fields={PurchaseOrderFormConfig.fields}
                        buttons={PurchaseOrderFormConfig.buttons}
                        data={poForm.data}
                        setData={handleSetData}
                        processing={poForm.processing}
                        handleSubmit={handleSubmit}
                        errors={poForm.errors}
                        open={modalOpen}
                        onOpenChange={(open) => {
                            if (open) {
                                setMode('create');
                                poForm.reset();
                                setModalOpen(true);
                            } else {
                                closeModal();
                            }
                        }}
                        mode={mode}
                        extraData={lookupData}
                        currentUserContext={null}
                        addButton={PurchaseOrderFormConfig.addButton}
                    >
                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Items</h3>
                            <PurchaseOrderItemEditor
                                data={poForm.data.items}
                                onUpdate={handleItemUpdate}
                                products={lookupData.products}
                                mode={mode}
                            />
                        </div>
                    </ComplexModalForm>
                </div>

                <ComplexTable
                    moduleName={PurchaseOrderTableConfig.moduleName}
                    columns={PurchaseOrderTableConfig.columns}
                    actions={PurchaseOrderTableConfig.actions}
                    data={purchaseOrders.data}
                    from={purchaseOrders.from}
                    onView={(row: any) => handleOpenModal('view', row)}
                    onEdit={(row: any) => handleOpenModal('edit', row)}
                    onDelete={handleDelete}
                    onCustomAction={handleCustomAction}
                    onExportPDF={(row: any) => window.open(route('purchase-orders.export.pdf.single', row.id))}
                    onExportExcel={(row: any) => window.open(route('purchase-orders.export.excel.single', row.id))}
                    onBulkExportPDF={(ids: number[]) => window.open(route('purchase-orders.bulk-export.pdf', { ids: ids.join(',') }))}
                    onBulkExportExcel={(ids: number[]) => window.open(route('purchase-orders.bulk-export.excel', { ids: ids.join(',') }))}
                />

                <Pagination
                    products={purchaseOrders}
                    perPage={filterForm.data.perPage}
                    onPerPageChange={(val) => { filterForm.setData('perPage', val); triggerSearch(); }}
                    totalCount={totalCount}
                    filteredCount={filteredCount}
                    search={filterForm.data.search}
                />
            </div>

            {/* 🟢 DELETE MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
                        <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to delete Draft PO <span className="font-bold">{poToDelete?.po_number}</span>?
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🟢 CANCEL ORDER MODAL (Replaces Browser Confirm) */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 text-red-600 mb-2">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Cancel Order?</h2>
                        </div>

                        <p className="mt-2 text-sm text-gray-600">
                            You are about to cancel Purchase Order <span className="font-bold text-gray-900">{poToCancel?.po_number}</span>.
                            <br/><br/>
                            This action cannot be undone if the order has already been processed by the supplier.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowCancelModal(false)}>Keep Order</Button>
                            <Button className="bg-red-600 hover:bg-red-700 text-white font-medium" onClick={confirmCancel}>
                                Yes, Cancel Order
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
