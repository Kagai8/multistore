<?php

namespace Tests\Feature\Qa;

use App\Models\Invoice;
use App\Models\NewStockEntry;
use App\Models\PurchaseOrder;
use App\Models\Quotation;

/**
 * QA: procurement chain — purchase orders, goods-in entries and quotations.
 */
class ProcurementLifecycleTest extends QaTestCase
{
    private function createPo(int $qty = 10, float $cost = 60): PurchaseOrder
    {
        $this->actingAs($this->admin)->post(route('purchase-orders.store'), [
            'supplier_id' => $this->supplier->id,
            'store_id' => $this->warehouse->id,
            'order_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $this->productA->id, 'quantity' => $qty, 'cost' => $cost],
            ],
        ])->assertRedirect();

        return PurchaseOrder::withoutGlobalScopes()->latest('id')->firstOrFail();
    }

    public function test_purchase_order_computes_its_total_from_the_items(): void
    {
        $po = $this->createPo(10, 60);

        $this->assertEquals(600, (float) $po->total_amount);
        $this->assertStringStartsWith('PO-', $po->po_number);
        $this->assertCount(1, $po->items);
        $this->assertSame(0, (int) $po->items->first()->quantity_received);
    }

    public function test_purchase_order_validates_quantities_and_costs(): void
    {
        $this->actingAs($this->admin)->post(route('purchase-orders.store'), [
            'supplier_id' => $this->supplier->id,
            'store_id' => $this->warehouse->id,
            'order_date' => now()->toDateString(),
            'items' => [['product_id' => $this->productA->id, 'quantity' => 0, 'cost' => -5]],
        ])->assertSessionHasErrors(['items.0.quantity', 'items.0.cost']);
    }

    public function test_marking_ordered_then_received_adds_stock(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);
        $po = $this->createPo(10, 60);

        $this->actingAs($this->admin)->post(route('purchase-orders.mark-ordered', $po))->assertRedirect();
        $this->assertSame('ordered', $po->fresh()->status);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse), 'Ordering alone leaves stock untouched.');

        $this->actingAs($this->admin)->post(route('purchase-orders.receive', $po->fresh()))->assertRedirect();

        $po->refresh();
        $this->assertSame('received', $po->status);
        $this->assertSame($before + 10, $this->qty($this->productA, $this->warehouse));
        $this->assertSame(10, (int) $po->items->first()->quantity_received);
    }

    public function test_receiving_a_draft_purchase_order_is_rejected(): void
    {
        $po = $this->createPo(3, 60);
        $before = $this->qty($this->productA, $this->warehouse);

        $this->actingAs($this->admin)
            ->post(route('purchase-orders.receive', $po))
            ->assertSessionHas('flash.error');

        $this->assertSame('draft', $po->fresh()->status);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse));
    }

    public function test_receiving_twice_does_not_double_the_stock(): void
    {
        $po = $this->createPo(4, 60);
        $this->actingAs($this->admin)->post(route('purchase-orders.mark-ordered', $po));
        $this->actingAs($this->admin)->post(route('purchase-orders.receive', $po->fresh()));

        $after = $this->qty($this->productA, $this->warehouse);

        $this->actingAs($this->admin)->post(route('purchase-orders.receive', $po->fresh()));

        $this->assertSame($after, $this->qty($this->productA, $this->warehouse), 'A second receipt must be a no-op.');
    }

    public function test_received_purchase_order_cannot_be_cancelled(): void
    {
        $po = $this->createPo(2, 60);
        $this->actingAs($this->admin)->post(route('purchase-orders.mark-ordered', $po));
        $this->actingAs($this->admin)->post(route('purchase-orders.receive', $po->fresh()));

        $this->actingAs($this->admin)
            ->post(route('purchase-orders.cancel', $po->fresh()))
            ->assertSessionHas('flash.error');

        $this->assertSame('received', $po->fresh()->status);
    }

    public function test_new_stock_entry_stays_pending_until_posted(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $this->actingAs($this->admin)->post(route('new-stock-entries.store'), [
            'product_id' => $this->productA->id,
            'supplier_id' => $this->supplier->id,
            'store_id' => $this->warehouse->id,
            'quantity_received' => 7,
        ])->assertRedirect();

        $entry = NewStockEntry::withoutGlobalScopes()->latest('id')->firstOrFail();

        $this->assertSame(NewStockEntry::STATUS_PENDING, $entry->status);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse), 'A pending entry moves no stock.');

        $this->actingAs($this->admin)->post(route('new-stock-entries.post', $entry))->assertRedirect();

        $entry->refresh();
        $this->assertSame($before + 7, $this->qty($this->productA, $this->warehouse));
        $this->assertNotSame(NewStockEntry::STATUS_PENDING, $entry->status);
    }

    public function test_posting_a_stock_entry_twice_is_rejected(): void
    {
        $this->actingAs($this->admin)->post(route('new-stock-entries.store'), [
            'product_id' => $this->productA->id,
            'supplier_id' => $this->supplier->id,
            'store_id' => $this->warehouse->id,
            'quantity_received' => 5,
            'invoice_number' => 'INV-GRN-001',
        ]);

        $entry = NewStockEntry::withoutGlobalScopes()->latest('id')->firstOrFail();
        $this->actingAs($this->admin)->post(route('new-stock-entries.post', $entry));

        $afterFirst = $this->qty($this->productA, $this->warehouse);
        $this->actingAs($this->admin)->post(route('new-stock-entries.post', $entry->fresh()))->assertSessionHas('flash.error');

        $this->assertSame($afterFirst, $this->qty($this->productA, $this->warehouse));
    }

    public function test_quotation_can_be_sent_and_converted_without_moving_stock(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $this->actingAs($this->admin)->post(route('quotations.store'), [
            'customer_id' => $this->customer->id,
            'quotation_date' => now()->toDateString(),
            'valid_until' => now()->addDays(14)->toDateString(),
            'items' => [
                ['product_id' => $this->productA->id, 'quantity' => 3, 'unit_price' => 100, 'price_category' => 'retail'],
            ],
        ])->assertRedirect();

        $quote = Quotation::withoutGlobalScopes()->latest('id')->firstOrFail();
        $this->assertEquals(300, (float) $quote->total_amount);

        $this->actingAs($this->admin)->post(route('quotations.mark-sent', $quote))->assertRedirect();
        $this->assertSame('sent', $quote->fresh()->status);

        $this->actingAs($this->admin)->post(route('quotations.convert', $quote->fresh()))->assertRedirect();

        $invoice = Invoice::withoutGlobalScopes()->latest('id')->first();
        $this->assertNotNull($invoice, 'Conversion must create an invoice.');
        $this->assertSame('draft', $invoice->status, 'The converted invoice starts as a draft.');
        $this->assertEquals(300, (float) $invoice->total_amount);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse), 'Quotation conversion must not move stock.');
    }

    public function test_quotation_can_be_rejected(): void
    {
        $this->actingAs($this->admin)->post(route('quotations.store'), [
            'customer_id' => $this->customer->id,
            'quotation_date' => now()->toDateString(),
            'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'unit_price' => 100, 'price_category' => 'retail']],
        ]);

        $quote = Quotation::withoutGlobalScopes()->latest('id')->firstOrFail();
        $this->actingAs($this->admin)->post(route('quotations.mark-rejected', $quote))->assertRedirect();

        $this->assertSame('rejected', $quote->fresh()->status);
        $this->assertSame(0, Invoice::withoutGlobalScopes()->count());
    }
}
