/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from 'ziggy-js';
import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RotateCcw, Filter } from 'lucide-react';

interface FilterGridProps {
    lookups: {
        brands: any[];
        categories: any[];
        stores: any[];
        suppliers: any[];
        products: any[];
    };
    filters: any;
}

export const FilterGrid: React.FC<FilterGridProps> = ({ lookups, filters }) => {
    const [values, setValues] = useState({
        min_price: filters.min_price || '',
        max_price: filters.max_price || '',
        stock_min: filters.stock_min || '',
        stock_max: filters.stock_max || '',
    });

    useEffect(() => {
        setValues({
            min_price: filters.min_price || '',
            max_price: filters.max_price || '',
            stock_min: filters.stock_min || '',
            stock_max: filters.stock_max || '',
        });
    }, [filters]);

    const applyFilters = (updates: any) => {
        const newFilters = {
            ...filters,
            ...values,
            ...updates,
            page: 1
        };

        // 🟢 DEBUG CONSOLE
        console.log("Applying filters:", newFilters);

        router.get(route('valuation-reports.index'), newFilters, {
            preserveState: true,
            replace: true,
            onSuccess: () => console.log("Navigation successful"),
            onError: (err) => console.error("Navigation error:", err)
        });
    };

    const handleReset = () => {
        router.get(route('valuation-reports.index'), { tab: filters.tab });
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2 text-orange-700 font-semibold">
                <Filter size={18} />
                <span>Compound Filters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-orange-500">Store Location</Label>
                    <SearchableSelect
                        options={lookups.stores.map(s => ({ label: s.name, value: s.id }))}
                        value={filters.store_id}
                        onChange={(val) => applyFilters({ store_id: val })}
                        placeholder="Select Store"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-orange-500">Brand</Label>
                    <SearchableSelect
                        options={lookups.brands.map(b => ({ label: b.name, value: b.id }))}
                        value={filters.brand_id}
                        onChange={(val) => applyFilters({ brand_id: val })}
                        placeholder="Select Brand"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-orange-500">Category</Label>
                    <SearchableSelect
                        options={lookups.categories.map(c => ({ label: c.name, value: c.id }))}
                        value={filters.category_id}
                        onChange={(val) => applyFilters({ category_id: val })}
                        placeholder="Select Category"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-orange-500">Supplier</Label>
                    <SearchableSelect
                        options={lookups.suppliers.map(sup => ({ label: sup.name, value: sup.id }))}
                        value={filters.supplier_id}
                        onChange={(val) => applyFilters({ supplier_id: val })}
                        placeholder="Select Supplier"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-orange-500">Specific Product</Label>
                    <SearchableSelect
                        options={lookups.products.map(p => ({
                            label: `${p.name} (${p.sku || 'No SKU'})`,
                            value: p.id
                        }))}
                        value={filters.product_id}
                        onChange={(val) => {
                            console.log("Product selected:", val);
                            applyFilters({ product_id: val });
                        }}
                        placeholder="Search Product..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-2 border-t border-orange-100">
                <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs uppercase text-orange-500">Buying Price (Min - Max)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={values.min_price}
                            onChange={(e) => setValues({ ...values, min_price: e.target.value })}
                        />
                        <span className="text-orange-400">—</span>
                        <Input
                            type="number"
                            placeholder="Max"
                            value={values.max_price}
                            onChange={(e) => setValues({ ...values, max_price: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs uppercase text-orange-500">Stock Units (Min - Max)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            placeholder="Min"
                            value={values.stock_min}
                            onChange={(e) => setValues({ ...values, stock_min: e.target.value })}
                        />
                        <span className="text-orange-400">—</span>
                        <Input
                            type="number"
                            placeholder="Max"
                            value={values.stock_max}
                            onChange={(e) => setValues({ ...values, stock_max: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <Button
                        className="flex-1 bg-orange-800 hover:bg-orange-900"
                        onClick={() => applyFilters({})}
                    >
                        Apply BI
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleReset}
                        title="Reset Filters"
                    >
                        <RotateCcw size={18} className="text-orange-500" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FilterGrid;
