import { useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
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

// Demo data matching the exact backend response structure
const DEMO_RESPONSE = {
  status: true,
  role: "admin",
  user_name: null,
  data: {
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
        { id: 1, name: "Sarah Johnson", revenue: 124500, link: "#" },
        { id: 2, name: "Mike Chen", revenue: 98200, link: "#" },
        { id: 3, name: "Emily Davis", revenue: 87600, link: "#" },
        { id: 4, name: null, revenue: 76300, link: "#" },
        { id: 5, name: "Alex Rivera", revenue: 65800, link: "#" },
      ],
      clients: [
        { id: 1, name: "Acme Corp", revenue: 245000, link: "#" },
        { id: 2, name: "TechStart Inc", revenue: 189000, link: "#" },
        { id: 3, name: "Global Solutions", revenue: 156000, link: "#" },
        { id: 4, name: "DataFlow Ltd", revenue: 134000, link: "#" },
        { id: 5, name: "CloudNine Systems", revenue: 98000, link: "#" },
      ],
    },
    expiring_subscriptions: [
      {
        id: 1,
        client_name: "Acme Corp",
        end_date: "2026-03-01",
        amount: "$12,000",
        link: "#",
      },
      {
        id: 2,
        client_name: "TechStart Inc",
        end_date: "2026-02-20",
        amount: "$8,500",
        link: "#",
      },
      {
        id: 3,
        client_name: "Global Solutions",
        end_date: "2026-04-15",
        amount: "$15,200",
        link: "#",
      },
      {
        id: 4,
        client_name: "DataFlow Ltd",
        end_date: "2026-02-28",
        amount: "$6,800",
        link: "#",
      },
    ],
  },
};

const Dashboard = ({ response }) => {
  const safeResponse = response ?? DEMO_RESPONSE;
  const role = safeResponse?.role;
  const data = safeResponse?.data;
  const userName = safeResponse?.user_name;
  const isAdmin = role === "admin";

  const kpi = data?.kpi;
  const monthlyTrend = data?.monthly_trend;
  const categoryDistribution = data?.category_distribution;
  const employees = data?.top_lists?.employees;
  const clients = data?.top_lists?.clients;
  const expiringSubs = data?.expiring_subscriptions;

  return (
    <DashboardLayout userName={userName}>
      <div className="space-y-8">
        {/* KPI Section */}
        <KpiSection kpi={kpi} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <MonthlyTrendChart data={monthlyTrend} />
          <CategoryDistributionChart data={categoryDistribution} />
        </div>

        {/* Tables Section */}
        <div className="space-y-6">
          {isAdmin && <EmployeesTable data={employees} />}
          <ClientsTable data={clients} />
          <ExpiringSubscriptionsTable data={expiringSubs} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
