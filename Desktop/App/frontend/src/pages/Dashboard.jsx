import React, { useEffect, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { fetchDashboardData } from "../features/dashboard/dashboardSlice";
import KpiSection from "../components/KpiSection";
import {
  MonthlyTrendChart,
  CategoryDistributionChart,
} from "../components/ChartCard";
import {
  EmployeesTable,
  ClientsTable,
  ExpiringSubscriptionsTable,
} from "../components/DataTable";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const DEMO_DATA = {
  kpi: {
    total_revenue: "$1,248,560",
    yearly_revenue: "$348,200",
    total_active: 1842,
  },
  monthly_trend: [
    { name: "Jan", value: 42000 },
    { name: "Feb", value: 38000 },
    { name: "Mar", value: 51000 },
    { name: "Apr", value: 47000 },
    { name: "May", value: 53000 },
    { name: "Jun", value: 59000 },
    { name: "Jul", value: 62000 },
    { name: "Aug", value: 55000 },
    { name: "Sep", value: 67000 },
    { name: "Oct", value: 72000 },
    { name: "Nov", value: 68000 },
    { name: "Dec", value: 74000 },
  ],
  category_distribution: [
    { name: "Enterprise", value: 45 },
    { name: "Pro", value: 30 },
    { name: "Starter", value: 15 },
    { name: "Free", value: 10 },
  ],
  top_lists: {
    employees: [
      { id: 1, name: "Sarah Johnson", revenue: 124500 },
      { id: 2, name: "Mike Chen", revenue: 98200 },
      { id: 3, name: "Emily Davis", revenue: 87600 },
    ],
    clients: [
      { id: 1, name: "Acme Corp", revenue: 245000 },
      { id: 2, name: "TechStart Inc", revenue: 189000 },
      { id: 3, name: "Global Solutions", revenue: 156000 },
    ],
  },
  expiring_subscriptions: [
    {
      id: 1,
      client_name: "Acme Corp",
      end_date: "2026-03-01",
      amount: "$12,000",
    },
    {
      id: 2,
      client_name: "TechStart Inc",
      end_date: "2026-02-20",
      amount: "$8,500",
    },
  ],
};

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { data, role, loading } = useAppSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const dashData = data || DEMO_DATA;
  const isAdmin = role === "admin";

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Tableau de Bord
        </h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de vos activités.
        </p>
      </div>

      <KpiSection kpi={dashData.kpi} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MonthlyTrendChart data={dashData.monthly_trend} />
        <CategoryDistributionChart data={dashData.category_distribution} />
      </div>

      <div className="space-y-6">
        {isAdmin && <EmployeesTable data={dashData.top_lists?.employees} />}
        <ClientsTable data={dashData.top_lists?.clients} />
        <ExpiringSubscriptionsTable data={dashData.expiring_subscriptions} />
      </div>
    </div>
  );
};

export default Dashboard;
