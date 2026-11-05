<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class FinancialReportExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping
{
    protected $rows;

    protected $tab;

    public function __construct($rows, string $tab)
    {
        $this->rows = $rows;
        $this->tab = $tab;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return $this->rows;
    }

    /**
     * Table headers for the active report tab.
     */
    public function headings(): array
    {
        return match ($this->tab) {
            'performance' => ['Product', 'SKU', 'Qty Sold', 'Revenue (KSh)', 'Profit (KSh)', 'Avg Margin %'],
            'tax_summary' => ['Invoice #', 'Customer', 'Invoice Date', 'Sub Total', 'Tax', 'Total', 'Status'],
            'payments' => ['Method', 'Cashier', 'Tendered (KSh)', 'Change Given (KSh)', 'Net (KSh)', 'Date'],
            'debt_aging' => ['Customer', 'Principal (KSh)', 'Balance (KSh)', 'Due Date', 'Status', 'Days Overdue'],
            'refunds_voids' => ['Reference #', 'Staff', 'Amount (KSh)', 'Reason', 'Voided At', 'Type'],
            default => ['Date', 'Reference #', 'Product', 'Store', 'Qty', 'Unit Price (KSh)', 'Total (KSh)', 'Unit Cost (KSh)', 'Gross Profit (KSh)'],
        };
    }

    /**
     * Map a report row to a spreadsheet row.
     */
    public function map($row): array
    {
        return match ($this->tab) {
            'performance' => [
                $row->product_name,
                $row->sku,
                (int) $row->total_qty_sold,
                round((float) $row->total_revenue, 2),
                round((float) $row->total_profit, 2),
                round((float) $row->avg_margin, 2),
            ],
            'tax_summary' => [
                $row->invoice_number,
                $row->customer_name,
                $row->invoice_date,
                round((float) $row->sub_total, 2),
                round((float) $row->tax_amount, 2),
                round((float) $row->total_amount, 2),
                $row->status,
            ],
            'payments' => [
                $row->payment_method,
                $row->user_name,
                round((float) $row->amount_tendered, 2),
                round((float) $row->change_given, 2),
                round((float) $row->net_amount, 2),
                $row->created_at,
            ],
            'debt_aging' => [
                $row->customer_name,
                round((float) $row->principal_amount, 2),
                round((float) $row->balance, 2),
                $row->due_date,
                $row->status,
                (int) $row->days_overdue,
            ],
            'refunds_voids' => [
                $row->reference_no,
                $row->staff_name,
                round((float) $row->amount, 2),
                $row->reason_note,
                $row->created_at,
                $row->void_type,
            ],
            default => [
                $row->created_at,
                $row->reference_no,
                $row->product_name,
                $row->store_name,
                (int) $row->quantity,
                round((float) $row->unit_price, 2),
                round((float) $row->total_price, 2),
                round((float) $row->unit_cost, 2),
                round((float) $row->gross_profit, 2),
            ],
        };
    }
}
