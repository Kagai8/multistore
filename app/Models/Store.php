<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\Store
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $address
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string $type
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \Illuminate\Database\Eloquent\Collection<int, \App\Models\Store> all(mixed $columns = ['*'])
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Store create(array $attributes = [])
 * @method static \App\Models\Store first(array|string $columns = ['*'])
 * @method static \App\Models\Store firstOrCreate(array $attributes = [], array $values = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> latest(?string $column = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class Store extends Model
{
    use SoftDeletes; // 🟢 NEW: Enable soft deletes

    protected $fillable = [
        'name',
        'type',
        'code',
        'phone',
        'email',
        'address',
        'is_active', // 🟢 NEW: Allow mass assignment for is_active
    ];

    // 🟢 NEW: Cast is_active to boolean automatically
    protected $casts = [
        'is_active' => 'boolean',
    ];

        /**
     * Check if the store is safe to delete.
     * Returns an array of reasons why it CANNOT be deleted.
     * If the array is empty, it is safe to delete.
     */
    public function getDeletionBlockers(): array
    {
        $blockers = [];

        // 1. Check for assigned users
        $userCount = User::where('store_id', $this->id)->count();
        if ($userCount > 0) {
            $blockers[] = "{$userCount} user(s) are currently assigned to this store.";
        }

        // 2. Check for existing stock records
        $stockCount = Stock::where('store_id', $this->id)->count();
        if ($stockCount > 0) {
            $blockers[] = "{$stockCount} active stock record(s) exist for this store.";
        }

        // 3. Check for financial transactions (Sales, POS Sales, or Invoices)
        $saleCount = Sale::where('store_id', $this->id)->count();
        $posSaleCount = PosSale::where('store_id', $this->id)->count();
        $invoiceCount = Invoice::where('store_id', $this->id)->count();

        if ($saleCount > 0 || $posSaleCount > 0 || $invoiceCount > 0) {
            $blockers[] = "Has historical financial transactions ({$saleCount} sales, {$posSaleCount} POS sales, {$invoiceCount} invoices).";
        }

        // 4. Check for Stock Transfers (where this store is source OR destination)
        $transferCount = StockTransfer::where('source_store_id', $this->id)
            ->orWhere('destination_store_id', $this->id)
            ->count();

        if ($transferCount > 0) {
            $blockers[] = "{$transferCount} stock transfer(s) are linked to this store.";
        }

        // 5. Safety net: Prevent deleting the main warehouse (adjust ID if your primary warehouse is different)
        if ($this->type === 'warehouse' && $this->id === 1) {
            $blockers[] = "Cannot delete the primary system warehouse.";
        }

        return $blockers;
    }
}

