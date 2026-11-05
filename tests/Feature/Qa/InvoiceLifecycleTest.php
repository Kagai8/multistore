<?php

namespace Tests\Feature\Qa;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Sale;

/**
 * QA: Invoice (sales) lifecycle — draft -> post -> payment -> void / refund.
 */
class InvoiceLifecycleTest extends QaTestCase
{
    private function createInvoice(int $quantity = 2, string $arrangement = 'full', ?int $customerId = null): Invoice
    {
        $this->actingAs($this->admin)->post(route('invoices.store'), [
            'customer_id' => $customerId ?? $this->customer->id,
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'payment_arrangement' => $arrangement,
            'items' => [
                ['product_id' => $this->productA->id, 'quantity' => $quantity, 'unit_price' => 100, 'price_category' => 'retail'],
            ],
        ])->assertRedirect(route('invoices.index'));

        return Invoice::withoutGlobalScopes()->latest('id')->firstOrFail();
    }

    public function test_draft_invoice_creation_does_not_touch_stock(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $invoice = $this->createInvoice(3);

        $this->assertSame('draft', $invoice->status);
        $this->assertSame('unpaid', $invoice->payment_status);
        $this->assertEquals(300, (float) $invoice->total_amount);
        $this->assertCount(1, $invoice->items);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse), 'Draft must not move stock.');
    }

    public function test_posting_an_invoice_deducts_stock_and_marks_it_posted(): void
    {
        $invoice = $this->createInvoice(3);
        $before = $this->qty($this->productA, $this->warehouse);

        $this->actingAs($this->admin)
            ->post(route('invoices.post', $invoice))
            ->assertRedirect();

        $this->assertSame('posted', $invoice->fresh()->status);
        $this->assertSame($before - 3, $this->qty($this->productA, $this->warehouse));
    }

    public function test_posting_twice_is_rejected_without_extra_stock_movement(): void
    {
        $invoice = $this->createInvoice(2);

        $this->actingAs($this->admin)->post(route('invoices.post', $invoice));
        $afterFirst = $this->qty($this->productA, $this->warehouse);

        $this->actingAs($this->admin)
            ->post(route('invoices.post', $invoice->fresh()))
            ->assertSessionHas('error');

        $this->assertSame($afterFirst, $this->qty($this->productA, $this->warehouse), 'Double post must not double-deduct.');
    }

    public function test_posting_is_blocked_when_stock_is_insufficient(): void
    {
        $this->stockAt($this->productB, $this->warehouse, 1);

        $this->actingAs($this->admin)->post(route('invoices.store'), [
            'customer_id' => $this->customer->id,
            'invoice_date' => now()->toDateString(),
            'payment_arrangement' => 'full',
            'items' => [
                ['product_id' => $this->productB->id, 'quantity' => 5, 'unit_price' => 250, 'price_category' => 'retail'],
            ],
        ]);

        $invoice = Invoice::withoutGlobalScopes()->latest('id')->firstOrFail();

        $this->actingAs($this->admin)
            ->post(route('invoices.post', $invoice))
            ->assertSessionHas('error');

        $this->assertSame('draft', $invoice->fresh()->status, 'Invoice must stay in draft.');
        $this->assertSame(1, $this->qty($this->productB, $this->warehouse), 'Stock must not go negative.');
    }

    public function test_payment_before_posting_is_rejected(): void
    {
        $invoice = $this->createInvoice(1);

        $this->actingAs($this->admin)
            ->post(route('invoices.payment', $invoice), [
                'payments' => [
                    ['amount' => 100, 'method' => 'cash', 'payment_date' => now()->toDateString()],
                ],
            ])
            ->assertSessionHas('error');

        $this->assertSame('unpaid', $invoice->fresh()->payment_status);
        $this->assertSame(0, Payment::withoutGlobalScopes()->count());
    }

    public function test_full_payment_marks_invoice_paid_and_creates_sales_ledger(): void
    {
        $invoice = $this->createInvoice(2);
        $this->actingAs($this->admin)->post(route('invoices.post', $invoice));

        $this->actingAs($this->admin)
            ->post(route('invoices.payment', $invoice->fresh()), [
                'payments' => [
                    ['amount' => 200, 'method' => 'cash', 'payment_date' => now()->toDateString()],
                ],
            ])
            ->assertSessionHas('success');

        $invoice->refresh();
        $this->assertSame('paid', $invoice->payment_status);
        $this->assertEquals(200, (float) $invoice->paid_amount);
        $this->assertSame(1, Payment::withoutGlobalScopes()->where('invoice_id', $invoice->id)->count());

        $sale = Sale::withoutGlobalScopes()
            ->where('source_type', Invoice::class)
            ->where('source_id', $invoice->id)
            ->first();

        $this->assertNotNull($sale, 'A Sale ledger row must be created on first payment.');
        $this->assertSame('completed', $sale->status);
        $this->assertSame('paid', $sale->payment_status);
        $this->assertCount(1, $sale->items);
    }

    public function test_partial_payment_marks_invoice_partial(): void
    {
        $invoice = $this->createInvoice(2);
        $this->actingAs($this->admin)->post(route('invoices.post', $invoice));

        $this->actingAs($this->admin)->post(route('invoices.payment', $invoice->fresh()), [
            'payments' => [['amount' => 50, 'method' => 'cash', 'payment_date' => now()->toDateString()]],
        ]);

        $invoice->refresh();
        $this->assertSame('partial', $invoice->payment_status);
        $this->assertEquals(50, (float) $invoice->paid_amount);
    }

    public function test_overpayment_records_change_for_customer(): void
    {
        $invoice = $this->createInvoice(1); // 100 due
        $this->actingAs($this->admin)->post(route('invoices.post', $invoice));

        $this->actingAs($this->admin)->post(route('invoices.payment', $invoice->fresh()), [
            'payments' => [['amount' => 150, 'method' => 'cash', 'payment_date' => now()->toDateString()]],
        ]);

        $this->assertSame('paid', $invoice->fresh()->payment_status);

        $change = \App\Models\PaymentToCustomer::withoutGlobalScopes()
            ->where('invoice_id', $invoice->id)
            ->where('type', 'change')
            ->first();

        $this->assertNotNull($change, 'Overpayment must be recorded as change.');
        $this->assertEquals(50, (float) $change->amount);
    }

    public function test_void_restores_stock_and_cancels_the_sales_ledger(): void
    {
        $invoice = $this->createInvoice(4);
        $before = $this->qty($this->productA, $this->warehouse);

        $this->actingAs($this->admin)->post(route('invoices.post', $invoice));
        $this->actingAs($this->admin)->post(route('invoices.payment', $invoice->fresh()), [
            'payments' => [['amount' => 400, 'method' => 'cash', 'payment_date' => now()->toDateString()]],
        ]);

        $this->assertSame($before - 4, $this->qty($this->productA, $this->warehouse));

        $this->actingAs($this->admin)
            ->post(route('invoices.void', $invoice->fresh()))
            ->assertSessionHas('success');

        $this->assertSame('void', $invoice->fresh()->status);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse), 'Void must return the stock.');

        $sale = Sale::withoutGlobalScopes()
            ->where('source_type', Invoice::class)
            ->where('source_id', $invoice->id)
            ->first();

        $this->assertSame('cancelled', $sale->status);
    }

    public function test_void_is_rejected_for_a_draft_invoice(): void
    {
        $invoice = $this->createInvoice(1);
        $before = $this->qty($this->productA, $this->warehouse);

        $this->actingAs($this->admin)
            ->post(route('invoices.void', $invoice))
            ->assertSessionHas('error');

        $this->assertSame('draft', $invoice->fresh()->status);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse));
    }

    public function test_refund_restores_stock_and_marks_sale_returned(): void
    {
        $invoice = $this->createInvoice(2);
        $before = $this->qty($this->productA, $this->warehouse);

        $this->actingAs($this->admin)->post(route('invoices.post', $invoice));
        $this->actingAs($this->admin)->post(route('invoices.payment', $invoice->fresh()), [
            'payments' => [['amount' => 200, 'method' => 'cash', 'payment_date' => now()->toDateString()]],
        ]);

        $this->actingAs($this->admin)
            ->post(route('invoices.refund', $invoice->fresh()))
            ->assertSessionHas('success');

        $this->assertSame('refunded', $invoice->fresh()->status);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse), 'Refund must return the stock.');

        $sale = Sale::withoutGlobalScopes()
            ->where('source_type', Invoice::class)
            ->where('source_id', $invoice->id)
            ->first();

        $this->assertSame('returned', $sale->status);
    }

    public function test_refund_without_payment_is_rejected(): void
    {
        $invoice = $this->createInvoice(1);
        $this->actingAs($this->admin)->post(route('invoices.post', $invoice));

        $this->actingAs($this->admin)
            ->post(route('invoices.refund', $invoice->fresh()))
            ->assertSessionHas('error');

        $this->assertSame('posted', $invoice->fresh()->status);
    }

    public function test_walk_in_customer_cannot_use_partial_arrangement(): void
    {
        $invoice = $this->createInvoice(1, 'partial', $this->walkIn->id);

        $this->actingAs($this->admin)
            ->post(route('invoices.post', $invoice))
            ->assertSessionHas('error');

        $this->assertSame('draft', $invoice->fresh()->status);
    }

    public function test_invoice_store_and_creator_are_stamped_automatically(): void
    {
        $invoice = $this->createInvoice(1);

        $this->assertSame($this->warehouse->id, $invoice->store_id);
        $this->assertSame($this->admin->id, $invoice->user_id);
    }
}
