<?php

namespace App\Models;

use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

/**
 * App\Models\PosSale
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $store_id
 * @property int $user_id
 * @property int $customer_id
 * @property int $pos_session_id
 * @property string $receipt_number
 * @property float $total_amount
 * @property float $tax_amount
 * @property float $discount_amount
 * @property float $tendered_amount
 * @property float $change_amount
 * @property string $status
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read \App\Models\Customer|null $customer
 * @property-read \App\Models\PaymentToCustomer|null $changeTransaction
 * @property-read \App\Models\PosSession|null $session
 * @property-read \App\Models\Sale|null $sale
 * @property-read \App\Models\User|null $user
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Payment> $payments
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\PosSaleItem> $items
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \App\Models\PosSale create(array $attributes = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class PosSale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'store_id', 'user_id', 'customer_id', 'pos_session_id',
        'receipt_number',
        'total_amount', 'tax_amount', 'discount_amount',
        'tendered_amount', 'change_amount',
        'status', 'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'tendered_amount' => 'decimal:2',
        'change_amount' => 'decimal:2',
    ];

    protected static function booted()
    {
        static::addGlobalScope(new StoreScope);

        static::creating(function ($model) {
            if (Auth::check()) {
                $model->store_id = Auth::user()->store_id;
                // User ID is passed manually usually, but fallback here
                if (! $model->user_id) {
                    $model->user_id = Auth::id();
                }
            }
        });
    }

    // --- Relationships ---

    /**
     * @return HasMany<\App\Models\PosSaleItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PosSaleItem::class);
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<\App\Models\Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    // 2. LINK TO SESSION (BelongsTo)
    // Essential for Z-Report (Shift Closing)
    /**
     * @return BelongsTo<\App\Models\PosSession, $this>
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(PosSession::class, 'pos_session_id');
    }

    // 3. LINK TO LEDGER (MorphOne)
    // This pushes the sale to the Master "Sales" table for reporting
    /**
     * @return MorphOne<\App\Models\Sale, $this>
     */
    public function sale(): MorphOne
    {
        return $this->morphOne(Sale::class, 'source');
    }

    // 4. LINK TO PAYMENTS IN (MorphMany)
    // Tracks Cash/Mpesa coming IN. Allows split payments.
    /**
     * @return MorphMany<\App\Models\Payment, $this>
     */
    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    // 5. LINK TO CHANGE GIVEN (HasOne)
    // Tracks money going OUT (Change).
    // We use the new column 'pos_sale_id' we just added.
    /**
     * @return HasOne<\App\Models\PaymentToCustomer, $this>
     */
    public function changeTransaction(): HasOne
    {
        return $this->hasOne(PaymentToCustomer::class, 'pos_sale_id');
    }
}
