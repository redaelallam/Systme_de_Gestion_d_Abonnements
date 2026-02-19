<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Client;
use App\Models\Abonnement;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = User::orderBy('created_at', 'desc');

        if ($request->has('page') || $request->has('per_page')) {
            $perPage = $request->input('per_page', 10);
            $employees = $query->paginate($perPage);
        } else {
            $employees = $query->get();
        }

        return response()->json([
            'status' => true,
            'data' => $employees
        ]);
    }

    public function store(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:admin,employee'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'nom' => $request->nom,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Employé créé avec succès.',
                'data' => $user
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la création.',
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        $employee = User::find($id);

        if (!$employee) {
            return response()->json(['status' => false, 'message' => 'Employé non trouvé.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'nullable|min:6',
            'role' => 'sometimes|required|in:admin,employee'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $validator->validated();

            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            } else {
                unset($data['password']);
            }

            $employee->update($data);

            return response()->json([
                'status' => true,
                'message' => 'Employé mis à jour avec succès.',
                'data' => $employee
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la mise à jour.',
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        $authUser = Auth::user();

        if ($authUser && $authUser->role !== 'admin' && $authUser->id != $id) {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        $employee = User::where('role', 'employee')->find($id);

        if (!$employee) {
            return response()->json(['status' => false, 'message' => 'Employé non trouvé.'], 404);
        }

        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $qTrans = Transaction::where('employee_id', $id)->revenue();

        $revenuMensuel = (clone $qTrans)->forMonth($year, $month)->sum('montant');
        $revenuAnnuel = (clone $qTrans)->forYear($year)->sum('montant');
        $revenuTotal = (clone $qTrans)->sum('montant');

        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();

        $clientsCount = Client::where('employee_id', $id)
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->count();

        $clientsActifs = Client::where('employee_id', $id)
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->whereHas('abonnements', function ($q) use ($startOfMonth, $endOfMonth) {
                $q->active()->whereBetween('created_at', [$startOfMonth, $endOfMonth]);
            })->count();

        $qAbo = Abonnement::whereHas('client', function ($q) use ($id) {
            $q->where('employee_id', $id);
        })->whereBetween('created_at', [$startOfMonth, $endOfMonth]);

        $abonnementsTotal = (clone $qAbo)->count();
        $abonnementsActifs = (clone $qAbo)->active()->count();

        $tauxConversion = $clientsCount > 0
            ? round(($clientsActifs / $clientsCount) * 100, 1)
            : 0;

        $startOfYear = Carbon::create($year, 1, 1)->startOfDay();
        $endOfYear = Carbon::create($year, 12, 31)->endOfDay();

        $monthlyQuery = Transaction::revenue()
            ->where('employee_id', $id)
            ->whereBetween('date_paiement', [$startOfYear, $endOfYear])
            ->select(DB::raw('MONTH(date_paiement) as mois, SUM(montant) as total'))
            ->groupBy(DB::raw('MONTH(date_paiement)'));

        $monthlyResults = $monthlyQuery->get()->keyBy('mois');
        $monthlyData = [];

        for ($m = 1; $m <= 12; $m++) {
            $monthlyData[] = [
                'label' => str_pad($m, 2, '0', STR_PAD_LEFT) . '/' . $year,
                'total' => isset($monthlyResults[$m]) ? (float) $monthlyResults[$m]->total : 0
            ];
        }

        $yearlyQuery = Transaction::revenue()
            ->where('employee_id', $id)
            ->select(DB::raw('YEAR(date_paiement) as annee, SUM(montant) as total'))
            ->groupBy(DB::raw('YEAR(date_paiement)'));

        $yearlyResults = $yearlyQuery->get()->keyBy('annee');
        $yearlyData = [];

        $firstTrans = Transaction::revenue()->where('employee_id', $id)->orderBy('date_paiement', 'asc')->first();
        $startYear = $firstTrans ? Carbon::parse($firstTrans->date_paiement)->year : $year;

        for ($y = $startYear; $y <= $year; $y++) {
            $yearlyData[] = [
                'label' => (string) $y,
                'total' => isset($yearlyResults[$y]) ? (float) $yearlyResults[$y]->total : 0
            ];
        }

        $typesDistribution = Abonnement::select('type', DB::raw('count(*) as total'))
            ->whereHas('client', function ($q) use ($id) {
                $q->where('employee_id', $id);
            })
            ->where('created_at', '<=', $endOfMonth)
            ->where('dateFin', '>=', $startOfMonth)
            ->groupBy('type')
            ->get()
            ->map(fn($item) => ['name' => $item->type, 'value' => $item->total]);

        $clientsRecents = Client::where('employee_id', $id)
            ->withCount('abonnements as total_abonnements')
            ->withSum([
                'abonnements as total_revenus' => function ($q) use ($startOfMonth, $endOfMonth) {
                    $q->whereBetween('created_at', [$startOfMonth, $endOfMonth]);
                }
            ], 'prix')
            ->get()
            ->sortByDesc('total_revenus')
            ->values();

        $firstTransGlobal = Transaction::orderBy('date_paiement', 'asc')->first();
        $minYear = $firstTransGlobal ? Carbon::parse($firstTransGlobal->date_paiement)->year : now()->year;
        $availableYears = range(now()->year, $minYear);

        return response()->json([
            'status' => true,
            'data' => [
                'employee_info' => $employee,
                'available_years' => $availableYears,
                'statistiques' => [
                    'revenu_mensuel' => (float) $revenuMensuel,
                    'revenu_annuel' => (float) $revenuAnnuel,
                    'revenu_total' => (float) $revenuTotal,
                    'clients_count' => $clientsCount,
                    'abonnements_total' => $abonnementsTotal,
                    'abonnements_actifs' => $abonnementsActifs,
                    'taux_conversion' => $tauxConversion,
                ],
                'graphiques' => [
                    'revenus_historique' => [
                        'mensuel' => $monthlyData,
                        'annuel' => $yearlyData
                    ],
                    'repartition_abonnements' => $typesDistribution
                ],
                'listes' => [
                    'clients_recents' => $clientsRecents,
                    'abonnements_recents' => []
                ]
            ]
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        try {
            DB::beginTransaction();

            $employee = User::find($id);

            if (!$employee) {
                return response()->json(['status' => false, 'message' => 'Employé non trouvé.'], 404);
            }

            if ($request->has('transfer_to_employee_id') && !empty($request->transfer_to_employee_id)) {
                $transferToId = $request->transfer_to_employee_id;

                $targetEmployee = User::find($transferToId);
                if (!$targetEmployee) {
                    return response()->json(['status' => false, 'message' => 'Employé de remplacement non trouvé.'], 404);
                }

                Client::where('employee_id', $employee->id)->update(['employee_id' => $targetEmployee->id]);
            } else {
                $clientsCount = Client::where('employee_id', $employee->id)->count();
                if ($clientsCount > 0) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Cet employé a des clients actifs. Veuillez les transférer avant de le supprimer.'
                    ], 400);
                }
            }

            $employee->delete();

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Employé supprimé avec succès.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }
}