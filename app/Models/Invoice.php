<?php

namespace App\Models;

use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

/**
 * App\Models\Invoice
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $store_id
 * @property int $user_id
 * @property int $customer_id
 * @property string $invoice_number
 * @property \Illuminate\Support\Carbon $invoice_date
 * @property \Illuminate\Support\Carbon|null $due_date
 * @property float $sub_total
 * @property float $tax_amount
 * @property float $discount_amount
 * @property float $total_amount
 * @property float $paid_amount
 * @property string $status
 * @property string $payment_status
 * @property string|null $payment_arrangement
 * @property \Illuminate\Support\Carbon|null $voided_at
 * @property string|null $void_reason
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property int|null $void_requested_by
 * @property int|null $voided_by
 * @property \Illuminate\Support\Carbon|null $refunded_at
 * @property int|null $refunded_by
 * @property int|null $quotation_id
 * @property-read \App\Models\Customer|null $customer
 * @property-read \App\Models\Sale|null $sale
 * @property-read \App\Models\Store|null $store
 * @property-read \App\Models\User|null $refunder
 * @property-read \App\Models\User|null $user
 * @property-read \App\Models\User|null $voidApprover
 * @property-read \App\Models\User|null $voidRequester
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\InvoiceItem> $items
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Payment> $payments
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Invoice create(array $attributes = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> latest(?string $column = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereNotIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class Invoice extends Model
{
    use SoftDeletes;

    protected $fillable = [
        // Context
        'store_id',
        'user_id',
        'customer_id',
        'quotation_id',

        // Data
        'invoice_number',
        'invoice_date',
        'due_date',

        // Financials
        'sub_total',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'paid_amount',

        // Status & Logic
        'status',               // draft, posted, void, refunded
        'payment_status',       // unpaid, partial, paid
        'payment_arrangement',  // full, partial

        // Void Logic
        'void_requested_by',
        'voided_by',
        'voided_at',
        'void_reason',

        // 🟢 Refund Logic (New Fields)
        'refunded_at',
        'refunded_by',

        'notes',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'voided_at' => 'datetime',
        'refunded_at' => 'datetime', // 🟢 Cast to datetime
        'sub_total' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
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

    /**
     * @return HasMany<\App\Models\InvoiceItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    /**
     * @return HasMany<\App\Models\Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
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

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function voidRequester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'void_requested_by');
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function voidApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    // 🟢 Refund Relationship
    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function refunder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refunded_by');
    }

    /**
     * @return MorphOne<\App\Models\Sale, $this>
     */
    public function sale(): MorphOne
    {
        return $this->morphOne(Sale::class, 'source');
    }
}
