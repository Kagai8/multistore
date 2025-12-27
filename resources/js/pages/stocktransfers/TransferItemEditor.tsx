/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';

// --- Interface Definitions ---

interface ProductLookup {
    id: number;
    name: string;
    sku: string;
}

interface TransferItem {
    key: number;
    product_id: number | string;
    quantity: number | string;
}

interface TransferItemEditorProps {
    data: TransferItem[];
    onUpdate: (items: Array<{ product_id: number; quantity: number }>) => void;
    products: ProductLookup[];
    sourceStoreId: number | string;
    mode: 'create' | 'view' | 'edit';
    // 🟢 NEW: Stock data structure: { product_id: { store_id: stock_qty, ... } }
    productStocks: Record<string, Record<string, number>>;
}

// Global counter for unique item keys
let nextKey = 0;

export const TransferItemEditor: React.FC<TransferItemEditorProps> = ({
    data: initialData,
    onUpdate,
    products,
    sourceStoreId,
    mode,
    // 🟢 Destructure the new stock prop
    productStocks,
}) => {
    // 1. Local state for managing the items array
    const [items, setItems] = useState<TransferItem[]>(() => {
        // Initialize with keys if passed existing data
        return initialData.map(item => ({
            // Ensure product_id is correctly typed for display
            ...item,
            product_id: item.product_id ?? '',
            key: nextKey++
        }));
    });

    // 2. Effect to sync local state back to parent form data
    useEffect(() => {
    if (mode === 'view') {
        return;
    }

    const cleanedItems = items
        .filter(item => item.product_id && Number(item.quantity) > 0)
        .map(item => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
        }));

    onUpdate(cleanedItems);
}, [JSON.stringify(items), mode]);

    // 💡 NEW: Memoized function to get the stock for a specific product and store
    const getProductStock = (productId: string | number, storeId: string | number): number | string => {
        const productKey = String(productId);
        const storeKey = String(storeId);

        // If no product or store is selected, return N/A
        if (!productKey || !storeKey || storeKey === '0' || storeKey === '') {
            return 'N/A';
        }

        const stocksByStore = productStocks[productKey];

        if (!stocksByStore) {
            return 0; // Product has no stock records globally
        }

        const stock = stocksByStore[storeKey];

        // Return 0 if the product exists but not in that specific store, otherwise return the stock
        return stock === undefined ? 0 : stock;
    };


    // 3. Handlers

    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            { key: nextKey++, product_id: '', quantity: 1 },
        ]);
    };

    const handleRemoveItem = (keyToRemove: number) => {
        // Ensure we always have at least one item if in create/edit mode
        if (mode !== 'view' && items.length === 1) {
            // Optional: reset the single item instead of removing
            setItems([{ key: nextKey++, product_id: '', quantity: 1 }]);
            return;
        }
        setItems(prev => prev.filter(item => item.key !== keyToRemove));
    };

    const handleItemChange = (keyToChange: number, field: keyof TransferItem, value: any) => {
        setItems(prev => prev.map(item =>
            item.key === keyToChange ? { ...item, [field]: value } : item
        ));
    };

    const productOptions = useMemo(() => {
        return products.map(p => ({
            value: String(p.id),
            label: `${p.sku} - ${p.name}`,
        }));
    }, [products]);

    // Check if the form is disabled (view mode or processing)
    const isDisabled = mode === 'view';

    return (
        <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-600 border-b pb-2">
                <div className="col-span-6">Product (SKU - Name)</div>
                <div className="col-span-3 text-center">Quantity *</div>
                {/* Updated Header */}
                <div className="col-span-2 text-center">Current Stock (Source)</div>
                <div className="col-span-1"></div> {/* Action column */}
            </div>

            {/* Item Rows */}
            {items.map((item) => {
                // 🟢 Call the stock lookup function
                const sourceStock = getProductStock(item.product_id, sourceStoreId);

                return (
                    <div key={item.key} className="grid grid-cols-12 gap-3 items-center">

                        {/* Product Select */}
                        <div className="col-span-6">
                            <Select
                                disabled={isDisabled}
                                value={String(item.product_id) || ''}
                                onValueChange={(v) => handleItemChange(item.key, 'product_id', v)}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select Product" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {productOptions.map(option => (
                                        <SelectItem value={option.value} key={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Quantity Input */}
                        <div className="col-span-3">
                            <Input
                                type="number"
                                placeholder="Qty"
                                min="1"
                                className="h-9 text-center"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(item.key, 'quantity', e.target.value)}
                                disabled={isDisabled}
                            />
                        </div>

                        {/* Current Stock Display (READ-ONLY) */}
                        <div className="col-span-2 text-center text-sm font-medium text-gray-700">
                            <Label className='block border border-gray-200 bg-gray-50 p-2 rounded'>
                                {/* 🟢 Display the result of the lookup */}
                                {sourceStoreId ? sourceStock : 'Select Source'}
                            </Label>
                        </div>

                        {/* Remove Button */}
                        <div className="col-span-1 flex justify-center">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => handleRemoveItem(item.key)}
                                disabled={isDisabled} // Allow deletion unless in view mode
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                );
            })}

            {/* Add Item Button */}
            {!isDisabled && (
                <div className="pt-2 border-t mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddItem}
                        className="flex items-center gap-1 text-orange-600 border-orange-400 hover:bg-orange-50"
                    >
                        <Plus size={16} /> Add Another Item
                    </Button>
                </div>
            )}

            {items.length === 0 && mode !== 'view' && (
                <div className="text-red-500 font-medium pt-2">
                    * At least one item is required for the transfer.
                </div>
            )}
        </div>
    );
};
