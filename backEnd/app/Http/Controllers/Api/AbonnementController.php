<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\Client;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class AbonnementController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Abonnement::with(['client:id,nom', 'employee:id,nom']);

            $user = Auth::user();

            if ($user->role !== 'admin') {
                $query->where('employee_id', $user->id);
            }

            if ($user->role === 'admin' && $request->filled('employee_id') && $request->employee_id !== 'all') {
                $query->where('employee_id', $request->employee_id);
            }

            if ($request->filled('client_id') && $request->client_id !== 'all') {
                $query->where('client_id', $request->client_id);
            }

            if ($request->filled('statut') && $request->statut !== 'all') {
                $query->where('statut', $request->statut);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->whereHas('client', function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%");
                });
            }

            $perPage = $request->input('per_page', 7);
            $abonnements = $query->latest()->paginate($perPage);

            return response()->json([
                'status' => true,
                'data' => $abonnements
            ]);

        } catch (\Throwable $th) {
            return response()->json([
                'status' => false,
                'message' => 'Erreur serveur.'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dateDebut' => 'required|date',
            'dateFin' => 'required|date|after:dateDebut',
            'statut' => 'required|string|in:Active,Suspendu,Expiré,Annulé',
            'type' => 'required|string',
            'prix' => 'required|numeric',
            'client_id' => 'required|exists:clients,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $client = Client::find($request->client_id);

        if ($user->role === 'employee' && $client->employee_id !== $user->id) {
            return response()->json(['status' => false, 'message' => 'Non autorisé'], 403);
        }

        $abonnementExistant = Abonnement::where('client_id', $request->client_id)
            ->where('type', $request->type)
            ->where('statut', 'Active')
            ->exists();

        if ($abonnementExistant) {
            return response()->json([
                'status' => false,
                'message' => 'Ce client possède déjà un abonnement actif de ce type.'
            ], 400);
        }

        $data = $validator->validated();
        $data['employee_id'] = $client->employee_id;

        try {
            DB::beginTransaction();

            $abonnement = Abonnement::create($data);

            Transaction::create([
                'client_id' => $abonnement->client_id,
                'employee_id' => $abonnement->employee_id,
                'abonnement_id' => $abonnement->id,
                'montant' => $abonnement->prix,
                'type_paiement' => Transaction::TYPE_PAIEMENT,
                'date_paiement' => now(),
                'description' => 'Paiement initial pour abonnement ' . $abonnement->type,
            ]);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Abonnement et transaction créés avec succès',
                'data' => $abonnement
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la création de l\'abonnement.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $user = Auth::user();
        $abonnement = Abonnement::with(['client', 'transactions'])->find($id);

        if (!$abonnement) {
            return response()->json(['status' => false, 'message' => 'Abonnement non trouvé'], 404);
        }

        if ($user->role === 'employee' && $abonnement->client->employee_id !== $user->id) {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        return response()->json(['status' => true, 'data' => $abonnement]);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $abonnement = Abonnement::with('client')->find($id);

        if (!$abonnement) {
            return response()->json(['status' => false, 'message' => 'Abonnement non trouvé'], 404);
        }

        if ($user->role === 'employee' && $abonnement->client->employee_id !== $user->id) {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }
        if (in_array($abonnement->statut, ['Annulé', 'Expiré'])) {
            return response()->json([
                'status' => false,
                'message' => 'Impossible de modifier un abonnement annulé ou expiré.'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'dateDebut' => 'sometimes|required|date',
            'dateFin' => 'sometimes|required|date',
            'statut' => 'sometimes|required|string|in:Active,Suspendu,Expiré,Annulé',
            'prix' => 'sometimes|required|numeric',
            'type' => 'sometimes|required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();
            $ancienPrix = $abonnement->prix;

            // 🛡️ استخدام validated() بدلاً من all()
            $abonnement->update($validator->validated());

            if ($request->has('prix') && $request->prix != $ancienPrix) {
                $difference = $request->prix - $ancienPrix;
                $isPayment = $difference > 0;

                Transaction::create([
                    'client_id' => $abonnement->client_id,
                    'employee_id' => $abonnement->employee_id,
                    'abonnement_id' => $abonnement->id,
                    'montant' => abs($difference),
                    'type_paiement' => $isPayment ? Transaction::TYPE_PAIEMENT : Transaction::TYPE_REMBOURSEMENT,
                    'date_paiement' => now(),
                    'description' => $isPayment
                        ? 'Paiement additionnel suite à une modification de l\'abonnement'
                        : 'Remboursement suite à une réduction du prix de l\'abonnement',
                ]);
            }

            DB::commit();
            return response()->json(['status' => true, 'message' => 'Mis à jour avec succès', 'data' => $abonnement]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => 'Erreur de mise à jour.'], 500);
        }
    }

    public function renew(Request $request, $id)
    {
        $user = Auth::user();
        $abonnement = Abonnement::with('client')->find($id);

        if (!$abonnement) {
            return response()->json(['status' => false, 'message' => 'Abonnement non trouvé'], 404);
        }

        if ($user->role === 'employee' && $abonnement->client->employee_id !== $user->id) {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'dateDebut' => 'required|date',
            'dateFin' => 'required|date|after:dateDebut',
            'prix' => 'required|numeric|min:0',
            'type' => 'sometimes|required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            Transaction::create([
                'client_id' => $abonnement->client_id,
                'employee_id' => $abonnement->employee_id,
                'abonnement_id' => $abonnement->id,
                'montant' => $request->prix,
                'type_paiement' => Transaction::TYPE_PAIEMENT,
                'date_paiement' => now(),
                'description' => 'Renouvellement : ' . $request->input('type', $abonnement->type),
            ]);

            $abonnement->update([
                'type' => $request->input('type', $abonnement->type),
                'dateDebut' => $request->dateDebut,
                'dateFin' => $request->dateFin,
                'prix' => $request->prix,
                'statut' => 'Active',
            ]);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Abonnement renouvelé avec succès',
                'data' => $abonnement
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => 'Erreur lors du renouvellement.'], 500);
        }
    }

    public function cancel($id)
    {
        $user = Auth::user();
        $abonnement = Abonnement::with('client')->find($id);

        if (!$abonnement) {
            return response()->json(['status' => false, 'message' => 'Abonnement non trouvé'], 404);
        }

        if ($user->role === 'employee' && $abonnement->client->employee_id !== $user->id) {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        if ($abonnement->statut === 'Annulé') {
            return response()->json(['status' => false, 'message' => 'Cet abonnement est déjà annulé.'], 400);
        }

        $abonnement->update([
            'statut' => 'Annulé',
            'dateFin' => now()
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Abonnement annulé avec succès.',
            'data' => $abonnement
        ]);
    }

    public function downloadReceipt($id)
    {
        $user = Auth::user();
        $abonnement = Abonnement::with(['client', 'employee'])->find($id);

        if (!$abonnement) {
            return response()->json(['status' => false, 'message' => 'Abonnement non trouvé'], 404);
        }

        if ($user->role === 'employee' && $abonnement->client->employee_id !== $user->id) {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        $transaction = Transaction::where('abonnement_id', $id)
            ->where('type_paiement', Transaction::TYPE_PAIEMENT)
            ->latest()
            ->first();

        if (!$transaction) {
            return response()->json(['status' => false, 'message' => 'Aucune transaction trouvée pour cet abonnement.'], 404);
        }

        $data = [
            'abonnement' => $abonnement,
            'transaction' => $transaction,
            'client' => $abonnement->client,
            'employee' => $abonnement->employee,
            'date' => now()->format('d/m/Y H:i'),
            'numero_recu' => 'REC-' . date('Y') . '-' . str_pad($transaction->id, 5, '0', STR_PAD_LEFT)
        ];

        $pdf = Pdf::loadView('pdf.receipt', $data);

        return $pdf->download('recu_' . $abonnement->client->nom . '_' . date('Ymd') . '.pdf');
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $abonnement = Abonnement::with('client')->find($id);

        if (!$abonnement) {
            return response()->json(['status' => false, 'message' => 'Abonnement non trouvé'], 404);
        }

        if ($user->role === 'employee' && $abonnement->client->employee_id !== $user->id) {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        try {
            DB::beginTransaction();

            $totalPaye = Transaction::where('abonnement_id', $abonnement->id)
                ->where('type_paiement', Transaction::TYPE_PAIEMENT)
                ->sum('montant');

            $totalRembourse = Transaction::where('abonnement_id', $abonnement->id)
                ->where('type_paiement', Transaction::TYPE_REMBOURSEMENT)
                ->sum('montant');

            $balance = $totalPaye - $totalRembourse;

            if ($balance > 0) {
                Transaction::create([
                    'client_id' => $abonnement->client_id,
                    'employee_id' => $abonnement->employee_id,
                    'abonnement_id' => $abonnement->id,
                    'montant' => $balance,
                    'type_paiement' => Transaction::TYPE_REMBOURSEMENT,
                    'date_paiement' => now(),
                    'description' => 'Remboursement automatique suite à la suppression de l\'abonnement (Erreur)',
                ]);
            }

            $abonnement->delete();
            DB::commit();

            return response()->json(['status' => true, 'message' => 'Abonnement supprimé et fonds ajustés avec succès']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => 'Erreur lors de la suppression.'], 500);
        }
    }
}