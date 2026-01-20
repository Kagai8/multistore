<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Scopes\StoreScope;

class PurchaseOrder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        // Core Fields
        'supplier_id',
        'store_id',
        'user_id', // Creator
        'po_number',
        'order_date',
        'expected_delivery_date',
        'total_amount',
        'status',
        'notes',

        // 🟢 AUDIT FIELDS (These were missing!)
        'requested_by_id', 'requested_at',
        'approved_by_id', 'approved_at',
        'received_by_id', 'received_at',
        'cancelled_by_id', 'cancelled_at',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_delivery_date' => 'date',
        'total_amount' => 'decimal:2',
        // Cast timestamps to ensure Carbon instances
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'received_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    // Status Constants
    const STATUS_DRAFT = 'draft';
    const STATUS_ORDERED = 'ordered';
    const STATUS_PARTIAL = 'partial';
    const STATUS_RECEIVED = 'received';
    const STATUS_CANCELLED = 'cancelled';

    protected static function booted()
    {
        static::addGlobalScope(new StoreScope);
    }

    // --- RELATIONSHIPS ---

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // 🟢 AUDIT RELATIONSHIPS (Needed for "Approved By" column in table)

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by_id');
    }

    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'cancelled_by_id');
    }
}
