<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Abonnement;
use Illuminate\Support\Facades\Log;

class UpdateExpiredSubscriptions extends Command
{
    protected $signature = 'subscriptions:update-expired';

    protected $description = 'Vérifier et mettre à jour le statut des abonnements expirés';

    public function handle()
    {
        $expiredSubscriptions = Abonnement::where('statut', 'Active')
            ->whereDate('dateFin', '<', now()->toDateString())
            ->get();

        $count = 0;

        foreach ($expiredSubscriptions as $abonnement) {
            $abonnement->update(['statut' => 'Expiré']);
            $count++;
        }

        if ($count > 0) {
            Log::info("{$count} abonnements ont été marqués comme Expiré automatiquement.");
            $this->info("{$count} abonnements mis à jour.");
        } else {
            $this->info("Aucun abonnement expiré trouvé aujourd'hui.");
        }
    }
}