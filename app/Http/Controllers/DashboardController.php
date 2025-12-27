<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Store;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\Stock;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $isGlobal = $user->is_global_user;
        $storeId = $user->store_id;

        // 🔑 1. Store-scoped stats
        $stats = $this->buildStats($isGlobal, $storeId);

        // 🔑 2. Store-scoped recent activity
        $recentActivity = $this->buildRecentActivity($isGlobal, $storeId);

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentActivity' => $recentActivity,
        ]);
    }

    private function buildStats(bool $isGlobal, ?int $storeId): array
    {
        if ($isGlobal) {
            return [
                'total_stores' => Store::count(),
                'active_products' => Product::count(),
                'pending_transfers' => StockTransfer::where('status', 'sent')->count(),
                'low_stock_items' => Stock::where('current_stock', '<=', 'reorder_level')->count(),
            ];
        }

        // Store user: only their store
        return [
            'total_stores' => 1,
            'active_products' => Product::whereHas('stocks', function ($query) use ($storeId) {
                $query->where('store_id', $storeId)->where('current_stock', '>', 0);
            })->count(),
            'pending_transfers' => StockTransfer::where('destination_store_id', $storeId)
                ->where('status', 'sent')
                ->count(),
            'low_stock_items' => Stock::where('store_id', $storeId)
                ->whereColumn('current_stock', '<=', 'reorder_level')
                ->count(),
        ];
    }

    private function buildRecentActivity(bool $isGlobal, ?int $storeId): array
    {
        $query = StockTransfer::with(['sourceStore', 'destinationStore'])
            ->latest('created_at')
            ->take(3);

        if (!$isGlobal && $storeId) {
            $query->where(function ($q) use ($storeId) {
                $q->where('source_store_id', $storeId)
                  ->orWhere('destination_store_id', $storeId);
            });
        }

        return $query->get()->map(function ($transfer) {
            $storeName = $transfer->destinationStore?->name ?? $transfer->sourceStore?->name ?? 'Unknown';

            return [
                'action' => match ($transfer->status) {
                    'sent' => 'Sent stock transfer',
                    'received' => 'Received stock',
                    'accepted' => 'Approved transfer',
                    default => 'Updated transfer',
                },
                'target' => $transfer->reference,
                'store' => $storeName,
                'time' => $transfer->created_at->diffForHumans(),
            ];
        })->toArray();
    }
}
