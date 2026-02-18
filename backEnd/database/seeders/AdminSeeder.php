<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run()
    {
        if (!User::where('email', 'admin@app.com')->exists()) {
            User::create([
                'nom' => 'Super Admin',
                'email' => 'admin@app.com',
                'password' => Hash::make('password123'),
                'role' => 'admin'
            ]);
        }
    }
}