import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { DashboardSkeleton } from "../components/ui/Skeleton";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Trophy,
  Clock,
  Users,
  Download,
  Loader2,
  Calendar,
} from "lucide-react";
import showToast from "../components/ui/Toast";
import { Toaster } from "react-hot-toast";
import api from "../api/axiosConfig";

const Dashboard = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { data, role, loading } = useAppSelector((s) => s.dashboard);
  const [activeView, setActiveView] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  useEffect(() => {
    dispatch(fetchDashboardData({ year: selectedYear, month: selectedMonth }));
  }, [dispatch, selectedYear, selectedMonth]);

  const isAdmin = role === "admin" || data?.role === "admin";

  const months = useMemo(
    () => [
      { value: 1, label: t("months.jan", "Janvier") },
      { value: 2, label: t("months.feb", "Février") },
      { value: 3, label: t("months.mar", "Mars") },
      { value: 4, label: t("months.apr", "Avril") },
      { value: 5, label: t("months.may", "Mai") },
      { value: 6, label: t("months.jun", "Juin") },
      { value: 7, label: t("months.jul", "Juillet") },
      { value: 8, label: t("months.aug", "Août") },
      { value: 9, label: t("months.sep", "Septembre") },
      { value: 10, label: t("months.oct", "Octobre") },
      { value: 11, label: t("months.nov", "Novembre") },
      { value: 12, label: t("months.dec", "Décembre") },
    ],
    [t],
  );

  const years = useMemo(() => {
    if (data?.available_years?.length > 0) return data.available_years;
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - i);
  }, [data?.available_years]);

  const viewOptions = useMemo(() => {
    const opts = [
      { value: "all", label: t("dashboard.viewAll", "Vue d'ensemble"), icon: LayoutDashboard },
      { value: "charts", label: t("dashboard.viewCharts", "Graphiques"), icon: BarChart3 },
    ];
    if (isAdmin) {
      opts.push({ value: "leaderboard", label: t("dashboard.viewLeaderboard", "Classement"), icon: Trophy });
      opts.push({ value: "clients", label: t("dashboard.topClients", "Meilleurs Clients"), icon: Users });
    } else {
      opts.push({ value: "clients", label: t("dashboard.myClients", "Mes Clients"), icon: Users });
    }
    opts.push({ value: "expiring", label: t("dashboard.viewExpiring", "Expirations"), icon: Clock });
    return opts;
  }, [t, isAdmin]);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    const toastId = showToast.loading("Génération du rapport Excel...");

    try {
      const response = await api.get("/dashboard/export", {
        responseType: "blob",
        params: { year: selectedYear, month: selectedMonth },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Rapport_Performance_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast.dismiss(toastId);
      showToast.success("Rapport téléchargé avec succès !");
    } catch (error) {
      console.error("Export error:", error);
      showToast.dismiss(toastId);
      showToast.error("Erreur lors de l'exportation du rapport.");
    } finally {
      setIsExporting(false);
    }
  }, [selectedYear, selectedMonth]);

  /* ── Skeleton on first load ── */
  if (loading && !data) return <DashboardSkeleton />;

  return (
    <>
      <Toaster position="top-center" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* ── Header ── */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {t("dashboard.title")}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isAdmin ? t("dashboard.description") : t("dashboard.personalDashboard")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Date picker */}
              <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 shadow-sm">
                <Calendar size={18} className="text-muted-foreground" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none text-foreground appearance-none"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <span className="text-border">|</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer outline-none text-foreground appearance-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center gap-2 font-medium text-sm transition-all shadow-sm disabled:opacity-70 whitespace-nowrap"
              >
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {t("common.exportExcel", "Exporter Excel")}
              </button>
            </div>
          </div>

          {/* View toggle tabs */}
          <div className="w-full overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="inline-flex items-center gap-1 rounded-xl bg-muted/50 border border-border p-1.5 min-w-max">
              {viewOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = activeView === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setActiveView(opt.value)}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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

        {/* ── Content ── */}
        <div
          className={`transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}
        >
          {data && (
            <>
              <KpiSection
                resumeFinancier={data.resume_financier}
                clientsAnalytics={data.clients_analytics}
              />

              {(activeView === "all" || activeView === "charts") && (
                <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2 animate-fade-in">
                  <RevenueTrendChart data={data.graphiques?.revenus_historique} />
                  <SubscriptionDistChart data={data.graphiques?.repartition_abonnements} />
                </div>
              )}

              {(activeView === "all" || activeView === "leaderboard") && isAdmin && data.performance_equipe && (
                <div className="mt-8 animate-fade-in">
                  <EmployeeLeaderboard data={data.performance_equipe} />
                </div>
              )}

              {(activeView === "all" || activeView === "clients") && data.clients_table && (
                <div className="mt-8 animate-fade-in">
                  <ClientsTable data={data.clients_table} isAdmin={isAdmin} />
                </div>
              )}

              {(activeView === "all" || activeView === "expiring") && data.abonnements_expirant?.liste && (
                <div className="mt-8 animate-fade-in">
                  <ExpiringSubscriptionsTable data={data.abonnements_expirant.liste} />
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Dashboard;
