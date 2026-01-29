/* eslint-disable @typescript-eslint/no-explicit-any */
import {route} from 'ziggy-js';
import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { CustomToast, toast } from '@/components/custom-toast';
import { BarChart3, BoxesIcon } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import Pagination from '@/components/ui/pagination';

// BI Component Imports (Partial files)
import { FilterGrid } from '@/pages/valuation-reports/filter-grid';
import { StatsGrid } from '@/pages/valuation-reports/stats-grid';
import { ReportTabs } from '@/pages/valuation-reports/report-tabs';
import { ReportTable } from '@/components/report-table';

// Table Configurations from central directory
import { ValuationTableConfig } from '@/components/config/tables/valuation-report-table';
import { MovementTableConfig } from '@/components/config/tables/movement-report-table';
import { AdjustmentTableConfig } from '@/components/config/tables/adjustment-report-table';

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
  stats: {
    total_asset_value: number;
    potential_revenue: number;
    total_units: number;
    low_stock_count: number;
  };
  lookups: {
    brands: any[];
    categories: any[];
    stores: any[];
    suppliers: any[];
  };
  filters: {
    tab: string;
    search?: string;
    perPage?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    [key: string]: any;
  };
}

export default function Index({ reportData, stats, lookups, filters }: IndexProps) {
  const currentTab = filters.tab || 'valuation';

  /**
   * 🟢 BI Logic: Selection Strategy
   * Selects the correct neat config based on the active lens.
   */
  const getActiveConfig = () => {
    switch (currentTab) {
      case 'movement': return MovementTableConfig;
      case 'adjustments': return AdjustmentTableConfig;
      case 'valuation':
      default: return ValuationTableConfig;
    }
  };

  const activeConfig = getActiveConfig();

  // --- Handlers ---

  const handlePerPageChange = (value: string) => {

        router.get(route('valuation-reports.index'),
            { ...filters, perPage: value, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    router.get('valuation-reports',
        { ...filters, sort: key, direction: direction },
        { preserveState: true, preserveScroll: true }
    );
  };

  const handleExportPDF = () => {
    const query = new URLSearchParams(filters as any).toString();
    window.open(`valuation-reports/export/pdf?${query}`, '_blank');
  };

  const handleExportExcel = () => {
    const query = new URLSearchParams(filters as any).toString();
    window.open(`valuation-reports/export/excel?${query}`, '_blank');
  };

  /**
   * 🟢 Action Orchestrator
   * Handles button clicks defined in the dynamic Configs.
   */
  const handleCustomAction = (label: string, row: any) => {
    switch (label) {
        case 'View Product':
            router.get(`products/${row.product_id || row.id}`);
            break;
        case 'View Source':
            toast.info(`Opening source reference: ${row.reference_number}`);
            break;
        case 'View Audit':
            toast.info(`Opening audit trail for adjustment #${row.id}`);
            break;
        case 'Export PDF':
            window.open(`valuation-reports/export/pdf/single/${row.id}`, '_blank');
            break;
        default:
            toast.error(`Action "${label}" not yet implemented in this perspective.`);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`BI Hub - ${activeConfig.moduleName}`} />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-6 p-6 bg-slate-50/50">

        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-16 before:h-1 before:bg-blue-600 before:rounded-full flex items-center gap-2">
                    <BarChart3 size={28} className="text-blue-600" />
                    BI Reporting Hub
                </h2>
                <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                    Compound data visualization. Mode: <span className="font-bold text-slate-700">{activeConfig.moduleName}</span>
                </p>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block border-r pr-4 border-slate-200">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-tighter">Report Integrity</p>
                    <p className="text-sm font-medium text-emerald-600 flex items-center gap-1 justify-end">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Aggregate
                    </p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-400">
                   <BoxesIcon size={24} />
                </div>
            </div>
        </div>

        {/* 1. Dynamic Metric Cards */}
        <StatsGrid stats={stats} />

        {/* 2. Master Control Filter Grid */}
        <FilterGrid lookups={lookups} filters={filters} />

        {/* 3. The BI Table Room */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-300">
            {/* Tabbed Perspective Switcher */}
            <ReportTabs currentTab={currentTab} filters={filters} />

            <div className="p-0 min-h-[450px]">
                <ReportTable
                    moduleName={activeConfig.moduleName}
                    columns={activeConfig.columns}
                    actions={activeConfig.actions} // 🟢 Pass the neat actions from config
                    data={reportData?.data || []}
                    from={reportData?.from || 1}
                    onExportPDF={handleExportPDF}
                    onExportExcel={handleExportExcel}
                    onSort={handleSort}
                    onCustomAction={handleCustomAction}
                />
            </div>

            {/* Pagination Integration */}
            {reportData?.data?.length > 0 && (
                <div className="p-4 border-t bg-slate-50/50">
                   <Pagination
                    products={reportData} // This matches the structure we built in PHP
                    perPage={filters.perPage || '10'}
                    onPerPageChange={handlePerPageChange}
                    totalCount={reportData.total}
                    filteredCount={reportData.data.length}
                    search={filters.search || ''}
                    />
                </div>
            )}
        </div>
      </div>
    </AppLayout>
  );
}
