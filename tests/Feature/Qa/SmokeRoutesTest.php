<?php

namespace Tests\Feature\Qa;

use App\Models\AdjustmentReason;
use App\Models\Customer;
use App\Models\Stock;
use Illuminate\Support\Facades\Route;

/**
 * QA smoke sweep: every GET endpoint the UI can reach must render (or redirect)
 * without a server error for an authenticated, fully privileged user.
 */
class SmokeRoutesTest extends QaTestCase
{
    public function test_every_parameterless_get_route_responds_without_server_error(): void
    {
        $this->actingAs($this->admin);

        $failures = [];
        $timings = [];
        $checked = 0;

        // The interface is not iterable; getRoutes() returns the concrete array.
        foreach (Route::getRoutes()->getRoutes() as $route) {
            if (! in_array('GET', $route->methods(), true)) {
                continue;
            }

            $uri = $route->uri();

            if (str_contains($uri, '{')) {
                continue;
            }

            // Laravel's health probe and the storage passthrough are infrastructure,
            // not application screens.
            if (in_array($uri, ['up', 'sanctum/csrf-cookie'], true) || str_starts_with($uri, 'storage/')) {
                continue;
            }

            $checked++;
            $started = microtime(true);
            $response = $this->get('/'.ltrim($uri, '/'));
            $timings[$uri] = round((microtime(true) - $started) * 1000);
            $status = $response->getStatusCode();

            if ($status >= 500) {
                $failures[] = sprintf('%s -> %d (%s)', $uri, $status, $route->getName() ?? 'unnamed');
            }
        }

        arsort($timings);
        $slowest = [];
        foreach (array_slice($timings, 0, 10, true) as $uri => $ms) {
            $slowest[] = sprintf('% 6d ms  %s', $ms, $uri);
        }

        // The sweep used to count >100 routes. Dead resource actions whose
        // controllers never implemented them were removed, so the real surface
        // is smaller. Keep a floor that still catches a truncated sweep.
        $this->assertGreaterThan(80, $checked, 'Expected to sweep the full GET surface.');
        $this->assertSame([], $failures, "GET routes returning 5xx:\n".implode("\n", $failures)."\n\nSlowest:\n".implode("\n", $slowest));
    }

    public function test_parameterised_get_routes_render_for_existing_records(): void
    {
        $this->actingAs($this->admin);

        $stock = Stock::withoutGlobalScopes()->where('product_id', $this->productA->id)->firstOrFail();
        $reason = AdjustmentReason::where('name', 'Goods Received')->firstOrFail();
        $customer = Customer::where('id', $this->customer->id)->firstOrFail();
        $permission = \Spatie\Permission\Models\Permission::query()->firstOrFail();

        $targets = [
            'brands.show' => ['brand' => $this->brand->id],
            'brands.edit' => ['brand' => $this->brand->id],
            'categories.show' => ['category' => $this->category->id],
            'categories.edit' => ['category' => $this->category->id],
            'units.show' => ['unit' => $this->unit->id],
            'units.edit' => ['unit' => $this->unit->id],
            'suppliers.show' => ['supplier' => $this->supplier->id],
            'suppliers.edit' => ['supplier' => $this->supplier->id],
            'customers.create' => [],
            'customers.show' => ['customer' => $customer->id],
            'customers.edit' => ['customer' => $customer->id],
            'products.show' => ['product' => $this->productA->id],
            'products.edit' => ['product' => $this->productA->id],
            'stocks.show' => ['stock' => $stock->id],
            'stocks.edit' => ['stock' => $stock->id],
            'stores.show' => ['store' => $this->warehouse->id],
            'stores.edit' => ['store' => $this->warehouse->id],
            'users.show' => ['user' => $this->admin->id],
            'users.edit' => ['user' => $this->admin->id],
            'adjustmentreasons.show' => ['adjustmentreason' => $reason->id],
            'adjustmentreasons.edit' => ['adjustmentreason' => $reason->id],
            'permissions.show' => ['permission' => $permission->id],
            'stock-transfers.create' => [],
            'purchase-orders.create' => [],
        ];

        $failures = [];
        $checked = 0;

        foreach ($targets as $name => $params) {
            // Resource actions that no controller implements are intentionally
            // absent from the route table; skip rather than fail.
            if (! \Illuminate\Support\Facades\Route::has($name)) {
                continue;
            }

            $checked++;
            $url = route($name, $params);
            $status = $this->get($url)->getStatusCode();

            if ($status >= 500) {
                $failures[] = sprintf('%s -> %d', $name, $status);
            }
        }

        $this->assertGreaterThan(5, $checked, 'Expected to probe the surviving detail screens.');
        $this->assertSame([], $failures, "Parameterised GET routes returning 5xx:\n".implode("\n", $failures));
    }

    public function test_guest_is_redirected_to_login_from_protected_screens(): void
    {
        foreach (['dashboard', 'brands.index', 'products.index', 'invoices.index', 'sales.index', 'stocks.index', 'users.index'] as $name) {
            $this->get(route($name))->assertRedirect(route('login'));
        }
    }
}
