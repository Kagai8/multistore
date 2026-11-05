/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';

import { PaymentToCustomerFormConfig } from '@/components/config/forms/payment-to-customer-modal-form';
import { PaymentToCustomerTableConfig } from '@/components/config/tables/payment-to-customer-table';

import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import FinanceModalForm from '@/components/finance-modal-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import { ArrowUpRight, Banknote, RotateCcw, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Outgoing Payments', href: '/payments-to-customers' },
];

interface OutgoingPayment {
    id: number;
    payment_date: string;
    amount: string;
    type: string;
    method: string;
    notes: string;
    customer_name: string;
    store_name: string;
    user_name: string;
    source_label: string;
}

interface OutgoingStats {
    total_outgoing: number;
    refunds_total: number;
    change_total: number;
}

interface IndexProps {
    payments: {
        data: OutgoingPayment[];
        links: any[];
        from: number;
        to: number;
        total: number;
    };
    filters: any;
    totalCount: number;
    filteredCount: number;
    stats: OutgoingStats;
}

const StatCard = ({ title, value, icon: Icon, colorClass, subText }: any) => (
    <div className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{title}</span>
            <div className={`rounded-full p-2 ${colorClass} bg-opacity-10`}>
                <Icon
                    size={20}
                    className={colorClass.replace('bg-', 'text-')}
                />
            </div>
        </div>
        <div className="mt-2 text-2xl font-bold text-gray-800">{value}</div>
        {subText && (
            <span className="mt-1 text-xs text-gray-400">{subText}</span>
        )}
    </div>
);

export default function Index({
    payments,
    filters,
    totalCount,
    filteredCount,
    stats,
}: IndexProps) {
    const { flash } = usePage<{
        flash?: { success?: string; error?: string };
    }>().props;

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] =
        useState<OutgoingPayment | null>(null);

    // Explicit shape so `any`-typed filters don't make FormDataKeys recurse infinitely.
    const filterForm = useForm<{
        search: string;
        perPage: string;
        dateFrom: string | null;
        dateTo: string | null;
    }>({
        search: filters.search || '',
        perPage: filters.perPage || '10',
        dateFrom: filters.dateFrom || null,
        dateTo: filters.dateTo || null,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleSetData = () => {};
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setModalOpen(false);
    };

    // --- HANDLERS ---

    // 🟢 SINGLE EXPORT HANDLERS
    const handleExportPDF = (payment: OutgoingPayment) => {
        window.open(
            route('payments-to-customers.export.pdf', payment.id),
            '_blank',
        );
    };

    const handleExportExcel = (payment: OutgoingPayment) => {
        window.open(
            route('payments-to-customers.export.excel', payment.id),
            '_blank',
        );
    };

    const handleView = (payment: OutgoingPayment) => {
        setSelectedPayment(payment);
        setModalOpen(true);
    };

    const handleCustomAction = (label: string, payment: OutgoingPayment) => {
        if (label === 'Export PDF') handleExportPDF(payment);
        if (label === 'Export Excel') handleExportExcel(payment);
    };

    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(
            route('payments-to-customers.bulk-export.pdf', {
                ids: ids.join(','),
            }),
            '_blank',
        );
    };

    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(
            route('payments-to-customers.bulk-export.excel', {
                ids: ids.join(','),
            }),
            '_blank',
        );
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        filterForm.setData('search', value);
        router.get(
            route('payments-to-customers.index'),
            { ...filterForm.data, search: value },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleReset = () => {
        filterForm.setData('search', '');
        filterForm.setData('perPage', '10');
        filterForm.setData('dateFrom', null);
        filterForm.setData('dateTo', null);
        router.get(
            route('payments-to-customers.index'),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleDateFilterChange = (
        dateFrom: string | null,
        dateTo: string | null,
    ) => {
        filterForm.setData('dateFrom', dateFrom);
        filterForm.setData('dateTo', dateTo);
        router.get(
            route('payments-to-customers.index'),
            { ...filterForm.data, dateFrom, dateTo },
            { preserveState: true, preserveScroll: true },
        );
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
        }).format(value);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Outgoing Payments" />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="relative flex items-center gap-2 pb-2 text-xl font-semibold text-gray-800 before:absolute before:bottom-0 before:left-0 before:h-0.5 before:w-15 before:rounded-full before:bg-orange-600">
                    <ArrowUpRight size={26} className="mr-1 text-orange-600" />
                    Outgoing Payments
                </h2>
                <p className="mb-2 text-sm text-gray-600">
                    Audit log of money returned to customers (Refunds, Change,
                    etc.).
                </p>

                {/* 🟢 STATS GRID */}
                <div className="mb-2 grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Total Outgoing"
                        value={formatCurrency(stats?.total_outgoing || 0)}
                        icon={ArrowUpRight}
                        colorClass="text-red-600 bg-red-100"
                        subText="Total refunds & change given"
                    />
                    <StatCard
                        title="Total Refunds"
                        value={formatCurrency(stats?.refunds_total || 0)}
                        icon={RotateCcw}
                        colorClass="text-orange-600 bg-orange-100"
                        subText="Product returns"
                    />
                    <StatCard
                        title="Change Given"
                        value={formatCurrency(stats?.change_total || 0)}
                        icon={Banknote}
                        colorClass="text-blue-600 bg-blue-100"
                        subText="Balance returned at POS"
                    />
                </div>

                <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <div className="flex w-full items-center gap-2 sm:w-1/2">
                        <Input
                            type="text"
                            value={filterForm.data.search}
                            onChange={handleSearchChange}
                            className="h-10 w-full"
                            placeholder="Search Customer or Type..."
                        />
                        <Button
                            onClick={handleReset}
                            className="h-10 shrink-0 cursor-pointer bg-orange-600 px-3 hover:bg-orange-500"
                        >
                            <X size={20} />
                        </Button>
                    </div>

                    <FinanceModalForm
                        key={
                            selectedPayment
                                ? `out-view-${selectedPayment.id}`
                                : 'out-view'
                        }
                        title="View Transaction"
                        description="Outgoing Funds Detail"
                        fields={PaymentToCustomerFormConfig.fields}
                        buttons={PaymentToCustomerFormConfig.buttons}
                        data={selectedPayment || {}}
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
                    moduleName={PaymentToCustomerTableConfig.moduleName}
                    columns={PaymentToCustomerTableConfig.columns}
                    actions={PaymentToCustomerTableConfig.actions}
                    data={payments.data}
                    from={payments.from}
                    onView={handleView}
                    onCustomAction={handleCustomAction}
                    onDateFilterChange={handleDateFilterChange}
                    // 🟢 WIRED UP HANDLERS
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
                            router.get(route('payments-to-customers.index'), {
                                ...filterForm.data,
                                perPage: val,
                            });
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
