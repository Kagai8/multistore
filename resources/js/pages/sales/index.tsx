/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

import { SalesTableConfig } from '@/components/config/tables/sales-table';
import { SalesFormConfig } from '@/components/config/forms/sale-modal-form';

import FinanceModalForm from '@/components/finance-modal-form';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, ShoppingCart, Banknote, CreditCard } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Sales Ledger', href: '/sales' },
];

interface Sale {
    id: number;
    reference_no: string;
    created_at: string;
    created_at_formatted: string;
    customer_name: string;
    store_name: string;
    user_name: string;
    source_type_label: string;
    total_amount: number;
    paid_amount: number; // Now derived correctly in backend
    payment_status: string;
    status: string;
    items: any[];
}

interface SalesPagination {
    data: Sale[];
    links: any[];
    from: number;
    to: number;
    total: number;
}

interface SalesStats {
    total_revenue: number;
    total_collected: number;
    total_transactions: number;
}

interface IndexProps {
    sales: SalesPagination;
    filters: any;
    totalCount: number;
    filteredCount: number;
    stats: SalesStats;
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

export default function Index({ sales, filters, totalCount, filteredCount, stats }: IndexProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

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

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        filterForm.setData('search', value);
        const query = { ...filterForm.data, search: value };
        router.get(route('sales.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        filterForm.setData('search', '');
        filterForm.setData('perPage', '10');
        filterForm.setData('dateFrom', null);
        filterForm.setData('dateTo', null);
        router.get(route('sales.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handleView = (sale: Sale) => {
        setSelectedSale(sale);
        setModalOpen(true);
    };

    const handleExportPDF = (sale: Sale) => window.open(route('sales.export.pdf.single', sale.id), '_blank');
    const handleExportExcel = (sale: Sale) => window.open(route('sales.export.excel.single', sale.id), '_blank');
    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(route('sales.bulk-export.pdf', { ids: ids.join(',') }), '_blank');
    };
    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(route('sales.bulk-export.excel', { ids: ids.join(',') }), '_blank');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value);
    };

    // Prepare data for view modal (ReadOnly)
    const viewData = selectedSale ? {
        ...selectedSale,
        total_amount: Number(selectedSale.total_amount).toLocaleString(),
        paid_amount: Number(selectedSale.paid_amount).toLocaleString(),
    } : {};

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Ledger" />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                    <ShoppingCart size={26} className="text-orange-600 mr-1" />
                    Sales Ledger
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                    Read-only record of all completed transactions.
                </p>

                {/* 🟢 STAT TABS */}
                <div className="grid gap-4 md:grid-cols-3 mb-2">
                    <StatCard
                        title="Total Transactions"
                        value={stats?.total_transactions || 0}
                        icon={ShoppingCart}
                        colorClass="text-blue-600 bg-blue-100"
                        subText="Count of sales records"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={formatCurrency(stats?.total_revenue || 0)}
                        icon={CreditCard}
                        colorClass="text-green-600 bg-green-100"
                        subText="Gross sales value"
                    />
                    <StatCard
                        title="Cash Collected"
                        value={formatCurrency(stats?.total_collected || 0)}
                        icon={Banknote}
                        colorClass="text-orange-600 bg-orange-100"
                        subText="Estimated from fully paid sales"
                    />
                </div>

                <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <div className="flex w-full sm:w-1/2 items-center gap-2">
                        <Input
                            type="text"
                            value={filterForm.data.search}
                            onChange={handleSearchChange}
                            className="h-10 w-full"
                            placeholder="Search Reference # or Customer..."
                        />
                        <Button onClick={handleReset} className="h-10 shrink-0 cursor-pointer bg-orange-600 hover:bg-orange-500 px-3">
                            <X size={20} />
                        </Button>
                    </div>

                    <FinanceModalForm
                        key={selectedSale ? `sale-view-${selectedSale.id}` : 'sale-view'}
                        title="View Sale Record"
                        description="Transaction Details"
                        fields={SalesFormConfig.fields}
                        buttons={SalesFormConfig.buttons}
                        data={viewData}
                        setData={() => {}}
                        processing={false}
                        handleSubmit={(e) => { e.preventDefault(); setModalOpen(false); }}
                        errors={{}}
                        open={modalOpen}
                        onOpenChange={setModalOpen}
                        mode="view"
                        extraData={{}}
                        currentUserContext={null}
                        addButton={null}
                    >
                        {selectedSale && selectedSale.items && (
                            <div className="space-y-3 p-4 border rounded-lg shadow-sm mt-4 bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                    <Banknote size={16} /> Sold Items
                                </h3>
                                <div className="overflow-hidden rounded-md border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium text-gray-900">Product</th>
                                                <th className="px-4 py-2 text-right font-medium text-gray-900">Qty</th>
                                                <th className="px-4 py-2 text-right font-medium text-gray-900">Price</th>
                                                <th className="px-4 py-2 text-right font-medium text-gray-900">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {selectedSale.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2 text-gray-700">{item.product_name}</td>
                                                    <td className="px-4 py-2 text-right text-gray-700">{item.quantity}</td>
                                                    <td className="px-4 py-2 text-right text-gray-700">{Number(item.unit_price).toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right font-bold text-gray-800">{Number(item.total_price).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </FinanceModalForm>
                </div>

                <ComplexTable
                    moduleName={SalesTableConfig.moduleName}
                    columns={SalesTableConfig.columns}
                    actions={SalesTableConfig.actions}
                    data={sales.data}
                    from={sales.from}
                    onView={handleView}
                    onCustomAction={(label: string, sale: Sale) => {
                        if (label === 'Export PDF') handleExportPDF(sale);
                        if (label === 'Export Excel') handleExportExcel(sale);
                    }}
                    onBulkExportPDF={handleBulkExportPDF}
                    onBulkExportExcel={handleBulkExportExcel}
                    isModal={false}
                />

                {sales.data && sales.data.length > 0 && (
                    <Pagination
                        products={sales}
                        perPage={filterForm.data.perPage}
                        onPerPageChange={(val) => {
                             filterForm.setData('perPage', val);
                             router.get(route('sales.index'), { ...filterForm.data, perPage: val });
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
