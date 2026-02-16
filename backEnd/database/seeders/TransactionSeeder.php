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
        $abonnements = Abonnement::all();

        if ($abonnements->isEmpty()) {
            return;
        }

        $transactions = [];

        foreach ($abonnements as $abonnement) {
            $transactions[] = [
                'client_id' => $abonnement->client_id,
                'employee_id' => $abonnement->employee_id,
                'abonnement_id' => $abonnement->id,
                'montant' => $abonnement->prix,
                'type_paiement' => Transaction::TYPE_PAIEMENT,
                'date_paiement' => $abonnement->created_at,
                'description' => 'Paiement abonnement ' . $abonnement->type,
                'created_at' => $abonnement->created_at,
                'updated_at' => $abonnement->created_at,
            ];

            if (rand(1, 100) <= 5) {
                $refundDate = Carbon::parse($abonnement->created_at)->addDays(rand(1, 5));
                $transactions[] = [
                    'client_id' => $abonnement->client_id,
                    'employee_id' => $abonnement->employee_id,
                    'abonnement_id' => $abonnement->id,
                    'montant' => $abonnement->prix,
                    'type_paiement' => Transaction::TYPE_REMBOURSEMENT,
                    'date_paiement' => $refundDate,
                    'description' => 'Remboursement client insatisfait',
                    'created_at' => $refundDate,
                    'updated_at' => $refundDate,
                ];
            }
        }

        foreach (array_chunk($transactions, 100) as $chunk) {
            Transaction::insert($chunk);
        }
    }
}