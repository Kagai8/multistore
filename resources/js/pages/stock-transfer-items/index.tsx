/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, ClipboardList } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

// --- CONFIGURATION ---

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory', href: '/inventory' },
  { title: 'Stock Movement Report', href: '/stock-transfer-items' },
];

const ReportTableConfig = {
    moduleName: 'Stock Movements',
    columns: [
        { key: 'transfer_date', label: 'Date', sortable: true },
        { key: 'transfer_reference', label: 'Reference', sortable: true },
        { key: 'transfer_status', label: 'Status', sortable: true, type: 'badge' },
        { key: 'source_store', label: 'From Store', sortable: true },
        { key: 'destination_store', label: 'To Store', sortable: true },
        { key: 'product_name', label: 'Product', sortable: true },
        { key: 'product_sku', label: 'SKU', sortable: true },
        { key: 'quantity', label: 'Qty', sortable: true, className: 'text-right font-medium' },
    ],
    actions: [] // No individual row actions (Read-only)
};

// --- TYPES ---

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface TransferItem {
    id: number;
    transfer_reference: string;
    transfer_status: string;
    transfer_date: string;
    source_store: string;
    destination_store: string;
    product_name: string;
    product_sku: string;
    quantity: number;
}

interface PaginationData {
    data: TransferItem[];
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

interface IndexProps {
    items: PaginationData;
    filters: FilterProps;
}

export default function Index({ items, filters }: IndexProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const flashMessage = flash?.success || flash?.error;

    // Filter Form
    const { data: filterData, setData: setFilterData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
        dateFrom: filters.dateFrom || null,
        dateTo: filters.dateTo || null,
    });

    useEffect(() => {
        if (flashMessage) {
            const type = flash?.success ? 'success' : 'error';
            toast[type](flashMessage);
        }
    }, [flashMessage, flash]);

    // --- HANDLERS ---

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilterData('search', value);
        const query = {
            ...(value && { search: value }),
            ...(filterData.perPage && { perPage: filterData.perPage }),
            ...(filterData.dateFrom && { dateFrom: filterData.dateFrom }),
            ...(filterData.dateTo && { dateTo: filterData.dateTo }),
        };
        router.get(route('stock-transfer-items.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        setFilterData('search', '');
        setFilterData('perPage', '10');
        setFilterData('dateFrom', null);
        setFilterData('dateTo', null);
        router.get(route('stock-transfer-items.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (value: string) => {
        setFilterData('perPage', value);
        const query = {
            ...(filterData.search && { search: filterData.search }),
            ...(value && { perPage: value }),
            ...(filterData.dateFrom && { dateFrom: filterData.dateFrom }),
            ...(filterData.dateTo && { dateTo: filterData.dateTo }),
        };
        router.get(route('stock-transfer-items.index'), query, { preserveState: true, preserveScroll: true });
    };

    const handleDateFilterChange = (dateFrom: string | null, dateTo: string | null) => {
        setFilterData((prev) => ({ ...prev, dateFrom, dateTo }));
        const query = {
            ...(filterData.search && { search: filterData.search }),
            ...(filterData.perPage && { perPage: filterData.perPage }),
            ...(dateFrom && { dateFrom: dateFrom }),
            ...(dateTo && { dateTo: dateTo }),
        };
        router.get(route('stock-transfer-items.index'), query, { preserveState: true, preserveScroll: true });
    };

    // 🟢 BULK EXPORT HANDLERS (Connected to ComplexTable)
    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        // IDs are passed as a comma-separated string
        window.open(route('stock-transfer-items.bulk-export-pdf') + `?ids=${ids.join(',')}`, '_blank');
    };

    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No items selected');
        window.open(route('stock-transfer-items.bulk-export-excel') + `?ids=${ids.join(',')}`, '_blank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Movement Report" />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                    <ClipboardList size={26} className="text-orange-600 mr-1" />
                    Stock Movement Item Report
                </h2>
                <p className="text-sm text-gray-600 max-w-2xxl">
                    A detailed breakdown of every individual item moved between stores. Use the table checkboxes to select items for export.
                </p>

                {/* Filters */}
                <div className="mb-4 flex w-full flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex w-full sm:w-1/2 items-center gap-2">
                        <Input
                            type="text"
                            value={filterData.search}
                            onChange={handleSearchChange}
                            className="h-10 w-full"
                            placeholder="Search by Product, SKU, or Reference..."
                            name="search"
                        />
                        <Button onClick={handleReset} className="h-10 shrink-0 cursor-pointer bg-orange-600 hover:bg-orange-500">
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                {/* 🟢 COMPLEX TABLE with Bulk Actions Enabled */}
                <ComplexTable
                    moduleName={ReportTableConfig.moduleName}
                    columns={ReportTableConfig.columns}
                    actions={ReportTableConfig.actions}
                    data={items.data}
                    from={items.from}
                    // Passing bulk handlers enables the selection checkboxes automatically
                    onBulkExportPDF={handleBulkExportPDF}
                    onBulkExportExcel={handleBulkExportExcel}
                    onDateFilterChange={handleDateFilterChange}
                    isModal={false}
                />

                {/* Pagination */}
                {items.data && items.data.length > 0 && (
                    <Pagination
                        products={items}
                        perPage={filterData.perPage}
                        onPerPageChange={handlePerPageChange}
                        totalCount={items.total}
                        filteredCount={items.total}
                        search={filterData.search}
                    />
                )}
            </div>
        </AppLayout>
    );
}
