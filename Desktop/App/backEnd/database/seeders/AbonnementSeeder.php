<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Abonnement;
use App\Models\Client;
use Carbon\Carbon;
use Faker\Factory as Faker;

class AbonnementSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $clients = Client::all();
        $now = Carbon::now();
        foreach ($clients as $client) {
            $numberOfSubs = rand(1, 6);
            $lastEndDate = Carbon::parse($client->created_at);

            for ($i = 0; $i < $numberOfSubs; $i++) {
                $typeData = $this->getRandomTypeAndPrice();

                $startDate = Carbon::instance($faker->dateTimeBetween($lastEndDate, $now));
                $endDate = $startDate->copy()->addMonths($typeData['duration_months']);

                $status = 'Active';
                if ($endDate->lessThan($now)) {
                    $status = 'Expiré';
                } else {
                    $rand = rand(1, 100);
                    if ($rand <= 5)
                        $status = 'Annulé';
                    elseif ($rand <= 10)
                        $status = 'Suspendu';
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

                $lastEndDate = $endDate->copy()->addDays(rand(1, 30));
                if ($lastEndDate->greaterThan($now))
                    break;
            }
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
        return $types[array_rand($types)];
    }
}