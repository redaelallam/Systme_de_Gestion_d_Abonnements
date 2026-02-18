<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Client;
use App\Models\Abonnement;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Client::with('employee:id,nom');
            $user = Auth::user();

            if ($user->role !== 'admin') {
                $query->where('employee_id', $user->id);
            }

            if ($user->role === 'admin' && $request->filled('employee_id') && $request->employee_id !== 'all') {
                $query->where('employee_id', $request->employee_id);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->has('page') || $request->has('per_page')) {
                $perPage = $request->input('per_page', 7);
                $clients = $query->latest()->paginate($perPage);
            } else {
                $clients = $query->latest()->get();
            }

            return response()->json([
                'status' => true,
                'data' => $clients
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
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email',
            'telephone' => 'required|string',
            'adresse' => 'required|string',
        ]);

        if ($request->user()->role === 'admin') {
            $request->validate(['employee_id' => 'required|exists:users,id']);
            $validated['employee_id'] = $request->employee_id;
        } else {
            $validated['employee_id'] = $request->user()->id;
        }

        $client = Client::create($validated);

        return response()->json([
            'status' => true,
            'message' => 'Client créé avec succès.',
            'data' => $client
        ], 201);
    }

    public function show($id)
    {
        $user = Auth::user();
        $client = Client::with(['employee:id,nom', 'abonnements'])->find($id);

        if (!$client) {
            return response()->json(['status' => false, 'message' => 'Client non trouvé.'], 404);
        }

        $totalTransactions = \App\Models\Transaction::where('client_id', $id)
            ->selectRaw("SUM(CASE WHEN type_paiement = 'Paiement' THEN montant ELSE -montant END) as total")
            ->first()->total ?? 0;

        $client->total_historique_financier = max(0, (float) $totalTransactions);

        return response()->json(['status' => true, 'data' => $client]);
    }

    public function update(Request $request, $id)
    {
        $client = Client::find($id);

        if (!$client) {
            return response()->json(['status' => false, 'message' => 'Client non trouvé.'], 404);
        }

        if (Auth::user()->role !== 'admin' && $client->employee_id !== Auth::id()) {
            return response()->json(['status' => false, 'message' => 'Non autorisé.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:clients,email,' . $id,
            'telephone' => 'sometimes|required|string',
            'adresse' => 'sometimes|required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $client->update($validator->validated());

        return response()->json([
            'status' => true,
            'message' => 'Client mis à jour.',
            'data' => $client
        ]);
    }

    public function destroy($id)
    {
        $client = Client::find($id);

        if (!$client) {
            return response()->json(['status' => false, 'message' => 'Client non trouvé.'], 404);
        }

        if (Auth::user()->role !== 'admin' && $client->employee_id !== Auth::id()) {
            return response()->json(['status' => false, 'message' => 'Non autorisé.'], 403);
        }

        try {
            DB::beginTransaction();
            Abonnement::where('client_id', $client->id)->delete();
            $client->delete();
            DB::commit();

            return response()->json(['status' => true, 'message' => 'Client supprimé. L\'historique financier est conservé.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => 'Erreur lors de la suppression.'], 500);
        }
    }
}