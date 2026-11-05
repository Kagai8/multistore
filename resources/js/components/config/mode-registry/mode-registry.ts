/* eslint-disable @typescript-eslint/no-explicit-any */
/* resources/js/components/config/mode-registry.ts */

import { AdjustmentFilters } from '@/components/config/filters/adjustment-filters';
import { DebtFilters } from '@/components/config/filters/debt-filters';
import { MovementFilters } from '@/components/config/filters/movement-filters';
import { PaymentsFilters } from '@/components/config/filters/payments-filters';
import { PerformanceFilters } from '@/components/config/filters/performance-filters';
import { ProfitLossFilters } from '@/components/config/filters/profit-loss-filters';
import { RefundsFilters } from '@/components/config/filters/refunds-filters';
import { TaxFilters } from '@/components/config/filters/tax-filters';
import { ValuationFilters } from '@/components/config/filters/valuation-filters';

import { AdjustmentStatsConfig } from '@/components/config/stats/adjustment-stats';
import { DebtStatsConfig } from '@/components/config/stats/debt-stats';
import { MovementStatsConfig } from '@/components/config/stats/movement-stats';
import { PaymentsStatsConfig } from '@/components/config/stats/payments-stats';
import { PerformanceStatsConfig } from '@/components/config/stats/performance-stats';
import { ProfitLossStatsConfig } from '@/components/config/stats/profit-loss-stats';
import { RefundsStatsConfig } from '@/components/config/stats/refunds-stats';
import { TaxStatsConfig } from '@/components/config/stats/tax-stats';
import { ValuationStatsConfig } from '@/components/config/stats/valuation-stats';

import { AdjustmentTableConfig } from '@/components/config/tables/adjustment-report-table';
import { DebtTableConfig } from '@/components/config/tables/debt-report-table';
import { MovementTableConfig } from '@/components/config/tables/movement-report-table';
import { PaymentsTableConfig } from '@/components/config/tables/payments-report-table';
import { PerformanceTableConfig } from '@/components/config/tables/performance-report-table';
import { ProfitLossTableConfig } from '@/components/config/tables/profit-loss-report-table';
import { RefundsTableConfig } from '@/components/config/tables/refunds-report-table';
import { TaxTableConfig } from '@/components/config/tables/tax-report-table';
import { ValuationTableConfig } from '@/components/config/tables/valuation-report-table';

// 🟢 Split into two specific groups to fix the "9 tabs" issue
export const INVENTORY_MODES = [
    { id: 'valuation', label: 'Stock Valuation', icon: 'BarChart3' },
    { id: 'movement', label: 'Stock Movement', icon: 'ArrowLeftRight' },
    { id: 'adjustments', label: 'Adjustments', icon: 'Sliders' },
];

export const FINANCE_MODES = [
    { id: 'profit_loss', label: 'Profit & Loss', icon: 'Receipt' },
    { id: 'performance', label: 'Product Performance', icon: 'TrendingUp' },
    { id: 'tax_summary', label: 'Tax Summary', icon: 'Gavel' },
    { id: 'payments', label: 'Payment Split', icon: 'Wallet' },
    { id: 'debt_aging', label: 'Debt Aging', icon: 'Clock' },
    { id: 'refunds_voids', label: 'Refunds & Voids', icon: 'RotateCcw' },
];

