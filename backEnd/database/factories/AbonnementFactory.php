<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Abonnement>
 */
class AbonnementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => \App\Models\Client::factory(),
            'employee_id' => \App\Models\User::factory(),
            'type' => 'Mensuel',
            'prix' => 300,
            'dateDebut' => now(),
            'dateFin' => now()->addMonth(),
            'statut' => 'Active',
        ];
    }
}
