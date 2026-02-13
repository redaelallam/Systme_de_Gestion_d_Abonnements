import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      {label && <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold text-popover-foreground">
          {entry.name}: {entry.value?.toLocaleString?.() ?? entry.value}
        </p>
      ))}
    </div>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
    <h3 className="mb-4 text-base font-semibold text-card-foreground">{title}</h3>
    {children}
  </div>
);

export const MonthlyTrendChart = ({ data }) => {
  const safeData = useMemo(() => data ?? [], [data]);

  return (
    <ChartCard title="Monthly Trend">
      <div style={{ width: "100%", height: 288 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={safeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
            <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS[0] }} activeDot={{ r: 6 }} name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export const CategoryDistributionChart = ({ data }) => {
  const safeData = useMemo(() => data ?? [], [data]);

  return (
    <ChartCard title="Category Distribution">
      <div style={{ width: "100%", height: 288 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={safeData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
            >
              {safeData.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};
