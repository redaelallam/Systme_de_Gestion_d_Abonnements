<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@app.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Employee User',
            'email' => 'employee@app.com',
            'password' => Hash::make('password123'),
            'role' => 'employee',
        ]);


        User::create([
            'name' => 'Client User',
            'email' => 'client@app.com',
            'password' => Hash::make('password123'),
            'role' => 'client',
        ]);
    }
}