import { useMemo } from "react";
import { DollarSign, TrendingUp, Users } from "lucide-react";

const KpiCard = ({ icon, title, value }) => {
  const IconComponent = icon;
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <IconComponent className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-2xl font-bold text-card-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
};

const KpiSection = ({ kpi }) => {
  const cards = useMemo(() => {
    if (!kpi) return [];
    return [
      { icon: DollarSign, title: "Total Revenue", value: kpi.total_revenue ?? "—" },
      { icon: TrendingUp, title: "Yearly Revenue", value: kpi.yearly_revenue ?? "—" },
      { icon: Users, title: "Total Active", value: kpi.total_active?.toLocaleString?.() ?? "—" },
    ];
  }, [kpi]);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <KpiCard key={card.title} icon={card.icon} title={card.title} value={card.value} />
      ))}
    </div>
  );
};

export default KpiSection;
