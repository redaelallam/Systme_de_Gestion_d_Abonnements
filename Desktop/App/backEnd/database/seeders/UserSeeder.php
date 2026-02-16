<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Faker\Factory as Faker;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('fr_FR');

        // Admin
        User::firstOrCreate(['email' => 'admin@app.com'], [
            'nom' => 'System Admin',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'created_at' => '2019-01-01 10:00:00'
        ]);

        $firstNames = ['reda', 'Youssef', 'Amine', 'Mehdi', 'Karim', 'Omar', 'Fatima', 'Khadija', 'Salma', 'Imane', 'Sara', 'Hamza', 'Layla', 'Nabil', 'Siham'];
        $lastNames = ['El allam', 'Bennani', 'Tazi', 'Bennis', 'Lahlou', 'Chraibi', 'El Fassi', 'Benjelloun', 'Idrissi', 'Alami', 'Mansouri'];

        for ($i = 0; $i < 12; $i++) {
            $nom = $faker->randomElement($firstNames) . ' ' . $faker->randomElement($lastNames);
            User::create([
                'nom' => $nom,
                'email' => strtolower(str_replace(' ', '.', $nom)) . rand(10, 99) . '@app.com',
                'password' => Hash::make('password123'),
                'role' => 'employee',
                'created_at' => $faker->dateTimeBetween('2019-01-01', 'now'),
            ]);
        }
    }
}