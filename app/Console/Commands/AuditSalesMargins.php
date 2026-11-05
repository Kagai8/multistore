<?php

namespace App\Console\Commands;

use App\Models\SaleItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AuditSalesMargins extends Command
{
    protected $signature = 'finance:audit-margins {--store= : Filter by store ID}';

    protected $description = 'Analyze sales items to detect low or negative profit margins';

    public function handle()
    {
        $query = SaleItem::query()
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->select(
                'products.name',
                'sale_items.unit_price',
                'products.buying_price',
                DB::raw('(sale_items.unit_price - products.buying_price) as margin')
            );

        if ($this->option('store')) {
            $query->whereHas('sale', fn ($q) => $q->where('store_id', $this->option('store')));
        }

        $lowMargins = $query->whereRaw('sale_items.unit_price <= products.buying_price')->get();

        if ($lowMargins->isEmpty()) {
            $this->info('All checked sales are profitable!');

            return;
        }

        $this->warn('Found '.$lowMargins->count().' items sold at or below cost price:');

        // name / buying_price / margin are raw SELECT aliases, not model attributes.
        $this->table(
            ['Product', 'Sold At', 'Cost Price', 'Profit'],
            $lowMargins->map(fn (SaleItem $m) => [
                $m->getAttribute('name'),
                $m->getAttribute('unit_price'),
                $m->getAttribute('buying_price'),
                $m->getAttribute('margin'),
            ])->toArray()
        );
    }
}
