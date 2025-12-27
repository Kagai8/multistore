/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import React, { useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, TrendingDown, ArrowUpDownIcon } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import { StockAdjustmentTableConfig } from '@/components/config/tables/stockadjustment-table';

// --- Interfaces (Ensuring consistency with Products/Index) ---

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory Management', href: '/stocks' },
  { title: 'Adjustment History', href: '/stock-adjustments' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface StockAdjustment {
  id: number;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  notes: string | null;
  old_stock: number;
  new_stock: number;
  product_name: string;
  store_name: string;
  adjusted_by: string;
  created_at: string;
}

interface StockAdjustmentPagination {
  data: StockAdjustment[];
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
  type?: 'in' | 'out' | null;
}

interface IndexProps {
  adjustments: StockAdjustmentPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}


// --- Main Component ---

export default function StockAdjustmentIndex({ adjustments, filters, totalCount, filteredCount }: IndexProps) {
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

  // Filter form state (search, perPage, type)
  const { data: filtersForm, setData: setFilterData } = useForm({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
    type: filters.type || null,
  });

  // --- Utility Functions ---

  // Unified function to execute the router visit
  const applyFilters = (newFilters: Partial<FilterProps>) => {
    const updatedFilters = {
        ...filtersForm,
        ...newFilters,
    };

    const query = {
        ...(updatedFilters.search && { search: updatedFilters.search }),
        ...(updatedFilters.perPage !== '10' && { perPage: updatedFilters.perPage }),
        ...(updatedFilters.dateFrom && { dateFrom: updatedFilters.dateFrom }),
        ...(updatedFilters.dateTo && { dateTo: updatedFilters.dateTo }),
        ...(updatedFilters.type && { type: updatedFilters.type }),
    };

    // Use replace: true to prevent endless back history states
    router.get(route('stock-adjustments.index'), query, { preserveState: true, replace: true });
  };


  // --- Event Handlers (Matching Products/Index feel) ---

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterData('search', value);
    // Apply search immediately upon change
    applyFilters({ search: value });
  };

  const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    setFilterData('type', null);
    router.get(route('stock-adjustments.index'), {}, { preserveState: true, replace: true });
  };

  const handlePerPageChange = (value: string) => {
    setFilterData('perPage', value);
    applyFilters({ perPage: value });
  };

  const handleDateFilterChange = (dateFrom: string | null, dateTo: string | null) => {
    setFilterData({ dateFrom: dateFrom, dateTo: dateTo });
    applyFilters({ dateFrom: dateFrom, dateTo: dateTo });
  };

  const handleTypeFilterChange = (type: 'in' | 'out' | null) => {
    setFilterData('type', type);
    applyFilters({ type: type });
  }

  // --- Table Action Handlers (Only Exports) ---

  const handleExportPDF = (row: any) => {
    window.open(route('stock-adjustments.export.pdf.single', row.id), '_blank');
  };

  const handleExportExcel = (row: any) => {
    window.open(route('stock-adjustments.export.excel.single', row.id), '_blank');
  };

  const handleBulkExportPDF = (ids: number[]) => {
    if (!ids.length) return toast.error('No adjustments selected');
    const url = route('stock-adjustments.bulkExportPDF', { ids: ids.join(',') });
    window.open(url, '_blank');
  };

  const handleBulkExportExcel = (ids: number[]) => {
    if (!ids.length) return toast.error('No adjustments selected');
    const url = route('stock-adjustments.bulkExportExcel', { ids: ids.join(',') });
    window.open(url, '_blank');
  };


  // --- Effects ---

  useEffect(() => {
    if (flash?.success) {
        toast.success(flash.success);
    } else if (flash?.error) {
        toast.error(flash.error);
    }
  }, [flash]);

  // --- Render Component ---

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Stock Adjustments" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
            <ArrowUpDownIcon size={26} className="text-orange-600 mr-1" />
            Stock Adjustment History
        </h2>
        <p className="text-sm text-gray-600 max-w-2xxl">
            Here you can view stock adjustment history and details. Use the controls below to filter and get accurate reports.
        </p>

        {/* Filters and Header (Matching Product Index Feel) */}
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
            {/* Search Input */}
            <Input
                type="text"
                value={filtersForm.search}
                onChange={handleSearchChange}
                className="h-10 w-full sm:w-1/2"
                placeholder="Search Product, Store, or Reason..."
                name="search"
            />

            <div className="flex items-center gap-2">
                {/* Type Filter Buttons */}
                <Button
                    onClick={() => handleTypeFilterChange(filtersForm.type === 'in' ? null : 'in')}
                    variant={filtersForm.type === 'in' ? 'default' : 'outline'}
                    className={`h-10 ${filtersForm.type === 'in' ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-green-600 text-green-700 hover:bg-green-50'}`}
                >
                    <TrendingUp size={18} className="me-1" /> Only IN
                </Button>
                <Button
                    onClick={() => handleTypeFilterChange(filtersForm.type === 'out' ? null : 'out')}
                    variant={filtersForm.type === 'out' ? 'default' : 'outline'}
                    className={`h-10 ${filtersForm.type === 'out' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-red-600 text-red-700 hover:bg-red-50'}`}
                >
                    <TrendingDown size={18} className="me-1" /> Only OUT
                </Button>
            </div>


            <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
                <X size={20} />
            </Button>

            {/* NO ADD BUTTON HERE */}
            <div className="ml-auto" />
        </div>

        {/* Complex Table */}
        <ComplexTable
          moduleName={StockAdjustmentTableConfig.moduleName}
          columns={StockAdjustmentTableConfig.columns}
          actions={StockAdjustmentTableConfig.actions}
          data={adjustments.data}
          from={adjustments.from}
          // Only Export Handlers are provided for an Audit Log
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          onBulkExportPDF={handleBulkExportPDF}
          onBulkExportExcel={handleBulkExportExcel}
          onDateFilterChange={handleDateFilterChange}
          // Note: isModal, onView, onEdit, onDelete, onBulkDelete, Import/Template are omitted for Audit Log
        />

        {/* Pagination — matching Products/Index structure */}
        {adjustments.data && adjustments.data.length > 0 && (
          <Pagination
            products={adjustments} // Using 'products' prop name to match existing component interface
            perPage={filtersForm.perPage}
            onPerPageChange={handlePerPageChange}
            totalCount={totalCount}
            filteredCount={filteredCount}
            search={filtersForm.search}
          />
        )}
      </div>

    </AppLayout>
  );
}
