<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // Fonction de Connexion (Login)
    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Erreur de validation.',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::where('email', $request->email)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Email ou mot de passe incorrect.',
                ], 401);
            }
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'status' => true,
                'message' => 'Connexion réussie.',
                'data' => [
                    'user' => $user,
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'role' => $user->role,
                ]
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Login Error: " . $th->getMessage());

            return response()->json([
                'status' => false,
                'message' => 'Une erreur interne est survenue. Veuillez réessayer plus tard.',
            ], 500);
        }
    }
    // Fonction d'Inscription (Register)
    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|confirmed|min:6',
                'role' => 'required|in:admin,employee'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Erreur de validation.',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::create([
                'nom' => $request->nom,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'status' => true,
                'message' => 'Utilisateur créé avec succès.',
                'data' => [
                    'user' => $user,
                    'access_token' => $token,
                ]
            ], 201);

        } catch (\Throwable $th) {
            Log::error("Register Error: " . $th->getMessage());

            return response()->json([
                'status' => false,
                'message' => 'Une erreur est survenue lors de l\'inscription.',
            ], 500);
        }
    }
    // Fonction de Déconnexion (Logout)
    public function logout(Request $request)
    {
        try {
            if ($request->user()) {
                $request->user()->currentAccessToken()->delete();
            }

            return response()->json([
                'status' => true,
                'message' => 'Déconnexion réussie.'
            ], 200);

        } catch (\Throwable $th) {
            Log::error("Logout Error: " . $th->getMessage());

            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la déconnexion.',
            ], 500);
        }
    }
}