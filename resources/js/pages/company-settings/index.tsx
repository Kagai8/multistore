/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// Configs
import { CompanySettingTableConfig } from '@/components/config/tables/company-setting-table';
import { CompanySettingFormConfig } from '@/components/config/forms/company-setting-modal-form';

// Components
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // 🟢 Standard Dialog
import { X, Building2, CheckCircle, Calendar } from 'lucide-react';
import Pagination from '@/components/ui/pagination';
import { type BreadcrumbItem } from '@/types';
import { SuccessModal } from '@/components/success-modal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings' },
    { title: 'Company Profiles', href: '/company-settings' },
];

interface CompanySetting {
    id: number;
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    tax_pin: string;
    is_default: boolean;
    logo_url: string | null;
    receipt_footer: string;
    slogan: string;
    website: string;
}

interface IndexProps {
    settings: { data: CompanySetting[]; links: any[]; from: number; to: number; total: number };
    filters: any;
    totalCount: number;
    filteredCount: number;
    stats: { total_profiles: number; has_default: boolean; last_updated: string };
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

export default function Index({ settings, filters, totalCount, filteredCount, stats }: IndexProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    // State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSetting, setSelectedSetting] = useState<CompanySetting | null>(null);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const filterForm = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
    });

    const form = useForm<any>({
        name: '', phone: '', email: '', address: '', city: '', tax_pin: '',
        receipt_footer: '', slogan: '', website: '', logo: null
    });

    useEffect(() => {
        if (flash?.success) {
            setSuccessMessage(flash.success);
            setShowSuccessModal(true);
        } else if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // --- HANDLERS ---

    const handleCreate = () => {
        setMode('create');
        setSelectedSetting(null);
        form.reset();
        setModalOpen(true);
    };

    const handleEdit = (setting: CompanySetting) => {
        setMode('edit');
        setSelectedSetting(setting);
        form.setData({
            name: setting.name,
            phone: setting.phone,
            email: setting.email,
            address: setting.address,
            city: setting.city,
            tax_pin: setting.tax_pin,
            receipt_footer: setting.receipt_footer,
            slogan: setting.slogan,
            website: setting.website,
            logo: null
        });
        setModalOpen(true);
    };

    const handleDelete = (setting: CompanySetting) => {
        if (confirm(`Are you sure you want to delete ${setting.name}?`)) {
            router.delete(route('company-settings.destroy', setting.id));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => { setModalOpen(false); form.reset(); },
            onError: () => toast.error('Check form errors.'),
            forceFormData: true
        };

        if (mode === 'create') {
            form.post(route('company-settings.store'), options);
        } else {
            form.transform((data) => ({ ...data, _method: 'PUT' }));
            form.post(route('company-settings.update', selectedSetting!.id), options);
        }
    };

    const handleCustomAction = (label: string, row: CompanySetting) => {
        if (label === 'Set Default') {
            router.post(route('company-settings.set-default', row.id));
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        filterForm.setData('search', value);
        router.get(route('company-settings.index'), { ...filterForm.data, search: value }, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        filterForm.setData('search', '');
        router.get(route('company-settings.index'), {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company Settings" />
            <CustomToast />
            <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} title="Success" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                    <Building2 size={26} className="text-orange-600 mr-1" />
                    Company Profiles
                </h2>
                <p className="text-sm text-gray-600 mb-2">
                    Manage company details, logos, and receipt headers.
                </p>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3 mb-2">
                    <StatCard title="Total Profiles" value={stats.total_profiles} icon={Building2} colorClass="text-blue-600 bg-blue-100" subText="Configured entities" />
                    <StatCard title="Default Active" value={stats.has_default ? 'Yes' : 'No'} icon={CheckCircle} colorClass={stats.has_default ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"} subText="Primary receipt profile" />
                    <StatCard title="Last Updated" value={stats.last_updated} icon={Calendar} colorClass="text-orange-600 bg-orange-100" subText="Latest modification" />
                </div>

                <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <div className="flex w-full sm:w-1/2 items-center gap-2">
                        <Input type="text" value={filterForm.data.search} onChange={handleSearchChange} className="h-10 w-full" placeholder="Search Name, Phone or Email..." />
                        <Button onClick={handleReset} className="h-10 shrink-0 cursor-pointer bg-orange-600 hover:bg-orange-500 px-3"><X size={20} /></Button>
                    </div>

                    {/* 🟢 Render Add Button from Config */}
                    {CompanySettingFormConfig.addButton && (
                        <div className="ml-auto">
                            <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2">
                                <CompanySettingFormConfig.addButton.icon size={18} />
                                {CompanySettingFormConfig.addButton.label}
                            </Button>
                        </div>
                    )}
                </div>

                <ComplexTable
                    moduleName={CompanySettingTableConfig.moduleName}
                    columns={CompanySettingTableConfig.columns}
                    actions={CompanySettingTableConfig.actions}
                    data={settings.data}
                    from={settings.from}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCustomAction={handleCustomAction}
                    isModal={true}
                />

                {settings.data && settings.data.length > 0 && (
                    <Pagination products={settings} perPage={filterForm.data.perPage} onPerPageChange={(val) => { filterForm.setData('perPage', val); router.get(route('company-settings.index'), { ...filterForm.data, perPage: val }); }} totalCount={totalCount} filteredCount={filteredCount} search={filterForm.data.search} />
                )}
            </div>

            {/* 🟢 STANDARD SIMPLE MODAL (Using Dialog) */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{mode === 'create' ? 'Create Profile' : 'Edit Profile'}</DialogTitle>
                        <DialogDescription>{CompanySettingFormConfig.description}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {CompanySettingFormConfig.fields.map((field) => (
                                <div key={field.name} className={field.type === 'textarea' || field.type === 'file' ? 'col-span-2' : ''}>
                                    <Label htmlFor={field.name}>{field.label}</Label>

                                    {field.type === 'textarea' ? (
                                        <Textarea
                                            id={field.name}
                                            value={form.data[field.name] || ''}
                                            onChange={(e) => form.setData(field.name, e.target.value)}
                                            className="mt-1"
                                            placeholder={field.placeholder}
                                        />
                                    ) : field.type === 'file' ? (
                                        <Input
                                            id={field.name}
                                            type="file"
                                            accept={field.accept}
                                            onChange={(e) => form.setData(field.name, e.target.files ? e.target.files[0] : null)}
                                            className="mt-1 cursor-pointer"
                                        />
                                    ) : (
                                        <div className="relative mt-1">
                                            {field.icon && <field.icon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />}
                                            <Input
                                                id={field.name}
                                                type={field.type}
                                                value={form.data[field.name] || ''}
                                                onChange={(e) => form.setData(field.name, e.target.value)}
                                                className={field.icon ? 'pl-9' : ''}
                                                placeholder={field.placeholder}
                                            />
                                        </div>
                                    )}
                                    {form.errors[field.name] && (
                                        <p className="text-red-500 text-xs mt-1">{form.errors[field.name]}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.processing} className="bg-orange-600 hover:bg-orange-700">
                                {form.processing ? 'Saving...' : 'Save Profile'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
