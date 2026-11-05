/* eslint-disable @typescript-eslint/no-explicit-any */
// resources/js/components/reports/StatsGrid.tsx
import { Card, CardContent } from '@/components/ui/card';
import * as Icons from 'lucide-react'; // We'll dynamic-map the icon strings
import React from 'react';

interface StatItem {
    key: string;
    label: string;
    type: 'currency' | 'number' | 'percentage';
    icon: string;
    color: string;
}

interface StatsGridProps {
    config: StatItem[];
    data: Record<string, any>; // The stats data from Laravel
    loading?: boolean;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
    config,
    data,
    loading,
}) => {
    const formatValue = (val: number, type: string) => {
        if (val === undefined || val === null) return '—';
        if (type === 'currency')
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'KES',
            }).format(val);
        if (type === 'percentage') return `${val}%`;
        return val.toLocaleString();
    };

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {config.map((stat) => {
                const IconComponent =
                    (Icons as any)[stat.icon] || Icons.BarChart3;

                return (
                    <Card
                        key={stat.key}
                        className="overflow-hidden border-none bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                {' '}
                                {/* Changed to gap-4 for consistent spacing */}
                                <div className="min-w-0 flex-1">
                                    {' '}
                                    {/* flex-1 takes space, min-w-0 allows text truncation/wrapping if needed */}
                                    <p className="mb-1 truncate text-sm font-medium text-slate-500">
                                        {stat.label}
                                    </p>
                                    <h3
                                        className={`text-xl font-bold break-words xl:text-2xl ${stat.color}`}
                                    >
                                        {loading
                                            ? '...'
                                            : formatValue(
                                                  data[stat.key],
                                                  stat.type,
                                              )}
                                    </h3>
                                </div>
                                {/* Added flex-shrink-0 so the icon NEVER gets pushed or resized */}
                                <div
                                    className={`flex-shrink-0 rounded-xl bg-slate-50 p-3 ${stat.color.replace('text-', 'bg-').replace('600', '100')}`}
                                >
                                    <IconComponent size={24} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
