/* eslint-disable @typescript-eslint/no-explicit-any */
import ComplexTable from '@/components/complex-table';
import { SaleItemTableConfig } from '@/components/config/tables/sale-item-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CreditCard, Layers, Package, X } from 'lucide-react';
import { useEffect } from 'react';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Item Sales', href: '/sale-items' },
];

interface SaleItem {
    id: number;
    created_at: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    price_category: string;
    reference_no: string;
    customer_name: string;
    store_name: string;
    source_type: string;
}

interface ItemPagination {
    data: SaleItem[];
    links: any[];
    from: number;
    to: number;
    total: number;
}

interface ItemStats {
    total_items_sold: number;
    total_revenue: number;
    avg_ticket_item: number;
}

interface IndexProps {
    items: ItemPagination;
    filters: any;
    totalCount: number;
    filteredCount: number;
    stats: ItemStats;
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
    items,
    filters,
    totalCount,
    filteredCount,
    stats,
}: IndexProps) {
    const { flash } = usePage<{
        flash?: { success?: string; error?: string };
    }>().props;

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

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        filterForm.setData('search', value);
        const query = { ...filterForm.data, search: value };
        router.get(route('sale-items.index'), query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        filterForm.setData('search', '');
        filterForm.setData('perPage', '10');
        filterForm.setData('dateFrom', null);
        filterForm.setData('dateTo', null);
        router.get(
            route('sale-items.index'),
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
        const query = { ...filterForm.data, dateFrom, dateTo };
        router.get(route('sale-items.index'), query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExportPDF = (item: SaleItem) =>
        window.open(route('sale-items.export.pdf.single', item.id), '_blank');
    const handleExportExcel = (item: SaleItem) =>
        window.open(route('sale-items.export.excel.single', item.id), '_blank');

    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(
            route('sale-items.bulk-export.pdf', { ids: ids.join(',') }),
            '_blank',
        );
    };
    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(
            route('sale-items.bulk-export.excel', { ids: ids.join(',') }),
            '_blank',
        );
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
        }).format(value);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sale Items" />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="relative flex items-center gap-2 pb-2 text-xl font-semibold text-gray-800 before:absolute before:bottom-0 before:left-0 before:h-0.5 before:w-15 before:rounded-full before:bg-orange-600">
                    <Package size={26} className="mr-1 text-orange-600" />
                    Sale Items Report
                </h2>
                <p className="mb-2 text-sm text-gray-600">
                    Detailed breakdown of every product sold, including price
                    type and store context.
                </p>

                <div className="mb-2 grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Items Sold"
                        value={stats?.total_items_sold || 0}
                        icon={Layers}
                        colorClass="text-blue-600 bg-blue-100"
                        subText="Total quantity moved"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={formatCurrency(stats?.total_revenue || 0)}
                        icon={CreditCard}
                        colorClass="text-green-600 bg-green-100"
                        subText="Sum of all item totals"
                    />
                    <StatCard
                        title="Avg. Item Price"
                        value={formatCurrency(stats?.avg_ticket_item || 0)}
                        icon={Package}
                        colorClass="text-orange-600 bg-orange-100"
                        subText="Average revenue per item line"
                    />
                </div>

                <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <div className="flex w-full items-center gap-2 sm:w-1/2">
                        <Input
                            type="text"
                            value={filterForm.data.search}
                            onChange={handleSearchChange}
                            className="h-10 w-full"
                            placeholder="Search Product, Store, Price Type or Ref..."
                        />
                        <Button
                            onClick={handleReset}
                            className="h-10 shrink-0 cursor-pointer bg-orange-600 px-3 hover:bg-orange-500"
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                <ComplexTable
                    moduleName={SaleItemTableConfig.moduleName}
                    columns={SaleItemTableConfig.columns}
                    actions={SaleItemTableConfig.actions}
                    data={items.data}
                    from={items.from}
                    onCustomAction={(label: string, item: SaleItem) => {
                        if (label === 'Export PDF') handleExportPDF(item);
                        if (label === 'Export Excel') handleExportExcel(item);
                    }}
                    onExportPDF={handleExportPDF}
                    onBulkExportPDF={handleBulkExportPDF}
                    onBulkExportExcel={handleBulkExportExcel}
                    onDateFilterChange={handleDateFilterChange}
                    isModal={false}
                />

                {items.data && items.data.length > 0 && (
                    <Pagination
                        products={items}
                        perPage={filterForm.data.perPage}
                        onPerPageChange={(val) => {
                            filterForm.setData('perPage', val);
                            router.get(route('sale-items.index'), {
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
