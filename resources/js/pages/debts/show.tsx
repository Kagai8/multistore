/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { route } from 'ziggy-js';

// Components
import ComplexTable from '@/components/complex-table';
import { CustomToast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button';
import { Wallet, User, Phone, Ban, FileText, ArrowLeft } from 'lucide-react';

// Config & Partials
import { DebtStatementTableConfig } from '@/components/config/tables/debt-statement-table';
import { DebtPaymentModal } from '@/components/Partials/DebtPaymentModal';
import { type BreadcrumbItem } from '@/types';

interface Props {
    customer: {
        id: number;
        name: string;
        phone: string;
        credit_limit: number;
        total_debt: number;
    };
    debts: any[];
}

export default function Show({ customer, debts }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Finance', href: '/finance' },
        { title: 'Debtors', href: '/debts' },
        { title: customer.name, href: `/debts/${customer.id}` },
    ];

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // 🟢 DYNAMIC TOTAL CALCULATION
    const selectedTotal = useMemo(() => {
        return debts
            .filter(d => selectedIds.includes(d.id))
            .reduce((sum, d) => sum + Number(d.balance), 0);
    }, [debts, selectedIds]);

    const handlePaySelected = () => {
        setShowPaymentModal(true);
    };

    const handlePayOnAccount = () => {
        setSelectedIds([]); // Clear specific selection to imply "Lump Sum"
        setShowPaymentModal(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Statement: ${customer.name}`} />
            <CustomToast />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">

                {/* 1. HEADER CARD */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-full"
                                onClick={() => window.history.back()}
                            >
                                <ArrowLeft size={16} />
                            </Button>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <User className="text-orange-600" />
                                {customer.name}
                            </h2>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 pl-8">
                            <span className="flex items-center gap-1"><Phone size={14} /> {customer.phone || 'No Phone'}</span>
                            <span className="flex items-center gap-1">
                                <Ban size={14} className="text-red-500" />
                                Limit: {Number(customer.credit_limit).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="text-right bg-orange-50 px-6 py-3 rounded-lg border border-orange-100 min-w-[200px]">
                        <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">Total Outstanding</div>
                        <div className="text-3xl font-black text-gray-900 mt-1">
                            <span className="text-lg text-gray-500 font-medium mr-1">KSh</span>
                            {Number(customer.total_debt).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* 2. ACTION BAR */}
                <div className={`flex justify-between items-center p-3 rounded-lg border transition-all ${selectedIds.length > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>

                    <div className="flex items-center gap-2">
                        {selectedIds.length > 0 ? (
                            <>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                                    {selectedIds.length}
                                </span>
                                <span className="text-sm font-bold text-emerald-800">
                                    Selected Total: KSh {selectedTotal.toLocaleString()}
                                </span>
                            </>
                        ) : (
                            <span className="text-sm text-gray-500 italic flex items-center gap-2">
                                <FileText size={16} /> Select invoices below to pay specific items.
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Statement Export */}
                        <Button
                            variant="outline"
                            className="bg-white border-gray-300 text-gray-700"
                            onClick={() => window.open(route('debts.export.statement', customer.id), '_blank')}
                        >
                            <FileText size={16} className="mr-2" /> Statement PDF
                        </Button>

                        {/* Pay Button (Changes based on selection) */}
                        <Button
                            onClick={selectedIds.length > 0 ? handlePaySelected : handlePayOnAccount}
                            className={`flex items-center gap-2 text-white shadow-sm ${selectedIds.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                        >
                            <Wallet size={18} />
                            {selectedIds.length > 0
                                ? `Pay Selected (${selectedTotal.toLocaleString()})`
                                : "Pay On Account"
                            }
                        </Button>
                    </div>
                </div>

                {/* 3. TABLE */}
                <ComplexTable
                    moduleName={DebtStatementTableConfig.moduleName}
                    columns={DebtStatementTableConfig.columns}
                    actions={DebtStatementTableConfig.actions}
                    data={debts}
                    // 🟢 THIS IS THE KEY: Tracking Selection
                    onSelectionChange={(ids) => setSelectedIds(ids)}
                    // Disable bulk delete/export default buttons to keep UI clean, we use custom Pay button
                    isModal={false}
                />

            </div>

            {/* 4. PAYMENT MODAL */}
            <DebtPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                customer={customer}
                // Logic: If IDs selected, pre-fill that sum. Else pre-fill total debt (for lump sum)
                preFilledAmount={selectedIds.length > 0 ? selectedTotal : customer.total_debt}
                // Pass selected IDs so backend can allocate specifically
                selectedDebtIds={selectedIds} // Pass the IDs to the modal
            />

        </AppLayout>
    );
}
