<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use App\Models\Scopes\StoreScope;
use Illuminate\Support\Facades\Auth;

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

        'notes'
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

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
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

    public function voidRequester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'void_requested_by');
    }

    public function voidApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    // 🟢 Refund Relationship
    public function refunder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refunded_by');
    }

    public function sale(): MorphOne
    {
        return $this->morphOne(Sale::class, 'source');
    }
}
