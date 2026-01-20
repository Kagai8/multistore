/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trash2, User, PauseCircle, Calculator, ChevronDown, X, Check, Search, FileClock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
}

export default function ActiveCart({ cart, customers, selectedCustomer, setCustomer, updateQty, updatePrice, total, onCheckout, onPark, onClear, parkedSales = [], onResume }: Props) {

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
        if (cart.length === 0 && parkedSales.length > 0 && activeTab === 'current') {
            // setActiveTab('held'); // Uncomment if you like auto-switch
        }
    }, [parkedSales.length, cart.length]);

    const filteredCustomers = useMemo(() => {
        if (!customerQuery) return customers.slice(0, 10);
        return customers.filter((c: any) =>
            c.name.toLowerCase().includes(customerQuery.toLowerCase()) ||
            c.phone?.includes(customerQuery) ||
            c.number?.includes(customerQuery)
        ).slice(0, 10);
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
        <div className="flex flex-col h-full relative bg-white">

            {/* =========================================
                1. CUSTOMER HEADER
               ========================================= */}
            <div className="p-3 border-b bg-white relative z-20 shrink-0">
                {isSearchingCustomer ? (
                    <div className="relative">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <Input
                                    ref={searchInputRef}
                                    value={customerQuery}
                                    onChange={(e) => setCustomerQuery(e.target.value)}
                                    placeholder="Search Customer..."
                                    className="pl-9 bg-gray-50 border-orange-200 focus:ring-orange-500 h-10"
                                />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsSearchingCustomer(false)}>
                                <X size={18} className="text-gray-500" />
                            </Button>
                        </div>
                        <div className="absolute top-full left-0 right-0 bg-white shadow-xl border rounded-b-lg mt-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                            {filteredCustomers.map((c: any) => (
                                <button
                                    key={c.id}
                                    className="w-full text-left p-3 hover:bg-orange-50 border-b last:border-0 flex justify-between items-center group transition-colors"
                                    onClick={() => {
                                        setCustomer(c);
                                        setIsSearchingCustomer(false);
                                        setCustomerQuery('');
                                    }}
                                >
                                    <div>
                                        <div className="font-bold text-gray-800 group-hover:text-orange-700">{c.name}</div>
                                        <div className="text-xs text-gray-500">{c.phone || c.number || 'No Phone'}</div>
                                    </div>
                                    {c.credit_limit > 0 && (
                                        <div className="text-right">
                                            <span className={`text-[10px] px-2 py-1 rounded-full ${c.available_credit < 1000 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                Avail: {Number(c.available_credit || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </button>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <div className="p-4 text-center text-gray-400 text-sm">No customers found</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-2">
                        <div
                            className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200 select-none"
                            onClick={() => setIsSearchingCustomer(true)}
                        >
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${selectedCustomer ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                <User size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <div className="text-sm font-bold text-gray-800 truncate">
                                    {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                                </div>
                                {selectedCustomer ? (
                                    <div className="text-[10px] text-green-600 font-medium truncate">
                                        Avail: {Number(selectedCustomer.available_credit || 0).toLocaleString()} | Pts: {selectedCustomer.loyalty_points || 0}
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-gray-400">Click to select customer</div>
                                )}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => setIsSearchingCustomer(true)}>
                            <ChevronDown size={16} />
                        </Button>
                    </div>
                )}
            </div>

            {/* =========================================
                2. TAB SWITCHER
               ========================================= */}
            <div className="flex border-b text-xs font-bold text-gray-500 bg-gray-50 shrink-0">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`flex-1 py-3 transition-colors ${activeTab === 'current' ? 'text-orange-600 border-b-2 border-orange-600 bg-white' : 'hover:bg-gray-100'}`}
                >
                    CURRENT SALE
                </button>
                <button
                    onClick={() => setActiveTab('held')}
                    className={`flex-1 py-3 transition-colors ${activeTab === 'held' ? 'text-orange-600 border-b-2 border-orange-600 bg-white' : 'hover:bg-gray-100'}`}
                >
                    HELD BILLS ({parkedSales.length})
                </button>
            </div>

            {/* =========================================
                3. CONTENT AREA
               ========================================= */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white custom-scrollbar relative">

                {/* 🟢 CURRENT SALE */}
                {activeTab === 'current' && (
                    <>
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-2 select-none">
                                <Calculator size={48} className="opacity-20" />
                                <p className="text-sm font-medium text-gray-400">Ticket is empty</p>
                                <p className="text-xs text-gray-400">Scan items to begin</p>
                            </div>
                        ) : (
                            cart.map((item: any) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className="flex items-center justify-between p-3 hover:bg-orange-50/50 rounded-lg group border border-gray-100 hover:border-orange-200 cursor-pointer transition-all select-none"
                                >
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                                                @{Number(item.price || 0).toLocaleString()}
                                            </span>
                                            {item.priceType && item.priceType !== 'retail' && (
                                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase text-[10px] font-bold">
                                                    {item.priceType}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="font-bold text-gray-900 w-20 text-right text-base">
                                            {(Number(item.price || 0) * item.qty).toLocaleString()}
                                        </div>
                                        <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors font-bold text-gray-500">-</button>
                                            <div className="w-8 h-8 flex items-center justify-center font-bold text-sm bg-white">{item.qty}</div>
                                            <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-green-100 hover:text-green-600 transition-colors font-bold text-gray-500">+</button>
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
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-2 select-none">
                                <FileClock size={48} className="opacity-20" />
                                <p className="text-sm font-medium text-gray-400">No Held Bills</p>
                                <p className="text-xs text-gray-400">Park a sale to see it here</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {parkedSales.map((sale: any) => (
                                    <div key={sale.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex justify-between items-center group">
                                        <div>
                                            <div className="font-bold text-gray-800">{sale.receipt_number}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <span>{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <span>{sale.customer?.name || 'Walk-In'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900">{Number(sale.total_amount).toLocaleString()}</div>
                                            {/* 🟢 WIRED UP RESUME BUTTON */}
                                            <button
                                                onClick={() => onResume && onResume(sale)}
                                                className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 mt-1 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Play size={10} fill="currentColor" /> Resume
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
            <div className="bg-gray-50 border-t p-4 space-y-3 shrink-0 z-10">
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

                <div className="flex justify-between items-end border-t border-gray-200 pt-2">
                    <span className="font-bold text-lg text-gray-800">Total Payable</span>
                    <span className="font-black text-2xl text-gray-900 tracking-tight">KSh {total.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={onPark}
                        className="bg-white border-yellow-400 text-yellow-700 hover:bg-yellow-50 h-12 shadow-sm"
                        disabled={cart.length === 0}
                    >
                        <PauseCircle size={20} />
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onClear}
                        className="bg-white border-red-200 text-red-600 hover:bg-red-50 h-12 shadow-sm"
                        disabled={cart.length === 0}
                    >
                        <Trash2 size={20} />
                    </Button>

                    <Button
                        className="col-span-2 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-green-200 shadow-md h-12"
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
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 border border-gray-200">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{editingItem.name}</h3>
                                <p className="text-xs text-gray-500">Modify Price Tier</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setEditingItem(null)} className="rounded-full">
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <PriceButton
                                    label="Retail"
                                    amount={editingItem.retail_price}
                                    active={editingItem.priceType === 'retail'}
                                    onClick={() => applyPrice(editingItem.retail_price || 0, 'retail')}
                                />
                                <PriceButton
                                    label="Wholesale"
                                    amount={editingItem.wholesale_price}
                                    active={editingItem.priceType === 'wholesale'}
                                    onClick={() => applyPrice(editingItem.wholesale_price || 0, 'wholesale')}
                                    disabled={!editingItem.wholesale_price}
                                />
                                <PriceButton
                                    label="Special"
                                    amount={editingItem.special_price}
                                    active={editingItem.priceType === 'special'}
                                    onClick={() => applyPrice(editingItem.special_price || 0, 'special')}
                                    disabled={!editingItem.special_price}
                                />
                                <div className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${editingItem.priceType === 'manual' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}>
                                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Manual</div>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={manualPrice}
                                            onChange={(e) => setManualPrice(e.target.value)}
                                            className="h-8 text-sm"
                                            placeholder="0.00"
                                        />
                                        <Button size="sm" className="h-8 w-8 p-0" onClick={() => applyPrice(parseFloat(manualPrice), 'manual')}>
                                            <Check size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <Button variant="destructive" onClick={() => {
                                updateQty(editingItem.id, -9999);
                                setEditingItem(null);
                            }}>
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
        className={`p-3 rounded-xl border-2 text-left transition-all ${
            active
            ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 shadow-sm'
            : 'border-gray-100 hover:border-orange-200 bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
    >
        <div className={`text-xs font-bold uppercase mb-1 ${active ? 'text-orange-700' : 'text-gray-500'}`}>{label}</div>
        <div className={`font-bold text-lg ${active ? 'text-orange-900' : 'text-gray-900'}`}>
            {amount ? Number(amount).toLocaleString() : '-'}
        </div>
    </button>
);
