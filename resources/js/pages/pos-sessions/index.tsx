/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

import { PosSessionTableConfig } from '@/components/config/tables/pos-session-table';
import { PosSessionFormConfig } from '@/components/config/forms/pos-session-modal-form';

import FinanceModalForm from '@/components/finance-modal-form';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Clock, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'POS Audit', href: '/pos-sessions' },
];

interface PosSession {
    id: number;
    user_name: string;
    store_name: string;
    start_time: string;
    end_time: string;
    opening_cash: number;
    closing_cash: number;
    cash_difference: number;
    status: string;
    notes: string;
}

interface Stats {
    total_sessions: number;
    open_sessions: number;
    total_discrepancy: number;
    shortage_count: number;
}

interface IndexProps {
    sessions: { data: PosSession[]; links: any[]; from: number; to: number; total: number };
    filters: any;
    totalCount: number;
    filteredCount: number;
    stats: Stats;
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

export default function Index({ sessions, filters, totalCount, filteredCount, stats }: IndexProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<PosSession | null>(null);

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

    // Mock form handlers (Read Only)
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setModalOpen(false); };

    // --- EXPORT HANDLERS ---
    const handleExportPDF = (session: PosSession) => {
        window.open(route('pos-sessions.export.pdf', session.id), '_blank');
    };

    const handleExportExcel = (session: PosSession) => {
        window.open(route('pos-sessions.export.excel', session.id), '_blank');
    };

    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(route('pos-sessions.bulk-export.pdf', { ids: ids.join(',') }), '_blank');
    };

    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(route('pos-sessions.bulk-export.excel', { ids: ids.join(',') }), '_blank');
    };

    // --- VIEW ACTIONS ---
    const handleView = (session: PosSession) => {
        setSelectedSession(session);
        setModalOpen(true);
    };

    const handleCustomAction = (label: string, session: PosSession) => {
        if (label === 'Export Z-Report') handleExportPDF(session);
        if (label === 'Export Excel') handleExportExcel(session);
    };

    // --- FILTERS ---
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        filterForm.setData('search', value);
        router.get(route('pos-sessions.index'), { ...filterForm.data, search: value }, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        filterForm.setData('search', '');
        filterForm.setData('perPage', '10');
        filterForm.setData('dateFrom', null);
        filterForm.setData('dateTo', null);
        router.get(route('pos-sessions.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handleDateFilterChange = (dateFrom: string | null, dateTo: string | null) => {
        filterForm.setData('dateFrom', dateFrom);
        filterForm.setData('dateTo', dateTo);
        router.get(route('pos-sessions.index'), { ...filterForm.data, dateFrom, dateTo }, { preserveState: true, preserveScroll: true });
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);

    // Prepare view data
    const viewData = selectedSession ? {
        ...selectedSession,
        opening_cash: formatCurrency(selectedSession.opening_cash),
        closing_cash: formatCurrency(selectedSession.closing_cash),
        cash_difference: formatCurrency(selectedSession.cash_difference),
    } : {};

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="POS Sessions" />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                    <Clock size={26} className="text-orange-600 mr-1" />
                    POS Audit Log
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                    Review cash drawer activity, open shifts, and closing discrepancies.
                </p>

                {/* 🟢 STATS GRID */}
                <div className="grid gap-4 md:grid-cols-4 mb-2">
                    <StatCard
                        title="Total Shifts"
                        value={stats?.total_sessions || 0}
                        icon={Clock}
                        colorClass="text-blue-600 bg-blue-100"
                    />
                    <StatCard
                        title="Active Now"
                        value={stats?.open_sessions || 0}
                        icon={CheckCircle}
                        colorClass="text-green-600 bg-green-100"
                    />
                    <StatCard
                        title="Total Discrepancy"
                        value={formatCurrency(stats?.total_discrepancy || 0)}
                        icon={AlertOctagon}
                        colorClass={stats?.total_discrepancy < 0 ? "text-red-600 bg-red-100" : "text-gray-600 bg-gray-100"}
                        subText="Net over/short amount"
                    />
                    <StatCard
                        title="Shortage Events"
                        value={stats?.shortage_count || 0}
                        icon={AlertTriangle}
                        colorClass="text-orange-600 bg-orange-100"
                        subText="Shifts closed with less cash"
                    />
                </div>

                <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <div className="flex w-full sm:w-1/2 items-center gap-2">
                        <Input
                            type="text"
                            value={filterForm.data.search}
                            onChange={handleSearchChange}
                            className="h-10 w-full"
                            placeholder="Search Cashier, ID, or Store..."
                        />
                        <Button onClick={handleReset} className="h-10 shrink-0 cursor-pointer bg-orange-600 hover:bg-orange-500 px-3">
                            <X size={20} />
                        </Button>
                    </div>

                    <FinanceModalForm
                        key={selectedSession ? `sess-view-${selectedSession.id}` : 'sess-view'}
                        title="Shift Details"
                        description="Audited cash figures"
                        fields={PosSessionFormConfig.fields}
                        buttons={PosSessionFormConfig.buttons}
                        data={viewData}
                        setData={() => {}}
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
                    moduleName={PosSessionTableConfig.moduleName}
                    columns={PosSessionTableConfig.columns}
                    actions={PosSessionTableConfig.actions}
                    data={sessions.data}
                    from={sessions.from}
                    onView={handleView}
                    onCustomAction={handleCustomAction}
                    onDateFilterChange={handleDateFilterChange}
                    onExportPDF={handleExportPDF}
                    onExportExcel={handleExportExcel}
                    onBulkExportPDF={handleBulkExportPDF}
                    onBulkExportExcel={handleBulkExportExcel}
                />

                {sessions.data && sessions.data.length > 0 && (
                    <Pagination
                        products={sessions}
                        perPage={filterForm.data.perPage}
                        onPerPageChange={(val) => {
                             filterForm.setData('perPage', val);
                             router.get(route('pos-sessions.index'), { ...filterForm.data, perPage: val });
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
