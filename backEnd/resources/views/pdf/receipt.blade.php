<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu de Paiement</title>
    <style>
        body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; color: #333; font-size: 14px; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { color: #2563eb; margin: 0; }
        .details { width: 100%; margin-bottom: 20px; }
        .details td { padding: 5px; vertical-align: top; }
        .details .client-info { text-align: right; }
        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .table th, .table td { padding: 12px; border: 1px solid #ddd; text-align: left; }
        .table th { background-color: #f8fafc; color: #333; font-weight: bold; }
        .total { font-size: 18px; font-weight: bold; color: #16a34a; text-align: right; margin-top: 20px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="invoice-box">
        <div class="header">
            <h1>REÇU DE PAIEMENT</h1>
            <p>N° {{ $numero_recu }}</p>
        </div>

        <table class="details">
            <tr>
                <td>
                    <strong>Émis par :</strong><br>
                    Nom de Votre Entreprise<br>
                    Agent : {{ $employee->nom ?? 'Admin' }}<br>
                    Date : {{ $date }}
                </td>
                <td class="client-info">
                    <strong>Client :</strong><br>
                    {{ $client->nom }}<br>
                    {{ $client->email }}<br>
                    {{ $client->telephone }}
                </td>
            </tr>
        </table>

        <table class="table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Période</th>
                    <th>Montant Payé</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Abonnement {{ $abonnement->type }}</td>
                    <td>Du {{ \Carbon\Carbon::parse($abonnement->dateDebut)->format('d/m/Y') }} <br>Au {{ \Carbon\Carbon::parse($abonnement->dateFin)->format('d/m/Y') }}</td>
                    <td>{{ number_format($transaction->montant, 2) }} DH</td>
                </tr>
            </tbody>
        </table>

        <div class="total">
            Total Payé : {{ number_format($transaction->montant, 2) }} DH
        </div>

        <div class="footer">
            Merci pour votre confiance !<br>
            Ceci est un reçu généré électroniquement et ne nécessite pas de signature.
        </div>
    </div>
</body>
</html>