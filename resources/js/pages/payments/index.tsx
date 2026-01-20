/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

import { PaymentTableConfig } from '@/components/config/tables/payment-table';
import { PaymentFormConfig } from '@/components/config/forms/payment-modal-form';

import FinanceModalForm from '@/components/finance-modal-form';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Wallet, Banknote, Smartphone } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Payments', href: '/payments' },
];

interface Payment {
    id: number;
    transaction_ref: string;
    payment_date: string;
    amount: number;
    method: string;
    status: string;
    customer_name: string;
    store_name: string;
    user_name: string;
    payable_type_label: string;
}

interface PaymentStats {
    total_collected: number;
    mpesa_total: number;
    cash_total: number;
}

interface IndexProps {
    payments: { data: Payment[]; links: any[]; from: number; to: number; total: number };
    filters: any;
    totalCount: number;
    filteredCount: number;
    stats: PaymentStats;
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

export default function Index({ payments, filters, totalCount, filteredCount, stats }: IndexProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

    const filterForm = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
        dateFrom: filters.dateFrom || null,
        dateTo: filters.dateTo || null,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // Mock form
    const form = useForm({});
    const handleSetData = () => {};
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setModalOpen(false); };

    // --- SINGLE EXPORT HANDLERS (Added these) ---
    const handleExportPDF = (payment: Payment) => {
        window.open(route('payments.export.pdf', payment.id), '_blank');
    };

    const handleExportExcel = (payment: Payment) => {
        window.open(route('payments.export.excel', payment.id), '_blank');
    };

    // --- OTHER ACTIONS ---
    const handleView = (payment: Payment) => {
        setSelectedPayment(payment);
        setModalOpen(true);
    };

    const handleCustomAction = (label: string, payment: Payment) => {
        if (label === 'Export PDF') handleExportPDF(payment);
        if (label === 'Export Excel') handleExportExcel(payment);
    };

    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(route('payments.bulk-export.pdf', { ids: ids.join(',') }), '_blank');
    };

    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(route('payments.bulk-export.excel', { ids: ids.join(',') }), '_blank');
    };

    // Filter Handlers
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        filterForm.setData('search', value);
        router.get(route('payments.index'), { ...filterForm.data, search: value }, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        filterForm.setData('search', '');
        filterForm.setData('perPage', '10');
        filterForm.setData('dateFrom', null);
        filterForm.setData('dateTo', null);
        router.get(route('payments.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handleDateFilterChange = (dateFrom: string | null, dateTo: string | null) => {
        filterForm.setData('dateFrom', dateFrom);
        filterForm.setData('dateTo', dateTo);
        router.get(route('payments.index'), { ...filterForm.data, dateFrom, dateTo }, { preserveState: true, preserveScroll: true });
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);

    // Prepare view data
    const viewData = selectedPayment ? {
        ...selectedPayment,
        amount: formatCurrency(selectedPayment.amount)
    } : {};

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments" />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                    <Wallet size={26} className="text-orange-600 mr-1" />
                    Payments Received
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                    Audit log of all incoming funds.
                </p>

                {/* 🟢 STATS GRID */}
                <div className="grid gap-4 md:grid-cols-3 mb-2">
                    <StatCard
                        title="Total Collected"
                        value={formatCurrency(stats?.total_collected || 0)}
                        icon={Wallet}
                        colorClass="text-blue-600 bg-blue-100"
                        subText="All payment methods"
                    />
                    <StatCard
                        title="M-Pesa Received"
                        value={formatCurrency(stats?.mpesa_total || 0)}
                        icon={Smartphone}
                        colorClass="text-green-600 bg-green-100"
                        subText="Mobile money transactions"
                    />
                    <StatCard
                        title="Cash Received"
                        value={formatCurrency(stats?.cash_total || 0)}
                        icon={Banknote}
                        colorClass="text-orange-600 bg-orange-100"
                        subText="Physical cash on hand"
                    />
                </div>

                <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <div className="flex w-full sm:w-1/2 items-center gap-2">
                        <Input
                            type="text"
                            value={filterForm.data.search}
                            onChange={handleSearchChange}
                            className="h-10 w-full"
                            placeholder="Search Ref, Customer, Store or Method..."
                        />
                        <Button onClick={handleReset} className="h-10 shrink-0 cursor-pointer bg-orange-600 hover:bg-orange-500 px-3">
                            <X size={20} />
                        </Button>
                    </div>

                    <FinanceModalForm
                        key={selectedPayment ? `pay-view-${selectedPayment.id}` : 'pay-view'}
                        title="View Payment"
                        description="Transaction Details"
                        fields={PaymentFormConfig.fields}
                        buttons={PaymentFormConfig.buttons}
                        data={viewData}
                        setData={handleSetData}
                        processing={false}
                        handleSubmit={handleSubmit}
                        errors={{}}
                        open={modalOpen}
                        onOpenChange={setModalOpen}
                        mode="view"
                        extraData={{}}
                        currentUserContext={null}
                        addButton={null}
                    />
                </div>

                <ComplexTable
                    moduleName={PaymentTableConfig.moduleName}
                    columns={PaymentTableConfig.columns}
                    actions={PaymentTableConfig.actions}
                    data={payments.data}
                    from={payments.from}
                    onView={handleView}
                    onCustomAction={handleCustomAction}
                    onDateFilterChange={handleDateFilterChange}
                    // 🟢 FIXED: Handlers passed explicitly
                    onExportPDF={handleExportPDF}
                    onExportExcel={handleExportExcel}
                    onBulkExportPDF={handleBulkExportPDF}
                    onBulkExportExcel={handleBulkExportExcel}
                />

                {payments.data && payments.data.length > 0 && (
                    <Pagination
                        products={payments}
                        perPage={filterForm.data.perPage}
                        onPerPageChange={(val) => {
                             filterForm.setData('perPage', val);
                             router.get(route('payments.index'), { ...filterForm.data, perPage: val });
                        }}
                        totalCount={totalCount}
                        filteredCount={filteredCount}
                        search={filterForm.data.search}
                    />
                )}
            </div>
        </AppLayout>
    );
}
