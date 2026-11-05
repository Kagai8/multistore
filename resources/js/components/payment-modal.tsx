/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    Ban,
    Banknote,
    Building,
    CheckCircle2,
    CreditCard,
    DollarSign,
    Loader2,
    Lock,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    Smartphone,
    SmartphoneNfc,
    Split,
    UserCheck,
    Wallet,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';

// --- TYPES ---
interface PaymentModalProps {
    invoice: any;
    isOpen: boolean;
    onClose: () => void;
}

type PaymentMethod =
    | 'cash'
    | 'mpesa'
    | 'card'
    | 'bank_transfer'
    | 'credit_limit'
    | 'other';
type MpesaMode = 'stk' | 'c2b' | 'manual';
type StkStatus =
    | 'idle'
    | 'sending'
    | 'verifying'
    | 'waiting_for_pin'
    | 'success'
    | 'failed';

interface PaymentLine {
    id: number;
    method: PaymentMethod;
    amount: number | string;
    transaction_ref: string;
    mpesaMode?: MpesaMode;
    mpesaPhone?: string;
    verified?: boolean;
}

const PAYMENT_METHODS: {
    id: PaymentMethod;
    label: string;
    icon: React.ElementType;
    color: string;
    requiresRef: boolean;
}[] = [
    {
        id: 'cash',
        label: 'Cash',
        icon: Banknote,
        color: 'text-green-600 bg-green-50 border-green-200',
        requiresRef: false,
    },
    {
        id: 'mpesa',
        label: 'M-Pesa',
        icon: Smartphone,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        requiresRef: true,
    },
    {
        id: 'card',
        label: 'Card',
        icon: CreditCard,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        requiresRef: true,
    },
    {
        id: 'bank_transfer',
        label: 'Bank',
        icon: Building,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        requiresRef: true,
    },
    {
        id: 'credit_limit',
        label: 'Credit',
        icon: UserCheck,
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        requiresRef: false,
    },
];

