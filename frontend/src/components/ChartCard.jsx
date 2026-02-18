import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Brush,
} from "recharts";
import { motion } from "framer-motion";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      {label && (
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold text-popover-foreground">
          {entry.name}: {Number(entry.value).toLocaleString()} DH
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length || !total) return null;
  const percent = ((payload[0].value / total) * 100).toFixed(1);

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-popover-foreground">
        {payload[0].name}: {payload[0].value} ({percent}%)
      </p>
    </div>
  );
};

const ChartCard = ({ title, action, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="chart-card"
  >
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
      <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
      {action && <div>{action}</div>}
    </div>
    {children}
  </motion.div>
);

export const RevenueTrendChart = ({ data }) => {
  const { t } = useTranslation();
  const [viewType, setViewType] = useState("mensuel");

  const dataset = useMemo(() => {
    if (!data) return [];
    return data[viewType] || [];
  }, [data, viewType]);

  const defaultStartIndex = Math.max(
    0,
    dataset.length > 12 ? dataset.length - 12 : 0,
  );

  return (
    <ChartCard
      title={t("dashboard.revenueTrend")}
      delay={0.2}
      action={
        <div className="flex bg-muted/50 rounded-md p-0.5 border border-border/50">
          <button
            onClick={() => setViewType("mensuel")}
            className={`px-3 py-1 text-xs font-semibold rounded-sm transition-all duration-200 ${
              viewType === "mensuel"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("common.monthly", "Mensuel")}
          </button>
          <button
            onClick={() => setViewType("annuel")}
            className={`px-3 py-1 text-xs font-semibold rounded-sm transition-all duration-200 ${
              viewType === "annuel"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("common.yearly", "Annuel")}
          </button>
        </div>
      }
    >
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={dataset}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-chart-1)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-chart-1)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              minTickGap={10}
            />
            <YAxis
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke={CHART_COLORS[0]}
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              name={t("dashboard.revenue")}
              activeDot={{ r: 6, fill: CHART_COLORS[0], strokeWidth: 0 }}
            />
            {dataset.length > 5 && (
              <Brush
                dataKey="label"
                height={30}
                stroke="var(--color-muted-foreground)"
                fill="var(--color-background)"
                startIndex={defaultStartIndex}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export const SubscriptionDistChart = ({ data }) => {
  const { t } = useTranslation();
  const safeData = useMemo(() => data ?? [], [data]);

  const total = useMemo(
    () => safeData.reduce((acc, curr) => acc + curr.value, 0),
    [safeData],
  );

  return (
    <ChartCard title={t("dashboard.subscriptionDist")} delay={0.3}>
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={safeData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
            >
              {safeData.map((_, index) => (
                <Cell
                  key={index}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip total={total} />} />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                color: "var(--color-muted-foreground)",
              }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export const MonthlyTrendChart = RevenueTrendChart;
export const CategoryDistributionChart = SubscriptionDistChart;
