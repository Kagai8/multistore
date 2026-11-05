/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Calculator,
    Check,
    ChevronDown,
    FileClock,
    PauseCircle,
    Play,
    Search,
    Trash2,
    User,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    cart: any[];
    customers: any[];
    selectedCustomer: any;
    setCustomer: (customer: any) => void;
    updateQty: (id: number, delta: number) => void;
    updatePrice: (id: number, newPrice: number, type: string) => void;
    total: number;
    onCheckout: () => void;
    onPark: () => void;
    onClear: () => void;
    parkedSales?: any[];
    onResume?: (sale: any) => void; // 🟢 New Prop
    // Accepted from the POS page for future tab sync; ActiveCart currently
    // manages its own tab state internally (these props are intentionally unused).
    activeTab?: 'current' | 'held';
    setActiveTab?: React.Dispatch<React.SetStateAction<'current' | 'held'>>;
}

export default function ActiveCart({
    cart,
    customers,
    selectedCustomer,
    setCustomer,
    updateQty,
    updatePrice,
    total,
    onCheckout,
    onPark,
    onClear,
    parkedSales = [],
    onResume,
}: Props) {
    // --- STATE ---
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [customerQuery, setCustomerQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'current' | 'held'>('current');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // --- PRICE EDIT MODAL STATE ---
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [manualPrice, setManualPrice] = useState('');

    useEffect(() => {
        if (isSearchingCustomer && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchingCustomer]);

    // Switch to Held tab automatically if parked sales change and cart is empty
    useEffect(() => {
        if (
            cart.length === 0 &&
            parkedSales.length > 0 &&
            activeTab === 'current'
        ) {
            // setActiveTab('held'); // Uncomment if you like auto-switch
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parkedSales.length, cart.length]);

    const filteredCustomers = useMemo(() => {
        if (!customerQuery) return customers.slice(0, 10);
        return customers
            .filter(
                (c: any) =>
                    c.name
                        .toLowerCase()
                        .includes(customerQuery.toLowerCase()) ||
                    c.phone?.includes(customerQuery) ||
                    c.number?.includes(customerQuery),
            )
            .slice(0, 10);
    }, [customers, customerQuery]);

    const handleItemClick = (item: any) => {
        setEditingItem(item);
        setManualPrice(item.price.toString());
    };

    const applyPrice = (price: number, type: string) => {
        if (editingItem && price >= 0) {
            updatePrice(editingItem.id, price, type);
            setEditingItem(null);
        }
    };

    return (
        <div className="relative flex h-full flex-col bg-white">
            {/* =========================================
                1. CUSTOMER HEADER
               ========================================= */}
            <div className="relative z-20 shrink-0 border-b bg-white p-3">
                {isSearchingCustomer ? (
                    <div className="relative">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search
                                    className="absolute top-2.5 left-3 text-gray-400"
                                    size={16}
                                />
                                <Input
                                    ref={searchInputRef}
                                    value={customerQuery}
                                    onChange={(e) =>
                                        setCustomerQuery(e.target.value)
                                    }
                                    placeholder="Search Customer..."
                                    className="h-10 border-orange-200 bg-gray-50 pl-9 focus:ring-orange-500"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSearchingCustomer(false)}
                            >
                                <X size={18} className="text-gray-500" />
                            </Button>
                        </div>
                        <div className="absolute top-full right-0 left-0 mt-1 max-h-60 overflow-y-auto rounded-b-lg border bg-white shadow-xl duration-100 animate-in fade-in zoom-in-95">
                            {filteredCustomers.map((c: any) => (
                                <button
                                    key={c.id}
                                    className="group flex w-full items-center justify-between border-b p-3 text-left transition-colors last:border-0 hover:bg-orange-50"
                                    onClick={() => {
                                        setCustomer(c);
                                        setIsSearchingCustomer(false);
                                        setCustomerQuery('');
                                    }}
                                >
                                    <div>
                                        <div className="font-bold text-gray-800 group-hover:text-orange-700">
                                            {c.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {c.phone || c.number || 'No Phone'}
                                        </div>
                                    </div>
                                    {c.credit_limit > 0 && (
                                        <div className="text-right">
                                            <span
                                                className={`rounded-full px-2 py-1 text-[10px] ${c.available_credit < 1000 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                                            >
                                                Avail:{' '}
                                                {Number(
                                                    c.available_credit || 0,
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </button>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <div className="p-4 text-center text-sm text-gray-400">
                                    No customers found
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-2">
                        <div
                            className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 transition-colors select-none hover:border-gray-200 hover:bg-gray-50"
                            onClick={() => setIsSearchingCustomer(true)}
                        >
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selectedCustomer ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}
                            >
                                <User size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <div className="truncate text-sm font-bold text-gray-800">
                                    {selectedCustomer
                                        ? selectedCustomer.name
                                        : 'Walk-in Customer'}
                                </div>
                                {selectedCustomer ? (
                                    <div className="truncate text-[10px] font-medium text-green-600">
                                        Avail:{' '}
                                        {Number(
                                            selectedCustomer.available_credit ||
                                                0,
                                        ).toLocaleString()}{' '}
                                        | Pts:{' '}
                                        {selectedCustomer.loyalty_points || 0}
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-gray-400">
                                        Click to select customer
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400"
                            onClick={() => setIsSearchingCustomer(true)}
                        >
                            <ChevronDown size={16} />
                        </Button>
                    </div>
                )}
            </div>

            {/* =========================================
                2. TAB SWITCHER
               ========================================= */}
            <div className="flex shrink-0 border-b bg-gray-50 text-xs font-bold text-gray-500">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`flex-1 py-3 transition-colors ${activeTab === 'current' ? 'border-b-2 border-orange-600 bg-white text-orange-600' : 'hover:bg-gray-100'}`}
                >
                    CURRENT SALE
                </button>
                <button
                    onClick={() => setActiveTab('held')}
                    className={`flex-1 py-3 transition-colors ${activeTab === 'held' ? 'border-b-2 border-orange-600 bg-white text-orange-600' : 'hover:bg-gray-100'}`}
                >
                    HELD BILLS ({parkedSales.length})
                </button>
            </div>

            {/* =========================================
                3. CONTENT AREA
               ========================================= */}
            <div className="custom-scrollbar relative flex-1 space-y-1 overflow-y-auto bg-white p-2">
                {/* 🟢 CURRENT SALE */}
                {activeTab === 'current' && (
                    <>
                        {cart.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center space-y-2 text-gray-300 select-none">
                                <Calculator size={48} className="opacity-20" />
                                <p className="text-sm font-medium text-gray-400">
                                    Ticket is empty
                                </p>
                                <p className="text-xs text-gray-400">
                                    Scan items to begin
                                </p>
                            </div>
                        ) : (
                            cart.map((item: any) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className="group flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 p-3 transition-all select-none hover:border-orange-200 hover:bg-orange-50/50"
                                >
                                    <div className="flex-1 overflow-hidden">
                                        <div className="line-clamp-1 text-sm font-bold text-gray-800">
                                            {item.name}
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600">
                                                @
                                                {Number(
                                                    item.price || 0,
                                                ).toLocaleString()}
                                            </span>
                                            {item.priceType &&
                                                item.priceType !== 'retail' && (
                                                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                                                        {item.priceType}
                                                    </span>
                                                )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-20 text-right text-base font-bold text-gray-900">
                                            {(
                                                Number(item.price || 0) *
                                                item.qty
                                            ).toLocaleString()}
                                        </div>
                                        <div
                                            className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() =>
                                                    updateQty(item.id, -1)
                                                }
                                                className="flex h-8 w-8 items-center justify-center font-bold text-gray-500 transition-colors hover:bg-red-100 hover:text-red-600"
                                            >
                                                -
                                            </button>
                                            <div className="flex h-8 w-8 items-center justify-center bg-white text-sm font-bold">
                                                {item.qty}
                                            </div>
                                            <button
                                                onClick={() =>
                                                    updateQty(item.id, 1)
                                                }
                                                className="flex h-8 w-8 items-center justify-center font-bold text-gray-500 transition-colors hover:bg-green-100 hover:text-green-600"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}

                {/* 🟢 HELD BILLS (Resume Button Wired Up) */}
                {activeTab === 'held' && (
                    <>
                        {parkedSales.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center space-y-2 text-gray-300 select-none">
                                <FileClock size={48} className="opacity-20" />
                                <p className="text-sm font-medium text-gray-400">
                                    No Held Bills
                                </p>
                                <p className="text-xs text-gray-400">
                                    Park a sale to see it here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {parkedSales.map((sale: any) => (
                                    <div
                                        key={sale.id}
                                        className="group flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                                    >
                                        <div>
                                            <div className="font-bold text-gray-800">
                                                {sale.receipt_number}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>
                                                    {new Date(
                                                        sale.created_at,
                                                    ).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                                <span>
                                                    {sale.customer?.name ||
                                                        'Walk-In'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900">
                                                {Number(
                                                    sale.total_amount,
                                                ).toLocaleString()}
                                            </div>
                                            {/* 🟢 WIRED UP RESUME BUTTON */}
                                            <button
                                                onClick={() =>
                                                    onResume && onResume(sale)
                                                }
                                                className="mt-1 flex cursor-pointer items-center gap-1 rounded bg-orange-100 px-2 py-1 text-[10px] text-orange-700 hover:bg-orange-200"
                                            >
                                                <Play
                                                    size={10}
                                                    fill="currentColor"
                                                />{' '}
                                                Resume
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* =========================================
                4. FOOTER TOTALS
               ========================================= */}
            <div className="z-10 shrink-0 space-y-3 border-t bg-gray-50 p-4">
                <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>Tax (VAT Included)</span>
                        <span>{(total * 0.16).toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex items-end justify-between border-t border-gray-200 pt-2">
                    <span className="text-lg font-bold text-gray-800">
                        Total Payable
                    </span>
                    <span className="text-2xl font-black tracking-tight text-gray-900">
                        KSh {total.toLocaleString()}
                    </span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={onPark}
                        className="h-12 border-yellow-400 bg-white text-yellow-700 shadow-sm hover:bg-yellow-50"
                        disabled={cart.length === 0}
                    >
                        <PauseCircle size={20} />
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onClear}
                        className="h-12 border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50"
                        disabled={cart.length === 0}
                    >
                        <Trash2 size={20} />
                    </Button>

                    <Button
                        className="col-span-2 h-12 bg-green-600 text-lg font-bold text-white shadow-md shadow-green-200 hover:bg-green-700"
                        onClick={onCheckout}
                        disabled={cart.length === 0}
                    >
                        PAY NOW
                    </Button>
                </div>
            </div>

            {/* =========================================
                🟢 ITEM MODIFIER MODAL
               ========================================= */}
            {editingItem && (
                <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm duration-200 animate-in fade-in sm:items-center">
                    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in slide-in-from-bottom-10">
                        <div className="flex items-center justify-between border-b bg-gray-50 p-4">
                            <div>
                                <h3 className="line-clamp-1 text-lg font-bold text-gray-800">
                                    {editingItem.name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Modify Price Tier
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingItem(null)}
                                className="rounded-full"
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="space-y-4 p-4">
                            <div className="grid grid-cols-2 gap-3">
                                <PriceButton
                                    label="Retail"
                                    amount={editingItem.retail_price}
                                    active={editingItem.priceType === 'retail'}
                                    onClick={() =>
                                        applyPrice(
                                            editingItem.retail_price || 0,
                                            'retail',
                                        )
                                    }
                                />
                                <PriceButton
                                    label="Wholesale"
                                    amount={editingItem.wholesale_price}
                                    active={
                                        editingItem.priceType === 'wholesale'
                                    }
                                    onClick={() =>
                                        applyPrice(
                                            editingItem.wholesale_price || 0,
                                            'wholesale',
                                        )
                                    }
                                    disabled={!editingItem.wholesale_price}
                                />
                                <PriceButton
                                    label="Special"
                                    amount={editingItem.special_price}
                                    active={editingItem.priceType === 'special'}
                                    onClick={() =>
                                        applyPrice(
                                            editingItem.special_price || 0,
                                            'special',
                                        )
                                    }
                                    disabled={!editingItem.special_price}
                                />
                                <div
                                    className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${editingItem.priceType === 'manual' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
                                >
                                    <div className="mb-1 text-xs font-bold text-gray-500 uppercase">
                                        Manual
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={manualPrice}
                                            onChange={(e) =>
                                                setManualPrice(e.target.value)
                                            }
                                            className="h-8 text-sm"
                                            placeholder="0.00"
                                        />
                                        <Button
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() =>
                                                applyPrice(
                                                    parseFloat(manualPrice),
                                                    'manual',
                                                )
                                            }
                                        >
                                            <Check size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end border-t bg-gray-50 p-4">
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    updateQty(editingItem.id, -9999);
                                    setEditingItem(null);
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Remove Item
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const PriceButton = ({ label, amount, active, disabled, onClick }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`rounded-xl border-2 p-3 text-left transition-all ${
            active
                ? 'border-orange-500 bg-orange-50 shadow-sm ring-1 ring-orange-500'
                : 'border-gray-100 bg-white hover:border-orange-200'
        } ${disabled ? 'cursor-not-allowed bg-gray-50 opacity-50' : ''}`}
    >
        <div
            className={`mb-1 text-xs font-bold uppercase ${active ? 'text-orange-700' : 'text-gray-500'}`}
        >
            {label}
        </div>
        <div
            className={`text-lg font-bold ${active ? 'text-orange-900' : 'text-gray-900'}`}
        >
            {amount ? Number(amount).toLocaleString() : '-'}
        </div>
    </button>
);
