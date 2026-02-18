<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
class Abonnement extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'dateDebut',
        'dateFin',
        'statut',
        'type',
        'prix',
        'client_id',
        'employee_id'
    ];
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "Abonnement a été {$eventName}");
    }
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function scopeActive($query)
    {
        return $query->where('statut', 'Active')
            ->where('dateFin', '>=', now());
    }

    public function scopeExpiringSoon($query, $days = 30)
    {
        return $query->where('statut', 'Active')
            ->where('dateFin', '>=', now())
            ->where('dateFin', '<=', now()->addDays($days));
    }

    public function scopeExpired($query)
    {
        return $query->where('dateFin', '<', now())
            ->orWhere('statut', 'Expiré');
    }
    public function transactions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Transaction::class)->latest('date_paiement');
    }
}