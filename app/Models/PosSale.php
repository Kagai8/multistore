<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Scopes\StoreScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class PosSale extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'store_id', 'user_id', 'customer_id', 'pos_session_id',
        'receipt_number',
        'total_amount', 'tax_amount', 'discount_amount',
        'tendered_amount', 'change_amount',
        'status', 'notes'
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
                if (!$model->user_id) $model->user_id = Auth::id();
            }
        });
    }

    // --- Relationships ---

    public function items()
    {
        return $this->hasMany(PosSaleItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function customer() {
        return $this->belongsTo(Customer::class);
    }

    // 2. LINK TO SESSION (BelongsTo)
    // Essential for Z-Report (Shift Closing)
    public function session() {
        return $this->belongsTo(PosSession::class, 'pos_session_id');
    }

    // 3. LINK TO LEDGER (MorphOne)
    // This pushes the sale to the Master "Sales" table for reporting
    public function sale() {
        return $this->morphOne(Sale::class, 'source');
    }

    // 4. LINK TO PAYMENTS IN (MorphMany)
    // Tracks Cash/Mpesa coming IN. Allows split payments.
    public function payments() {
        return $this->morphMany(Payment::class, 'payable');
    }

    // 5. LINK TO CHANGE GIVEN (HasOne)
    // Tracks money going OUT (Change).
    // We use the new column 'pos_sale_id' we just added.
    public function changeTransaction() {
        return $this->hasOne(PaymentToCustomer::class, 'pos_sale_id');
    }
}
