/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BrandTableConfig } from '@/components/config/tables/brand-table';
import { BrandModalFormConfig } from '@/components/config/forms/brand-modal-form';
import CustomTable from '@/components/custom-table';
import SimpleModalForm from '@/components/simple-custom-modal-form';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Tag, AlertTriangle } from 'lucide-react'; // 🟢 Added AlertTriangle
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';

// --- TYPES ---
interface AuthPageProps {
    [key: string]: any;
    auth: {
        permissions: string[];
    };
    flash?: { success?: string; error?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Brands', href: '/brands' },
    { title: 'Manage Brands', href: '/brands' },
];

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface Brand {
    id: number;
    name: string;
    slug?: string;
    description?: string | null;
    logo?: string | null;
    created_at: string;
    products_count?: number; // 🟢 Essential for "Smart Delete"
}

interface BrandPagination {
    data: Brand[];
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
    brands: BrandPagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
}
// --- END TYPES ---


export default function Index({ brands, filters, totalCount, filteredCount }: IndexProps) {
    const { flash } = usePage<AuthPageProps>().props;
    const flashMessage = flash?.success || flash?.error;

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'view' | 'edit'>('create');
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

    // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [brandsToBulkDeleteIds, setBrandsToBulkDeleteIds] = useState<number[]>([]);

    // Form for creating/editing
    const { data, setData, reset, errors, processing, post } = useForm({
        name: '',
        description: '',
        logo: null as File | null,
        _method: 'POST',
    });

    // Filter form (search and perPage)
    const { data: filtersForm, setData: setFilterData } = useForm<FilterProps>({
        search: filters.search || '',
        perPage: filters.perPage || '10',
        dateFrom: filters.dateFrom || null,
        dateTo: filters.dateTo || null,
    });

    // Handle File Input Correctly
    const handleSetData = (key: string, value: any) => {
        setData(key, value);
        if (key === 'logo' && value instanceof File) {
            const url = URL.createObjectURL(value);
            setMainImagePreview(url);
        } else if (key === 'logo' && value === null) {
             setMainImagePreview(null);
        }
    };

    // Auto-hide toast after 3s (Global Listener)
    useEffect(() => {
        if (flashMessage) {
            const type = flash.success ? 'success' : flash.error ? 'error' : 'warning';
            toast[type](flashMessage);
        }
    }, [flashMessage, flash]);

    // Search Handler
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilterData('search', value);

        const query = {
            ...(value && { search: value }),
            ...(filtersForm.perPage && { perPage: filtersForm.perPage }),
            ...(filtersForm.dateFrom && { dateFrom: filtersForm.dateFrom }),
            ...(filtersForm.dateTo && { dateTo: filtersForm.dateTo }),
        };

        router.get(route('brands.index'), query, { preserveState: true, preserveScroll: true });
    };

    // Reset Filters
    const handleReset = () => {
        setFilterData('search', '');
        setFilterData('perPage', '10');
        setFilterData('dateFrom', null);
        setFilterData('dateTo', null);
        router.get(route('brands.index'), {}, { preserveState: true, preserveScroll: true });
    };

    // Per Page Change
    const handlePerPageChange = (value: string) => {
        setFilterData('perPage', value);
        const query = {
            ...(filtersForm.search && { search: filtersForm.search }),
            ...(value && { perPage: value }),
            ...(filtersForm.dateFrom && { dateFrom: filtersForm.dateFrom }),
            ...(filtersForm.dateTo && { dateTo: filtersForm.dateTo }),
        };
        router.get(route('brands.index'), query, { preserveState: true, preserveScroll: true });
    };

    // Date Filter Handler
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

