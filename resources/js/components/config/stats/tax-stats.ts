export const TaxStatsConfig = [
    {
        key: 'total_vat_collected',
        label: 'VAT Collected',
        type: 'currency',
        icon: 'Gavel',
        color: 'text-red-600',
    },
    {
        key: 'taxable_turnover',
        label: 'Taxable Sales',
        type: 'currency',
        icon: 'BarChart3',
        color: 'text-gray-700',
    },
    {
        key: 'exempt_sales_total',
        label: 'Exempt Sales',
        type: 'currency',
        icon: 'ShieldCheck',
        color: 'text-blue-600',
    },
    {
        key: 'effective_tax_rate',
        label: 'Avg Tax Rate',
        type: 'percentage',
        icon: 'Percent',
        color: 'text-emerald-600',
    },
];
