export const DebtStatsConfig = [
    {
        key: 'total_outstanding_debt',
        label: 'Total Receivables',
        type: 'currency',
        icon: 'Clock',
        color: 'text-red-700',
    },
    {
        key: 'overdue_30_days',
        label: 'Overdue > 30D',
        type: 'currency',
        icon: 'AlertTriangle',
        color: 'text-orange-600',
    },
    {
        key: 'debt_collected_mtd',
        label: 'Collected (MTD)',
        type: 'currency',
        icon: 'CheckCircle2',
        color: 'text-emerald-600',
    },
    {
        key: 'active_debtors_count',
        label: 'Active Debtors',
        type: 'number',
        icon: 'Users',
        color: 'text-blue-600',
    },
];
