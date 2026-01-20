/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState, useCallback } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

import { InvoiceTableConfig } from '@/components/config/tables/invoice-table';
import { InvoiceFormConfig } from '@/components/config/forms/invoice-modal-form';
import { InvoiceItemEditor } from '@/components/InvoiceItemEditor';

import FinanceModalForm from '@/components/finance-modal-form';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// 🟢 ADDED ICONS: Wallet, AlertCircle, FileClock
import { X, FileText, AlertTriangle, RotateCcw, Wallet, AlertCircle, FileClock } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import { PaymentModal } from '@/components/payment-modal';
import { SuccessModal } from '@/components/success-modal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Invoices', href: '/invoices' },
];

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface Invoice {
    id: number;
    invoice_number: string;
    invoice_date: string;
    due_date: string | null;
    customer_id: number;
    customer_name: string;
    store_name: string;
    user_name: string;
    total_amount: number;
    paid_amount: number;
    balance_due: number;
    status: 'draft' | 'posted' | 'void' | 'refunded';
    payment_status: 'unpaid' | 'partial' | 'paid';
    payment_arrangement: 'full' | 'partial';
    notes: string | null;

    // Audit Fields
    voided_at?: string;
    void_reason?: string;
    voided_by_name?: string;
    refunded_at?: string;
    refunded_by_name?: string;

    items: Array<{
        product_id: number;
        product_name: string;
        quantity: number;
        unit_price: number;
        sub_total: number;
        price_category: 'retail' | 'wholesale' | 'special' | 'manual';
    }>;
    customer_credit_limit?: number;
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

interface InvoiceForm {
    is_walkin: boolean;
    customer_id: string;
    invoice_date: string;
    due_date: string;
    payment_arrangement: string;
    notes: string;
    items: Array<{
        product_id: number | string;
        quantity: number;
        unit_price: number;
        price_category: string;
    }>;
    total_amount: number;
    paid_amount: number;
    balance_due: number;
}

interface InvoicePagination {
    data: Invoice[];
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
    customers: Array<{ id: number; name: string }>;
    products: Array<{
        id: number;
        name: string;
        sku: string;
        retail_price: number;
        wholesale_price: number;
        special_price: number
    }>;
    productStocks: Record<string, Record<string, number>>;
}

// 🟢 Stats Interface
interface InvoiceStats {
    draft_count: number;
    outstanding: number;
    collected: number;
}

interface IndexProps {
    invoices: InvoicePagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
    lookupData: LookupData;
    stats: InvoiceStats; // 🟢 Receive Stats
    [key: string]: any;
}

// 🟢 StatCard Component
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

export default function Index({ invoices, filters, totalCount, filteredCount, lookupData, stats }: IndexProps) {
    const { inventoryConfig } = usePage<PagePropsWithConfig>().props;
    const currentUserContext = inventoryConfig?.userContext || null;

    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const today = new Date().toISOString().split('T')[0];

    const initialInvoiceData: InvoiceForm = {
        is_walkin: false,
        customer_id: '',
        invoice_date: today,
        due_date: '',
        payment_arrangement: 'full',
        notes: '',
        items: [],
        total_amount: 0,
        paid_amount: 0,
        balance_due: 0,
    };

    // --- STATE ---
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // Modals
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [invoiceForPayment, setInvoiceForPayment] = useState<Invoice | null>(null);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successModalMessage, setSuccessModalMessage] = useState('');

    const [showVoidModal, setShowVoidModal] = useState(false);
    const [invoiceToVoid, setInvoiceToVoid] = useState<Invoice | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

    const [showRefundModal, setShowRefundModal] = useState(false);
    const [invoiceToRefund, setInvoiceToRefund] = useState<Invoice | null>(null);

    const invoiceForm = useForm<InvoiceForm>(initialInvoiceData);

    const filterForm = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
        dateFrom: filters.dateFrom || null,
        dateTo: filters.dateTo || null,
    });

    useEffect(() => {
        if (flash?.success) {
            setSuccessModalMessage(flash.success);
            setShowSuccessModal(true);
        } else if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // --- HANDLERS ---
    const handleSetData = (key: string, value: any) => {
        invoiceForm.setData(key as keyof InvoiceForm, value);
    };

    const handleItemUpdate = useCallback((newItems: any[], newGrandTotal: number) => {
        invoiceForm.setData((previousData) => ({
            ...previousData,
            items: newItems,
            total_amount: newGrandTotal,
            balance_due: newGrandTotal,
            paid_amount: 0,
        }));
    }, [invoiceForm]);

    useEffect(() => {
        if (invoiceForm.data.is_walkin) {
            if (invoiceForm.data.payment_arrangement !== 'full') {
                handleSetData('payment_arrangement', 'full');
            }
            if (invoiceForm.data.customer_id) {
                handleSetData('customer_id', '');
            }
        }
    }, [invoiceForm.data.is_walkin]);

    const handleOpenEditViewModal = (m: 'view' | 'edit', invoice: Invoice) => {
        setMode(m);
        setSelectedInvoice(invoice);

        invoiceForm.setData({
            is_walkin: false,
            customer_id: String(invoice.customer_id),
            ['customer_name' as any]: invoice.customer_name,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date || '',
            payment_arrangement: invoice.payment_arrangement,
            notes: invoice.notes || '',
            items: invoice.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                price_category: item.price_category
            })),
            total_amount: invoice.total_amount,
            paid_amount: invoice.paid_amount,
            balance_due: invoice.balance_due,
            ['user_name' as any]: invoice.user_name,
            ['store_name' as any]: invoice.store_name,
            ['status' as any]: invoice.status,
            ['payment_status' as any]: invoice.payment_status,
            ['voided_at' as any]: (invoice as any).voided_at,
            ['voided_by_name' as any]: (invoice as any).voided_by_name,
            ['void_reason' as any]: (invoice as any).void_reason,
            ['refunded_at' as any]: (invoice as any).refunded_at,
            ['refunded_by_name' as any]: (invoice as any).refunded_by_name,
        });

        setModalOpen(true);
    };

    const closeModal = () => {
        setMode('create');
        setSelectedInvoice(null);
        invoiceForm.reset();
        setModalOpen(false);
    };

    const checkStockAvailability = (): boolean => {
        const currentStoreId = currentUserContext?.store_id;
        if (!currentStoreId) return true;
        const stockData = lookupData.productStocks;

        for (const item of invoiceForm.data.items) {
            const productId = String(item.product_id);
            const currentStock = stockData[productId]?.[String(currentStoreId)] ?? 0;

            if (currentStock < item.quantity) {
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
        if (invoiceForm.data.items.length === 0) return toast.error("Invoice must contain at least one item.");
        if (!checkStockAvailability()) return;

        if (mode === "edit" && selectedInvoice) {
            invoiceForm.put(route("invoices.update", selectedInvoice.id), {
                onSuccess: () => closeModal(),
                onError: (errors) => toast.error("Failed to update Invoice"),
            });
        } else {
            invoiceForm.post(route("invoices.store"), {
                forceFormData: true,
                onSuccess: () => closeModal(),
                onError: (errors) => toast.error("Failed to create Invoice"),
            });
        }
    };

    const handleCustomAction = (label: string, invoice: Invoice) => {
        const cleanLabel = label.trim();
        switch (cleanLabel) {
            case 'Post Invoice':
                router.post(route('invoices.post', invoice.id), {}, {
                    onSuccess: () => router.reload({ preserveState: true }),
                    onError: (e: any) => toast.error(e.message || 'Failed to post invoice.'),
                });
                break;
            case 'Void':
                setInvoiceToVoid(invoice);
                setShowVoidModal(true);
                break;
            case 'Add Payment':
                setInvoiceForPayment(invoice);
                setShowPaymentModal(true);
                break;
            case 'Refund':
                setInvoiceToRefund(invoice);
                setShowRefundModal(true);
                break;
            case 'Print Receipt':
                window.open(route('invoices.print-receipt', invoice.id), '_blank');
                break;
            default:
                toast.error(`Action "${cleanLabel}" not configured.`);
        }
    };

    const confirmVoid = () => {
        if (!invoiceToVoid) return;
        router.post(route('invoices.void', invoiceToVoid.id), {}, {
            onSuccess: () => {
                setShowVoidModal(false);
                setInvoiceToVoid(null);
                router.reload({ preserveState: true });
            },
            onError: (e: any) => toast.error(e.message || 'Failed to void invoice.'),
        });
    };

    const confirmRefund = () => {
        if (!invoiceToRefund) return;
        router.post(route('invoices.refund', invoiceToRefund.id), {}, {
            onSuccess: () => {
                setShowRefundModal(false);
                setInvoiceToRefund(null);
                router.reload({ preserveState: true });
            },
            onError: (e: any) => toast.error(e.message || 'Failed to refund invoice.'),
        });
    };

    const handleDelete = (invoice: Invoice) => {
        if (invoice.status !== 'draft') {
            return toast.error('Only Draft invoices can be deleted.');
        }
        setInvoiceToDelete(invoice);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!invoiceToDelete) return;
        router.delete(route('invoices.destroy', invoiceToDelete.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setInvoiceToDelete(null);
            },
            onError: () => toast.error('Failed to delete invoice'),
        });
    };

    const handleExportPDF = (invoice: Invoice) => window.open(route('invoices.export.pdf.single', invoice.id), '_blank');
    const handleExportExcel = (invoice: Invoice) => window.open(route('invoices.export.excel.single', invoice.id), '_blank');
    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No invoices selected');
        const url = route('invoices.bulk-export.pdf', { ids: ids.join(',') });
        window.open(url, '_blank');
    };
    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No invoices selected');
        const url = route('invoices.bulk-export.excel', { ids: ids.join(',') });
        window.open(url, '_blank');
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        filterForm.setData('search', value);
        const query = {
            ...(value && { search: value }),
            ...(filterForm.data.perPage && { perPage: filterForm.data.perPage }),
        };
        router.get(route('invoices.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        filterForm.setData('search', '');
        filterForm.setData('perPage', '10');
        filterForm.setData('dateFrom', null);
        filterForm.setData('dateTo', null);
        router.get(route('invoices.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (value: string) => {
        filterForm.setData('perPage', value);
        const query = {
            ...(filterForm.data.search && { search: filterForm.data.search }),
            ...(value && { perPage: value }),
        };
        router.get(route('invoices.index'), query, { preserveState: true, preserveScroll: true });
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
        router.get(route('invoices.index'), query, { preserveState: true, preserveScroll: true });
    };

    const extraDataForForm = {
        ...lookupData,
        payment_arrangements: [
            { id: 'full', name: 'Full Payment' },
            { id: 'partial', name: 'Partial Payment' },
        ]
    };

    // 🟢 Currency Helper
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices" />
            <CustomToast />

            <SuccessModal
                key={successModalMessage}
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                message={successModalMessage}
                title="Success"
            />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                    <FileText size={26} className="text-orange-600 mr-1" />
                    Invoice Hub
                </h2>

                {/* 🟢 DESCRIPTION */}
                <p className="text-sm text-gray-600 max-w-2xxl mb-2">
                    Create, manage, and finalize sales invoices.
                </p>

                {/* 🟢 STAT TABS GRID */}
                <div className="grid gap-4 md:grid-cols-3 mb-2">
                    <StatCard
                        title="Draft Invoices"
                        value={stats?.draft_count || 0}
                        icon={FileClock}
                        colorClass="text-gray-600 bg-gray-100"
                        subText="Not yet posted"
                    />
                    <StatCard
                        title="Outstanding Balance"
                        value={formatCurrency(stats?.outstanding || 0)}
                        icon={AlertCircle}
                        colorClass="text-red-600 bg-red-100"
                        subText="Total owed to you"
                    />
                    <StatCard
                        title="Total Collected"
                        value={formatCurrency(stats?.collected || 0)}
                        icon={Wallet}
                        colorClass="text-green-600 bg-green-100"
                        subText="Cash received (Revenue)"
                    />
                </div>

                <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <Input
                        type="text"
                        value={filterForm.data.search}
                        onChange={handleSearchChange}
                        className="h-10 w-full sm:w-1/2"
                        placeholder="Search Invoice #, Customer, or Status..."
                        name="search"
                    />
                    <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
                        <X size={20} />
                    </Button>
                    <div className="ml-auto">
                        <FinanceModalForm
                            key={selectedInvoice ? `invoice-edit-${selectedInvoice.id}` : 'invoice-create'}
                            title={mode === 'view' ? 'View Invoice' : mode === 'edit' ? 'Edit Draft Invoice' : InvoiceFormConfig.title}
                            description={InvoiceFormConfig.description}
                            fields={InvoiceFormConfig.fields}
                            buttons={InvoiceFormConfig.buttons}
                            data={invoiceForm.data}
                            setData={handleSetData}
                            processing={invoiceForm.processing}
                            handleSubmit={handleSubmit}
                            errors={invoiceForm.errors}
                            open={modalOpen}
                            onOpenChange={(open: boolean) => {
                                if (open && mode !== 'edit' && mode !== 'view') {
                                    setMode('create');
                                    invoiceForm.reset();
                                }
                                if (!open) closeModal();
                                else setModalOpen(open);
                            }}
                            mode={mode}
                            extraData={extraDataForForm}
                            currentUserContext={currentUserContext}
                            addButton={InvoiceFormConfig.addButton}
                            childrenPosition={0}
                        >
                            <div className="space-y-3 p-4 border rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold border-b pb-2 mb-3 text-orange-600 dark:text-orange-400">
                                    Invoice Items
                                </h3>
                                <InvoiceItemEditor
                                    data={invoiceForm.data.items}
                                    onUpdate={handleItemUpdate}
                                    products={lookupData.products}
                                    currentStoreId={currentUserContext?.store_id || null}
                                    mode={mode}
                                    productStocks={lookupData.productStocks}
                                />
                            </div>
                        </FinanceModalForm>
                    </div>
                </div>

                <PaymentModal
                    isOpen={showPaymentModal}
                    invoice={invoiceForPayment}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setInvoiceForPayment(null);
                    }}
                />

                <ComplexTable
                    moduleName={InvoiceTableConfig.moduleName}
                    columns={InvoiceTableConfig.columns}
                    actions={InvoiceTableConfig.actions}
                    data={invoices.data}
                    from={invoices.from}
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

                {invoices.data && invoices.data.length > 0 && (
                    <Pagination
                        products={invoices}
                        perPage={filterForm.data.perPage}
                        onPerPageChange={handlePerPageChange}
                        totalCount={totalCount}
                        filteredCount={filteredCount}
                        search={filterForm.data.search}
                    />
                )}
            </div>

            {/* DELETE MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
                        <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to delete Invoice{' '}
                            <span className="font-semibold text-gray-800">{invoiceToDelete?.invoice_number}</span>?
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

            {/* VOID MODAL */}
            {showVoidModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md border-l-4 border-orange-500">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                                <AlertTriangle size={24} />
                             </div>
                             <h2 className="text-lg font-semibold text-gray-800">Confirm Void</h2>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to <span className="font-bold text-red-600">VOID</span> Invoice{' '}
                            <span className="font-semibold text-gray-800">{invoiceToVoid?.invoice_number}</span>?
                        </p>
                        <ul className="mt-3 text-sm text-gray-500 list-disc list-inside space-y-1">
                            <li>Stock will be returned to inventory.</li>
                            <li>Sales ledger will be cancelled.</li>
                            <li>This action cannot be undone.</li>
                        </ul>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowVoidModal(false)}>
                                Cancel
                            </Button>
                            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={confirmVoid}>
                                Confirm Void
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* REFUND MODAL */}
            {showRefundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md border-l-4 border-purple-500">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                                <RotateCcw size={24} />
                             </div>
                             <h2 className="text-lg font-semibold text-gray-800">Confirm Refund</h2>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                            Process full refund for <span className="font-semibold text-gray-800">{invoiceToRefund?.invoice_number}</span>?
                        </p>
                        <div className="bg-yellow-50 p-3 rounded mt-3 text-xs text-yellow-800 border border-yellow-200">
                            <strong>Note:</strong> This will return stock, create a "Refund" transaction in the ledger, and mark the invoice as Refunded.
                            You should physically return cash/M-Pesa to the customer.
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowRefundModal(false)}>
                                Cancel
                            </Button>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={confirmRefund}>
                                Process Refund
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
