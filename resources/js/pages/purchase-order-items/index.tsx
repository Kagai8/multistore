/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, ClipboardList, FileText, Truck, CheckCircle } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import { PurchaseOrderItemTableConfig } from '@/components/config/tables/purchase-order-items-table';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory', href: '/inventory' },
  { title: 'Procurement', href: '/purchase-orders' },
  { title: 'Item Report', href: '/purchase-order-items' },
];

// Reusing your StatCard component for consistency
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

export default function Index({ items, filters, stats }: any) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const { data: filterData, setData: setFilterData } = useForm({
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
        setFilterData('search', e.target.value);
    };

    const triggerSearch = () => {
        const query = {
            ...(filterData.search && { search: filterData.search }),
            ...(filterData.perPage && { perPage: filterData.perPage }),
            ...(filterData.dateFrom && { dateFrom: filterData.dateFrom }),
            ...(filterData.dateTo && { dateTo: filterData.dateTo }),
        };
        router.get(route('purchase-order-items.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        setFilterData('search', '');
        setFilterData('perPage', '10');
        setFilterData('dateFrom', null);
        setFilterData('dateTo', null);
        router.get(route('purchase-order-items.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(route('purchase-order-items.bulk-export.pdf') + `?ids=${ids.join(',')}`, '_blank');
    };

    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(route('purchase-order-items.bulk-export.excel') + `?ids=${ids.join(',')}`, '_blank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="PO Item Report" />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                    <ClipboardList size={26} className="text-orange-600 mr-1" />
                    Purchase Order Line Items
                </h2>

                {/* 🟢 STAT CARDS (Mirroring Purchase Order Module) */}
                <div className="grid gap-4 md:grid-cols-3 mb-2">
                    <StatCard
                        title="Draft Items"
                        value={stats?.draft_items || 0}
                        icon={FileText}
                        colorClass="text-gray-600 bg-gray-100"
                        subText="Individual items in draft"
                    />
                    <StatCard
                        title="Pending Arrival (Value)"
                        value={new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(stats?.pending_value || 0)}
                        icon={Truck}
                        colorClass="text-blue-600 bg-blue-100"
                        subText="Total cost of ordered items"
                    />
                    <StatCard
                        title="Received Items"
                        value={stats?.received_items || 0}
                        icon={CheckCircle}
                        colorClass="text-green-600 bg-green-100"
                        subText="Successfully delivered lines"
                    />
                </div>

                {/* Filters */}
                <div className="mb-4 flex w-full flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex w-full sm:w-1/2 items-center gap-2">
                        <Input
                            type="text"
                            value={filterData.search}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
                            className="h-10 w-full"
                            placeholder="Search Product, SKU, PO#, or Supplier..."
                        />
                        <Button onClick={handleReset} className="h-10 shrink-0 cursor-pointer bg-orange-600 hover:bg-orange-500">
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                <ComplexTable
                    moduleName={PurchaseOrderItemTableConfig.moduleName}
                    columns={PurchaseOrderItemTableConfig.columns}
                    actions={PurchaseOrderItemTableConfig.actions}
                    data={items.data}
                    from={items.from}
                    onBulkExportPDF={handleBulkExportPDF}
                    onBulkExportExcel={handleBulkExportExcel}
                    // Pass date filter handler to ComplexTable if it supports it, or use custom UI
                    isModal={false}
                />

                {items.data && items.data.length > 0 && (
                    <Pagination
                        products={items}
                        perPage={filterData.perPage}
                        onPerPageChange={(val) => { setFilterData('perPage', val); triggerSearch(); }}
                        totalCount={items.total}
                        filteredCount={items.total}
                        search={filterData.search}
                    />
                )}
            </div>
        </AppLayout>
    );
}
