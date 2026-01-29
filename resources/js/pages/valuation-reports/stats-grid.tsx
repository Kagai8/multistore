/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Package, AlertTriangle } from 'lucide-react';

interface StatsGridProps {
    stats: {
        total_asset_value: number;
        potential_revenue: number;
        total_units: number;
        low_stock_count: number;
    };
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {

    // Helper to format currency specifically for Kenyan Shilling context
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KSh',
            minimumFractionDigits: 2
        }).format(val);
    };

    // Helper to format large numbers with commas
    const formatNumber = (val: number) => {
        return new Intl.NumberFormat().format(val);
    };

    console.log('[Stats-Grid] Rendering metrics:', stats);

    const metrics = [
        {
            title: "Total Asset Value",
            value: formatCurrency(stats.total_asset_value),
            description: "Cost of current inventory",
            icon: Wallet,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: "Potential Revenue",
            value: formatCurrency(stats.potential_revenue),
            description: "Expected value at retail",
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50"
        },
        {
            title: "Total Units",
            value: formatNumber(stats.total_units),
            description: "Total items in stock",
            icon: Package,
            color: "text-orange-600",
            bg: "bg-orange-50"
        },
        {
            title: "Low Stock Alert",
            value: formatNumber(stats.low_stock_count),
            description: "Items with <= 5 units",
            icon: AlertTriangle,
            color: "text-red-600",
            bg: "bg-red-50"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((item, index) => {
                const Icon = item.icon;
                return (
                    <Card key={index} className="border-orange-200 shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-500 uppercase tracking-wider">
                                {item.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${item.bg}`}>
                                <Icon size={18} className={item.color} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-900 tracking-tight">
                                {item.value}
                            </div>
                            <p className="text-xs text-orange-400 mt-1">
                                {item.description}
                            </p>
                        </CardContent>
                        {/* Visual indicator bar at the bottom for BI feel */}
                        <div className={`h-1 w-full ${item.bg} opacity-50`} />
                    </Card>
                );
            })}
        </div>
    );
};

export default StatsGrid;
