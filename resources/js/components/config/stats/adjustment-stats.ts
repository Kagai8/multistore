export const AdjustmentStatsConfig = [
    {
        key: 'total_adjustments',
        label: 'Adjustment Count',
        type: 'number',
        icon: 'ClipboardCheck',
        color: 'text-slate-700',
    },
    {
        key: 'net_value_impact',
        label: 'Net Value Impact',
        type: 'currency',
        icon: 'Scale',
        color: 'text-red-500',
    }, // Usually negative
    {
        key: 'items_affected',
        label: 'Items Adjusted',
        type: 'number',
        icon: 'Layers',
        color: 'text-orange-600',
    },
];
