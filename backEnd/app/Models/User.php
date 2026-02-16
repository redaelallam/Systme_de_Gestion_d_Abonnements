<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'nom',
        'email',
        'password',
        'role',
    ];

    public function abonnements(): HasMany
    {
        return $this->hasMany(Abonnement::class, 'employee_id');
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class, 'employee_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'employee_id');
    }
}