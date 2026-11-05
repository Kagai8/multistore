/* eslint-disable @typescript-eslint/no-explicit-any */
import { CustomToast, toast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button'; // Ensure you have this
import { Input } from '@/components/ui/input';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronRight,
    CircleUser,
    Home,
    Loader2,
    Search,
    X,
} from 'lucide-react'; // 🟢 Added Icons
import { useEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';

// 🟢 Print Library
import { useReactToPrint } from 'react-to-print';

// Partials
import ActiveCart from '@/components/Partials/ActiveCart';
import CategoryTabs from '@/components/Partials/CategoryTabs';
import CloseRegisterModal from '@/components/Partials/CloseRegisterModal';
import FooterLog from '@/components/Partials/FooterLog';
import OpenRegisterModal from '@/components/Partials/OpenRegisterModal';
import ProductGrid from '@/components/Partials/ProductGrid';

// 🟢 Receipt Components
import ReceiptSuccessModal from '@/components/Partials/ReceiptSuccessModal';
import { ReceiptTemplate } from '@/components/Partials/ReceiptTemplate';

// 🟢 Modals
import ClearCartModal from '@/components/Partials/ClearCartModal';
import PosPaymentModal from '@/components/Partials/PosPaymentModal';

interface Props {
    initialProducts: any[];
    categories: any[];
    customers: any[];
    activeSession: any;
    defaultCustomer: any;
    parkedSales: any[];
    company: any;
}

export default function PosIndex({
    initialProducts,
    categories,
    customers,
    activeSession,
    defaultCustomer,
    parkedSales = [],
    company,
}: Props) {
    const { auth, flash } = usePage<any>().props;
    const userRole = auth.roles?.[0] || 'Operator';

    // --- STATE ---
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>(
        'all',
    );
    const [cart, setCart] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] =
        useState<any>(defaultCustomer);

    const [activeTab, setActiveTab] = useState<'current' | 'held'>('current');

    // Modals
    const [isPaymentOpen, setPaymentOpen] = useState(false);
    const [payableAmount, setPayableAmount] = useState(0);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);

    // 🟢 RESUME MODAL STATE
    const [showResumeConfirm, setShowResumeConfirm] = useState(false);
    const [saleToResume, setSaleToResume] = useState<any>(null);
    const [isResuming, setIsResuming] = useState(false);

    // Receipt Data
    const [lastSaleData, setLastSaleData] = useState<any>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const cartTotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
        [cart],
    );

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: 'Receipt',
        onAfterPrint: () => {
            setShowReceiptModal(false);
            setCart([]);
        },
    });

    // 🟢 GLOBAL LISTENER
    useEffect(() => {
        if (flash?.receipt_data) {
            toast.success('Transaction Successful!');
            setPaymentOpen(false);
            setLastSaleData({
                ...flash.receipt_data,
                items: [...cart],
                total_amount: cartTotal,
                tendered_amount: payableAmount,
                customer_name: selectedCustomer?.name || 'Walk-In Customer',
            });
            setCart([]);
            setShowReceiptModal(true);
        } else if (flash?.success && !flash?.receipt_data) {
            if (flash.success.includes('Parked')) {
                toast.success(flash.success);
                if (cart.length > 0) setCart([]);
            } else {
                toast.success(flash.success);
            }
        } else if (flash?.error) {
            toast.error(flash.error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash]);

    // --- CART ACTIONS ---
    const addToCart = (product: any) => {
        const priceToUse = product.price || product.retail_price || 0;
        const inCart = cart.find((i) => i.id === product.id);
        const currentQty = inCart ? inCart.qty : 0;

        if (currentQty + 1 > product.stock) {
            toast.error(`Out of stock! Only ${product.stock} remaining.`);
            return;
        }

        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, qty: item.qty + 1 }
                        : item,
                );
            }
            return [
                ...prev,
                { ...product, price: priceToUse, qty: 1, priceType: 'retail' },
            ];
        });
    };

    const updateQty = (id: number, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.id === id) {
                        const newQty = Math.max(0, item.qty + delta);
                        return { ...item, qty: newQty };
                    }
                    return item;
                })
                .filter((item) => item.qty > 0),
        );
    };

    const updateItemPrice = (id: number, newPrice: number, type: string) => {
        setCart((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, price: newPrice, priceType: type }
                    : item,
            ),
        );
    };

    const handleCheckout = () => {
        if (cart.length === 0) return toast.error('Cart is empty');
        setPayableAmount(cartTotal);
        setPaymentOpen(true);
    };

    const handleClearCart = () => {
        if (cart.length === 0) return;
        setShowClearModal(true);
    };

    const confirmClearCart = () => {
        setCart([]);
        setShowClearModal(false);
        toast.info('Cart cleared');
    };

    const handleParkSale = () => {
        if (cart.length === 0) return toast.error('Cart is empty');

        router.post(
            route('pos.store'),
            {
                customer_id: selectedCustomer?.id,
                cart: cart.map((i) => ({
                    id: i.id,
                    qty: i.qty,
                    price: i.price,
                    priceType: i.priceType,
                })),
                status: 'parked',
                payments: [],
            },
            {
                preserveState: true,
                preserveScroll: true,
                onError: (err) => {
                    console.error(err);
                    toast.error('Failed to park sale');
                },
            },
        );
    };

    // 🟢 1. TRIGGER: Only checks condition and opens modal if needed
    const handleRequestResume = (sale: any) => {
        if (cart.length > 0) {
            setSaleToResume(sale);
            setShowResumeConfirm(true);
        } else {
            // Cart is empty, proceed directly
            executeResume(sale);
        }
    };

    // 🟢 2. EXECUTE: The actual logic
    const executeResume = (sale: any) => {
        setIsResuming(true);
        const itemsToRestore =
            sale.items?.map((item: any) => ({
                id: item.product_id,
                name: item.product?.name || 'Unknown Item',
                qty: item.quantity,
                price: Number(item.unit_price),
                stock: item.product?.stocks?.[0]?.current_stock || 999,
                priceType: 'retail',
            })) || [];

        const customerToRestore = sale.customer || defaultCustomer;

        router.delete(route('pos.destroy', sale.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setCart(itemsToRestore);
                setSelectedCustomer(customerToRestore);
                setActiveTab('current');
                toast.info(`Resumed Receipt: ${sale.receipt_number}`);

                // Reset State
                setShowResumeConfirm(false);
                setSaleToResume(null);
                setIsResuming(false);
            },
            onError: () => {
                toast.error('Failed to resume sale');
                setIsResuming(false);
            },
        });
    };

    const filteredProducts = useMemo(() => {
        return initialProducts.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.sku.toLowerCase().includes(search.toLowerCase());
            const matchesCategory =
                selectedCategory === 'all' ||
                p.category_id === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [search, selectedCategory, initialProducts]);

    return (
        // 🟢 FULL SCREEN LAYOUT (No Sidebar)
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-50 font-sans text-gray-900">
            <Head title="POS Terminal" />
            <CustomToast />
            <OpenRegisterModal show={!activeSession} />

            {/* HEADER */}
            <div className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
                {/* Left: Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm">
                    <Link
                        href={route('dashboard')}
                        className="flex items-center gap-1 text-gray-500 transition-colors hover:text-orange-600"
                    >
                        <Home size={16} />
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <ChevronRight size={14} className="text-gray-300" />
                    <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-bold tracking-wide text-gray-800">
                        POS TERMINAL
                    </span>
                </div>

                {/* Center: Search */}
                <div className="relative mx-6 max-w-lg flex-1">
                    <Search
                        className="absolute top-2.5 left-3 text-gray-400"
                        size={18}
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Scan Barcode / Search Product..."
                        className="h-10 rounded-full border-gray-200 bg-gray-50 pl-10 focus:border-orange-500 focus:ring-orange-500"
                        autoFocus
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute top-2.5 right-3 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Right: Status & User */}
                <div className="flex items-center gap-4">
                    <div className="mr-2 hidden flex-col items-end sm:flex">
                        <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                            {activeSession
                                ? `Shift #${activeSession.id}`
                                : 'Closed'}
                        </div>
                        {activeSession ? (
                            <button
                                onClick={() => setShowCloseModal(true)}
                                className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-0.5 transition-colors hover:bg-gray-100"
                                title="Click to Close Shift"
                            >
                                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                                <span className="text-xs font-bold text-green-700">
                                    Online
                                </span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2 py-0.5">
                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                <span className="text-xs font-bold text-red-700">
                                    Offline
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white shadow-sm ring-2 ring-gray-100">
                            <CircleUser size={20} />
                        </div>
                        <div className="hidden flex-col md:flex">
                            <span className="text-sm leading-none font-bold text-gray-800">
                                {auth.user?.name}
                            </span>
                            <span className="mt-1 text-[10px] text-gray-500 uppercase">
                                {String(userRole).replace(/-/g, ' ')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div
                className={`flex flex-1 overflow-hidden ${!activeSession ? 'pointer-events-none blur-sm' : ''}`}
            >
                {/* Left Panel: Products */}
                <div className="flex min-w-0 flex-1 flex-col bg-gray-50/50">
                    <div className="shrink-0 border-b border-gray-200 bg-white">
                        <CategoryTabs
                            categories={categories}
                            selected={selectedCategory}
                            onSelect={setSelectedCategory}
                        />
                    </div>
                    <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
                        <ProductGrid
                            products={filteredProducts}
                            onAdd={addToCart}
                        />
                    </div>
                    <div className="shrink-0 border-t border-gray-200 bg-white">
                        <FooterLog />
                    </div>
                </div>

                {/* Right Panel: Cart (Fixed Width) */}
                <div className="z-20 flex h-full w-[420px] flex-col border-l border-gray-200 bg-white shadow-2xl 2xl:w-[480px]">
                    <ActiveCart
                        cart={cart}
                        customers={customers}
                        selectedCustomer={selectedCustomer}
                        setCustomer={setSelectedCustomer}
                        updateQty={updateQty}
                        updatePrice={updateItemPrice}
                        total={cartTotal}
                        onCheckout={handleCheckout}
                        onPark={handleParkSale}
                        onClear={handleClearCart}
                        parkedSales={parkedSales}
                        onResume={handleRequestResume} // 🟢 Passes the trigger, not logic
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                </div>
            </div>

            {/* --- MODALS --- */}

            <ReceiptSuccessModal
                show={showReceiptModal}
                data={lastSaleData}
                onClose={() => {
                    setShowReceiptModal(false);
                    setCart([]);
                }}
                onPrint={handlePrint}
            />
            <div className="hidden">
                <ReceiptTemplate
                    ref={receiptRef}
                    data={lastSaleData}
                    items={lastSaleData?.items || []}
                    company={company}
                />
            </div>

            <ClearCartModal
                open={showClearModal}
                onClose={() => setShowClearModal(false)}
                onConfirm={confirmClearCart}
            />

            <PosPaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setPaymentOpen(false)}
                totalAmount={payableAmount}
                customer={
                    selectedCustomer || { id: 1, name: 'Walk-in Customer' }
                }
                cartData={cart.map((i) => ({
                    id: i.id,
                    qty: i.qty,
                    price: i.price,
                    priceType: i.priceType,
                }))}
            />

            <CloseRegisterModal
                isOpen={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                sessionStart={
                    activeSession?.start_time
                        ? new Date(activeSession.start_time).toLocaleTimeString(
                              [],
                              { hour: '2-digit', minute: '2-digit' },
                          )
                        : 'Unknown'
                }
            />

            {/* 🟢 CUSTOM RESUME CONFIRMATION MODAL */}
            {showResumeConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
                    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="rounded-full bg-orange-100 p-3">
                                <AlertTriangle className="h-8 w-8 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Clear Cart & Resume?
                                </h2>
                                <p className="mt-2 text-sm text-gray-500">
                                    You have active items in your cart. Resuming
                                    <span className="mx-1 font-mono font-bold text-gray-800">
                                        {saleToResume?.receipt_number}
                                    </span>
                                    will replace the current cart contents.
                                </p>
                            </div>
                            <div className="flex w-full gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowResumeConfirm(false);
                                        setSaleToResume(null);
                                    }}
                                    className="flex-1"
                                    disabled={isResuming}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => executeResume(saleToResume)}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                                    disabled={isResuming}
                                >
                                    {isResuming ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Yes, Resume
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
