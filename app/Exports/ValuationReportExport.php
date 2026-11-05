<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ValuationReportExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping
{
    protected $data;

    protected $stats;

    protected $tab;

    protected $company;

    public function __construct($data, $stats, $tab, $company)
    {
        $this->data = $data;
        $this->stats = $stats;
        $this->tab = $tab;
        $this->company = $company;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return $this->data;
    }

    /**
     * Table Headers
     */
    public function headings(): array
    {
        return match ($this->tab) {
            'movement' => [
                'Date', 'Reference #', 'Product', 'Source Store', 'Destination Store', 'Quantity', 'Status',
            ],
            'adjustments' => [
                'Date', 'Product', 'Store', 'Reason', 'Qty Before', 'Adj Qty', 'Qty After', 'Value Impact (KSh)', 'Notes',
            ],
            default => [
                'Product Name', 'Store', 'Buying Price (KSh)', 'Retail Price (KSh)', 'Current Stock', 'Total Asset Value (KSh)',
            ],
        };
    }

    /**
     * Row Mapping
     */
    public function map($row): array
    {
        return match ($this->tab) {
            'movement' => [
                $row->created_at ? $row->created_at->format('d M Y H:i') : '-',
                $row->reference_number,
                $row->product_name,
                $row->source_name,
                $row->destination_name,
                $row->quantity,
                ucfirst($row->status),
            ],
            'adjustments' => [
                $row->created_at ? $row->created_at->format('d M Y H:i') : '-',
                $row->product_name,
                $row->store_name,
                $row->reason_name ?? 'N/A',
                $row->old_stock,
                $row->adjusted_qty,
                $row->new_stock,
                number_format($row->value_impact, 2, '.', ''),
                $row->notes,
            ],
            default => [
                $row->product_name,
                $row->store_name,
                number_format($row->buying_price, 2, '.', ''),
                number_format($row->retail_price, 2, '.', ''),
                $row->current_stock,
                number_format($row->asset_value, 2, '.', ''),
            ],
        };
    }
}
