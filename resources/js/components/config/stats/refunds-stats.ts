export const RefundsStatsConfig = [
    {
        key: 'total_voided_value',
        label: 'Voided Value',
        type: 'currency',
        icon: 'XCircle',
        color: 'text-gray-600',
    },
    {
        key: 'refund_impact_net',
        label: 'Net Refund Loss',
        type: 'currency',
        icon: 'RotateCcw',
        color: 'text-red-600',
    },
    {
        key: 'void_frequency_rate',
        label: 'Void Rate',
        type: 'percentage',
        icon: 'Activity',
        color: 'text-orange-600',
    },
    {
        key: 'restocked_items',
        label: 'Restocked Qty',
        type: 'number',
        icon: 'RefreshCw',
        color: 'text-blue-600',
    },
];
