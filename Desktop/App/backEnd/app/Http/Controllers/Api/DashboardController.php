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

        $response = [
            'role' => $user->role,
            'resume_financier' => $financials,
            'graphiques' => $this->getDonneesGraphiques($user),
            'clients_analytics' => $this->getAnalyseClients($user),
            'abonnements_expirant' => $this->getApercuAbonnementsExpirant(30, $user),
            'clients_table' => $this->getClientsTableData($user),
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

    private function getMetriquesFinancieres(int $year, int $month, $user): array
    {
        $query = Transaction::query();
        if ($user->role === 'employee') {
            $query->where('employee_id', $user->id);
        }

        $revenuCeMois = (clone $query)->revenue()->forMonth($year, $month)->sum('montant');

        $lastMonthDate = Carbon::create($year, $month, 1)->subMonth();
        $revenuMoisDernier = (clone $query)->revenue()
            ->forMonth($lastMonthDate->year, $lastMonthDate->month)
            ->sum('montant');

        $croissance = 0;
        if ($revenuMoisDernier > 0) {
            $croissance = (($revenuCeMois - $revenuMoisDernier) / $revenuMoisDernier) * 100;
        } elseif ($revenuCeMois > 0) {
            $croissance = 100;
        }

        $annuel = (clone $query)->revenue()->forYear($year)->sum('montant');
        $total = (clone $query)->revenue()->sum('montant');

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

    private function getDonneesGraphiques($user): array
    {
        $monthlyQuery = Transaction::revenue()
            ->select(DB::raw('YEAR(date_paiement) as annee, MONTH(date_paiement) as mois, SUM(montant) as total'))
            ->groupBy('annee', 'mois');

        $yearlyQuery = Transaction::revenue()
            ->select(DB::raw('YEAR(date_paiement) as annee, SUM(montant) as total'))
            ->groupBy('annee');

        if ($user->role === 'employee') {
            $monthlyQuery->where('employee_id', $user->id);
            $yearlyQuery->where('employee_id', $user->id);
        }

        $firstTransaction = Transaction::revenue()
            ->when($user->role === 'employee', fn($q) => $q->where('employee_id', $user->id))
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
            ->when($user->role === 'employee', function ($q) use ($user) {
                $q->whereHas('client', function ($clientQuery) use ($user) {
                    $clientQuery->where('employee_id', $user->id);
                });
            })
            ->where('statut', 'Active')
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
        $employes = User::where('role', 'employee')
            ->withCount('clients as total_clients')
            ->withCount(['abonnements as abonnements_actifs' => fn($q) => $q->active()])
            ->withSum(['transactions as revenu_total' => fn($q) => $q->revenue()], 'montant')
            ->withSum(['transactions as revenu_annuel' => fn($q) => $q->revenue()->forYear($year)], 'montant')
            ->withSum(['transactions as revenu_mensuel' => fn($q) => $q->revenue()->forMonth($year, $month)], 'montant')
            ->get();

        $classement = $employes->map(function ($emp) {
            return [
                'id' => $emp->id,
                'nom' => $emp->nom,
                'email' => $emp->email,
                'clients_count' => $emp->total_clients,
                'active_subs' => $emp->abonnements_actifs,
                'revenu_mensuel' => (float) ($emp->revenu_mensuel ?? 0),
                'revenu_annuel' => (float) ($emp->revenu_annuel ?? 0),
                'revenu_total' => (float) ($emp->revenu_total ?? 0),
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
        $actifs = (clone $query)->whereHas('abonnements', fn($q) => $q->active())->count();

        return [
            'total' => $total,
            'actifs' => $actifs,
            'inactifs' => $total - $actifs,
            'taux_activite' => $total > 0 ? round(($actifs / $total) * 100, 1) : 0
        ];
    }

    private function getApercuAbonnementsExpirant(int $days, $user): array
    {
        $query = Abonnement::with(['client:id,nom', 'employee:id,nom'])->expiringSoon($days);
        if ($user->role === 'employee') {
            $query->whereHas('client', function ($q) use ($user) {
                $q->where('employee_id', $user->id);
            });
        }

        return [
            'total_count' => (clone $query)->count(),
            'liste' => $query->orderBy('dateFin')->get()->map(function ($sub) {
                $daysLeft = (int) now()->diffInDays(Carbon::parse($sub->dateFin), false);
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

    private function getClientsTableData($user): array
    {
        $query = Client::query()
            ->withCount(['abonnements as abonnements_actifs' => fn($q) => $q->active()])
            ->withSum('abonnements as revenu_total', 'prix');

        if ($user->role === 'employee') {
            $query->where('employee_id', $user->id);
        }

        $clients = $query->orderBy('revenu_total', 'desc')->take(50)->get();

        return $clients->map(function ($client) {
            return [
                'id' => $client->id,
                'nom' => $client->nom,
                'email' => $client->email,
                'telephone' => $client->telephone,
                'abonnements_actifs' => $client->abonnements_actifs,
                'revenu_total' => (float) ($client->revenu_total ?? 0),
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
        $graphData = $this->getDonneesGraphiques($user);
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