<?php

namespace App\Models;

use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\PurchaseOrder
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $supplier_id
 * @property int $store_id
 * @property string $po_number
 * @property float $total_amount
 * @property \Illuminate\Support\Carbon|null $expected_delivery_date
 * @property string|null $notes
 * @property string $status
 * @property int $requested_by_id
 * @property \Illuminate\Support\Carbon $requested_at
 * @property int|null $approved_by_id
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property int|null $received_by_id
 * @property \Illuminate\Support\Carbon|null $received_at
 * @property int|null $cancelled_by_id
 * @property \Illuminate\Support\Carbon|null $cancelled_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property int $user_id
 * @property \Illuminate\Support\Carbon $order_date
 * @property-read \App\Models\Store|null $store
 * @property-read \App\Models\Supplier|null $supplier
 * @property-read \App\Models\User|null $approvedBy
 * @property-read \App\Models\User|null $cancelledBy
 * @property-read \App\Models\User|null $receivedBy
 * @property-read \App\Models\User|null $requestedBy
 * @property-read \App\Models\User|null $user
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\PurchaseOrderItem> $items
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static int count(string $columns = '*')
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereYear(\Closure|string $column, mixed $operator, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScope(mixed $scope)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class PurchaseOrder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        // Core Fields
        'supplier_id',
        'store_id',
        'user_id', // Creator
        'po_number',
        'order_date',
        'expected_delivery_date',
        'total_amount',
        'status',
        'notes',

        // 🟢 AUDIT FIELDS (These were missing!)
        'requested_by_id', 'requested_at',
        'approved_by_id', 'approved_at',
        'received_by_id', 'received_at',
        'cancelled_by_id', 'cancelled_at',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_delivery_date' => 'date',
        'total_amount' => 'decimal:2',
        // Cast timestamps to ensure Carbon instances
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'received_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    // Status Constants
    const STATUS_DRAFT = 'draft';

    const STATUS_ORDERED = 'ordered';

    const STATUS_PARTIAL = 'partial';

    const STATUS_RECEIVED = 'received';

    const STATUS_CANCELLED = 'cancelled';

    protected static function booted()
    {
        static::addGlobalScope(new StoreScope);
    }

    // --- RELATIONSHIPS ---

    /**
     * @return HasMany<\App\Models\PurchaseOrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * @return BelongsTo<\App\Models\Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // 🟢 AUDIT RELATIONSHIPS (Needed for "Approved By" column in table)

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_id');
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_id');
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_id');
    }
}
