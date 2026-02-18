<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('employee_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('abonnement_id')->nullable()->constrained('abonnements')->onDelete('set null');

            $table->decimal('montant', 10, 2);
            $table->string('type_paiement');
            $table->date('date_paiement');
            $table->text('description')->nullable();

            $table->timestamps();

            $table->softDeletes();

            $table->index('date_paiement');
            $table->index('client_id');
            $table->index('employee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};