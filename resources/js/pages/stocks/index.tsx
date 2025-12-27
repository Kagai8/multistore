// resources/js/Pages/Stocks/Index.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// 🟢 Config and Component Imports
import { StockTableConfig } from '@/components/config/tables/stock-table';
import { StockModalFormConfig } from '@/components/config/forms/stock-modal-form';
import ComplexModalForm from '@/components/complex-modal-form';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BoxesIcon, X } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import ComplexTable from '@/components/complex-table';

// 🟢 Updated Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory', href: '/inventory' },
  { title: 'Inventory Levels', href: '/stocks' },
];

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

// ✅ Stock Interface - Data structure returned from Laravel
interface Stock {
  id: number;
  product_id: number;
  store_id: number;
  current_stock: number;
  reorder_level: number;
  reorder_quantity: number;
  updated_at: string;

  // Relationships
  product: { id: number; name: string; sku: string };
  store: { id: number; name: string; code: string };
}

// 🟢 StockForm interface - The data structure sent to Inertia/Laravel for POLICY UPDATE
interface StockForm {
  // Only the fields allowed for direct update
  reorder_level: number;
  reorder_quantity: number;

  // Hidden fields used for display in the modal but required for update logic
  id: number;
  store_name: string;
  product_name: string;
  current_stock: number;

  _method?: 'PUT';
}

