<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\AbonnementController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TrashController;
use App\Http\Middleware\IsAdmin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('clients', ClientController::class);
    Route::apiResource('abonnements', AbonnementController::class);
    Route::post('/abonnements/{id}/renew', [AbonnementController::class, 'renew']);
    Route::middleware(IsAdmin::class)->group(function () {
        Route::apiResource('employees', EmployeeController::class);
    });

    Route::prefix('dashboard')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard.index');
        Route::get('/expiring-subscriptions', [DashboardController::class, 'expiringSubscriptions'])->name('dashboard.expiring-subscriptions');
        Route::get('/employee/{employeeId}/revenue', [DashboardController::class, 'employeeRevenue'])->name('dashboard.employee.revenue');
    });
    Route::get('/abonnements/{id}/receipt', [App\Http\Controllers\Api\AbonnementController::class, 'downloadReceipt']);
    Route::put('/abonnements/{id}/cancel', [AbonnementController::class, 'cancel']);
    Route::get('/dashboard/export', [DashboardController::class, 'exportExcel']);
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::get('/activity-logs/{id}', [ActivityLogController::class, 'show']);
    Route::get('/trash/{type}', [TrashController::class, 'index']);
    Route::post('/trash/{type}/{id}/restore', [TrashController::class, 'restore']);
    Route::delete('/trash/{type}/{id}/force', [TrashController::class, 'forceDelete']);
});