        router.get(route('brands.index'), query, { preserveState: true, preserveScroll: true });
    };

    // Open Modal Logic
    const openModal = (m: 'create' | 'view' | 'edit', brand?: Brand) => {
        setMode(m);

        if (brand) {
            setData((prev) => ({
                ...prev,
                id: brand.id as any,
                name: brand.name,
                description: brand.description || '',
                logo: null,
                _method: 'PUT',
            }));
            setSelectedBrand(brand);
            setMainImagePreview(brand.logo || null);
        } else {
            reset();
            setSelectedBrand(null);
            setMainImagePreview(null);
            setData('_method', 'POST' as any);
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setMode('create');
        setSelectedBrand(null);
        setMainImagePreview(null);
        reset();
        setModalOpen(false);
    };

    // Submit Handler
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const actionRoute = selectedBrand ? route('brands.update', selectedBrand.id) : route('brands.store');

        post(actionRoute, {
            forceFormData: true,
            onSuccess: () => {
                // 🟢 FIX: Removed toast.success() to prevent double toast
                closeModal();
            },
            onError: (err: any) => {
                const msg = err?.message || (selectedBrand ? 'Failed to update brand.' : 'Failed to create brand.');
                toast.error(msg);
            },
        });
    };

    // Delete Logic
    const handleDelete = (brand: Brand) => {
        setBrandToDelete(brand);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!brandToDelete) return;
        router.delete(route('brands.destroy', brandToDelete.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setBrandToDelete(null);
            },
            onError: () => toast.error('Failed to delete brand'),
            preserveScroll: true,
            preserveState: true,
        });
    };

    // Single Export Logic
    const handleExportPDF = (brand: Brand) => {
        window.open(route('brands.exportSinglePdf', brand.id), '_blank');
    };

    const handleExportExcel = (brand: Brand) => {
        window.open(route('brands.exportSingleExcel', brand.id), '_blank');
    };

    // 🟢 BULK ACTIONS HELPERS
    const handleBulkDelete = (ids: number[]) => {
        if (!ids.length) return toast.error('No brands selected');
        setBrandsToBulkDeleteIds(ids);
        setShowBulkDeleteModal(true);
    };

    // Calculate total products affected by bulk selection
    const getBulkAffectedCount = () => {
        return brands.data
            .filter((b) => brandsToBulkDeleteIds.includes(b.id))
            .reduce((sum, b) => sum + (b.products_count || 0), 0);
    };

    const confirmBulkDelete = () => {
        const ids = brandsToBulkDeleteIds;
        if (!ids.length) return;

        router.post(
            route('brands.bulk-delete'),
            { ids },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // 🟢 FIX: Removed toast.success()
                    setShowBulkDeleteModal(false);
                    setBrandsToBulkDeleteIds([]);
                },
                onError: () => {
                    toast.error('Failed to delete selected brands');
                    setShowBulkDeleteModal(false);
                    setBrandsToBulkDeleteIds([]);
                }
            }
        );
    };

    const handleBulkExportPDF = (ids: number[]) => {
        if (!ids.length) return toast.error('No brands selected');
        const url = route('brands.bulk-export-pdf') + `?ids=${ids.join(',')}`;
        window.open(url, '_blank');
    };

    const handleBulkExportExcel = (ids: number[]) => {
        if (!ids.length) return toast.error('No brands selected');
        const url = route('brands.bulk-export-excel') + `?ids=${ids.join(',')}`;
        window.open(url, '_blank');
    };

    const handleDownloadTemplate = () => {
        window.open(route('brands.download-template'), '_blank');
    };

    // Import Handler
    const handleFileSelected = (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        router.post(route('brands.import'), formData, {
            forceFormData: true,
            onStart: () => toast.loading('Importing...', { id: 'import' }),
            onSuccess: () => {
                // 🟢 FIX: Dismiss loading toast, let global useEffect handle success
                toast.dismiss('import');
            },
            onError: (errors: any) => {
                const errorMessage = errors?.file || 'Failed to import file. Check file format.';
                toast.error(errorMessage, { id: 'import' });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Brands" />
        <CustomToast />

        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
             <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                <Tag size={26} className="text-orange-600" />
                Brand Management Hub
            </h2>
            <p className="text-sm text-gray-600 max-w-2xxl">
                Create new brands, update and view existing ones, and organize your brand information efficiently. Use the filters to get reporting data as needed.
            </p>

            {/* Filters */}
            <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                <Input
                    type="text"
                    value={filtersForm.search}
                    onChange={handleSearchChange}
                    className="h-10 w-full sm:w-1/2"
                    placeholder="Search Brand..."
                    name="search"
                />

                <Button onClick={handleReset} className="h-10 cursor-pointer bg-orange-600 hover:bg-orange-500">
                    <X size={20} />
                </Button>

                <div className="ml-auto">
                    <SimpleModalForm
                        title={mode === 'view' ? 'View Brand' : mode === 'edit' ? 'Update Brand' : BrandModalFormConfig.title}
                        description={BrandModalFormConfig.description}
                        fields={BrandModalFormConfig.fields}
                        buttons={BrandModalFormConfig.buttons}
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
                        mainImagePreview={mainImagePreview}
                        addButton={BrandModalFormConfig.addButton}
                    />
                </div>
            </div>

            {/* Table */}
            <CustomTable
                moduleName="Brand"
                importPermission="import-brand"
                downloadTemplatePermission="download-template-brand"
                columns={BrandTableConfig.columns}
                actions={BrandTableConfig.actions}
                data={brands.data}
                from={brands.from}
                onView={(b: any) => openModal('view', b)}
                onEdit={(b: any) => openModal('edit', b)}
                onDelete={handleDelete}
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onBulkDelete={handleBulkDelete}
                onBulkExportPDF={handleBulkExportPDF}
                onBulkExportExcel={handleBulkExportExcel}
                isModal
                onDownloadTemplate={handleDownloadTemplate}
                onFileSelected={handleFileSelected}
                onDateFilterChange={handleDateFilterChange}
            />

            {/* Pagination */}
            {brands.data && brands.data.length > 0 && (
                <Pagination
                    products={brands}
                    perPage={filtersForm.perPage}
                    onPerPageChange={handlePerPageChange}
                    totalCount={totalCount}
                    filteredCount={filteredCount}
                    search={filtersForm.search}
                />
            )}
        </div>

        {/* 🟢 SMART DELETE MODAL */}
        {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                        <AlertTriangle className="h-6 w-6" />
                        <h2 className="text-lg font-semibold">Confirm Deletion</h2>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                        <p>
                            Are you sure you want to delete <span className="font-bold text-gray-800">{brandToDelete?.name}</span>?
                        </p>

                        {(brandToDelete?.products_count || 0) > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-orange-800">
                                <span className="font-bold">Warning:</span> This brand is currently assigned to
                                <span className="font-bold text-lg mx-1">{brandToDelete?.products_count}</span>
                                products. Deleting it may detach these products or cause data issues.
                            </div>
                        )}

                        <p>This action cannot be undone.</p>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Yes, Delete</Button>
                    </div>
                </div>
            </div>
        )}

        {/* 🟢 SMART BULK DELETE MODAL */}
        {showBulkDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                        <AlertTriangle className="h-6 w-6" />
                        <h2 className="text-lg font-semibold">Bulk Delete Warning</h2>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                        <p>
                            You are about to delete <span className="font-bold text-gray-800">{brandsToBulkDeleteIds.length} brands</span>.
                        </p>

                        {getBulkAffectedCount() > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
                                <span className="font-bold">CRITICAL:</span> These brands affect a total of
                                <span className="font-bold text-lg mx-1">{getBulkAffectedCount()}</span>
                                products. This could significantly impact your inventory.
                            </div>
                        )}

                        <p>Are you absolutely sure?</p>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)}>Cancel</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmBulkDelete}>Confirm Bulk Delete</Button>
                    </div>
                </div>
            </div>
        )}

        </AppLayout>
    );
}
