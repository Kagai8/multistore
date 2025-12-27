<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Scopes\TransferScope;
use Illuminate\Support\Facades\Auth;

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

    public function sourceStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'source_store_id');
    }

    public function destinationStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'destination_store_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }
    // 🟢 NEW: Relationship for the user who approved the transfer
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    // 🟢 NEW: Relationship for the user who received the transfer
    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_id');
    }

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
            if ($user && !$user->is_global_user) {
                // Set the source store and the user ID for auditing
                $model->source_store_id = $user->store_id;
                $model->user_id = $user->id;
            }
            // Note: Global users must supply both source_store_id and destination_store_id via the request.
        });
    }
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
