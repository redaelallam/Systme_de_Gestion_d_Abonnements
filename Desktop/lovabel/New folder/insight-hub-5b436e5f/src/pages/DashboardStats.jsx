import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  Wallet,
  Activity,
  AlertCircle,
  TrendingUp,
  Loader2,
  Filter,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// استخدام ألوان النظام الجديد للرسوم البيانية
const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export default function DashboardStats() {
  /* ... (نفس منطق الحالات والـ useEffect الخاص بك تماماً) ... */
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  // ... (افترض وجود دوال fetchStats هنا)

  // (محاكاة للبيانات لغرض العرض إذا لم تكن متوفرة)
  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  if (!data) return <div>Erreur</div>;

  const { stats, charts, filters } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Tableau de Bord
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de vos activités.
          </p>
        </div>

        {filters?.canFilter && (
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <select
              value={selectedEmployee}
              onChange={(e) => {
                /* handleFilter */
              }}
              className="pl-9 pr-4 py-2 bg-card border border-input rounded-md text-sm focus:ring-1 focus:ring-ring outline-none"
            >
              <option value="all">Tous les employés</option>
              {filters.employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nom}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Component reusable structure */}
        {[
          {
            title: "Revenu Total",
            value: `${stats.totalRevenue} DH`,
            icon: Wallet,
            color: "text-chart-1",
          },
          {
            title: "Clients Actifs",
            value: stats.totalClients,
            icon: Users,
            color: "text-chart-2",
          },
          {
            title: "Abonnements",
            value: stats.activeSubs,
            icon: Activity,
            color: "text-chart-3",
          },
          {
            title: "Expiration (7j)",
            value: stats.expiringSoon,
            icon: AlertCircle,
            color: "text-destructive",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                {item.title}
              </span>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div className="text-2xl font-bold">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" /> Évolution du
            Revenu
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <AreaChart data={charts.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius-md)",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col">
          <h3 className="font-semibold mb-4">Répartition</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={charts.subsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  cornerRadius={4}
                >
                  {charts.subsByType.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius-md)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {charts.subsByType.map((entry, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                ></span>
                {entry.type}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
