<?php

namespace App\Models;

use App\Models\Scopes\TransferScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

/**
 * App\Models\StockTransfer
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $source_store_id
 * @property int $destination_store_id
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $transfer_date
 * @property string|null $reference
 * @property string|null $notes
 * @property int $user_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string $approved_status
 * @property int|null $approved_by_id
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property int|null $received_by_id
 * @property \Illuminate\Support\Carbon|null $received_at
 * @property string|null $delivery_type
 * @property int|null $assigned_to_user_id
 * @property string|null $carrier_name
 * @property string|null $contact_number
 * @property string|null $tracking_reference
 * @property \Illuminate\Support\Carbon|null $delivery_time
 * @property-read \App\Models\Product|null $product
 * @property-read \App\Models\Store|null $destinationStore
 * @property-read \App\Models\Store|null $sourceStore
 * @property-read \App\Models\User|null $approvedBy
 * @property-read \App\Models\User|null $assignedToUser
 * @property-read \App\Models\User|null $receivedBy
 * @property-read \App\Models\User|null $user
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\StockTransferItem> $items
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \Illuminate\Database\Eloquent\Collection<int, \App\Models\StockTransfer> all(mixed $columns = ['*'])
 * @method static int count(string $columns = '*')
 * @method static \App\Models\StockTransfer create(array $attributes = [])
 * @method static \App\Models\StockTransfer first(array|string $columns = ['*'])
 * @method static mixed max(string $column)
 * @method static \Illuminate\Database\Eloquent\Builder<static> select(mixed $columns = ['*'])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class StockTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_store_id',
        'destination_store_id',
        'status',
        'transfer_date',
        'reference',
        'notes',
        'user_id', // Initiated By

        // 🟢 NEW: For Approval Workflow
        'approved_by_id',
        'approved_status',
        'approved_at',

        // 🟢 NEW: For Receipt Workflow
        'received_by_id', // Add this
        'received_at',    // Add this

        // ✅ DELIVERY FIELDS (ADD THESE)
        'delivery_type',
        'assigned_to_user_id',
        'carrier_name',
        'contact_number',
        'tracking_reference',
        'delivery_time',
    ];

    protected $casts = [
        'transfer_date' => 'date',
        // 🛑 CRITICAL FIX: Cast the timestamp columns to 'datetime'
        'approved_at' => 'datetime',
        'received_at' => 'datetime',
        'delivery_time' => 'date',
    ];

    // Relationships

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    public function sourceStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'source_store_id');
    }

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    public function destinationStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'destination_store_id');
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<\App\Models\StockTransferItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }

    // 🟢 NEW: Relationship for the user who approved the transfer
    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    // 🟢 NEW: Relationship for the user who received the transfer
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
    public function assignedToUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    protected static function booted(): void
    {
        // 1. READ ACCESS: Applies the custom dual-ID scope (source OR destination)
        static::addGlobalScope(new TransferScope);

        // 2. WRITE ACCESS: Forces restricted users to use their store as the source
        static::creating(function ($model) {
            $user = Auth::user();

            // Only force the ID if the user is logged in AND does NOT have global access
            // 🛑 FIX: isGlobalUser() changed to the property access: is_global_user
            if ($user && ! $user->is_global_user) {
                // Set the source store and the user ID for auditing
                $model->source_store_id = $user->store_id;
                $model->user_id = $user->id;
            }
            // Note: Global users must supply both source_store_id and destination_store_id via the request.
        });
    }

    /**
     * @return BelongsTo<\App\Models\Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
