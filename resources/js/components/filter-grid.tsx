/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { FilterDefinition } from '@/types/reports';
import { router } from '@inertiajs/react';
import { Filter, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { route } from 'ziggy-js';

interface FilterGridProps {
    lookups: {
        brands: any[];
        categories: any[];
        stores: any[];
        suppliers: any[];
        products: any[];
        [key: string]: any[];
    };
    filters: any;
    config: FilterDefinition[];
    // 🟢 The Missing Piece: Tell the grid which route to use
    routeName: string;
}

export const FilterGrid: React.FC<FilterGridProps> = ({
    lookups,
    filters,
    config,
    routeName,
}) => {
    const [rangeValues, setRangeValues] = useState<Record<string, string>>({});

    useEffect(() => {
        const syncValues: Record<string, string> = {};
        config.forEach((f) => {
            if (f.type === 'range' || f.type === 'date-range') {
                syncValues[f.fields[0]] = filters[f.fields[0]] || '';
                syncValues[f.fields[1]] = filters[f.fields[1]] || '';
            }
        });
        setRangeValues(syncValues);
    }, [filters, config]);

    const applyFilters = (updates: any) => {
        const newFilters = {
            ...filters,
            ...rangeValues,
            ...updates,
            page: 1,
        };

        // 🟢 FIXED: Using dynamic routeName instead of hardcoded valuation-reports.index
        router.get(route(routeName), newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        // 🟢 FIXED: Resetting within the context of the current module
        router.get(route(routeName), { tab: filters.tab, store_id: 'all' });
    };

    const handleLocalChange = (field: string, value: string) => {
        setRangeValues((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6 rounded-xl border border-orange-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-orange-50 pb-2 font-semibold text-orange-700">
                <Filter size={18} />
                <span>BI Intelligence Filters</span>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {config.map((item) => (
                    <div key={item.id} className="space-y-2">
                        <Label className="text-[10px] font-bold tracking-widest text-orange-500 uppercase">
                            {item.label}
                        </Label>

                        {item.type === 'select' && (
                            <SearchableSelect
                                options={[
                                    ...(item.id === 'store_id'
                                        ? [{ label: 'All Store', value: 'all' }]
                                        : []),
                                    ...(lookups[item.lookupKey] || []).map(
                                        (opt: any) => ({
                                            label:
                                                opt.name ||
                                                opt.label ||
                                                'Unknown',
                                            value: String(opt.id || opt.value),
                                        }),
                                    ),
                                ]}
                                value={
                                    filters[item.id] ||
                                    (item.id === 'store_id' ? 'all' : '')
                                }
                                onChange={(val) =>
                                    applyFilters({ [item.id]: val })
                                }
                                placeholder={item.placeholder || 'Select...'}
                            />
                        )}

                        {item.type === 'range' && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    className="h-9 border-orange-100 shadow-none focus-visible:ring-orange-500"
                                    value={rangeValues[item.fields[0]] || ''}
                                    onChange={(e) =>
                                        handleLocalChange(
                                            item.fields[0],
                                            e.target.value,
                                        )
                                    }
                                />
                                <span className="text-orange-300">-</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    className="h-9 border-orange-100 shadow-none focus-visible:ring-orange-500"
                                    value={rangeValues[item.fields[1]] || ''}
                                    onChange={(e) =>
                                        handleLocalChange(
                                            item.fields[1],
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        )}

                        {item.type === 'date-range' && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    className="block h-9 w-full appearance-none border-orange-100 text-xs shadow-none focus-visible:ring-orange-500"
                                    value={rangeValues[item.fields[0]] || ''}
                                    onChange={(e) =>
                                        handleLocalChange(
                                            item.fields[0],
                                            e.target.value,
                                        )
                                    }
                                />
                                <span className="text-orange-300">to</span>
                                <Input
                                    type="date"
                                    className="block h-9 w-full appearance-none border-orange-100 text-xs shadow-none focus-visible:ring-orange-500"
                                    value={rangeValues[item.fields[1]] || ''}
                                    onChange={(e) =>
                                        handleLocalChange(
                                            item.fields[1],
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        )}

                        {item.type === 'text' && (
                            <Input
                                className="h-9 border-orange-100 shadow-none focus-visible:ring-orange-500"
                                placeholder={
                                    item.placeholder || 'Type to search...'
                                }
                                value={filters[item.id] || ''}
                                onChange={(e) =>
                                    applyFilters({ [item.id]: e.target.value })
                                }
                            />
                        )}
                    </div>
                ))}

                <div className="flex items-end gap-2 lg:col-span-1">
                    <Button
                        className="h-9 flex-1 bg-orange-800 font-bold shadow-md shadow-orange-100 hover:bg-orange-900"
                        onClick={() => applyFilters({})}
                    >
                        Execute BI
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 border-orange-200 hover:bg-orange-50"
                        onClick={handleReset}
                        title="Reset Filters"
                    >
                        <RotateCcw size={16} className="text-orange-500" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FilterGrid;
