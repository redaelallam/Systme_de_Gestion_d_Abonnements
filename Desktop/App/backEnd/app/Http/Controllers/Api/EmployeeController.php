<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Client;
use App\Models\Abonnement;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class EmployeeController extends Controller
{
    public function index()
    {
        try {
            $employees = User::where('role', 'employee')->orderBy('created_at', 'desc')->get();
            return response()->json(['status' => true, 'data' => $employees]);
        } catch (\Throwable $th) {
            return response()->json(['status' => false, 'message' => 'Erreur serveur.'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|min:6',
                'role' => 'sometimes|string|in:admin,employee',
            ]);

            if ($validator->fails()) {
                return response()->json(['status' => false, 'message' => 'Erreur de validation', 'errors' => $validator->errors()], 422);
            }

            $employee = User::create([
                'nom' => $request->nom,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role ?? 'employee'
            ]);

            return response()->json(['status' => true, 'message' => 'Créé avec succès.', 'data' => $employee], 201);

        } catch (\Throwable $th) {
            Log::error("Create User Error: " . $th->getMessage());
            return response()->json(['status' => false, 'message' => 'Erreur serveur.'], 500);
        }
    }

    public function show($id)
    {
        $authUser = Auth::user();

        // حماية البيانات بناءً على الدور (الأدمن يرى الجميع، الموظف يرى نفسه فقط)
        if ($authUser && $authUser->role !== 'admin' && $authUser->id != $id) {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        $employee = User::where('role', 'employee')->find($id);

        if (!$employee) {
            return response()->json(['status' => false, 'message' => 'Employé non trouvé.'], 404);
        }

        $year = now()->year;
        $month = now()->month;

        $qTrans = Transaction::where('employee_id', $id)->revenue();

        $revenuMensuel = (clone $qTrans)->forMonth($year, $month)->sum('montant');
        $revenuAnnuel = (clone $qTrans)->forYear($year)->sum('montant');
        $revenuTotal = (clone $qTrans)->sum('montant');

        $clientsCount = Client::where('employee_id', $id)->count();

        $clientsActifs = Client::where('employee_id', $id)
            ->whereHas('abonnements', function ($q) {
                $q->active();
            })->count();

        $qAbo = Abonnement::whereHas('client', function ($q) use ($id) {
            $q->where('employee_id', $id);
        });

        $abonnementsTotal = (clone $qAbo)->count();
        $abonnementsActifs = (clone $qAbo)->active()->count();

        $tauxConversion = $clientsCount > 0
            ? round(($clientsActifs / $clientsCount) * 100, 1)
            : 0;

        $monthlyQuery = Transaction::revenue()
            ->where('employee_id', $id)
            ->select(DB::raw('YEAR(date_paiement) as annee, MONTH(date_paiement) as mois, SUM(montant) as total'))
            ->groupBy('annee', 'mois');

        $yearlyQuery = Transaction::revenue()
            ->where('employee_id', $id)
            ->select(DB::raw('YEAR(date_paiement) as annee, SUM(montant) as total'))
            ->groupBy('annee');

        $firstTransaction = Transaction::revenue()
            ->where('employee_id', $id)
            ->orderBy('date_paiement', 'asc')
            ->first();

        $startYear = $firstTransaction ? Carbon::parse($firstTransaction->date_paiement)->year : now()->year;
        $startMonth = $firstTransaction ? Carbon::parse($firstTransaction->date_paiement)->month : now()->month;
        $currentYear = now()->year;
        $currentMonth = now()->month;

        $monthlyResults = $monthlyQuery->get()->keyBy(function ($item) {
            return $item->annee . '-' . str_pad($item->mois, 2, '0', STR_PAD_LEFT);
        });

        $monthlyData = [];
        $currentDate = Carbon::create($startYear, $startMonth, 1);
        $endDate = Carbon::create($currentYear, $currentMonth, 1);

        while ($currentDate <= $endDate) {
            $key = $currentDate->format('Y-m');
            $monthlyData[] = [
                'label' => $currentDate->format('m/Y'),
                'total' => isset($monthlyResults[$key]) ? (float) $monthlyResults[$key]->total : 0
            ];
            $currentDate->addMonth();
        }

        $yearlyResults = $yearlyQuery->get()->keyBy('annee');
        $yearlyData = [];

        for ($y = $startYear; $y <= $currentYear; $y++) {
            $yearlyData[] = [
                'label' => (string) $y,
                'total' => isset($yearlyResults[$y]) ? (float) $yearlyResults[$y]->total : 0
            ];
        }

        $typesDistribution = Abonnement::select('type', DB::raw('count(*) as total'))
            ->whereHas('client', function ($q) use ($id) {
                $q->where('employee_id', $id);
            })
            ->where('statut', 'Active')
            ->groupBy('type')
            ->get()
            ->map(fn($item) => ['name' => $item->type, 'value' => $item->total]);

        $clientsRecents = Client::where('employee_id', $id)
            ->withCount('abonnements as total_abonnements')
            ->withSum('abonnements as total_revenus', 'prix')
            ->orderBy('created_at', 'desc')
            ->get();

        $abonnementsRecents = (clone $qAbo)->with('client:id,nom')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'status' => true,
            'data' => [
                'employee_info' => $employee,
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
                    'abonnements_recents' => $abonnementsRecents
                ]
            ]
        ]);
    }

    public function update(Request $request, $id)
    {
        try {
            $employee = User::where('role', 'employee')->find($id);

            if (!$employee) {
                return response()->json(['status' => false, 'message' => 'Employé non trouvé.'], 404);
            }

            $validator = Validator::make($request->all(), [
                'nom' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $id,
                'password' => 'nullable|min:6',
                'role' => 'sometimes|string|in:admin,employee',
            ]);

            if ($validator->fails()) {
                return response()->json(['status' => false, 'message' => 'Erreur de validation', 'errors' => $validator->errors()], 422);
            }

            if ($request->has('nom'))
                $employee->nom = $request->nom;
            if ($request->has('email'))
                $employee->email = $request->email;
            if ($request->has('password') && !empty($request->password))
                $employee->password = Hash::make($request->password);
            if ($request->has('role'))
                $employee->role = $request->role;

            $employee->save();

            return response()->json(['status' => true, 'message' => 'Mis à jour avec succès.', 'data' => $employee]);

        } catch (\Throwable $th) {
            Log::error("Update User Error: " . $th->getMessage());
            return response()->json(['status' => false, 'message' => 'Erreur serveur.'], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $employee = User::where('role', 'employee')->find($id);

        if (!$employee) {
            return response()->json(['status' => false, 'message' => 'Employé non trouvé.'], 404);
        }

        $hasClients = Client::where('employee_id', $id)->exists();

        if ($hasClients) {
            $transferToId = $request->input('transfer_to_employee_id');

            if (!$transferToId) {
                return response()->json([
                    'status' => false,
                    'message' => 'Impossible de supprimer cet employé car il a des clients associés. Veuillez fournir un employé de remplacement (transfer_to_employee_id).'
                ], 400);
            }

            $newEmployee = User::where('role', 'employee')->find($transferToId);
            if (!$newEmployee || $newEmployee->id === $employee->id) {
                return response()->json(['status' => false, 'message' => 'L\'employé de remplacement est invalide.'], 400);
            }

            try {
                DB::beginTransaction();

                Client::where('employee_id', $id)->update(['employee_id' => $transferToId]);

                Abonnement::where('employee_id', $id)->update(['employee_id' => $transferToId]);

                $employee->delete();

                DB::commit();

                return response()->json([
                    'status' => true,
                    'message' => 'Employé supprimé et ses clients ont été transférés avec succès.'
                ]);

            } catch (\Throwable $th) {
                DB::rollBack();
                Log::error("Transfer and Delete Error: " . $th->getMessage());
                return response()->json(['status' => false, 'message' => 'Erreur lors du transfert et de la suppression.'], 500);
            }
        }

        $employee->delete();
        return response()->json(['status' => true, 'message' => 'Employé supprimé avec succès.']);
    }
}