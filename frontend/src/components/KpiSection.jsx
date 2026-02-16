import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

const TrendBadge = ({ value }) => {
  if (value == null) return null;
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        isPositive
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      <Icon size={12} />
      {isPositive ? "+" : ""}
      {value}%
    </span>
  );
};

const KpiCard = ({ icon, title, value, trend, index }) => {
  const IconComponent = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="kpi-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
          <IconComponent className="h-5 w-5 text-accent-foreground" />
        </div>
        {trend != null && <TrendBadge value={trend} />}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-bold text-card-foreground tracking-tight">
        {value}
      </p>
    </motion.div>
  );
};

// تعديل العملة إلى DH
const formatCurrency = (val) => {
  if (val == null) return "—";
  return `${Number(val).toLocaleString()} DH`;
};

const KpiSection = ({ resumeFinancier, clientsAnalytics }) => {
  const { t } = useTranslation();

  const cards = useMemo(() => {
    const list = [];

    if (resumeFinancier) {
      list.push({
        icon: DollarSign,
        title: t("dashboard.monthlyRevenue"),
        value: formatCurrency(resumeFinancier.mensuel?.montant),
        trend: resumeFinancier.mensuel?.croissance_pourcentage,
      });
      list.push({
        icon: BarChart3,
        title: t("dashboard.annualRevenue"),
        value: formatCurrency(resumeFinancier.annuel),
        trend: null,
      });
      list.push({
        icon: TrendingUp,
        title: t("dashboard.totalRevenue"),
        value: formatCurrency(resumeFinancier.total_global),
        trend: null,
      });
    }

    if (clientsAnalytics) {
      list.push({
        icon: Users,
        title: t("dashboard.activeCustomers"),
        value: `${clientsAnalytics.actifs ?? 0} / ${clientsAnalytics.total ?? 0}`,
        trend: null,
      });
    }

    return list;
  }, [resumeFinancier, clientsAnalytics, t]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <KpiCard key={card.title} {...card} index={i} />
      ))}
    </div>
  );
};

export default KpiSection;
