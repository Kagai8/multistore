/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { route } from 'ziggy-js';

import { DebtTableConfig } from '@/components/config/tables/debt-table';

import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Wallet, Users, TrendingUp, AlertCircle } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import { SuccessModal } from '@/components/success-modal';
import { DebtPaymentModal } from '@/components/Partials/DebtPaymentModal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Debtors List', href: '/debts' },
];

interface Debtor {
    id: number;
    name: string;
    phone: string;
    credit_limit: number;
    total_debt: number;
    usage_percent: number;
}

interface PaginationData {
    data: Debtor[];
    links: any[];
    from: number;
    to: number;
    total: number;
}

// 🟢 STATS INTERFACE
interface DebtStats {
    total_outstanding: number;
    debtors_count: number;
    avg_debt: number;
}

interface IndexProps {
    debtors: PaginationData;
    filters: any;
    totalCount: number;
    filteredCount: number;
    stats: DebtStats; // 🟢
}

// 🟢 STAT CARD
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

export default function Index({ debtors, filters, totalCount, filteredCount, stats }: IndexProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successModalMessage, setSuccessModalMessage] = useState('');

    const filterForm = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
    });

    useEffect(() => {
        if (flash?.success) {
            setSuccessModalMessage(flash.success);
            setShowSuccessModal(true);
        } else if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleCustomAction = (label: string, row: Debtor) => {
        const cleanLabel = label.trim();
        switch (cleanLabel) {
            case 'View Statement':
                router.visit(route('debts.show', row.id));
                break;
            case 'Record Payment':
                setSelectedDebtor(row);
                setShowPaymentModal(true);
                break;
            case 'Export Statement (PDF)':
                window.open(route('debts.export.statement', row.id), '_blank');
                break;
            default:
                toast.error(`Action "${cleanLabel}" not configured.`);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        filterForm.setData('search', value);
        const query = {
            ...(value && { search: value }),
            ...(filterForm.data.perPage && { perPage: filterForm.data.perPage }),
        };
        router.get(route('debts.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        filterForm.setData('search', '');
        filterForm.setData('perPage', '10');
        router.get(route('debts.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (value: string) => {
        filterForm.setData('perPage', value);
        const query = {
            ...(filterForm.data.search && { search: filterForm.data.search }),
            ...(value && { perPage: value }),
        };
        router.get(route('debts.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleQuickRepayment = () => {
        setSelectedDebtor(null);
        setShowPaymentModal(true);
    };

    // 🟢 Update these handlers
    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(route('debts.export.pdf.bulk', { ids: ids.join(',') }), '_blank');
    };

    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(route('debts.export.excel.bulk', { ids: ids.join(',') }), '_blank');
    };

    // Helper
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Debtors List" />
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
                    <Wallet size={26} className="text-orange-600 mr-1" />
                    Accounts Receivable
                </h2>

                {/* 🟢 DESCRIPTION */}
                <p className="text-sm text-gray-600 mb-2">
                    Manage outstanding customer balances and record repayments.
                </p>

                {/* 🟢 STATS GRID */}
                <div className="grid gap-4 md:grid-cols-3 mb-2">
                    <StatCard
                        title="Total Outstanding"
                        value={formatCurrency(stats?.total_outstanding || 0)}
                        icon={AlertCircle}
                        colorClass="text-red-600 bg-red-100"
                        subText="Total owed by all customers"
                    />
                    <StatCard
                        title="Active Debtors"
                        value={stats?.debtors_count || 0}
                        icon={Users}
                        colorClass="text-blue-600 bg-blue-100"
                        subText="Customers with balance > 0"
                    />
                    <StatCard
                        title="Avg. Debt per Customer"
                        value={formatCurrency(stats?.avg_debt || 0)}
                        icon={TrendingUp}
                        colorClass="text-orange-600 bg-orange-100"
                        subText="Average exposure risk"
                    />
                </div>

                <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <div className="relative h-10 w-full sm:w-1/2">
                        <Input
                            type="text"
                            value={filterForm.data.search}
                            onChange={handleSearchChange}
                            className="h-10 w-full pr-10"
                            placeholder="Search Customer Name or Phone..."
                        />
                        {filterForm.data.search && (
                            <button
                                onClick={handleReset}
                                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="ml-auto">
                        <Button
                            onClick={handleQuickRepayment}
                            className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            <Wallet size={18} />
                            Record Repayment
                        </Button>
                    </div>
                </div>

                <ComplexTable
                    moduleName={DebtTableConfig.moduleName}
                    columns={DebtTableConfig.columns}
                    actions={DebtTableConfig.actions}
                    data={debtors.data}
                    from={debtors.from}
                    onCustomAction={handleCustomAction}
                    isModal={false}
                    onBulkExportPDF={handleBulkExportPDF}
                    onBulkExportExcel={handleBulkExportExcel}
                />

                {debtors.data && debtors.data.length > 0 && (
                    <Pagination
                        products={debtors}
                        perPage={filterForm.data.perPage}
                        onPerPageChange={handlePerPageChange}
                        totalCount={totalCount}
                        filteredCount={filteredCount}
                        search={filterForm.data.search}
                    />
                )}
            </div>

            <DebtPaymentModal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setSelectedDebtor(null);
                }}
                customer={selectedDebtor}
                preFilledAmount={selectedDebtor?.total_debt ?? 0}
                allCustomers={!selectedDebtor ? debtors.data : []}
            />
        </AppLayout>
    );
}
