import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { fetchDashboardData } from "../features/dashboard/dashboardSlice";
import KpiSection from "../components/KpiSection";
import {
  RevenueTrendChart,
  SubscriptionDistChart,
} from "../components/ChartCard";
import {
  EmployeeLeaderboard,
  ExpiringSubscriptionsTable,
  ClientsTable,
} from "../components/DataTable";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Trophy,
  Clock,
  Users,
  Download,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axiosConfig";

const Dashboard = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { data, role, loading } = useAppSelector((s) => s.dashboard);
  const [activeView, setActiveView] = useState("all");

  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const isAdmin = role === "admin";

  const viewOptions = useMemo(() => {
    const opts = [
      {
        value: "all",
        label: t("dashboard.viewAll", "Vue d'ensemble"),
        icon: LayoutDashboard,
      },
      {
        value: "charts",
        label: t("dashboard.viewCharts", "Graphiques"),
        icon: BarChart3,
      },
    ];

    if (isAdmin) {
      opts.push({
        value: "leaderboard",
        label: t("dashboard.viewLeaderboard", "Classement"),
        icon: Trophy,
      });
      opts.push({
        value: "clients",
        label: t("dashboard.topClients", "Meilleurs Clients"),
        icon: Users,
      });
    } else {
      opts.push({
        value: "clients",
        label: t("dashboard.myClients", "Mes Clients"),
        icon: Users,
      });
    }

    opts.push({
      value: "expiring",
      label: t("dashboard.viewExpiring", "Expirations"),
      icon: Clock,
    });
    return opts;
  }, [t, isAdmin]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Génération du rapport Excel en cours...");

    try {
      const response = await api.get("/dashboard/export", {
        responseType: "blob",
        params: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const fileName = `Rapport_Performance_${new Date().toISOString().slice(0, 10)}.xlsx`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Rapport téléchargé avec succès !", { id: toastId });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'exportation du rapport.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || !data) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {t("dashboard.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin
                ? t("dashboard.description")
                : t("dashboard.personalDashboard")}
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center gap-2 font-medium text-sm transition-all shadow-sm disabled:opacity-70"
          >
            {isExporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Exporter Excel
          </button>
        </div>

        <div className="w-full overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <div className="inline-flex items-center justify-start gap-1.5 rounded-lg bg-muted/50 p-1.5 min-w-max">
            {viewOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = activeView === opt.value;

              return (
                <button
                  key={opt.value}
                  onClick={() => setActiveView(opt.value)}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-primary" : ""} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <KpiSection
        resumeFinancier={data.resume_financier}
        clientsAnalytics={data.clients_analytics}
      />

      {(activeView === "all" || activeView === "charts") && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <RevenueTrendChart data={data.graphiques?.revenus_historique} />
          <SubscriptionDistChart
            data={data.graphiques?.repartition_abonnements}
          />
        </div>
      )}

      {(activeView === "all" || activeView === "leaderboard") && isAdmin && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EmployeeLeaderboard data={data.performance_equipe} />
        </div>
      )}

      {(activeView === "all" || activeView === "clients") &&
        data.clients_table && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ClientsTable data={data.clients_table} isAdmin={isAdmin} />
          </div>
        )}

      {(activeView === "all" || activeView === "expiring") && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ExpiringSubscriptionsTable data={data.abonnements_expirant?.liste} />
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
