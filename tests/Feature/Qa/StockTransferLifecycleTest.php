<?php

namespace Tests\Feature\Qa;

use App\Models\StockTransfer;

/**
 * QA: inter-store stock transfer approval and dispatch workflow.
 */
class StockTransferLifecycleTest extends QaTestCase
{
    private function createTransfer(int $qty = 5, ?int $sourceId = null, ?int $destId = null): StockTransfer
    {
        $this->actingAs($this->admin)->post(route('stock-transfers.store'), [
            'source_store_id' => $sourceId ?? $this->warehouse->id,
            'destination_store_id' => $destId ?? $this->branch->id,
            'transfer_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $this->productA->id, 'quantity' => $qty],
            ],
        ])->assertRedirect();

        return StockTransfer::withoutGlobalScopes()->latest('id')->firstOrFail();
    }

    public function test_transfer_is_created_as_a_draft_awaiting_approval(): void
    {
        $transfer = $this->createTransfer();

        $this->assertSame('draft', $transfer->status);
        $this->assertSame('pending', $transfer->approved_status);
        $this->assertStringStartsWith('TR-', $transfer->reference);
        $this->assertCount(1, $transfer->items);
    }

    public function test_source_and_destination_must_differ(): void
    {
        $this->actingAs($this->admin)->post(route('stock-transfers.store'), [
            'source_store_id' => $this->warehouse->id,
            'destination_store_id' => $this->warehouse->id,
            'transfer_date' => now()->toDateString(),
            'items' => [['product_id' => $this->productA->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('source_store_id');

        $this->assertSame(0, StockTransfer::withoutGlobalScopes()->count());
    }

    public function test_full_workflow_moves_stock_from_source_to_destination(): void
    {
        $sourceBefore = $this->qty($this->productA, $this->warehouse);
        $destBefore = $this->qty($this->productA, $this->branch);

        $transfer = $this->createTransfer(5);

        $this->actingAs($this->admin)->post(route('stock-transfers.initiate', $transfer))->assertRedirect();
        $this->assertSame('initiated', $transfer->fresh()->status);

        $this->actingAs($this->admin)->post(route('stock-transfers.approve', $transfer->fresh()))->assertRedirect();
        $transfer->refresh();
        $this->assertSame('accepted', $transfer->status);
        $this->assertSame('approved', $transfer->approved_status);

        $this->actingAs($this->admin)->post(route('stock-transfers.send', $transfer), [
            'delivery_type' => 'external',
            'carrier_name' => 'QA Couriers',
        ])->assertRedirect();

        $transfer->refresh();
        $this->assertSame('sent', $transfer->status);
        $this->assertSame($sourceBefore - 5, $this->qty($this->productA, $this->warehouse), 'Dispatch must decrement the source.');
        $this->assertSame($destBefore, $this->qty($this->productA, $this->branch), 'Destination is untouched until receipt.');

        $this->actingAs($this->admin)->post(route('stock-transfers.receive', $transfer->fresh()))->assertRedirect();

        $this->assertSame('received', $transfer->fresh()->status);
        $this->assertSame($sourceBefore - 5, $this->qty($this->productA, $this->warehouse));
        $this->assertSame($destBefore + 5, $this->qty($this->productA, $this->branch), 'Receipt must increment the destination.');
    }

    public function test_send_requires_an_approved_transfer(): void
    {
        $transfer = $this->createTransfer(1);

        $this->actingAs($this->admin)->post(route('stock-transfers.send', $transfer), [
            'delivery_type' => 'external',
            'carrier_name' => 'QA Couriers',
        ])->assertSessionHas('flash.error');

        $this->assertSame('draft', $transfer->fresh()->status);
    }

    public function test_send_requires_a_delivery_method(): void
    {
        $transfer = $this->createTransfer(1);
        $this->actingAs($this->admin)->post(route('stock-transfers.initiate', $transfer));
        $this->actingAs($this->admin)->post(route('stock-transfers.approve', $transfer->fresh()));

        $this->actingAs($this->admin)
            ->post(route('stock-transfers.send', $transfer->fresh()), [])
            ->assertSessionHas('flash.error');

        $this->assertSame('accepted', $transfer->fresh()->status);
    }

    public function test_external_delivery_requires_a_carrier(): void
    {
        $transfer = $this->createTransfer(1);
        $this->actingAs($this->admin)->post(route('stock-transfers.initiate', $transfer));
        $this->actingAs($this->admin)->post(route('stock-transfers.approve', $transfer->fresh()));

        $this->actingAs($this->admin)
            ->post(route('stock-transfers.send', $transfer->fresh()), ['delivery_type' => 'external'])
            ->assertSessionHas('flash.error');
    }

    public function test_send_is_blocked_when_the_source_lacks_stock(): void
    {
        $this->stockAt($this->productA, $this->warehouse, 2);

        $transfer = $this->createTransfer(10);
        $this->actingAs($this->admin)->post(route('stock-transfers.initiate', $transfer));
        $this->actingAs($this->admin)->post(route('stock-transfers.approve', $transfer->fresh()));

        $this->actingAs($this->admin)
            ->post(route('stock-transfers.send', $transfer->fresh()), [
                'delivery_type' => 'external',
                'carrier_name' => 'QA Couriers',
            ])
            ->assertSessionHas('flash.error');

        $this->assertSame('accepted', $transfer->fresh()->status, 'Failed dispatch must not advance the status.');
        $this->assertSame(2, $this->qty($this->productA, $this->warehouse), 'Source stock must be untouched.');
    }

    public function test_receive_is_rejected_before_dispatch(): void
    {
        $transfer = $this->createTransfer(1);
        $this->actingAs($this->admin)->post(route('stock-transfers.initiate', $transfer));
        $this->actingAs($this->admin)->post(route('stock-transfers.approve', $transfer->fresh()));

        $this->actingAs($this->admin)
            ->post(route('stock-transfers.receive', $transfer->fresh()))
            ->assertSessionHas('flash.error');

        $this->assertSame('accepted', $transfer->fresh()->status);
    }

    public function test_rejection_stops_the_workflow(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $transfer = $this->createTransfer(1);
        $this->actingAs($this->admin)->post(route('stock-transfers.initiate', $transfer));

        $this->actingAs($this->admin)->post(route('stock-transfers.reject', $transfer->fresh()))->assertRedirect();

        $transfer->refresh();
        $this->assertSame('rejected', $transfer->approved_status);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse), 'A rejected transfer moves no stock.');
    }

    public function test_global_administrator_is_not_pinned_to_their_own_store(): void
    {
        // The super administrator bypasses store scoping, so a transfer may start
        // from the branch even though the admin is assigned to the warehouse.
        $this->assertTrue((bool) $this->admin->is_global_user);

        $transfer = $this->createTransfer(1, $this->branch->id, $this->warehouse->id);

        $this->assertSame($this->branch->id, $transfer->source_store_id);
        $this->assertSame($this->warehouse->id, $transfer->destination_store_id);
    }
}
