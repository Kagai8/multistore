<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Scopes\StoreScope;
use Illuminate\Support\Facades\Auth;

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
        'notes'
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
    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Link to the Invoice created from this Quote (if any)
    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }
}
