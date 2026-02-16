import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Loader2 } from "lucide-react";

import ProtectedRoute from "./pages/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import ActivityLogs from "./pages/ActivityLogs";
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Employees = lazy(() => import("./pages/Employees"));
const CreateEmployee = lazy(() => import("./pages/CreateEmployee"));
const EditEmployee = lazy(() => import("./pages/EditEmployee"));
const EmployeeDetails = lazy(() => import("./pages/EmployeeDetails"));
const Clients = lazy(() => import("./pages/Clients"));
const CreateClient = lazy(() => import("./pages/CreateClient"));
const ClientDetails = lazy(() => import("./pages/ClientDetails"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const SubscriptionDetails = lazy(() => import("./pages/SubscriptionDetails"));
import ActivityLogDetails from "./pages/ActivityLogDetails";
import RecycleBin from "./pages/RecycleBin";
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/activity-logs" element={<ActivityLogs />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/create" element={<CreateClient />} />
            <Route path="/clients/:id" element={<ClientDetails />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="activity-logs/:id" element={<ActivityLogDetails />} />
            <Route path="recycle-bin" element={<RecycleBin />} />
            <Route
              path="/subscriptions/:id"
              element={<SubscriptionDetails />}
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/create"
              element={
                <ProtectedRoute adminOnly={true}>
                  <CreateEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/edit/:id"
              element={
                <ProtectedRoute adminOnly={true}>
                  <EditEmployee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/:id"
              element={
                <ProtectedRoute adminOnly={true}>
                  <EmployeeDetails />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
