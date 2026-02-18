<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Abonnement;
use App\Models\Client;
use Carbon\Carbon;

class AbonnementSeeder extends Seeder
{
    public function run(): void
    {
        $clients = Client::all();
        $now = Carbon::now();

        foreach ($clients as $client) {
            $typeData = $this->getRandomTypeAndPrice();
            $startDate = Carbon::parse($client->created_at);
            $endDate = $startDate->copy()->addMonths($typeData['duration_months']);

            $status = 'Active';

            if ($endDate->lessThan($now)) {
                $status = 'Expiré';
            } else {
                $rand = rand(1, 100);
                if ($rand <= 5)
                    $status = 'Suspendu';
                elseif ($rand <= 10)
                    $status = 'Annulé';
            }

            if ($status === 'Annulé') {
                $endDate = $startDate->copy()->addDays(rand(5, 30));
                if ($endDate->greaterThan($now))
                    $endDate = $now;
            }

            Abonnement::create([
                'client_id' => $client->id,
                'employee_id' => $client->employee_id,
                'type' => $typeData['type'],
                'prix' => $typeData['price'],
                'statut' => $status,
                'dateDebut' => $startDate,
                'dateFin' => $endDate,
                'created_at' => $startDate,
                'updated_at' => $startDate,
            ]);
        }
    }

    private function getRandomTypeAndPrice()
    {
        $types = [
            ['type' => 'Mensuel', 'price' => 300.00, 'duration_months' => 1],
            ['type' => 'Trimestriel', 'price' => 800.00, 'duration_months' => 3],
            ['type' => 'Semestriel', 'price' => 1500.00, 'duration_months' => 6],
            ['type' => 'Annuel', 'price' => 2500.00, 'duration_months' => 12],
            ['type' => 'Premium', 'price' => 4000.00, 'duration_months' => 12],
        ];

        $weights = [0, 0, 1, 1, 2, 3, 3, 4, 4];
        return $types[$weights[array_rand($weights)]];
    }
}