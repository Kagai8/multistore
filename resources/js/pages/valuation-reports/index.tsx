/* eslint-disable @typescript-eslint/no-explicit-any */
import { CustomToast, toast } from '@/components/custom-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';

import { BiHeader } from '@/components/bi-header';
import { FilterGrid } from '@/components/filter-grid';
import { ModeNavigator } from '@/components/mode-navigator';
import { ReportTable } from '@/components/report-table';
import { StatsGrid } from '@/components/stats-grid';
import Pagination from '@/components/ui/pagination';
import { ZeroState } from '@/components/zero-state';

import {
    INVENTORY_MODES,
    MODE_REGISTRY,
} from '@/components/config/mode-registry/mode-registry';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory' },
    { title: 'BI Reporting Hub', href: '/inventory/valuation-reports' },
];

interface IndexProps {
    reportData: {
        data: any[];
        links: any[];
        from: number;
        to: number;
        total: number;
        current_page: number;
    };
    stats: Record<string, number>;
    lookups: any;
    filters: any;
}

export default function Index({
    reportData,
    stats,
    lookups,
    filters,
}: IndexProps) {
    const BASE_ROUTE = 'valuation-reports.index';
    const currentTab = filters.tab || 'valuation';
    const activeMode = MODE_REGISTRY[currentTab] || MODE_REGISTRY.valuation;

    const hasRequiredFilters = () => {
        if (!activeMode.requiresFilter) return true;
        const filterKeys = [
            'store_id',
            'brand_id',
            'category_id',
            'product_id',
            'user_id',
        ];
        return filterKeys.some((key) => {
            const value = filters[key];
            return value !== undefined && value !== null && value !== '';
        });
    };

    const showTable = hasRequiredFilters();

    // 🟢 Fix ts(2345): Convert route() to string for Inertia
    const handleSearch = (value: string) => {
        router.get(
            route(BASE_ROUTE).toString(),
            { ...filters, search: value, page: 1, tab: currentTab },
            { preserveState: true, replace: true },
        );
    };

    // 🟢 Fix ts(2345): Convert route() to string for window.open
    const handleExport = (format: 'pdf' | 'excel') => {
        const url = route('valuation-reports.export', {
            ...filters,
            format: format,
            tab: currentTab,
        }).toString();
        window.open(url, '_blank');
    };

    const handlePerPageChange = (value: string) => {
        router.get(
            route(BASE_ROUTE).toString(),
            { ...filters, perPage: value, page: 1, tab: currentTab },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (key: string, direction: 'asc' | 'desc') => {
        router.get(
            route(BASE_ROUTE).toString(),
            { ...filters, sort: key, direction: direction, tab: currentTab },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleCustomAction = (label: string, row: any) => {
        switch (label) {
            case 'View Product':
                router.get(`/inventory/products/${row.product_id || row.id}`);
                break;
            default:
                toast.info(`Action "${label}" triggered.`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`BI Hub - ${activeMode.title}`} />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-6 bg-slate-50/30 p-8">
                <BiHeader
                    title={activeMode.title}
                    searchPlaceholder={activeMode.searchPlaceholder}
                    searchValue={filters.search || ''}
                    onSearch={handleSearch}
                    onExport={handleExport}
                />

                <ModeNavigator
                    modes={INVENTORY_MODES}
                    activeMode={currentTab}
                    filters={filters}
                />

                <StatsGrid config={activeMode.stats} data={stats} />

                <FilterGrid
                    lookups={lookups}
                    filters={filters}
                    config={activeMode.filters}
                    routeName={BASE_ROUTE}
                />

                <div className="flex min-h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {showTable ? (
                        <>
                            <div className="flex-1 p-0">
                                <ReportTable
                                    moduleName={activeMode.title}
                                    columns={activeMode.columns}
                                    actions={activeMode.actions || []}
                                    data={reportData?.data || []}
                                    from={reportData?.from || 1}
                                    onExportPDF={() => handleExport('pdf')}
                                    onExportExcel={() => handleExport('excel')}
                                    onSort={handleSort}
                                    onCustomAction={handleCustomAction}
                                />
                            </div>

                            {reportData?.total > 0 && (
                                <div className="border-t bg-slate-50/50 p-4">
                                    <Pagination
                                        products={reportData}
                                        perPage={filters.perPage || '10'}
                                        onPerPageChange={handlePerPageChange}
                                        totalCount={reportData.total}
                                        filteredCount={reportData.data.length}
                                        search={filters.search || ''}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center p-12">
                            <ZeroState
                                title={activeMode.zeroStateTitle}
                                description={activeMode.zeroStateDescription}
                            />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
