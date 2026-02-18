<?php

namespace Tests\Feature;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Client;
use App\Models\Abonnement;
class SubscriptionFlowTest extends TestCase
{
    use RefreshDatabase;
    /**
     * A basic feature test example.
     */
    // tests/Feature/SubscriptionFlowTest.php
    public function test_creating_subscription_generates_transaction()
    {
        $user = User::factory()->create(['role' => 'employee']);
        $client = Client::factory()->create(['employee_id' => $user->id]);

        $response = $this->actingAs($user)->postJson('/api/abonnements', [
            'client_id' => $client->id,
            'type' => 'Mensuel',
            'prix' => 300,
            'dateDebut' => now()->format('Y-m-d'),
            'dateFin' => now()->addMonth()->format('Y-m-d'),
            'statut' => 'Active'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('abonnements', ['client_id' => $client->id]);
        $this->assertDatabaseHas('transactions', [
            'client_id' => $client->id,
            'montant' => 300,
            'type_paiement' => 'paiement'
        ]);
    }
    public function test_employee_cannot_access_admin_routes()
    {
        $employee = User::factory()->create(['role' => 'employee']);

        $response = $this->actingAs($employee)->getJson('/api/employees');

        $response->assertStatus(403);
    }
    public function test_deleting_subscription_creates_refund_transaction()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $sub = Abonnement::factory()->create(['prix' => 500]);
        Transaction::create([
            'abonnement_id' => $sub->id,
            'client_id' => $sub->client_id,
            'montant' => 500,
            'type_paiement' => 'paiement',
            'date_paiement' => now()
        ]);

        $response = $this->actingAs($admin)->deleteJson("/api/abonnements/{$sub->id}");

        $response->assertStatus(200);
        $this->assertDatabaseHas('transactions', [
            'abonnement_id' => $sub->id,
            'type_paiement' => 'remboursement',
            'montant' => 500
        ]);
    }
    public function test_expired_subscriptions_command_updates_status()
    {
        $expiredSub = Abonnement::factory()->create([
            'dateFin' => now()->subDay(),
            'statut' => 'Active'
        ]);

        $this->artisan('subscriptions:update-expired')
            ->assertExitCode(0);

        $this->assertEquals('Expiré', $expiredSub->fresh()->statut);
    }
}
