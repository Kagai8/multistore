<?php

namespace Tests\Feature\Qa;

use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Route;

/**
 * QA: structural integrity of the routing table.
 *
 * Laravel happily registers `Route::resource()` entries for actions a controller
 * does not implement; the failure only surfaces at request time as a 500
 * (BadMethodCallException). This guards against that by inspecting every action.
 */
class RouteIntegrityTest extends QaTestCase
{
    public function test_every_route_targets_an_existing_controller_method(): void
    {
        $missing = [];

        /** @var RoutingRoute $route */
        // The interface is not iterable; getRoutes() returns the concrete array.
        foreach (Route::getRoutes()->getRoutes() as $route) {
            $action = $route->getActionName();

            if ($action === 'Closure' || str_starts_with($action, 'Closure') || ! str_contains($action, '@')) {
                continue;
            }

            [$controller, $method] = explode('@', $action);

            if (! class_exists($controller) || ! method_exists($controller, $method)) {
                $missing[] = sprintf(
                    '%s %s -> %s@%s',
                    implode('|', $route->methods()),
                    $route->uri(),
                    class_basename($controller),
                    $method
                );
            }
        }

        sort($missing);

        $this->assertSame([], $missing, "Routes pointing at non-existent controller actions:\n".implode("\n", $missing));
    }

    public function test_every_named_route_helper_resolves(): void
    {
        $failures = [];

        // The interface is not iterable; getRoutes() returns the concrete array.
        foreach (Route::getRoutes()->getRoutes() as $route) {
            $name = $route->getName();

            if (! $name) {
                continue;
            }

            // Skip routes that need parameters — those are exercised by the
            // behavioural suites where real records exist.
            if (count($route->parameterNames()) > 0) {
                continue;
            }

            try {
                route($name);
            } catch (\Throwable $e) {
                $failures[] = $name.': '.$e->getMessage();
            }
        }

        $this->assertSame([], $failures, "Named routes failing to resolve:\n".implode("\n", $failures));
    }

    public function test_no_duplicate_route_names(): void
    {
        $seen = [];
        $duplicates = [];

        // The interface is not iterable; getRoutes() returns the concrete array.
        foreach (Route::getRoutes()->getRoutes() as $route) {
            $name = $route->getName();

            if (! $name) {
                continue;
            }

            if (isset($seen[$name])) {
                $duplicates[] = $name;
            }

            $seen[$name] = true;
        }

        $this->assertSame([], array_values(array_unique($duplicates)), 'Duplicate route names: '.implode(', ', array_unique($duplicates)));
    }
}
