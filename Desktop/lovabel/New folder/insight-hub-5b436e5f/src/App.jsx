import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// الصفحات
import Login from "./pages/Login";
import Register from "./pages/Register";

import DashboardHome from "./pages/Dashboard";
import Employees from "./pages/Employees";
import CreateEmployee from "./pages/CreateEmployee";
import EditEmployee from "./pages/EditEmployee";
import CreateClient from "./pages/CreateClient";
import Clients from "./pages/Clients";
import Subscriptions from "./pages/Subscriptions";
import ProtectedRoute from "./pages/ProtectedRoute";
import DashboardLayout from "./pages/DashboardLayout";
import ClientDetails from "./pages/ClientDetails";
import SubscriptionDetails from "./pages/SubscriptionDetails";

function App() {
  return (
    <Router>
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
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/create" element={<CreateClient />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/clients/:id" element={<ClientDetails />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetails />} />
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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
