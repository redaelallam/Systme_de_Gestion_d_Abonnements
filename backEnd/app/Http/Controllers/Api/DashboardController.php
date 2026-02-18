<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Abonnement;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Chart\Chart;
use PhpOffice\PhpSpreadsheet\Chart\DataSeries;
use PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues;
use PhpOffice\PhpSpreadsheet\Chart\PlotArea;
use PhpOffice\PhpSpreadsheet\Chart\Title;
use PhpOffice\PhpSpreadsheet\Chart\Legend;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Color;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'year' => 'nullable|integer|min:2000|max:2100',
            'month' => 'nullable|integer|min:1|max:12',
        ]);

        $user = Auth::user();
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $financials = $this->getMetriquesFinancieres($year, $month, $user);

        $firstTransaction = Transaction::orderBy('date_paiement', 'asc')->first();
        $minYear = $firstTransaction ? Carbon::parse($firstTransaction->date_paiement)->year : now()->year;
        $availableYears = range(now()->year, $minYear);

        $response = [
            'role' => $user->role,
            'available_years' => $availableYears,
            'resume_financier' => $financials,
            'graphiques' => $this->getDonneesGraphiques($user, $year, $month),
            // 🟢 تم التعديل هنا: استدعاء الدالة بدون تمرير الشهر والسنة
            'clients_analytics' => $this->getAnalyseClients($user),
            'abonnements_expirant' => $this->getApercuAbonnementsExpirant(30, $user, $year, $month),
            'clients_table' => $this->getClientsTableData($user, $year, $month),
        ];

        if ($user->role === 'admin') {
            $response['performance_equipe'] = $this->getPerformancesEmployes($year, $month);
        }

        return response()->json($response);
    }

    public function expiringSubscriptions(Request $request)
    {
        $user = Auth::user();
        $days = $request->input('days', 30);

        return response()->json([
            'status' => true,
            'data' => $this->getApercuAbonnementsExpirant($days, $user)
        ]);
    }

    public function employeeRevenue(Request $request, $employeeId)
    {
        $user = Auth::user();

        if ($user->role !== 'admin' && $user->id != $employeeId) {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        $targetEmployee = User::findOrFail($employeeId);
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        return response()->json([
            'status' => true,
            'data' => $this->getMetriquesFinancieres($year, $month, $targetEmployee)
        ]);
    }

    private function calculateNetRevenue($query)
    {
        $paiements = (clone $query)->where('type_paiement', Transaction::TYPE_PAIEMENT)->sum('montant');
        $remboursements = (clone $query)->where('type_paiement', Transaction::TYPE_REMBOURSEMENT)->sum('montant');

        return max(0, $paiements - $remboursements);
    }

    private function getMetriquesFinancieres(int $year, int $month, $user): array
    {
        $query = Transaction::query();
        if ($user->role === 'employee') {
            $query->where('employee_id', $user->id);
        }

        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();
        $lastMonthStart = Carbon::create($year, $month, 1)->subMonth()->startOfMonth();
        $lastMonthEnd = Carbon::create($year, $month, 1)->subMonth()->endOfMonth();
        $startOfYear = Carbon::create($year, 1, 1)->startOfYear();
        $endOfYear = Carbon::create($year, 12, 31)->endOfYear();

        $revenuCeMois = $this->calculateNetRevenue((clone $query)->whereBetween('date_paiement', [$startOfMonth, $endOfMonth]));
        $revenuMoisDernier = $this->calculateNetRevenue((clone $query)->whereBetween('date_paiement', [$lastMonthStart, $lastMonthEnd]));
        $annuel = $this->calculateNetRevenue((clone $query)->whereBetween('date_paiement', [$startOfYear, $endOfYear]));
        $total = $this->calculateNetRevenue(clone $query);

        $croissance = 0;
        if ($revenuMoisDernier > 0) {
            $croissance = (($revenuCeMois - $revenuMoisDernier) / $revenuMoisDernier) * 100;
        } elseif ($revenuCeMois > 0) {
            $croissance = 100;
        }

        return [
            'mensuel' => [
                'montant' => (float) $revenuCeMois,
                'montant_precedent' => (float) $revenuMoisDernier,
                'croissance_pourcentage' => round($croissance, 2),
                'tendance' => $croissance >= 0 ? 'hausse' : 'baisse'
            ],
            'annuel' => (float) $annuel,
            'total_global' => (float) $total,
        ];
    }

    private function getDonneesGraphiques($user, int $year, int $month): array
    {
        $startOfYear = Carbon::create($year, 1, 1)->startOfDay();
        $endOfYear = Carbon::create($year, 12, 31)->endOfDay();

        $typePaiement = Transaction::TYPE_PAIEMENT;
        $netRaw = "SUM(CASE WHEN type_paiement = '{$typePaiement}' THEN montant ELSE -montant END)";

        $monthlyQuery = Transaction::query()
            ->whereBetween('date_paiement', [$startOfYear, $endOfYear])
            ->select(DB::raw('MONTH(date_paiement) as mois'), DB::raw("{$netRaw} as total"))
            ->groupBy(DB::raw('MONTH(date_paiement)'));

        $yearlyQuery = Transaction::query()
            ->select(DB::raw('YEAR(date_paiement) as annee'), DB::raw("{$netRaw} as total"))
            ->groupBy(DB::raw('YEAR(date_paiement)'));

        if ($user->role === 'employee') {
            $monthlyQuery->where('employee_id', $user->id);
            $yearlyQuery->where('employee_id', $user->id);
        }

        $monthlyResults = $monthlyQuery->get()->keyBy('mois');
        $monthlyData = [];

        for ($m = 1; $m <= 12; $m++) {
            $monthlyData[] = [
                'label' => str_pad($m, 2, '0', STR_PAD_LEFT) . '/' . $year,
                'total' => isset($monthlyResults[$m]) ? max(0, (float) $monthlyResults[$m]->total) : 0
            ];
        }

        $firstTransaction = Transaction::when($user->role === 'employee', fn($q) => $q->where('employee_id', $user->id))
            ->orderBy('date_paiement', 'asc')
            ->first();

        $startYear = $firstTransaction ? Carbon::parse($firstTransaction->date_paiement)->year : $year;

        $yearlyResults = $yearlyQuery->get()->keyBy('annee');
        $yearlyData = [];

        for ($y = $startYear; $y <= $year; $y++) {
            $yearlyData[] = [
                'label' => (string) $y,
                'total' => isset($yearlyResults[$y]) ? max(0, (float) $yearlyResults[$y]->total) : 0
            ];
        }

        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();

        $typesDistribution = Abonnement::select('type', DB::raw('count(*) as total'))
            ->when($user->role === 'employee', function ($q) use ($user) {
                $q->whereHas('client', function ($clientQuery) use ($user) {
                    $clientQuery->where('employee_id', $user->id);
                });
            })
            ->where('created_at', '<=', $endOfMonth)
            ->where('dateFin', '>=', $startOfMonth)
            ->groupBy('type')
            ->get()
            ->map(fn($item) => ['name' => $item->type, 'value' => $item->total]);

        return [
            'revenus_historique' => [
                'mensuel' => $monthlyData,
                'annuel' => $yearlyData
            ],
            'repartition_abonnements' => $typesDistribution
        ];
    }

    private function getPerformancesEmployes(int $year, int $month): array
    {
        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();
        $startOfYear = Carbon::create($year, 1, 1)->startOfYear();
        $endOfYear = Carbon::create($year, 12, 31)->endOfYear();

        $employes = User::where('role', 'employee')
            ->withCount('clients as total_clients')
            ->withCount(['abonnements as abonnements_actifs' => fn($q) => $q->active()])

            ->withSum(['transactions as paye_total' => fn($q) => $q->where('type_paiement', Transaction::TYPE_PAIEMENT)], 'montant')
            ->withSum(['transactions as paye_annuel' => fn($q) => $q->where('type_paiement', Transaction::TYPE_PAIEMENT)->whereBetween('date_paiement', [$startOfYear, $endOfYear])], 'montant')
            ->withSum(['transactions as paye_mensuel' => fn($q) => $q->where('type_paiement', Transaction::TYPE_PAIEMENT)->whereBetween('date_paiement', [$startOfMonth, $endOfMonth])], 'montant')

            ->withSum(['transactions as rem_total' => fn($q) => $q->where('type_paiement', Transaction::TYPE_REMBOURSEMENT)], 'montant')
            ->withSum(['transactions as rem_annuel' => fn($q) => $q->where('type_paiement', Transaction::TYPE_REMBOURSEMENT)->whereBetween('date_paiement', [$startOfYear, $endOfYear])], 'montant')
            ->withSum(['transactions as rem_mensuel' => fn($q) => $q->where('type_paiement', Transaction::TYPE_REMBOURSEMENT)->whereBetween('date_paiement', [$startOfMonth, $endOfMonth])], 'montant')
            ->get();

        $classement = $employes->map(function ($emp) {
            $revMensuel = ($emp->paye_mensuel ?? 0) - ($emp->rem_mensuel ?? 0);
            $revAnnuel = ($emp->paye_annuel ?? 0) - ($emp->rem_annuel ?? 0);
            $revTotal = ($emp->paye_total ?? 0) - ($emp->rem_total ?? 0);

            return [
                'id' => $emp->id,
                'nom' => $emp->nom,
                'email' => $emp->email,
                'clients_count' => $emp->total_clients,
                'active_subs' => $emp->abonnements_actifs,
                'revenu_mensuel' => max(0, (float) $revMensuel),
                'revenu_annuel' => max(0, (float) $revAnnuel),
                'revenu_total' => max(0, (float) $revTotal),
                'taux_conversion' => $emp->total_clients > 0
                    ? round(($emp->abonnements_actifs / $emp->total_clients) * 100, 1)
                    : 0,
            ];
        });

        return $classement->sortByDesc('revenu_mensuel')->values()->toArray();
    }

    private function getAnalyseClients($user): array
    {
        $query = Client::query();

        if ($user->role === 'employee') {
            $query->where('employee_id', $user->id);
        }

        $total = (clone $query)->count();
        $actifs = (clone $query)->whereHas('abonnements', function ($q) {
            $q->active();
        })->count();

        return [
            'total' => $total,
            'actifs' => $actifs,
            'inactifs' => $total - $actifs,
            'taux_activite' => $total > 0 ? round(($actifs / $total) * 100, 1) : 0
        ];
    }

    private function getApercuAbonnementsExpirant(int $days, $user, int $year = null, int $month = null): array
    {
        $baseDate = ($year && $month) ? Carbon::create($year, $month, 1)->endOfMonth() : now();
        $endDate = (clone $baseDate)->addDays($days);

        $query = Abonnement::with(['client:id,nom', 'employee:id,nom'])
            ->whereBetween('dateFin', [$baseDate->format('Y-m-d'), $endDate->format('Y-m-d')]);

        if ($user->role === 'employee') {
            $query->whereHas('client', function ($q) use ($user) {
                $q->where('employee_id', $user->id);
            });
        }

        return [
            'total_count' => (clone $query)->count(),
            'liste' => $query->orderBy('dateFin')->get()->map(function ($sub) use ($baseDate) {
                $daysLeft = (int) $baseDate->diffInDays(Carbon::parse($sub->dateFin), false);
                return [
                    'id' => $sub->id,
                    'client' => $sub->client->nom ?? 'N/A',
                    'prix' => $sub->prix,
                    'date_fin' => $sub->dateFin,
                    'jours_restants' => $daysLeft,
                    'urgence' => $daysLeft < 3 ? 'high' : 'medium'
                ];
            })
        ];
    }

    private function getClientsTableData($user, int $year, int $month): array
    {
        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = Carbon::create($year, $month, 1)->endOfMonth();

        $query = Client::select('clients.*')
            ->withCount(['abonnements as abonnements_actifs' => fn($q) => $q->active()])
            ->addSelect([
                'revenu_net' => Transaction::selectRaw('IFNULL(SUM(CASE WHEN type_paiement = ? THEN montant ELSE -montant END), 0)', [Transaction::TYPE_PAIEMENT])
                    ->whereColumn('client_id', 'clients.id')
                    ->whereBetween('date_paiement', [$start, $end])
            ]);

        if ($user->role === 'employee') {
            $query->where('employee_id', $user->id);
        }

        $clients = $query->orderByDesc('revenu_net')->take(50)->get();

        return $clients->map(function ($client) {
            return [
                'id' => $client->id,
                'nom' => $client->nom,
                'email' => $client->email,
                'telephone' => $client->telephone,
                'abonnements_actifs' => $client->abonnements_actifs,
                'revenu_total' => max(0, (float) ($client->revenu_net ?? 0)),
                'created_at' => $client->created_at->format('Y-m-d'),
            ];
        })->toArray();
    }

    public function exportExcel(Request $request)
    {
        $user = Auth::user();
        $year = $request->input('year', now()->year);
        $month = $request->input('month', now()->month);

        $financials = $this->getMetriquesFinancieres($year, $month, $user);
        $graphData = $this->getDonneesGraphiques($user, $year, $month);

        $clientsData = $this->getAnalyseClients($user);

        $spreadsheet = new Spreadsheet();

        $spreadsheet->getProperties()
            ->setCreator(config('app.name'))
            ->setTitle("Rapport Financier - " . ($user->role === 'admin' ? 'Global' : $user->nom))
            ->setSubject("Rapport de performance")
            ->setCategory("Rapport");

        $sheet1 = $spreadsheet->getActiveSheet();
        $sheet1->setTitle('Résumé');

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['argb' => Color::COLOR_WHITE]],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF0070C0']],
            'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN]]
        ];

        $sheet1->setCellValue('A1', 'Indicateur');
        $sheet1->setCellValue('B1', 'Valeur');
        $sheet1->getStyle('A1:B1')->applyFromArray($headerStyle);

        $sheet1->setCellValue('A2', 'Revenu Total Global');
        $sheet1->setCellValue('B2', $financials['total_global']);

        $sheet1->setCellValue('A3', 'Revenu Annuel (' . $year . ')');
        $sheet1->setCellValue('B3', $financials['annuel']);

        $sheet1->setCellValue('A4', 'Revenu Mensuel (' . $month . '/' . $year . ')');
        $sheet1->setCellValue('B4', $financials['mensuel']['montant']);

        $sheet1->setCellValue('A5', 'Total Clients');
        $sheet1->setCellValue('B5', $clientsData['total']);

        $sheet1->setCellValue('A6', 'Clients Actifs');
        $sheet1->setCellValue('B6', $clientsData['actifs']);

        $sheet1->getStyle('B2:B4')->getNumberFormat()->setFormatCode('#,##0.00 "DH"');
        $sheet1->getColumnDimension('A')->setAutoSize(true);
        $sheet1->getColumnDimension('B')->setAutoSize(true);

        $sheet2 = $spreadsheet->createSheet();
        $sheet2->setTitle('Revenus Historique');

        $sheet2->setCellValue('A1', 'Mois');
        $sheet2->setCellValue('B1', 'Revenu (DH)');
        $sheet2->getStyle('A1:B1')->applyFromArray($headerStyle);

        $row = 2;
        $mensuelData = $graphData['revenus_historique']['mensuel'];
        foreach ($mensuelData as $data) {
            $sheet2->setCellValue('A' . $row, $data['label']);
            $sheet2->setCellValue('B' . $row, $data['total']);
            $row++;
        }
        $sheet2->getStyle('B2:B' . ($row - 1))->getNumberFormat()->setFormatCode('#,##0.00 "DH"');
        $sheet2->getColumnDimension('A')->setAutoSize(true);
        $sheet2->getColumnDimension('B')->setAutoSize(true);

        if (count($mensuelData) > 0) {
            $dataSeriesLabels = [new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, "'Revenus Historique'!\$B\$1", null, 1)];
            $xAxisTickValues = [new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, "'Revenus Historique'!\$A\$2:\$A\$" . ($row - 1), null, count($mensuelData))];
            $dataSeriesValues = [new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, "'Revenus Historique'!\$B\$2:\$B\$" . ($row - 1), null, count($mensuelData))];

            $series = new DataSeries(
                DataSeries::TYPE_LINECHART,
                DataSeries::GROUPING_STANDARD,
                range(0, count($dataSeriesValues) - 1),
                $dataSeriesLabels,
                $xAxisTickValues,
                $dataSeriesValues
            );

            $plotArea = new PlotArea(null, [$series]);
            $title = new Title('Évolution des Revenus Mensuels');
            $chart = new Chart('chart_revenus', $title, new Legend(Legend::POSITION_TOPRIGHT, null, false), $plotArea);

            $chart->setTopLeftPosition('D2');
            $chart->setBottomRightPosition('M20');
            $sheet2->addChart($chart);
        }

        if ($user->role === 'admin') {
            $sheet3 = $spreadsheet->createSheet();
            $sheet3->setTitle('Performance Équipe');

            $headers = ['Nom', 'Email', 'Clients', 'Abonnements Actifs', 'Revenu Mensuel', 'Taux de Conversion (%)'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet3->setCellValue($col . '1', $header);
                $col++;
            }
            $sheet3->getStyle('A1:F1')->applyFromArray($headerStyle);

            $equipeData = $this->getPerformancesEmployes($year, $month);
            $row = 2;
            foreach ($equipeData as $emp) {
                $sheet3->setCellValue('A' . $row, $emp['nom']);
                $sheet3->setCellValue('B' . $row, $emp['email']);
                $sheet3->setCellValue('C' . $row, $emp['clients_count']);
                $sheet3->setCellValue('D' . $row, $emp['active_subs']);
                $sheet3->setCellValue('E' . $row, $emp['revenu_mensuel']);
                $sheet3->setCellValue('F' . $row, $emp['taux_conversion']);
                $row++;
            }
            $sheet3->getStyle('E2:E' . ($row - 1))->getNumberFormat()->setFormatCode('#,##0.00 "DH"');

            foreach (range('A', 'F') as $columnID) {
                $sheet3->getColumnDimension($columnID)->setAutoSize(true);
            }
        }

        $spreadsheet->setActiveSheetIndex(0);
        $writer = new Xlsx($spreadsheet);
        $writer->setIncludeCharts(true);

        $fileName = 'Rapport_Performance_' . date('Y-m-d') . '.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'excel');
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ])->deleteFileAfterSend(true);
    }
}