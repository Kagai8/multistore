/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState, useCallback } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// 🟢 Config Imports
import { QuotationTableConfig } from '@/components/config/tables/quotation-table';
import { QuotationFormConfig } from '@/components/config/forms/quotation-modal-form';
import { InvoiceItemEditor } from '@/components/InvoiceItemEditor';

// Components
import FinanceModalForm from '@/components/finance-modal-form';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// 🟢 ADDED ICONS: CheckCircle (for Accepted)
import { X, FileText, ArrowRightCircle, FileEdit, Percent, CheckCircle } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import { SuccessModal } from '@/components/success-modal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sales', href: '/sales' },
    { title: 'Quotations', href: '/quotations' },
];

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface Quotation {
    id: number;
    quotation_number: string;
    quotation_date: string;
    valid_until: string | null;
    customer_id: number;
    customer_name: string;
    store_name: string;
    user_name: string;
    total_amount: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    notes: string | null;

    items: Array<{
        product_id: number;
        product_name: string;
        quantity: number;
        unit_price: number;
        sub_total: number;
        price_category: 'retail' | 'wholesale' | 'special' | 'manual';
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

interface QuotationForm {
    customer_id: string;
    quotation_date: string;
    valid_until: string;
    notes: string;
    items: Array<{
        product_id: number | string;
        quantity: number;
        unit_price: number;
        price_category: string;
    }>;
    total_amount: number;
}

interface QuotationPagination {
    data: Quotation[];
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
interface QuoteStats {
    draft_count: number;
    accepted_value: number; // Matches Controller
    conversion_rate: number;
}

interface IndexProps {
    quotations: QuotationPagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
    lookupData: LookupData;
    stats: QuoteStats;
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

export default function Index({ quotations, filters, totalCount, filteredCount, lookupData, stats }: IndexProps) {
    const { inventoryConfig } = usePage<PagePropsWithConfig>().props;
    const currentUserContext = inventoryConfig?.userContext || null;
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const today = new Date().toISOString().split('T')[0];

    const initialFormData: QuotationForm = {
        customer_id: '',
        quotation_date: today,
        valid_until: '',
        notes: '',
        items: [],
        total_amount: 0,
    };

    // --- STATE ---
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

    // Modals
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successModalMessage, setSuccessModalMessage] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState<Quotation | null>(null);

    const [showConvertModal, setShowConvertModal] = useState(false);
    const [quoteToConvert, setQuoteToConvert] = useState<Quotation | null>(null);

    const form = useForm<QuotationForm>(initialFormData);

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
        form.setData(key as keyof QuotationForm, value);
    };

    const handleItemUpdate = useCallback((newItems: any[], newGrandTotal: number) => {
        form.setData((previousData) => ({
            ...previousData,
            items: newItems,
            total_amount: newGrandTotal,
        }));
    }, [form]);

    const handleOpenEditViewModal = (m: 'view' | 'edit', quote: Quotation) => {
        setMode(m);
        setSelectedQuotation(quote);

        form.setData({
            customer_id: String(quote.customer_id),
            ['customer_name' as any]: quote.customer_name,
            quotation_date: quote.quotation_date,
            valid_until: quote.valid_until || '',
            notes: quote.notes || '',
            items: quote.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                price_category: item.price_category
            })),
            total_amount: quote.total_amount,
            ['user_name' as any]: quote.user_name,
            ['store_name' as any]: quote.store_name,
            ['status' as any]: quote.status,
            ['quotation_number' as any]: quote.quotation_number,
        });

        setModalOpen(true);
    };

    const closeModal = () => {
        setMode('create');
        setSelectedQuotation(null);
        form.reset();
        setModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.data.items.length === 0) return toast.error("Quotation must contain at least one item.");

        if (mode === "edit" && selectedQuotation) {
            form.put(route("quotations.update", selectedQuotation.id), {
                onSuccess: () => closeModal(),
                onError: (errors) => toast.error("Failed to update Quotation"),
            });
        } else {
            form.post(route("quotations.store"), {
                forceFormData: true,
                onSuccess: () => closeModal(),
                onError: (errors) => toast.error("Failed to create Quotation"),
            });
        }
    };

    const handleCustomAction = (label: string, quote: Quotation) => {
        const cleanLabel = label.trim();
        switch (cleanLabel) {
            case 'Convert to Invoice':
                setQuoteToConvert(quote);
                setShowConvertModal(true);
                break;
            case 'Mark Sent':
                router.post(route('quotations.mark-sent', quote.id), {}, {
                    onSuccess: () => router.reload({ preserveState: true }),
                    onError: (e: any) => toast.error(e.message || 'Failed.'),
                });
                break;
            case 'Reject':
                if (confirm('Are you sure you want to mark this quote as rejected?')) {
                    router.post(route('quotations.mark-rejected', quote.id), {}, {
                        onSuccess: () => router.reload({ preserveState: true }),
                        onError: (e: any) => toast.error(e.message || 'Failed.'),
                    });
                }
                break;
            case 'Export PDF':
                window.open(route('quotations.export.pdf', quote.id), '_blank');
                break;
            default:
                toast.error(`Action "${cleanLabel}" not configured.`);
        }
    };

    const confirmConvert = () => {
        if (!quoteToConvert) return;
        router.post(route('quotations.convert', quoteToConvert.id), {}, {
            onSuccess: () => {
                setShowConvertModal(false);
                setQuoteToConvert(null);
            },
            onError: (e: any) => toast.error(e.message || 'Conversion failed.'),
        });
    };

    const handleDelete = (quote: Quotation) => {
        if (quote.status === 'accepted') {
            return toast.error('Accepted quotes cannot be deleted.');
        }
        setQuoteToDelete(quote);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!quoteToDelete) return;
        router.delete(route('quotations.destroy', quoteToDelete.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setQuoteToDelete(null);
            },
            onError: () => toast.error('Failed to delete quotation'),
        });
    };

    const handleExportPDF = (quote: Quotation) => window.open(route('quotations.export.pdf', quote.id), '_blank');
    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        const url = route('quotations.bulk-export.pdf', { ids: ids.join(',') });
        window.open(url, '_blank');
    };
    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        const url = route('quotations.bulk-export.excel', { ids: ids.join(',') });
        window.open(url, '_blank');
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        filterForm.setData('search', value);
        const query = {
            ...(value && { search: value }),
            ...(filterForm.data.perPage && { perPage: filterForm.data.perPage }),
        };
        router.get(route('quotations.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        filterForm.setData('search', '');
        filterForm.setData('perPage', '10');
        filterForm.setData('dateFrom', null);
        filterForm.setData('dateTo', null);
        router.get(route('quotations.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (value: string) => {
        filterForm.setData('perPage', value);
        const query = {
            ...(filterForm.data.search && { search: filterForm.data.search }),
            ...(value && { perPage: value }),
        };
        router.get(route('quotations.index'), query, { preserveState: true, preserveScroll: true });
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
        router.get(route('quotations.index'), query, { preserveState: true, preserveScroll: true });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Quotations" />
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
                    Quotation Hub
                </h2>

                {/* 🟢 DESCRIPTION MOVED HERE (Above Stats) */}
                <p className="text-sm text-gray-600 max-w-2xxl mb-2">
                    Create sales proposals and convert them to invoices.
                </p>

                {/* 🟢 STAT TABS GRID */}
                <div className="grid gap-4 md:grid-cols-3 mb-2">
                    <StatCard
                        title="Draft Proposals"
                        value={stats?.draft_count || 0}
                        icon={FileEdit}
                        colorClass="text-gray-600 bg-gray-100"
                        subText="Work in progress"
                    />
                    <StatCard
                        title="Revenue Won (Accepted)"
                        value={formatCurrency(stats?.accepted_value || 0)} // 🟢 FIXED: Using accepted_value
                        icon={CheckCircle}
                        colorClass="text-green-600 bg-green-100"
                        subText="Total value of accepted quotes"
                    />
                    <StatCard
                        title="Conversion Rate"
                        value={`${stats?.conversion_rate || 0}%`}
                        icon={Percent}
                        colorClass="text-blue-600 bg-blue-100"
                        subText="Quotes accepted vs total"
                    />
                </div>

                <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <Input
                        type="text"
                        value={filterForm.data.search}
                        onChange={handleSearchChange}
                        className="h-10 w-full sm:w-1/2"
                        placeholder="Search Quote # or Customer..."
                        name="search"
                    />
                    <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
                        <X size={20} />
                    </Button>
                    <div className="ml-auto">
                        <FinanceModalForm
                            key={selectedQuotation ? `quote-edit-${selectedQuotation.id}` : 'quote-create'}
                            title={mode === 'view' ? 'View Quotation' : mode === 'edit' ? 'Edit Draft Quotation' : QuotationFormConfig.title}
                            description={QuotationFormConfig.description}
                            fields={QuotationFormConfig.fields}
                            buttons={QuotationFormConfig.buttons}
                            data={form.data}
                            setData={handleSetData}
                            processing={form.processing}
                            handleSubmit={handleSubmit}
                            errors={form.errors}
                            open={modalOpen}
                            onOpenChange={(open: boolean) => {
                                if (open && mode !== 'edit' && mode !== 'view') {
                                    setMode('create');
                                    form.reset();
                                }
                                if (!open) closeModal();
                                else setModalOpen(open);
                            }}
                            mode={mode}
                            extraData={lookupData}
                            currentUserContext={currentUserContext}
                            addButton={QuotationFormConfig.addButton}
                            childrenPosition={0}
                        >
                            <div className="space-y-3 p-4 border rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold border-b pb-2 mb-3 text-orange-600 dark:text-orange-400">
                                    Quotation Items
                                </h3>
                                <InvoiceItemEditor
                                    data={form.data.items}
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

                <ComplexTable
                    moduleName={QuotationTableConfig.moduleName}
                    columns={QuotationTableConfig.columns}
                    actions={QuotationTableConfig.actions}
                    data={quotations.data}
                    from={quotations.from}
                    onView={(t: any) => handleOpenEditViewModal('view', t)}
                    onEdit={(t: any) => handleOpenEditViewModal('edit', t)}
                    onDelete={handleDelete}
                    onExportPDF={(t: any) => handleExportPDF(t)}
                    onCustomAction={handleCustomAction}
                    isModal
                    onDateFilterChange={handleDateFilterChange}
                    onBulkExportPDF={handleBulkExportPDF}
                    onBulkExportExcel={handleBulkExportExcel}
                />

                {quotations.data && quotations.data.length > 0 && (
                    <Pagination
                        products={quotations}
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
                            Are you sure you want to delete Quote{' '}
                            <span className="font-semibold text-gray-800">{quoteToDelete?.quotation_number}</span>?
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

            {/* CONVERT MODAL */}
            {showConvertModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md border-l-4 border-emerald-500">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                                <ArrowRightCircle size={24} />
                             </div>
                             <h2 className="text-lg font-semibold text-gray-800">Confirm Conversion</h2>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                            Convert Quote <span className="font-semibold text-gray-800">{quoteToConvert?.quotation_number}</span> to a Draft Invoice?
                        </p>
                        <ul className="mt-3 text-sm text-gray-500 list-disc list-inside space-y-1">
                            <li>A new Invoice will be created.</li>
                            <li>This Quote will be marked as <strong>Accepted</strong>.</li>
                            <li>You can then edit/post the invoice.</li>
                        </ul>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowConvertModal(false)}>
                                Cancel
                            </Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={confirmConvert}>
                                Yes, Convert
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
