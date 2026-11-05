<?php

namespace App\Models;

use App\Models\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Auth;

/**
 * App\Models\Payment
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int|null $invoice_id
 * @property int $user_id
 * @property int $store_id
 * @property float $amount
 * @property string $method
 * @property string $type
 * @property string|null $transaction_ref
 * @property \Illuminate\Support\Carbon $payment_date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $payment_group_id
 * @property string|null $payable_type
 * @property int|null $payable_id
 * @property string|null $method_type
 * @property int|null $method_id
 * @property string $status
 * @property-read \App\Models\Store|null $store
 * @property-read \App\Models\User|null $user
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static int count(string $columns = '*')
 * @method static \App\Models\Payment create(array $attributes = [])
 * @method static mixed sum(string $column)
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder<static> whereIn(string $column, mixed $values, string $boolean = 'and', bool $not = false)
 * @method static \Illuminate\Database\Eloquent\Builder<static> with(mixed $relations, mixed $callback = null)
 * @method static \Illuminate\Database\Eloquent\Builder<static> withoutGlobalScopes(array $scopes = [])
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class Payment extends Model
{
    protected $fillable = [
        'store_id',
        'user_id',

        // Polymorphic Links (What is being paid?)
        'payable_type',
        'payable_id',
        // Legacy support (optional, but good to keep in fillable if column exists)
        'invoice_id',
        'method',
        'transaction_ref',

        // Grouping Split Payments
        'payment_group_id',

        // Polymorphic Method (How is it paid?)
        'method_type',
        'method_id',

        'amount',
        'status', // completed, void, etc.
        'payment_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    protected static function booted()
    {
        static::addGlobalScope(new StoreScope);

        static::creating(function ($model) {
            $user = Auth::user();
            if ($user) {
                if (empty($model->store_id) && ! $user->is_global_user) {
                    $model->store_id = $user->store_id;
                }
                if (empty($model->user_id)) {
                    $model->user_id = $user->id;
                }
            }

            // Auto-generate Group ID if missing (for single payments)
            if (empty($model->payment_group_id)) {
                $model->payment_group_id = 'PAY-'.strtoupper(uniqid());
            }
        });
    }

    // --- Relationships ---

    /**
     * @return MorphTo<\Illuminate\Database\Eloquent\Model, $this>
     */
    /**
     * Get the entity being paid (Invoice, Debt, etc.)
     */
    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return MorphTo<\Illuminate\Database\Eloquent\Model, $this>
     */
    /**
     * Get the specific payment details (MpesaTransaction, CardTransaction, etc.)
     */
    public function method(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<\App\Models\User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