export const MODE_REGISTRY: Record<string, any> = {
    valuation: {
        title: 'Stock Valuation',
        filters: ValuationFilters,
        stats: ValuationStatsConfig,
        columns: ValuationTableConfig.columns,
        actions: ValuationTableConfig.actions || [],
        requiresFilter: true,
        searchPlaceholder: 'Search Product or SKU...',
        exportRoute: 'valuation-reports.export',
        zeroStateTitle: 'Inventory Value Analyzer',
        zeroStateDescription:
            'Select a store or brand to calculate current asset value and potential revenue.',
    },
    movement: {
        title: 'Stock Movement',
        filters: MovementFilters,
        stats: MovementStatsConfig,
        columns: MovementTableConfig.columns,
        actions: MovementTableConfig.actions || [],
        requiresFilter: false,
        searchPlaceholder: 'Search Reference (TR-XXXX)...',
        exportRoute: 'valuation-reports.export',
        zeroStateTitle: 'Logistics Overview',
        zeroStateDescription: 'Track stock transfers between store locations.',
    },
    adjustments: {
        title: 'Stock Adjustments',
        filters: AdjustmentFilters,
        stats: AdjustmentStatsConfig,
        columns: AdjustmentTableConfig.columns,
        actions: AdjustmentTableConfig.actions || [],
        requiresFilter: true,
        searchPlaceholder: 'Search by Reason...',
        exportRoute: 'valuation-reports.export',
        zeroStateTitle: 'Correction Audit',
        zeroStateDescription:
            'Review manual stock adjustments and loss impacts.',
    },
    profit_loss: {
        title: 'Profit & Loss Ledger',
        filters: ProfitLossFilters,
        stats: ProfitLossStatsConfig,
        columns: ProfitLossTableConfig.columns,
        actions: ProfitLossTableConfig.actions || [],
        requiresFilter: true,
        searchPlaceholder: 'Search Reference or Product...',
        exportRoute: 'financial-reports.export',
        zeroStateTitle: 'Financial Margin Analyzer',
        zeroStateDescription:
            'Analyze gross profit margins per sale. Tracks retail vs manual price performance.',
    },
    performance: {
        title: 'Product Performance',
        filters: PerformanceFilters,
        stats: PerformanceStatsConfig,
        columns: PerformanceTableConfig.columns,
        actions: PerformanceTableConfig.actions || [],
        requiresFilter: false,
        searchPlaceholder: 'Search Product Performance...',
        exportRoute: 'financial-reports.export',
        zeroStateTitle: 'Sales Velocity Tracker',
        zeroStateDescription:
            'Identify your most profitable items and slow-moving stock.',
    },
    tax_summary: {
        title: 'Tax & VAT Summary',
        filters: TaxFilters,
        stats: TaxStatsConfig,
        columns: TaxTableConfig.columns,
        actions: TaxTableConfig.actions || [],
        requiresFilter: true,
        searchPlaceholder: 'Search Invoice No...',
        exportRoute: 'financial-reports.export',
        zeroStateTitle: 'Tax Compliance',
        zeroStateDescription:
            'Overview of VAT collected and taxable turnover for filing.',
    },
    payments: {
        title: 'Payment Split',
        filters: PaymentsFilters,
        stats: PaymentsStatsConfig,
        columns: PaymentsTableConfig.columns,
        actions: PaymentsTableConfig.actions || [],
        requiresFilter: true,
        searchPlaceholder: 'Search Payments...',
        exportRoute: 'financial-reports.export',
        zeroStateTitle: 'Cash Reconciliation',
        zeroStateDescription:
            'Audit M-Pesa, Cash, and Bank totals including change given.',
    },
    debt_aging: {
        title: 'Debt Aging',
        filters: DebtFilters,
        stats: DebtStatsConfig,
        columns: DebtTableConfig.columns,
        actions: DebtTableConfig.actions || [],
        requiresFilter: false,
        searchPlaceholder: 'Search Customer Debt...',
        exportRoute: 'financial-reports.export',
        zeroStateTitle: 'Accounts Receivable',
        zeroStateDescription:
            'Track outstanding balances and long-term credit risk.',
    },
    refunds_voids: {
        title: 'Refunds & Voids',
        filters: RefundsFilters,
        stats: RefundsStatsConfig,
        columns: RefundsTableConfig.columns,
        actions: RefundsTableConfig.actions || [],
        requiresFilter: false,
        searchPlaceholder: 'Search Voided Sales...',
        exportRoute: 'financial-reports.export',
        zeroStateTitle: 'Revenue Protection',
        zeroStateDescription:
            'Audit cancelled sales and returned items to prevent loss.',
    },
};
