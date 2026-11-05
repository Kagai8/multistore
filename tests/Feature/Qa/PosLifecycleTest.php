<?php

namespace Tests\Feature\Qa;

use App\Models\Payment;
use App\Models\PaymentToCustomer;
use App\Models\PosSale;
use App\Models\PosSession;
use App\Models\Sale;

/**
 * QA: Point of Sale — register session, sale, parking/resume and cash reconciliation.
 */
class PosLifecycleTest extends QaTestCase
{
    private function sell(int $qty, float $price, string $status = 'completed', ?float $tendered = null): PosSale
    {
        $tendered ??= $qty * $price;

        $payload = [
            'customer_id' => $this->walkIn->id,
            'status' => $status,
            'cart' => [
                ['id' => $this->productA->id, 'qty' => $qty, 'price' => $price, 'priceType' => 'retail'],
            ],
        ];

        if ($status === 'completed') {
            $payload['payments'] = [['amount' => $tendered, 'method' => 'cash']];
        }

        $this->actingAs($this->admin)->post(route('pos.store'), $payload)->assertRedirect();

        return PosSale::withoutGlobalScopes()->latest('id')->firstOrFail();
    }

    public function test_completed_sale_deducts_stock_and_creates_ledger(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $sale = $this->sell(2, 100);

        $this->assertSame('completed', $sale->status);
        $this->assertEquals(200, (float) $sale->total_amount);
        $this->assertStringStartsWith('RCP-', $sale->receipt_number);
        $this->assertSame($before - 2, $this->qty($this->productA, $this->warehouse));

        $ledger = Sale::withoutGlobalScopes()
            ->where('source_type', PosSale::class)
            ->where('source_id', $sale->id)
            ->first();

        $this->assertNotNull($ledger, 'A completed POS sale must write a Sales ledger row.');
        $this->assertSame('completed', $ledger->status);
        $this->assertSame(1, Payment::withoutGlobalScopes()->where('payable_id', $sale->id)->count());
    }

    public function test_pos_opens_a_register_session_automatically(): void
    {
        $this->assertSame(0, PosSession::withoutGlobalScopes()->count());

        $sale = $this->sell(1, 100);

        $session = PosSession::withoutGlobalScopes()->find($sale->pos_session_id);
        $this->assertNotNull($session);
        $this->assertSame('open', $session->status);
    }

    public function test_parked_sale_holds_stock_but_writes_no_ledger(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $sale = $this->sell(2, 100, 'parked');

        $this->assertSame('parked', $sale->status);
        $this->assertSame($before - 2, $this->qty($this->productA, $this->warehouse), 'Parked sales reserve stock.');

        $this->assertSame(0, Sale::withoutGlobalScopes()->count(), 'Parked sales must not hit the ledger.');
    }

    public function test_resuming_a_parked_sale_returns_the_stock(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);
        $sale = $this->sell(2, 100, 'parked');

        $this->actingAs($this->admin)
            ->delete(route('pos.destroy', $sale))
            ->assertRedirect();

        $this->assertSame($before, $this->qty($this->productA, $this->warehouse), 'Resume must return the held stock.');
    }

    public function test_change_is_recorded_when_customer_tenders_more_than_total(): void
    {
        $sale = $this->sell(1, 100, 'completed', 150);

        $this->assertEquals(50, (float) $sale->fresh()->change_amount);

        $change = PaymentToCustomer::withoutGlobalScopes()->where('pos_sale_id', $sale->id)->first();
        $this->assertNotNull($change);
        $this->assertEquals(50, (float) $change->amount);
    }

    public function test_sale_validation_rejects_empty_cart_and_zero_quantity(): void
    {
        $this->actingAs($this->admin)->post(route('pos.store'), [
            'customer_id' => $this->walkIn->id,
            'status' => 'parked',
            'cart' => [],
        ])->assertSessionHasErrors('cart');

        $this->actingAs($this->admin)->post(route('pos.store'), [
            'customer_id' => $this->walkIn->id,
            'status' => 'parked',
            'cart' => [['id' => $this->productA->id, 'qty' => 0, 'price' => 100]],
        ])->assertSessionHasErrors('cart.0.qty');
    }

    public function test_register_can_be_opened_closed_and_reconciled(): void
    {
        $this->actingAs($this->admin)
            ->post(route('pos.open'), ['opening_cash' => 1000])
            ->assertSessionHas('success');

        $session = PosSession::withoutGlobalScopes()->where('status', 'open')->firstOrFail();
        $this->assertEquals(1000, (float) $session->opening_cash);

        // One cash sale of 200 goes through this register.
        $this->sell(2, 100);

        $this->actingAs($this->admin)
            ->post(route('pos.close-session'), ['closing_cash' => 1150])
            ->assertSessionHas('success');

        $session->refresh();
        $this->assertSame('closed', $session->status);
        $this->assertEquals(1200, (float) $session->opening_cash + 200); // sanity of expectation
        $this->assertEquals(-50, (float) $session->cash_difference, 'Counted 1150 against expected 1200.');
    }

    public function test_opening_a_second_session_is_rejected(): void
    {
        $this->actingAs($this->admin)->post(route('pos.open'), ['opening_cash' => 500]);
        $this->actingAs($this->admin)->post(route('pos.open'), ['opening_cash' => 500])->assertSessionHas('error');

        $this->assertSame(1, PosSession::withoutGlobalScopes()->where('status', 'open')->count());
    }

    public function test_closing_without_an_open_session_is_rejected(): void
    {
        $this->actingAs($this->admin)
            ->post(route('pos.close-session'), ['closing_cash' => 0])
            ->assertSessionHas('error');
    }
}
