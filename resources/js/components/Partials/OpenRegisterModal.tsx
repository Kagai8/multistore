import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useForm } from '@inertiajs/react'; // 🟢 Added Link
import { ArrowLeft, DollarSign, Loader2, Store } from 'lucide-react'; // 🟢 Added ArrowLeft
import React from 'react';
import { route } from 'ziggy-js';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl duration-200 animate-in zoom-in-95">
                {/* Header */}
                <div className="border-b bg-slate-50 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <Store size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Open Register
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Start a new sales shift
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Opening Cash Float (KSh)
                        </label>
                        <div className="relative">
                            <DollarSign
                                className="absolute top-2.5 left-3 text-gray-400"
                                size={18}
                            />
                            <Input
                                type="number"
                                value={data.opening_cash}
                                onChange={(e) =>
                                    setData('opening_cash', e.target.value)
                                }
                                className="pl-10 text-lg font-bold"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        {errors.opening_cash && (
                            <p className="text-xs text-red-500">
                                {errors.opening_cash}
                            </p>
                        )}
                        <p className="text-xs text-gray-500">
                            Enter the total cash currently in the drawer.
                        </p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Button
                            type="submit"
                            className="h-12 w-full bg-orange-600 text-lg shadow-md shadow-orange-200 hover:bg-orange-700"
                            disabled={processing}
                        >
                            {processing ? (
                                <Loader2 className="mr-2 animate-spin" />
                            ) : null}
                            Open Register
                        </Button>

                        {/* 🟢 GO BACK LINK */}
                        <div className="text-center">
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 transition-all hover:text-gray-600 hover:underline"
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
