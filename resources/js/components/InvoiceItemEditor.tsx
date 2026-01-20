/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';

// --- Interface Definitions ---

interface ProductLookup {
    id: number;
    name: string;
    sku: string;
    retail_price: number;
    wholesale_price: number;
    special_price: number;
}

interface InvoiceItem {
    key: number;
    product_id: string;
    quantity: number;
    price_category: 'retail' | 'wholesale' | 'special' | 'manual';
    unit_price: number;
    sub_total: number;
}

interface InvoiceItemEditorProps {
    data: any[]; // Incoming data from the form
    // 🟢 UPDATED: onUpdate now accepts items AND grandTotal
    onUpdate: (items: any[], grandTotal: number) => void;
    products: ProductLookup[];
    currentStoreId: number | string | null; // To check stock
    mode: 'create' | 'view' | 'edit';
    productStocks: Record<string, Record<string, number>>; // { productId: { storeId: qty } }
}

// Global counter for unique item keys
let nextKey = 0;

export const InvoiceItemEditor: React.FC<InvoiceItemEditorProps> = ({
    data: initialData,
    onUpdate,
    products,
    currentStoreId,
    mode,
    productStocks,
}) => {
    // 1. Initialize State
    const [items, setItems] = useState<InvoiceItem[]>(() => {
        if (!initialData || initialData.length === 0) {
            return [{ key: nextKey++, product_id: '', quantity: 1, price_category: 'retail', unit_price: 0, sub_total: 0 }];
        }
        return initialData.map(item => ({
            ...item,
            product_id: String(item.product_id),
            key: nextKey++,
            // Ensure numbers are numbers
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            sub_total: Number(item.quantity) * Number(item.unit_price)
        }));
    });

    // 2. Sync to Parent Form
    useEffect(() => {
        if (mode === 'view') return;

        const cleanedItems = items
            .filter(item => item.product_id && item.quantity > 0)
            .map(item => ({
                product_id: Number(item.product_id),
                quantity: Number(item.quantity),
                price_category: item.price_category,
                unit_price: Number(item.unit_price),
                sub_total: Number(item.quantity) * Number(item.unit_price) // Recalculate to be safe
            }));

        // 🟢 Calculate Grand Total
        const calculatedTotal = cleanedItems.reduce((sum, item) => sum + item.sub_total, 0);

        // 🟢 Send both back to parent
        onUpdate(cleanedItems, calculatedTotal);

    }, [items, mode]);

    // 3. Helper: Get Stock
    const getStock = (productId: string) => {
        if (!productId || !currentStoreId) return 0;
        const prodStocks = productStocks[productId];
        if (!prodStocks) return 0;
        return prodStocks[String(currentStoreId)] || 0;
    };

    // 4. Handlers
    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            { key: nextKey++, product_id: '', quantity: 1, price_category: 'retail', unit_price: 0, sub_total: 0 },
        ]);
    };

    const handleRemoveItem = (keyToRemove: number) => {
        if (mode !== 'view' && items.length === 1) {
            // Reset last item instead of removing
            setItems([{ key: nextKey++, product_id: '', quantity: 1, price_category: 'retail', unit_price: 0, sub_total: 0 }]);
            return;
        }
        setItems(prev => prev.filter(item => item.key !== keyToRemove));
    };

    // 🟢 SMART CHANGE HANDLER
    const handleFieldChange = (key: number, field: keyof InvoiceItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.key !== key) return item;

            const updatedItem = { ...item, [field]: value };

            // Logic: If Product Changes -> Auto-set Price
            if (field === 'product_id') {
                const product = products.find(p => String(p.id) === String(value));
                if (product) {
                    // Default to retail, or keep current category if valid
                    const category = item.price_category === 'manual' ? 'retail' : item.price_category;

                    if (category === 'wholesale') updatedItem.unit_price = Number(product.wholesale_price);
                    else if (category === 'special') updatedItem.unit_price = Number(product.special_price);
                    else updatedItem.unit_price = Number(product.retail_price);
                }
            }

            // Logic: If Category Changes -> Auto-update Price
            if (field === 'price_category') {
                const product = products.find(p => String(p.id) === String(item.product_id));
                if (product && value !== 'manual') {
                    if (value === 'wholesale') updatedItem.unit_price = Number(product.wholesale_price);
                    else if (value === 'special') updatedItem.unit_price = Number(product.special_price);
                    else updatedItem.unit_price = Number(product.retail_price);
                }
            }

            // Logic: Recalculate Subtotal
            updatedItem.sub_total = Number(updatedItem.quantity) * Number(updatedItem.unit_price);

            return updatedItem;
        }));
    };

    // Prepare options for the SearchableSelect
    const productOptions = useMemo(() => {
        return products.map(p => ({
            value: String(p.id),
            label: `${p.sku} - ${p.name}`,
        }));
    }, [products]);

    // Calculate Grand Total for Display (Local Display)
    const grandTotal = items.reduce((sum, item) => sum + (item.sub_total || 0), 0);
    const isDisabled = mode === 'view';

    return (
        <div className="space-y-4">
            {/* Table Header  */}
            <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 border-b pb-2 uppercase tracking-wider">
                <div className="col-span-4">Product</div>
                <div className="col-span-1 text-center">Stock</div>
                <div className="col-span-2">Price Tier</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-right">Total</div>
            </div>

            {/* Rows */}
            <div className="space-y-4 sm:space-y-2">
                {items.map((item) => {
                    const currentStock = getStock(item.product_id);
                    // Validation: Check if stock is low
                    const isLowStock = currentStock < item.quantity && item.product_id !== '';

                    return (
                        <div key={item.key} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-none">

                            {/* 🟢 Product Select (NOW SEARCHABLE) */}
                            <div className="col-span-4">
                                <Label className="sm:hidden text-xs text-gray-500">Product</Label>
                                <SearchableSelect
                                    options={productOptions}
                                    value={item.product_id}
                                    onChange={(v) => handleFieldChange(item.key, 'product_id', v)}
                                    placeholder="Select Item..."
                                    disabled={isDisabled}
                                    className="bg-white"
                                />
                            </div>

                            {/* Stock Display */}
                            <div className="col-span-1 flex flex-col justify-center text-center">
                                <span className={`text-xs font-mono font-medium py-1 px-2 rounded ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                    {item.product_id ? currentStock : '-'}
                                </span>
                            </div>

                            {/* Category Select (Standard Dropdown is fine here) */}
                            <div className="col-span-2">
                                <Label className="sm:hidden text-xs text-gray-500">Tier</Label>
                                <Select
                                    disabled={isDisabled}
                                    value={item.price_category}
                                    onValueChange={(v) => handleFieldChange(item.key, 'price_category', v)}
                                >
                                    <SelectTrigger className="h-9 bg-white text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="retail">Retail</SelectItem>
                                        <SelectItem value="wholesale">Wholesale</SelectItem>
                                        <SelectItem value="special">Special</SelectItem>
                                        <SelectItem value="manual">Manual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Price Input */}
                            <div className="col-span-2">
                                <Label className="sm:hidden text-xs text-gray-500">Price</Label>
                                <Input
                                    type="number"
                                    className="h-9 bg-white text-right"
                                    min="0"
                                    value={item.unit_price}
                                    onChange={(e) => handleFieldChange(item.key, 'unit_price', e.target.value)}
                                    // Disable unless Manual or Special
                                    disabled={isDisabled || (item.price_category !== 'manual' && item.price_category !== 'special')}
                                />
                            </div>

                            {/* Quantity */}
                            <div className="col-span-1">
                                <Label className="sm:hidden text-xs text-gray-500">Qty</Label>
                                <Input
                                    type="number"
                                    className={`h-9 text-center ${isLowStock ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleFieldChange(item.key, 'quantity', e.target.value)}
                                    disabled={isDisabled}
                                />
                            </div>

                            {/* Subtotal (Read Only) */}
                            <div className="col-span-2 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                                <Label className="sm:hidden text-xs font-bold">Total:</Label>
                                <div className="font-mono font-bold text-gray-800">
                                    {item.sub_total.toLocaleString()}
                                </div>
                                {!isDisabled && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleRemoveItem(item.key)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t gap-4">
                {!isDisabled ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddItem}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 w-full sm:w-auto"
                    >
                        <Plus size={16} className="mr-2" /> Add Item
                    </Button>
                ) : <div></div>}

                <div className="flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-lg border">
                    <span className="text-gray-500 font-medium text-sm">Grand Total:</span>
                    <span className="text-xl font-bold text-gray-900 font-mono">
                        {grandTotal.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
};
