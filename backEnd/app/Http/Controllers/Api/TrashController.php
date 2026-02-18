<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Client;
use App\Models\Abonnement;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class TrashController extends Controller
{
    private function checkAdmin()
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Accès non autorisé.');
        }
    }

    public function index($type)
    {
        $this->checkAdmin();
        $data = [];

        switch ($type) {
            case 'clients':
                $data = Client::onlyTrashed()->with('employee:id,nom')->latest('deleted_at')->get();
                break;
            case 'abonnements':
                $data = Abonnement::onlyTrashed()->with(['client:id,nom', 'employee:id,nom'])->latest('deleted_at')->get();
                break;
            case 'employees':
                $data = User::onlyTrashed()->where('role', 'employee')->latest('deleted_at')->get();
                break;
            default:
                return response()->json(['status' => false, 'message' => 'Type invalide'], 400);
        }

        return response()->json(['status' => true, 'data' => $data]);
    }

    public function restore($type, $id)
    {
        $this->checkAdmin();
        $model = $this->getModel($type, $id);

        if (!$model) {
            return response()->json(['status' => false, 'message' => 'Élément introuvable.'], 404);
        }

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            $model->restore();

            if ($type === 'abonnements') {
                $this->compensateRefunds($id);
            }

            if ($type === 'clients') {
                $abonnements = \App\Models\Abonnement::onlyTrashed()->where('client_id', $id)->get();

                foreach ($abonnements as $abo) {
                    $abo->restore();
                    $this->compensateRefunds($abo->id);
                }
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Élément restauré avec succès. Les finances et statuts sont revenus à leur état d\'origine.'
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['status' => false, 'message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    private function compensateRefunds($abonnementId)
    {
        $refunds = \App\Models\Transaction::where('abonnement_id', $abonnementId)
            ->where('type_paiement', \App\Models\Transaction::TYPE_REMBOURSEMENT)
            ->where('description', 'like', '%suppression%')
            ->get();

        foreach ($refunds as $refund) {
            \App\Models\Transaction::create([
                'client_id' => $refund->client_id,
                'employee_id' => $refund->employee_id,
                'abonnement_id' => $refund->abonnement_id,
                'montant' => $refund->montant,
                'type_paiement' => \App\Models\Transaction::TYPE_PAIEMENT,
                'date_paiement' => now(),
                'description' => 'Annulation du remboursement (Restauration de l\'abonnement)',
            ]);
        }
    }

    public function forceDelete($type, $id)
    {
        $this->checkAdmin();
        $model = $this->getModel($type, $id);

        if (!$model) {
            return response()->json(['status' => false, 'message' => 'Élément introuvable.'], 404);
        }

        $model->forceDelete();

        return response()->json(['status' => true, 'message' => 'Élément supprimé définitivement.']);
    }

    private function getModel($type, $id)
    {
        switch ($type) {
            case 'clients':
                return Client::onlyTrashed()->find($id);
            case 'abonnements':
                return Abonnement::onlyTrashed()->find($id);
            case 'employees':
                return User::onlyTrashed()->find($id);
        }
        return null;
    }
}