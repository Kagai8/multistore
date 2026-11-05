<?php

namespace App\Models;

use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

/**
 * App\Models\Quotation
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $store_id
 * @property int $user_id
 * @property int $customer_id
 * @property string $quotation_number
 * @property \Illuminate\Support\Carbon $quotation_date
 * @property \Illuminate\Support\Carbon|null $valid_until
 * @property float $sub_total
 * @property float $tax_amount
 * @property float $discount_amount
 * @property float $total_amount
 * @property string $status
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Customer|null $customer
 * @property-read \App\Models\Invoice|null $invoice
 * @property-read \App\Models\Store|null $store
 * @property-read \App\Models\User|null $user
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\QuotationItem> $items
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Quotation create(array $attributes = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class Quotation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        // Context
        'store_id',
        'user_id',
        'customer_id',

        // Data
        'quotation_number',
        'quotation_date',
        'valid_until',

        // Financials
        'sub_total',
        'tax_amount',
        'discount_amount',
        'total_amount',

        // Status
        'status', // draft, sent, accepted, rejected, expired
        'notes',
    ];

    protected $casts = [
        'quotation_date' => 'date',
        'valid_until' => 'date',
        'sub_total' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    /**
     * The "Booted" method handles the Store Scope automatically.
     */
    protected static function booted()
    {
        static::addGlobalScope(new StoreScope);

        static::creating(function ($model) {
            $user = Auth::user();
            if ($user) {
                if (empty($model->store_id)) {
                    $model->store_id = $user->store_id;
                }
                if (empty($model->user_id)) {
                    $model->user_id = $user->id;
                }
            }
        });
    }

    // --- Relationships ---

    // Note: We need to create this model next (QuotationItem)
    /**
     * @return HasMany<\App\Models\QuotationItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class);
    }

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * @return BelongsTo<\App\Models\Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Link to the Invoice created from this Quote (if any)
    /**
     * @return HasOne<\App\Models\Invoice, $this>
     */
    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }
}
