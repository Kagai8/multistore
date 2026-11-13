<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * App\Models\Customer
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property string $name
 * @property string|null $number
 * @property string|null $email
 * @property float|null $credit_limit
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property float|null $loyalty_points
 * @property-read \App\Models\Store|null $store
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\CustomerDebt> $debts
 * @property-read float|null $total_debt Sum of active debt balances, added via withSum().
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \Illuminate\Database\Eloquent\Collection<int, \App\Models\Customer> all(mixed $columns = ['*'])
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Customer create(array $attributes = [])
 * @method static \App\Models\Customer find(mixed $id, array|string $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Builder<static> select(mixed $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereHas(string $relation, ?\Closure $callback = null, string $operator = '>=', int|string $count = 1)
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class Customer extends Model
{
    protected $fillable = [
        'name',
        'number',
        'email',
        'credit_limit',
        'loyalty_points',
    ];

    // Cast credit_limit to float for convenience
    protected $casts = [
        'credit_limit' => 'float',
        'loyalty_points' => 'float',

    ];

    /**
     * @return HasMany<\App\Models\CustomerDebt, $this>
     */
    public function debts(): HasMany
    {
        return $this->hasMany(CustomerDebt::class);
    }

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Check if the customer is safe to delete.
     * Returns an array of reasons why it CANNOT be deleted.
     */
    public function getDeletionBlockers(): array
    {
        $blockers = [];

        // 1. Check for active debts
        $activeDebts = \App\Models\CustomerDebt::where('customer_id', $this->id)
            ->where('status', 'active') // Adjust 'status' to your actual column name (e.g., 'is_active' or 'balance' > 0)
            ->count();

        if ($activeDebts > 0) {
            $blockers[] = "Customer has {$activeDebts} active debt(s).";
        }

        // 2. Check for historical invoices (audit trail)
        $invoiceCount = \App\Models\Invoice::where('customer_id', $this->id)->count();
        if ($invoiceCount > 0) {
            $blockers[] = "Customer has {$invoiceCount} historical invoice(s).";
        }

        // 3. Check for POS/Regular Sales (audit & loyalty trail)
        $saleCount = \App\Models\Sale::where('customer_id', $this->id)->count();
        $posSaleCount = \App\Models\PosSale::where('customer_id', $this->id)->count();

        if ($saleCount > 0 || $posSaleCount > 0) {
            $blockers[] = "Customer has historical sales records ({$saleCount} invoices, {$posSaleCount} POS sales).";
        }

        // 4. Protect the system "Walk-In Customer"
        if ($this->name === 'Walk-In Customer') {
            $blockers[] = "This is a protected system record and cannot be deleted.";
        }

        return $blockers;
    }
}
