import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

import { PaymentSettingsTableConfig } from '@/components/config/tables/payment-settings-table';
import { PaymentSettingsModalFormConfig } from '@/components/config/forms/payment-settings-modal-form';

import SimpleModalForm from '@/components/simple-custom-modal-form';
import ComplexTable from '@/components/complex-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { CreditCard } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings' },
    { title: 'Payment Integration', href: '/settings/payments' },
];

export default function Index({ settings }: { settings: any }) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    // --- STATE ---
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selectedSetting, setSelectedSetting] = useState<any>(null);

    // 🟢 UPDATED: Initial Form Data to match Controller & Config
    const initialData = {
        provider: 'mpesa',
        type: 'paybill', // Default to Paybill
        business_number: '',
        account_number: '', // New Field
        consumer_key: '',
        consumer_secret: '',
        passkey: '',
        is_active: true,
    };

    const form = useForm(initialData);

    // --- HANDLERS ---
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleSetData = (key: string, value: any) => {
        form.setData(key as keyof typeof initialData, value);
    };

    const handleOpenEdit = (item: any) => {
        setMode('edit');
        setSelectedSetting(item);

        // 🟢 UNPACK DATA: The controller already sends unpacked JSON as flat fields
        form.setData({
            provider: item.provider,
            type: item.type || 'paybill',
            business_number: item.business_number,
            account_number: item.account_number || '', // Handle nulls
            is_active: Boolean(item.is_active),

            // Credentials (already unpacked by Controller resource)
            consumer_key: item.consumer_key || '',
            consumer_secret: item.consumer_secret || '',
            passkey: item.passkey || '',
        });

        setModalOpen(true);
    };

    const closeModal = () => {
        setMode('create');
        setSelectedSetting(null);
        form.reset();
        setModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'edit' && selectedSetting) {
            form.put(route('payment-settings.update', selectedSetting.id), {
                onSuccess: () => closeModal(),
                onError: () => toast.error('Failed to update settings.'),
            });
        } else {
            form.post(route('payment-settings.store'), {
                onSuccess: () => closeModal(),
                onError: () => toast.error('Failed to save settings.'),
            });
        }
    };

    const handleDelete = (item: any) => {
        if (confirm('Are you sure you want to delete this configuration?')) {
            router.delete(route('payment-settings.destroy', item.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Settings" />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h2 className="text-xl font-semibold text-gray-800 relative pb-2 before:absolute before:bottom-0 before:left-0 before:w-15 before:h-0.5 before:bg-orange-600 before:rounded-full flex items-center gap-2">
                    <CreditCard size={26} className="text-orange-600 mr-1" />
                    Payment Integrations
                </h2>
                <p className="text-sm text-gray-600">
                    Configure M-Pesa (Paybill/Till) credentials for this store.
                </p>

                <div className="mb-4 flex w-full justify-end">
                    <SimpleModalForm
                        title={mode === 'create' ? PaymentSettingsModalFormConfig.title : 'Edit Configuration'}
                        description={PaymentSettingsModalFormConfig.description}
                        fields={PaymentSettingsModalFormConfig.fields}
                        buttons={PaymentSettingsModalFormConfig.buttons}
                        data={form.data}
                        setData={handleSetData}
                        processing={form.processing}
                        handleSubmit={handleSubmit}
                        errors={form.errors}
                        open={modalOpen}
                        onOpenChange={(open) => {
                            if (!open) closeModal();
                            else setModalOpen(open);
                        }}
                        addButton={PaymentSettingsModalFormConfig.addButton}
                    />
                </div>

                <ComplexTable
                    moduleName={PaymentSettingsTableConfig.moduleName}
                    columns={PaymentSettingsTableConfig.columns}
                    actions={PaymentSettingsTableConfig.actions}
                    data={settings.data || settings}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    isModal={false}
                />
            </div>
        </AppLayout>
    );
}
