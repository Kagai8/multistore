<?php

namespace Tests\Feature\Qa;

use App\Models\Stock;
use App\Models\StockAdjustment;
use App\Models\StockAdjustmentRequest;

/**
 * QA: direct stock adjustments and the request/approval workflow that feeds them.
 */
class StockAdjustmentTest extends QaTestCase
{
    private function stockId(): int
    {
        return Stock::withoutGlobalScopes()
            ->where('product_id', $this->productA->id)
            ->where('store_id', $this->warehouse->id)
            ->value('id');
    }

    private function adjust(string $type, int $quantity, ?string $notes = null): void
    {
        $payload = [
            'stock_id' => $this->stockId(),
            'type' => $type,
            'adjustment_reason_id' => $this->reasonId('Damaged'),
            'quantity' => $quantity,
        ];

        if ($notes !== null) {
            $payload['notes'] = $notes;
        }

        $this->actingAs($this->admin)->post(route('stock-adjustments.store'), $payload)->assertRedirect();
    }

    private function requestAdjustment(int $quantity, ?string $notes = null): StockAdjustmentRequest
    {
        $payload = [
            'store_id' => $this->warehouse->id,
            'product_id' => $this->productA->id,
            'adjustment_reason_id' => $this->reasonId('Damaged'),
            'quantity' => $quantity,
        ];

        if ($notes !== null) {
            $payload['notes'] = $notes;
        }

        $this->actingAs($this->admin)
            ->post(route('stock-adjustment-requests.store'), $payload)
            ->assertRedirect();

        return StockAdjustmentRequest::withoutGlobalScopes()->latest('id')->firstOrFail();
    }

    public function test_adjustment_in_adds_to_the_current_stock(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $this->adjust('in', 15);

        $this->assertSame($before + 15, $this->qty($this->productA, $this->warehouse));

        $log = StockAdjustment::withoutGlobalScopes()->latest('id')->firstOrFail();
        $this->assertSame('in', $log->type);
        $this->assertSame($before, (int) $log->old_stock);
        $this->assertSame($before + 15, (int) $log->new_stock);
    }

    public function test_adjustment_out_removes_from_the_current_stock(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $this->adjust('out', 15);

        $this->assertSame($before - 15, $this->qty($this->productA, $this->warehouse));
    }

    public function test_adjustment_without_notes_still_succeeds(): void
    {
        // Regression: notes is nullable, so omitting it must not abort the request.
        $before = $this->qty($this->productA, $this->warehouse);

        $this->adjust('in', 3);

        $this->assertSame($before + 3, $this->qty($this->productA, $this->warehouse));
        $this->assertNull(StockAdjustment::withoutGlobalScopes()->latest('id')->firstOrFail()->notes);
    }

    public function test_adjustment_out_beyond_stock_is_blocked(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $this->actingAs($this->admin)
            ->post(route('stock-adjustments.store'), [
                'stock_id' => $this->stockId(),
                'type' => 'out',
                'adjustment_reason_id' => $this->reasonId('Damaged'),
                'quantity' => $before + 1,
            ])
            ->assertSessionHas('error');

        $this->assertSame($before, $this->qty($this->productA, $this->warehouse), 'A blocked adjustment must not touch stock.');
        $this->assertSame(0, StockAdjustment::withoutGlobalScopes()->count());
    }

    public function test_adjustment_validation_rejects_zero_quantity_and_bad_reason(): void
    {
        $this->actingAs($this->admin)->post(route('stock-adjustments.store'), [
            'stock_id' => $this->stockId(),
            'type' => 'in',
            'adjustment_reason_id' => 999999,
            'quantity' => 0,
        ])->assertSessionHasErrors(['quantity', 'adjustment_reason_id']);
    }

    public function test_request_is_created_as_draft_without_moving_stock(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $request = $this->requestAdjustment(10);

        $this->assertSame('draft', $request->status);
        $this->assertSame('in', $request->type);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse));
    }

    public function test_request_submission_moves_it_to_pending_approval(): void
    {
        $request = $this->requestAdjustment(10);

        $this->actingAs($this->admin)
            ->post(route('stock-adjustment-requests.submit', $request))
            ->assertRedirect();

        $this->assertSame('pending_approval', $request->fresh()->status);
    }

    public function test_approving_a_request_applies_the_stock_change(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $request = $this->requestAdjustment(10);
        $this->actingAs($this->admin)->post(route('stock-adjustment-requests.submit', $request));
        $this->actingAs($this->admin)->post(route('stock-adjustment-requests.approve', $request->fresh()));

        $request->refresh();
        $this->assertSame('approved', $request->status);
        $this->assertNotNull($request->approved_at);
        $this->assertSame($before + 10, $this->qty($this->productA, $this->warehouse), 'Approval applies the adjustment.');
    }

    public function test_negative_request_becomes_an_outbound_adjustment(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $request = $this->requestAdjustment(-5);
        $this->assertSame('out', $request->type);
        $this->assertSame(5, (int) $request->quantity);

        $this->actingAs($this->admin)->post(route('stock-adjustment-requests.submit', $request));
        $this->actingAs($this->admin)->post(route('stock-adjustment-requests.approve', $request->fresh()));

        $this->assertSame($before - 5, $this->qty($this->productA, $this->warehouse));
    }

    public function test_approving_twice_does_not_double_apply(): void
    {
        $request = $this->requestAdjustment(10);
        $this->actingAs($this->admin)->post(route('stock-adjustment-requests.submit', $request));
        $this->actingAs($this->admin)->post(route('stock-adjustment-requests.approve', $request->fresh()));

        $after = $this->qty($this->productA, $this->warehouse);

        $this->actingAs($this->admin)
            ->post(route('stock-adjustment-requests.approve', $request->fresh()))
            ->assertSessionHas('error');

        $this->assertSame($after, $this->qty($this->productA, $this->warehouse));
    }

    public function test_draft_request_cannot_be_approved_directly(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $request = $this->requestAdjustment(10);

        $this->actingAs($this->admin)
            ->post(route('stock-adjustment-requests.approve', $request))
            ->assertSessionHas('error');

        $this->assertSame('draft', $request->fresh()->status);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse));
    }

    public function test_rejecting_a_request_leaves_stock_untouched(): void
    {
        $before = $this->qty($this->productA, $this->warehouse);

        $request = $this->requestAdjustment(10);
        $this->actingAs($this->admin)->post(route('stock-adjustment-requests.submit', $request));
        $this->actingAs($this->admin)->post(route('stock-adjustment-requests.reject', $request->fresh()));

        $this->assertSame('rejected', $request->fresh()->status);
        $this->assertSame($before, $this->qty($this->productA, $this->warehouse));
    }
}
