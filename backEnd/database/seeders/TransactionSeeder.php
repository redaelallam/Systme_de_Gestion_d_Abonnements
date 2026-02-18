<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transaction;
use App\Models\Abonnement;
use Carbon\Carbon;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        Abonnement::chunk(100, function ($abonnements) {
            $transactions = [];
            $now = Carbon::now();

            foreach ($abonnements as $abonnement) {
                $startDate = Carbon::parse($abonnement->dateDebut);

                $transactions[] = [
                    'client_id' => $abonnement->client_id,
                    'employee_id' => $abonnement->employee_id,
                    'abonnement_id' => $abonnement->id,
                    'montant' => $abonnement->prix,
                    'type_paiement' => Transaction::TYPE_PAIEMENT,
                    'date_paiement' => $startDate,
                    'description' => 'Paiement initial abonnement ' . $abonnement->type,
                    'created_at' => $startDate,
                    'updated_at' => $startDate,
                ];

                $randScenario = rand(1, 100);

                if ($randScenario <= 20) {
                    $upgradeDate = $startDate->copy()->addDays(rand(10, 20));
                    if ($upgradeDate->lessThan($now)) {
                        $transactions[] = [
                            'client_id' => $abonnement->client_id,
                            'employee_id' => $abonnement->employee_id,
                            'abonnement_id' => $abonnement->id,
                            'montant' => rand(50, 200),
                            'type_paiement' => Transaction::TYPE_PAIEMENT,
                            'date_paiement' => $upgradeDate,
                            'description' => 'Paiement additionnel suite à une modification (Upgrade)',
                            'created_at' => $upgradeDate,
                            'updated_at' => $upgradeDate,
                        ];
                    }
                }

                if ($abonnement->statut === 'Active' && $randScenario > 20 && $randScenario <= 50) {
                    $renewDate = $now->copy()->subDays(rand(1, 15));
                    $transactions[] = [
                        'client_id' => $abonnement->client_id,
                        'employee_id' => $abonnement->employee_id,
                        'abonnement_id' => $abonnement->id,
                        'montant' => $abonnement->prix,
                        'type_paiement' => Transaction::TYPE_PAIEMENT,
                        'date_paiement' => $renewDate,
                        'description' => 'Renouvellement : ' . $abonnement->type,
                        'created_at' => $renewDate,
                        'updated_at' => $renewDate,
                    ];
                }

                if ($abonnement->statut === 'Annulé' || $randScenario >= 95) {
                    $refundDate = $startDate->copy()->addDays(rand(2, 10));
                    if ($refundDate->lessThan($now)) {
                        $transactions[] = [
                            'client_id' => $abonnement->client_id,
                            'employee_id' => $abonnement->employee_id,
                            'abonnement_id' => $abonnement->id,
                            'montant' => $abonnement->prix * (rand(30, 100) / 100),
                            'type_paiement' => Transaction::TYPE_REMBOURSEMENT,
                            'date_paiement' => $refundDate,
                            'description' => 'Remboursement suite à annulation ou erreur',
                            'created_at' => $refundDate,
                            'updated_at' => $refundDate,
                        ];
                    }
                }
            }

            Transaction::insert($transactions);
        });
    }
}