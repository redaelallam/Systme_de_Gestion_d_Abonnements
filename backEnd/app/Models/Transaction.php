<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'client_id',
        'employee_id',
        'abonnement_id',
        'montant',
        'type_paiement',
        'date_paiement',
        'description',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_paiement' => 'date',
    ];

    const TYPE_PAIEMENT = 'paiement';
    const TYPE_REMBOURSEMENT = 'remboursement';

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function abonnement(): BelongsTo
    {
        return $this->belongsTo(Abonnement::class);
    }

    public function scopeRevenue($query)
    {
        return $query->where('type_paiement', '!=', self::TYPE_REMBOURSEMENT);
    }

    public function scopeForYear($query, $year)
    {
        return $query->whereYear('date_paiement', $year);
    }

    public function scopeForMonth($query, $year, $month)
    {
        return $query->whereYear('date_paiement', $year)
            ->whereMonth('date_paiement', $month);
    }
}