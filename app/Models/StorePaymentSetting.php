<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * App\Models\StorePaymentSetting
 *
 * QA-GENERATED: generated from the live schema. Re-run the generator after a migration.
 *
 * @property int $id
 * @property int $store_id
 * @property string $provider
 * @property string $type
 * @property string $business_number
 * @property string|null $account_number
 * @property array|null $credentials
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Store|null $store
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static> newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static> query()
 * @method static \App\Models\StorePaymentSetting create(array $attributes = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static> where(\Closure|string|array $column, mixed $operator = null, mixed $value = null, string $boolean = 'and')
 * @method bool|null delete()
 * @method int increment(string $column, mixed $amount = 1, array $extra = [])
 * @method int decrement(string $column, mixed $amount = 1, array $extra = [])
 */
class StorePaymentSetting extends Model
{
    protected $fillable = [
        'store_id',
        'provider', // 'mpesa'
        'type',     // 'paybill', 'till'
        'business_number',
        'account_number',
        'credentials', // JSON
        'is_active',
    ];

    protected $casts = [
        // 🔴 CHANGE THIS LINE: Remove 'encrypted:'
        'credentials' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * @return BelongsTo<\App\Models\Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
