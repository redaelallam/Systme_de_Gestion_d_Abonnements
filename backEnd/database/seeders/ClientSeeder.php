<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Client;
use App\Models\User;
use Faker\Factory as Faker;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('fr_FR');
        $employees = User::where('role', 'employee')->pluck('id')->toArray();

        if (empty($employees))
            return;

        $firstNames = ['Reda', 'Yassine', 'Rachid', 'Hassan', 'Soufiane', 'Ayoub', 'Mohamed', 'Ilyas', 'Anass', 'Zineb', 'Meriem', 'Najat', 'Sanaa', 'Hajar', 'Wissal', 'Mustapha', 'Brahim', 'Laila', 'Samira', 'Zakaria', 'Souad'];
        $lastNames = ['El allam', 'El Amrani', 'Filali', 'Zouhairi', 'Mansouri', 'Tahiri', 'Guessous', 'Berrada', 'Kabbaj', 'Ouazzani', 'El Moutawakil', 'Raji', 'Slaoui', 'Tazi', 'Haddad'];
        $cities = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Safi', 'Mohammédia', 'El Jadida'];

        for ($i = 0; $i < 300; $i++) {
            $nom = $faker->randomElement($firstNames) . ' ' . $faker->randomElement($lastNames);
            $prefixes = ['06', '07', '05'];
            $phone = $faker->randomElement($prefixes) . $faker->numerify('########');

            $address = $faker->buildingNumber() . ' Rue ' . $faker->lastName() . ', ' . $faker->randomElement($cities);

            $createdAt = $faker->dateTimeBetween('-2 years', 'now');

            Client::create([
                'nom' => $nom,
                'email' => strtolower(str_replace(' ', '.', $nom)) . rand(1, 9999) . '@gmail.com',
                'telephone' => $phone,
                'adresse' => $address,
                'employee_id' => $employees[array_rand($employees)],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }
    }
}