// --- STATUS DIALOG (The Popup) ---
const StkStatusDialog = ({
    status,
    errorMsg,
    onClose,
}: {
    status: StkStatus;
    errorMsg: string;
    onClose: () => void;
}) => {
    if (status === 'idle') return null;

    return (
        <Dialog
            open={true}
            onOpenChange={() =>
                status === 'failed' || status === 'success' ? onClose() : null
            }
        >
            <DialogContent className="py-10 text-center sm:max-w-sm">
                {status === 'sending' && (
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-16 w-16 animate-spin text-emerald-600" />
                        <h3 className="text-lg font-bold text-gray-700">
                            Contacting Safaricom...
                        </h3>
                    </div>
                )}
                {status === 'verifying' && (
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-gray-700">
                                Checking Records...
                            </h3>
                            <p className="text-sm text-gray-500">
                                Searching for payment...
                            </p>
                        </div>
                    </div>
                )}
                {status === 'waiting_for_pin' && (
                    <div className="flex flex-col items-center space-y-4 animate-in fade-in">
                        <div className="relative">
                            <SmartphoneNfc className="h-20 w-20 animate-pulse text-blue-600" />
                            <span className="absolute top-0 right-0 flex h-4 w-4">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex h-4 w-4 rounded-full bg-blue-500"></span>
                            </span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-gray-800">
                                Check Customer Phone
                            </h3>
                            <p className="text-sm text-gray-500">
                                Waiting for PIN entry...
                            </p>
                        </div>
                    </div>
                )}
                {status === 'success' && (
                    <div className="flex flex-col items-center space-y-4 duration-300 animate-in zoom-in">
                        <CheckCircle2 className="h-20 w-20 text-green-500" />
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-green-700">
                                Confirmed!
                            </h3>
                            <p className="text-sm text-gray-500">
                                Payment Verified Successfully.
                            </p>
                        </div>
                    </div>
                )}
                {status === 'failed' && (
                    <div className="flex flex-col items-center space-y-4 duration-300 animate-in zoom-in">
                        <Ban className="h-20 w-20 text-red-500" />
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-red-700">
                                Verification Failed
                            </h3>
                            <p className="px-4 text-sm text-red-600">
                                {errorMsg}
                            </p>
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

// --- PAYMENT ROW ---
const PaymentRow = ({
    line,
    onChange,
    onRemove,
    creditLimit,
    isSingleMode,
    onAutoSubmit,
}: {
    line: PaymentLine;
    onChange: (updates: Partial<PaymentLine>) => void;
    onRemove?: () => void;
    creditLimit: number;
    isSingleMode?: boolean;
    onAutoSubmit: () => void;
}) => {
    // 🟢 Use the prop 'verified' if available, otherwise assume false
    const isPaid = line.verified || false;

    const [stkStatus, setStkStatus] = useState<StkStatus>('idle');
    const [stkError, setStkError] = useState('');
    const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, []);

    // Prevent Enter Key from submitting the form inside inputs
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    // --- A. STK PUSH LOGIC ---
    const handleStkPush = async () => {
        if (!line.mpesaPhone || line.mpesaPhone.length < 9) {
            alert('Please enter a valid phone number');
            return;
        }
        if (!line.amount || Number(line.amount) <= 0) {
            alert('Enter an amount first.');
            return;
        }

        setStkStatus('sending');
        setStkError('');

        try {
            const response = await axios.post('/mpesa/stk-push', {
                phone: line.mpesaPhone,
                amount: line.amount,
            });

            if (response.data.success) {
                const checkoutId = response.data.checkout_request_id;
                setStkStatus('waiting_for_pin');
                startPolling(checkoutId);
            }
        } catch (error: any) {
            setStkStatus('failed');
            setStkError(error.response?.data?.error || 'Connection failed');
        }
    };

    const startPolling = (checkoutId: string) => {
        let attempts = 0;
        const maxAttempts = 20;

        pollInterval.current = setInterval(async () => {
            attempts++;
            try {
                const res = await axios.get(`/api/mpesa/status/${checkoutId}`);
                const status = res.data.status;

                if (status === 'COMPLETED') {
                    if (pollInterval.current)
                        clearInterval(pollInterval.current);

                    // 🟢 Update Parent State: Verified = True
                    onChange({
                        transaction_ref:
                            res.data.transaction_code || checkoutId,
                        verified: true,
                    });

                    setStkStatus('success');
                    // Wait for the green tick animation, then trigger submit check
                    setTimeout(() => {
                        setStkStatus('idle');
                        onAutoSubmit();
                    }, 1500);
                } else if (status === 'FAILED') {
                    if (pollInterval.current)
                        clearInterval(pollInterval.current);
                    setStkStatus('failed');
                    setStkError(res.data.result_desc || 'User Cancelled');
                } else if (attempts >= maxAttempts) {
                    if (pollInterval.current)
                        clearInterval(pollInterval.current);
                    setStkStatus('failed');
                    setStkError('Timeout: No response from M-Pesa');
                }
            } catch {
                console.log('Polling...', attempts);
            }
        }, 3000);
    };

    // --- B. MANUAL VERIFY LOGIC (Find by Phone) ---
    const handleManualVerify = async () => {
        // 1. Validation Checks
        if (!line.mpesaPhone || line.mpesaPhone.length < 9) {
            alert("Please enter the customer's phone number to verify.");
            return;
        }
        if (!line.amount || Number(line.amount) <= 0) {
            alert('Enter the Amount paid before verifying.');
            return;
        }

        setStkStatus('verifying');
        setStkError('');

        try {
            const response = await axios.post('/api/mpesa/verify', {
                phone: line.mpesaPhone,
                amount: line.amount,
            });

            if (response.data.success) {
                const realCode = response.data.data.transaction_code;

                // 🟢 Success! Update Parent
                onChange({
                    transaction_ref: realCode,
                    verified: true,
                });

                setStkStatus('success');
                // Wait for the green tick animation, then trigger submit check
                setTimeout(() => {
                    setStkStatus('idle');
                    onAutoSubmit();
                }, 1500);
            }
        } catch (error: any) {
            setStkStatus('failed');
            setStkError(
                error.response?.data?.error ||
                    'Payment not found yet. Please wait for SMS.',
            );
        }
    };

    // --- C. CREDIT LOGIC ---
    const handleVerifyCredit = () => {
        const amt = Number(line.amount);
        if (amt <= 0) {
            alert('Enter amount first');
            return;
        }
        if (amt > creditLimit) {
            alert(
                `Insufficient Credit. Available: ${creditLimit.toLocaleString()}`,
            );
            return;
        }
        // 🟢 Success! Update Parent
        onChange({ verified: true });
        onAutoSubmit();
    };

    const isRefRequired =
        PAYMENT_METHODS.find((m) => m.id === line.method)?.requiresRef || false;
    const isCreditLow =
        line.method === 'credit_limit' && Number(line.amount) > creditLimit;

    // Locked Styling (Green if Verified)
    const containerClass = isPaid
        ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500 opacity-90'
        : isSingleMode
          ? 'border-transparent p-0'
          : 'bg-gray-50 border-gray-200 shadow-sm';

    return (
        <div
            className={`space-y-4 rounded-xl border p-4 transition-all ${containerClass}`}
        >
            <StkStatusDialog
                status={stkStatus}
                errorMsg={stkError}
                onClose={() => setStkStatus('idle')}
            />

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map((m) => {
                        const isActive = line.method === m.id;
                        if (isPaid && !isActive) return null;

                        return (
                            <button
                                key={m.id}
                                type="button"
                                disabled={isPaid}
                                onClick={() => onChange({ method: m.id })}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${isActive ? `border-emerald-500 bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-500` : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'} ${isPaid ? 'cursor-default' : ''}`}
                            >
                                <m.icon size={18} />
                                <span className="text-xs font-semibold">
                                    {m.label}
                                </span>
                                {isPaid && (
                                    <CheckCircle2
                                        size={16}
                                        className="ml-1 fill-emerald-100 text-emerald-600"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
                {onRemove && !isPaid && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-1 text-gray-400 hover:text-red-500"
                    >
                        <X size={18} />
                    </button>
                )}
                {isPaid && (
                    <div className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                        <Lock size={12} /> VERIFIED
                    </div>
                )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase">
                    Amount
                </Label>
                <div className="relative">
                    <span className="absolute top-2.5 left-3 font-bold text-gray-400">
                        $
                    </span>
                    <Input
                        type="number"
                        disabled={isPaid}
                        onKeyDown={handleKeyDown} // 🟢 Block Enter Key
                        className={`bg-white pl-8 text-lg font-bold ${isPaid ? 'bg-gray-50 text-gray-500' : ''}`}
                        value={line.amount}
                        onChange={(e) => onChange({ amount: e.target.value })}
                        placeholder="0.00"
                    />
                </div>
                {line.method === 'credit_limit' && (
                    <div
                        className={`flex items-center gap-2 text-xs ${isCreditLow ? 'font-bold text-red-600' : 'text-blue-600'}`}
                    >
                        <AlertCircle size={14} />
                        <span>Available: {creditLimit.toLocaleString()}</span>
                    </div>
                )}
            </div>

            {/* Credit Button */}
            {line.method === 'credit_limit' && !isPaid && (
                <div className="animate-in fade-in slide-in-from-top-1">
                    <Button
                        type="button"
                        onClick={handleVerifyCredit}
                        className="w-full bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                        size="sm"
                    >
                        <ShieldCheck size={16} className="mr-2" /> Check Limit &
                        Verify
                    </Button>
                </div>
            )}

            {/* M-Pesa Content */}
            {line.method === 'mpesa' && (
                <div
                    className={`space-y-3 rounded-lg p-3 transition-all ${isPaid ? 'bg-transparent p-0' : 'border border-emerald-100 bg-emerald-50/80'}`}
                >
                    {!isPaid && (
                        <div className="flex gap-2 border-b border-emerald-200/50 pb-2">
                            {(['stk', 'c2b', 'manual'] as MpesaMode[]).map(
                                (mMode) => (
                                    <button
                                        key={mMode}
                                        type="button"
                                        onClick={() =>
                                            onChange({ mpesaMode: mMode })
                                        }
                                        className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase transition-colors ${line.mpesaMode === mMode ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-100'}`}
                                    >
                                        {mMode === 'c2b'
                                            ? 'Paybill'
                                            : mMode === 'stk'
                                              ? 'STK Push'
                                              : 'Manual'}
                                    </button>
                                ),
                            )}
                        </div>
                    )}

                    {line.mpesaMode === 'stk' && (
                        <div className="flex gap-2">
                            <Input
                                placeholder="2547XXXXXXXX"
                                value={line.mpesaPhone}
                                disabled={isPaid}
                                onKeyDown={handleKeyDown}
                                onChange={(e) =>
                                    onChange({ mpesaPhone: e.target.value })
                                }
                                className="h-9 border-emerald-200 bg-white text-sm"
                            />
                            {!isPaid && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleStkPush}
                                    disabled={
                                        stkStatus === 'sending' ||
                                        (line.mpesaPhone || '').length < 10
                                    }
                                    className="min-w-[100px] bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    {stkStatus === 'sending' ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                        'Push'
                                    )}
                                </Button>
                            )}
                        </div>
                    )}

                    {(line.mpesaMode === 'c2b' ||
                        line.mpesaMode === 'manual') && (
                        <div className="flex flex-col gap-2 rounded border border-emerald-100 bg-white p-2">
                            {line.mpesaMode === 'c2b' && (
                                <div className="mb-1 flex items-center justify-between text-xs text-emerald-800">
                                    <span>
                                        <span className="font-bold">
                                            Paybill/Till:
                                        </span>
                                    </span>
                                    <span>
                                        <span className="font-bold">Amt:</span>{' '}
                                        {line.amount}
                                    </span>
                                </div>
                            )}

                            {!isPaid ? (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Customer Phone (e.g. 07xx...)"
                                        value={line.mpesaPhone}
                                        onKeyDown={handleKeyDown} // 🟢 Block Enter Key
                                        onChange={(e) =>
                                            onChange({
                                                mpesaPhone: e.target.value,
                                            })
                                        }
                                        className="h-9 text-sm"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        type="button" // Explicit button type
                                        onClick={handleManualVerify}
                                        className="h-9 border-emerald-200 bg-emerald-50 text-xs whitespace-nowrap text-emerald-700 hover:bg-emerald-100"
                                    >
                                        <Search size={14} className="mr-1" />{' '}
                                        Find Payment
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 rounded bg-emerald-50 p-1 font-mono text-sm text-emerald-700">
                                    <CheckCircle2 size={14} />
                                    <span>Code: {line.transaction_ref}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {line.method !== 'mpesa' && isRefRequired && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                    <Label className="text-xs font-bold text-gray-500 uppercase">
                        Reference / Code
                    </Label>
                    <Input
                        placeholder="Auth Code..."
                        value={line.transaction_ref}
                        disabled={isPaid}
                        onKeyDown={handleKeyDown}
                        onChange={(e) =>
                            onChange({ transaction_ref: e.target.value })
                        }
                        className="bg-white"
                    />
                </div>
            )}
        </div>
    );
};

// --- MAIN MODAL ---
export const PaymentModal: React.FC<PaymentModalProps> = ({
    invoice,
    isOpen,
    onClose,
}) => {
    const [mode, setMode] = useState<'single' | 'split'>('single');

    // Grab Available Credit if present, fallback to limit, fallback to 0
    const creditLimit = invoice
        ? Number(
              invoice.customer_available_credit ??
                  invoice.customer_credit_limit ??
                  0,
          )
        : 0;

    const totalAmount = invoice ? Number(invoice.total_amount) : 0;
    const paidAmount = invoice ? Number(invoice.paid_amount) : 0;
    const balanceDue = Math.max(0, totalAmount - paidAmount);

    const { processing } = useForm();
    const [lines, setLines] = useState<PaymentLine[]>([
        {
            id: 1,
            method: 'cash',
            amount: '',
            transaction_ref: '',
            mpesaMode: 'stk',
            mpesaPhone: '',
        },
    ]);

    useEffect(() => {
        if (isOpen && invoice) {
            setMode('single');
            setLines([
                {
                    id: Date.now(),
                    method: 'cash',
                    amount: balanceDue,
                    transaction_ref: '',
                    mpesaMode: 'stk',
                    mpesaPhone: '',
                    verified: false,
                },
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, invoice]);

    const updateLine = (id: number, updates: Partial<PaymentLine>) => {
        setLines((prev) =>
            prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        );
    };

    const addLine = () => {
        setLines((prev) => [
            ...prev,
            {
                id: Date.now(),
                method: 'cash',
                amount: '',
                transaction_ref: '',
                mpesaMode: 'stk',
                mpesaPhone: '',
                verified: false,
            },
        ]);
    };

    const removeLine = (id: number) => {
        setLines((prev) => prev.filter((l) => l.id !== id));
    };

    const currentTotal = lines.reduce(
        (sum, l) => sum + Number(l.amount || 0),
        0,
    );
    const remaining = balanceDue - currentTotal;
    const isOverpaid = remaining < 0;

    // 🟢 CHECK: Disable Submit if any M-Pesa/Credit line is NOT verified
    // Cash is always "verified" implicitly
    const isSubmitDisabled =
        processing ||
        lines.some(
            (l) =>
                (l.method === 'mpesa' || l.method === 'credit_limit') &&
                !l.verified,
        );

    const processPayment = () => {
        console.log('Submitting Payment...');
        const finalPayload = lines.map((line) => ({
            amount: Number(line.amount),
            method: line.method,
            transaction_ref: line.transaction_ref,
            mpesaMode: line.method === 'mpesa' ? line.mpesaMode : null,
            mpesaPhone: line.method === 'mpesa' ? line.mpesaPhone : null,
            payment_date: new Date().toISOString().split('T')[0],
        }));

        router.post(
            route('invoices.payment', invoice.id),
            {
                payments: finalPayload,
            },
            {
                onSuccess: () => onClose(),
            },
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Double check safety
        if (isSubmitDisabled) return;

        processPayment();
    };

    // 🟢 SINGLE MODE TWEAK: Removed auto-submit so modal stays open with "Verified" status
    const handleAutoSubmit = () => {
        // Previously: if (mode === 'single') processPayment();
        // Now: Do nothing. Just let the row lock and wait for manual "Confirm Payment" click.
        console.log('Verification successful. Waiting for user confirmation.');
    };

    if (!invoice) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader className="mb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl text-emerald-700">
                        <Wallet className="h-6 w-6" /> Receive Payment
                    </DialogTitle>
                    <DialogDescription>
                        Invoice{' '}
                        <span className="font-bold text-gray-800">
                            {invoice.invoice_number}
                        </span>{' '}
                        &bull; {invoice.customer_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">
                            Total Invoice
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                            {Number(totalAmount).toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">
                            Paid So Far
                        </div>
                        <div className="text-lg font-bold text-emerald-600">
                            {Number(paidAmount).toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase">
                            Balance Due
                        </div>
                        <div className="text-2xl font-black text-orange-600">
                            {Number(balanceDue).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="mb-6 flex w-full rounded-lg bg-gray-100 p-1 sm:w-fit">
                    <button
                        type="button"
                        onClick={() => {
                            setMode('single');
                            setLines([
                                {
                                    id: Date.now(),
                                    method: 'cash',
                                    amount: balanceDue,
                                    transaction_ref: '',
                                    mpesaMode: 'stk',
                                    mpesaPhone: '',
                                    verified: false,
                                },
                            ]);
                        }}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${mode === 'single' ? 'bg-white text-emerald-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <DollarSign size={16} /> Single Method
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('split')}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${mode === 'split' ? 'bg-white text-emerald-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Split size={16} /> Split Payment
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {lines.map((line) => (
                            <PaymentRow
                                key={line.id}
                                line={line}
                                onChange={(updates) =>
                                    updateLine(line.id, updates)
                                }
                                onRemove={
                                    mode === 'split' && lines.length > 1
                                        ? () => removeLine(line.id)
                                        : undefined
                                }
                                creditLimit={creditLimit}
                                isSingleMode={mode === 'single'}
                                onAutoSubmit={handleAutoSubmit}
                            />
                        ))}
                    </div>

                    {mode === 'split' && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addLine}
                            className="w-full border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                            <Plus size={16} className="mr-2" /> Add Another
                            Payment Method
                        </Button>
                    )}

                    <div className="mt-6 border-t pt-4">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Date: {new Date().toLocaleDateString()}
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">
                                    Total Tendered
                                </div>
                                <div className="text-xl font-bold text-gray-900">
                                    {currentTotal.toLocaleString()}
                                </div>
                                {isOverpaid ? (
                                    <div className="text-sm font-medium text-emerald-600">
                                        Change Due:{' '}
                                        {Math.abs(remaining).toLocaleString()}
                                    </div>
                                ) : (
                                    <div
                                        className={`text-sm font-medium ${remaining > 0 ? 'text-red-500' : 'text-emerald-600'}`}
                                    >
                                        Remaining:{' '}
                                        {Math.max(
                                            0,
                                            remaining,
                                        ).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            {/* 🟢 FIXED: Button DISABLED if verification needed */}
                            <Button
                                type="submit"
                                className={`min-w-[150px] ${isSubmitDisabled ? 'cursor-not-allowed bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                disabled={isSubmitDisabled}
                            >
                                {processing
                                    ? 'Processing...'
                                    : isSubmitDisabled
                                      ? 'Verify First'
                                      : 'Confirm Payment'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
