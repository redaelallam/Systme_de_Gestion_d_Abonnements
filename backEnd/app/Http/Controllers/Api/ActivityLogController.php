<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        $logs = Activity::with(['causer', 'subject'])->latest()->paginate(15);

        $formattedLogs = $logs->map(function ($log) {
            return [
                'id' => $log->id,
                'action' => $log->event,
                'description' => $log->description,
                'causer' => $log->causer ? $log->causer->nom : 'Système',
                'causer_role' => $log->causer ? $log->causer->role : '',
                'subject_type' => class_basename($log->subject_type),
                'subject_id' => $log->subject_id,
                'properties' => $log->properties,
                'date' => $log->created_at->format('Y-m-d H:i:s'),
                'time_ago' => $log->created_at->diffForHumans()
            ];
        });

        return response()->json([
            'status' => true,
            'data' => $formattedLogs,
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total()
            ]
        ]);
    }
    public function show($id)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['status' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        $log = Activity::with(['causer', 'subject'])->find($id);

        if (!$log) {
            return response()->json(['status' => false, 'message' => 'Log non trouvé.'], 404);
        }

        $formattedLog = [
            'id' => $log->id,
            'action' => $log->event,
            'description' => $log->description,
            'causer' => $log->causer ? $log->causer->nom : 'Système',
            'causer_email' => $log->causer ? $log->causer->email : 'N/A',
            'causer_role' => $log->causer ? $log->causer->role : 'N/A',
            'subject_type' => class_basename($log->subject_type),
            'subject_id' => $log->subject_id,
            'properties' => $log->properties,
            'date' => $log->created_at->format('d/m/Y'),
            'time' => $log->created_at->format('H:i:s'),
            'time_ago' => $log->created_at->diffForHumans()
        ];

        return response()->json([
            'status' => true,
            'data' => $formattedLog
        ]);
    }
}