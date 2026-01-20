import React from 'react';
import { route } from 'ziggy-js';
import { useForm, Link } from '@inertiajs/react'; // 🟢 Added Link
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Store, DollarSign, Loader2, ArrowLeft } from 'lucide-react'; // 🟢 Added ArrowLeft

export default function OpenRegisterModal({ show }: { show: boolean }) {
    // 🟢 1. Hooks MUST come first (Always run)
    const { data, setData, post, processing, errors } = useForm({
        opening_cash: '0',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('pos.open'));
    };

    // 🟢 2. Conditional Return comes AFTER hooks
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-50 border-b p-6 text-center">
                    <div className="mx-auto bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-orange-600">
                        <Store size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Open Register</h2>
                    <p className="text-sm text-gray-500 mt-1">Start a new sales shift</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Opening Cash Float (KSh)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <Input
                                type="number"
                                value={data.opening_cash}
                                onChange={(e) => setData('opening_cash', e.target.value)}
                                className="pl-10 text-lg font-bold"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        {errors.opening_cash && <p className="text-xs text-red-500">{errors.opening_cash}</p>}
                        <p className="text-xs text-gray-500">Enter the total cash currently in the drawer.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Button
                            type="submit"
                            className="w-full bg-orange-600 hover:bg-orange-700 text-lg h-12 shadow-md shadow-orange-200"
                            disabled={processing}
                        >
                            {processing ? <Loader2 className="animate-spin mr-2" /> : null}
                            Open Register
                        </Button>

                        {/* 🟢 GO BACK LINK */}
                        <div className="text-center">
                            <Link
                                href={route('dashboard')}
                                className="text-xs text-gray-400 hover:text-gray-600 font-medium inline-flex items-center gap-1 hover:underline transition-all"
                            >
                                <ArrowLeft size={12} />
                                Go back to Dashboard
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