interface StockPagination {
  data: Stock[];
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

interface LookupItem {
    id: number;
    name: string;
}

interface IndexProps {
  stocks: StockPagination;
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
  // Kept for prop compatibility, even if unused in this view now
  lookupData: {
    stores: LookupItem[];
    products: LookupItem[];
    adjustmentReasons: LookupItem[];
  };
}

export default function Index({ stocks, filters, totalCount, filteredCount }: IndexProps) {
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
  const flashMessage = flash?.success || flash?.error;

  // --- STATE FOR POLICY UPDATE MODAL ---
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // 🟢 useForm Initialization for Policy Update
  const {
    data, setData, reset, errors, processing, post
  } = useForm<StockForm>({
    id: 0,
    reorder_level: 0,
    reorder_quantity: 0,
    store_name: '',
    product_name: '',
    current_stock: 0,
  });

  // Filter form
  const { data: filtersForm, setData: setFilterData } = useForm({
    search: filters.search || '',
    perPage: filters.perPage || '10',
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
  });

  // 🟢 Centralized Data Handler
  const handleSetData = (key: string, value: any) => {
    const isNumericField = ['reorder_level', 'reorder_quantity'].includes(key);

    if (isNumericField) {
        const numericValue = value === '' || value === null ? 0 : Number(value);
        setData(key as keyof StockForm, numericValue);
    } else {
        if (key in data) {
             setData(key as keyof StockForm, value);
        }
    }
  };

  // Toast Handling
  useEffect(() => {
    if (flashMessage) {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }
  }, [flashMessage, flash]);

  // ✅ openModal function for Policy Edit/View
  const openModal = (m: 'view' | 'edit', stock: Stock) => {
    setMode(m);
    setSelectedStock(stock);

    setData({
        // Policy Fields (Editable in Edit Mode)
        reorder_level: stock.reorder_level,
        reorder_quantity: stock.reorder_quantity,

        // Read-Only/Hidden Fields
        id: stock.id,
        store_name: stock.store.name,
        product_name: stock.product.name,
        current_stock: stock.current_stock,

        _method: 'PUT',
    } as StockForm);

    setModalOpen(true);
  };

  const closeModal = () => {
    setMode('view');
    setSelectedStock(null);
    reset();
    setModalOpen(false);
  };

  // 🟢 CRITICAL: handleSubmit for POLICY UPDATE
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStock) {
        post(route("stocks.update", selectedStock.id), {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Reorder policy updated successfully");
                closeModal();
            },
            onError: (errs) => {
                const errorMessages = errors && Object.values(errors).flat();
                const msg = errorMessages?.length ? errorMessages.join(', ') : 'Failed to update reorder policy';
                toast.error(msg);
            },
        });
    }
  };

  // Search Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterData('search', value);
    const query = {
      ...(value && { search: value }),
      ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
    };
    router.get(route('stocks.index'), query, { preserveState: true, preserveScroll: true });
  };

  const handleReset = () => {
    setFilterData('search', '');
    setFilterData('perPage', '10');
    setFilterData('dateFrom', null);
    setFilterData('dateTo', null);
    router.get(route('stocks.index'), {}, { preserveState: true, preserveScroll: true });
  };

  const handlePerPageChange = (value: string) => {
    setFilterData('perPage', value);
    const query = {
      ...(filtersForm.search && { search: filtersForm.search }),
      ...(value && { perPage: value }),
    };
    router.get(route('stocks.index'), query, { preserveState: true, preserveScroll: true });
  };

  // Exports
  const handleExportPDF = (stock: Stock) => {
    window.open(route('stocks.export.pdf.single', stock.id), '_blank');
  };

  const handleExportExcel = (stock: Stock) => {
    window.open(route('stocks.export.excel.single', stock.id), '_blank');
  };

  const handleBulkExportPDF = (ids: number[]) => {
    if (!ids.length) return toast.error('No stock records selected');
    const url = route('stocks.bulk-export.pdf', { ids: ids.join(',') });
    window.open(url, '_blank');
  };

  const handleBulkExportExcel = (ids: number[]) => {
    if (!ids.length) return toast.error('No stock records selected');
    const url = route('stocks.bulk-export.excel', { ids: ids.join(',') });
    window.open(url, '_blank');
  };

  const handleDateFilterChange = (dateFrom: string | null, dateTo: string | null) => {
    setFilterData((prev) => ({
        ...prev,
        dateFrom: dateFrom,
        dateTo: dateTo,
    }));

    const query = {
        ...(filtersForm.search && { search: filtersForm.search }),
        ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
        ...(dateFrom && { dateFrom: dateFrom }),
        ...(dateTo && { dateTo: dateTo }),
    };

    router.get(route('stocks.index'), query, { preserveState: true, preserveScroll: true });
  };

  // Unified Action Handler
  const handleCustomAction = (label: string, row: Stock) => {
    switch (label) {
        case 'Edit Policy':
            openModal('edit', row);
            break;
        case 'Request Transfer':
            toast.info(`Placeholder: Transfer request for ${row.product.name} at ${row.store.name} not yet implemented.`);
            break;
        case 'Export PDF':
            handleExportPDF(row);
            break;
        case 'Export Excel':
            handleExportExcel(row);
            break;
        default:
            toast.error(`Action "${label}" not configured.`);
            break;
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inventory" />
      <CustomToast />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
            <BoxesIcon size={26} className="text-orange-600 mr-1" />
            Inventory Levels Hub
        </h2>
        <p className="text-sm text-gray-600 max-w-2xxl">
            Here you can view inventory levels of all products across a specific store or all stores. Use the search and filters to quickly find products by name or SKU, and adjust reorder policies as needed.
        </p>

        {/* 🟢 LAYOUT FIX: Removed justify-between and wrapped Input+Button in a flex group */}
        <div className="mb-4 flex w-full flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex w-full sm:w-1/2 items-center gap-2">
                <Input
                    type="text"
                    value={filtersForm.search}
                    onChange={handleSearchChange}
                    className="h-10 w-full"
                    placeholder="Search Inventory..."
                    name="search"
                />
                <Button onClick={handleReset} className="h-10 shrink-0 cursor-pointer bg-orange-600 hover:bg-orange-500">
                    <X size={20} />
                </Button>
            </div>
        </div>

        {/* Table */}
        <ComplexTable
          moduleName="Inventory Levels"
          columns={StockTableConfig.columns}
          actions={StockTableConfig.actions}
          data={stocks.data}
          from={stocks.from}
          onView={(s: any) => openModal('view', s)}
          onCustomAction={handleCustomAction}
          onDelete={() => toast.error("Stock records cannot be directly deleted.")}
          onBulkDelete={() => toast.error("Bulk deletion of inventory is not permitted.")}
          onBulkExportPDF={handleBulkExportPDF}
          onBulkExportExcel={handleBulkExportExcel}
          onExportPDF={(s: any) => handleExportPDF(s)}
          onExportExcel={(s: any) => handleExportExcel(s)}
          isModal
          onDateFilterChange={handleDateFilterChange}
        />

        {/* Pagination */}
        {stocks.data && stocks.data.length > 0 && (
          <Pagination
            products={stocks}
            perPage={filtersForm.perPage}
            onPerPageChange={handlePerPageChange}
            totalCount={totalCount}
            filteredCount={filteredCount}
            search={filtersForm.search}
          />
        )}
      </div>

      {/* Modal Form for Policy Update/View */}
      <ComplexModalForm
        key={selectedStock ? `stock-edit-${selectedStock.id}` : 'stock-view'}
        title={mode === 'view' ? 'View Inventory Policy' : 'Update Reorder Policy'}
        description={StockModalFormConfig.description}
        fields={StockModalFormConfig.fields}
        buttons={StockModalFormConfig.buttons}
        data={data}
        setData={handleSetData}
        processing={processing}
        handleSubmit={handleSubmit}
        errors={errors}
        open={modalOpen}
        onOpenChange={(open: boolean) => {
          if (!open) closeModal();
          else setModalOpen(open);
        }}
        mode={mode}
        extraData={{}}
      />
    </AppLayout>
  );
}
