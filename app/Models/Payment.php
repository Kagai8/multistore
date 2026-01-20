<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Auth;
use App\Models\Scopes\StoreScope;

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
        'payment_date'
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
                if (empty($model->store_id) && !$user->is_global_user) {
                    $model->store_id = $user->store_id;
                }
                if (empty($model->user_id)) {
                    $model->user_id = $user->id;
                }
            }

            // Auto-generate Group ID if missing (for single payments)
            if (empty($model->payment_group_id)) {
                $model->payment_group_id = 'PAY-' . strtoupper(uniqid());
            }
        });
    }

    // --- Relationships ---

    /**
     * Get the entity being paid (Invoice, Debt, etc.)
     */
    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the specific payment details (MpesaTransaction, CardTransaction, etc.)
     */
    public function method(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
