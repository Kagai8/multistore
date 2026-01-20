/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select'; // Ensure you have this component saved
import { formatCurrency } from '@/lib/utils'; // Assuming you have a helper

// --- Interface Definitions ---

interface ProductLookup {
    id: number;
    name: string;
    sku: string;
    buying_price: number; // 🟢 Vital for default cost
}

interface POItem {
    key: number;
    product_id: number | string;
    quantity: number | string;
    cost: number | string; // Unit Cost
}

interface PurchaseOrderItemEditorProps {
    data: POItem[];
    onUpdate: (items: any[]) => void;
    products: ProductLookup[];
    mode: 'create' | 'view' | 'edit';
}

// Global counter for unique item keys
let nextKey = 0;

export const PurchaseOrderItemEditor: React.FC<PurchaseOrderItemEditorProps> = ({
    data: initialData,
    onUpdate,
    products,
    mode,
}) => {
    // 1. Local state
    const [items, setItems] = useState<POItem[]>(() => {
        if (!initialData || initialData.length === 0) {
            return [{ key: nextKey++, product_id: '', quantity: 1, cost: 0 }];
        }
        return initialData.map(item => ({
            ...item,
            product_id: item.product_id ?? '',
            cost: item.cost ?? 0,
            key: nextKey++
        }));
    });

    // 2. Sync to parent
    useEffect(() => {
        if (mode === 'view') return;

        const cleanedItems = items
            .filter(item => item.product_id && Number(item.quantity) > 0)
            .map(item => ({
                product_id: Number(item.product_id),
                quantity: Number(item.quantity),
                cost: Number(item.cost)
            }));

        onUpdate(cleanedItems);
    }, [items, mode]);

    // 3. Helpers
    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            { key: nextKey++, product_id: '', quantity: 1, cost: 0 },
        ]);
    };

    const handleRemoveItem = (keyToRemove: number) => {
        if (mode !== 'view' && items.length === 1) {
            setItems([{ key: nextKey++, product_id: '', quantity: 1, cost: 0 }]);
            return;
        }
        setItems(prev => prev.filter(item => item.key !== keyToRemove));
    };

    const handleItemChange = (key: number, field: keyof POItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.key !== key) return item;

            const updates: any = { [field]: value };

            // 🟢 Auto-fill Cost when Product is selected
            if (field === 'product_id') {
                const product = products.find(p => String(p.id) === String(value));
                if (product) {
                    updates.cost = product.buying_price;
                }
            }

            return { ...item, ...updates };
        }));
    };

    // Prepare Options for SearchableSelect
    const productOptions = useMemo(() => {
        return products.map(p => ({
            value: p.id,
            label: `${p.sku} - ${p.name}`,
        }));
    }, [products]);

    // Calculate Grand Total for display
    const grandTotal = items.reduce((sum, item) => {
        return sum + (Number(item.quantity || 0) * Number(item.cost || 0));
    }, 0);

    const isDisabled = mode === 'view';

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-600 border-b pb-2">
                <div className="col-span-5">Product (SKU - Name)</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Unit Cost</div>
                <div className="col-span-2 text-right">Line Total</div>
                <div className="col-span-1"></div>
            </div>

            {/* Rows */}
            {items.map((item) => {
                const lineTotal = Number(item.quantity || 0) * Number(item.cost || 0);

                return (
                    <div key={item.key} className="grid grid-cols-12 gap-3 items-center">
                        {/* Product */}
                        <div className="col-span-5">
                            <SearchableSelect
                                options={productOptions}
                                value={item.product_id}
                                onChange={(val) => handleItemChange(item.key, 'product_id', val)}
                                disabled={isDisabled}
                                placeholder="Select Product..."
                            />
                        </div>

                        {/* Qty */}
                        <div className="col-span-2">
                            <Input
                                type="number"
                                min="1"
                                className="h-9 text-center"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(item.key, 'quantity', e.target.value)}
                                disabled={isDisabled}
                            />
                        </div>

                        {/* Unit Cost */}
                        <div className="col-span-2">
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="h-9 text-right"
                                value={item.cost}
                                onChange={(e) => handleItemChange(item.key, 'cost', e.target.value)}
                                disabled={isDisabled}
                            />
                        </div>

                        {/* Line Total (Read Only) */}
                        <div className="col-span-2 text-right font-mono text-sm font-medium text-gray-700 pt-2">
                            {formatCurrency(lineTotal)}
                        </div>

                        {/* Remove */}
                        <div className="col-span-1 flex justify-center">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveItem(item.key)}
                                disabled={isDisabled}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                );
            })}

            {/* Footer / Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                    {!isDisabled && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddItem}
                            className="flex items-center gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                            <Plus size={16} /> Add Product
                        </Button>
                    )}
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Amount</span>
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(grandTotal)}</span>
                </div>
            </div>

            {/* Golden Rule Alert */}
            {!isDisabled && (
                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded flex items-start gap-2 border border-blue-100 mt-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>
                        <strong>Note:</strong> Ensure products are registered in the Product Catalog before adding them here.
                        Unit costs default to your system's Buying Price but should be updated to match the Supplier's quote.
                    </p>
                </div>
            )}
        </div>
    );
};
