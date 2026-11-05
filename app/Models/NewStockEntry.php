<?php

namespace App\Models;

use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\NewStockEntry
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $product_id
 * @property int $supplier_id
 * @property int $store_id
 * @property int $quantity_received
 * @property string|null $invoice_number
 * @property int $quantity_transferred
 * @property string $status
 * @property int|null $user_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Product|null $product
 * @property-read \App\Models\Store|null $store
 * @property-read \App\Models\Supplier|null $supplier
 * @property-read \App\Models\User|null $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static int count(string $columns = '*')
 * @method static \App\Models\NewStockEntry create(array $attributes = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class NewStockEntry extends Model
{
    use HasFactory;

    // The name of the table in the database
    protected $table = 'new_stock_entries';

    // Fields that can be mass assigned
    protected $fillable = [
        'product_id',
        'supplier_id',
        'store_id',
        'quantity_received',
        'invoice_number',
        'quantity_transferred',
        'status',
        'user_id',
    ];

    // Status constants for clarity
    public const STATUS_PENDING = 'pending';

    public const STATUS_PARTIALLY_SENT = 'partially_sent';

    public const STATUS_COMPLETED = 'completed';

    // --- Relationships ---

    /**
     * @return BelongsTo<\App\Models\Product, $this>
     */
    /**
     * Get the product associated with the new stock entry.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<\App\Models\Supplier, $this>
     */
    /**
     * Get the supplier who provided the goods.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    /**
     * Get the store where the stock was received (implicitly the Warehouse).
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    /**
     * Get the user who recorded the entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // --- Accessors/Calculations (Flow Logic) ---

    /**
     * Calculate the quantity available for transfer.
     */
    public function getAvailableToTransferAttribute(): int
    {
        return $this->quantity_received - $this->quantity_transferred;
    }

    protected static function booted(): void
    {
        // 🟢 Required Scope Registration
        static::addGlobalScope(new StoreScope);
    }
}
