import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchEmployeeById,
  clearCurrentEmployee,
} from "../features/employees/employeesSlice";
import { Toaster } from "react-hot-toast";
import {
  Mail,
  Shield,
  ArrowLeft,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  Briefcase,
  Calendar,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { getAvatarColor } from "../utils/helpers";
import {
  RevenueTrendChart,
  SubscriptionDistChart,
} from "../components/ChartCard";

const StatCard = ({
  title,
  value,
  icon: Icon,
  subtext,
  trendColor = "text-muted-foreground",
}) => (
  <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-sm hover:border-primary/50 transition-all group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight mt-1">{value}</h3>
        {subtext && (
          <p className={`text-xs mt-1 font-medium ${trendColor}`}>{subtext}</p>
        )}
      </div>
      <div className="p-3 rounded-md bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const formatDH = (val) => {
  if (val == null) return "0 DH";
  return `${Number(val).toLocaleString()} DH`;
};

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { currentEmployee, loading, error } = useAppSelector(
    (state) => state.employees,
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "desc",
  });
  const itemsPerPage = 5;

  const employee = currentEmployee?.employee_info || {};
  const stats = currentEmployee?.statistiques || {};
  const graphiques = currentEmployee?.graphiques || {};
  const listes = currentEmployee?.listes || {};
  const clientsRecents = listes?.clients_recents || [];

  const sortedClients = useMemo(() => {
    let sortableItems = [...clientsRecents];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = Number(a[sortConfig.key]) || 0;
        const bValue = Number(b[sortConfig.key]) || 0;
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [clientsRecents, sortConfig]);

  useEffect(() => {
    dispatch(fetchEmployeeById(id));
    return () => {
      dispatch(clearCurrentEmployee());
    };
  }, [id, dispatch]);

  const handleRefresh = () => {
    dispatch(fetchEmployeeById(id));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );

  if (error || !currentEmployee)
    return (
      <div className="flex items-center justify-center min-h-[400px] text-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Oops!</h2>
          <p className="text-destructive font-medium">
            {error || "Employé introuvable ou accès non autorisé"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-background border border-input rounded-md text-sm text-foreground hover:bg-accent transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );

  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentClients = sortedClients.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-background border border-border rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
              {employee.nom}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${employee.role === "admin" ? "bg-chart-4/10 text-chart-4 border-chart-4/20" : "bg-chart-1/10 text-chart-1 border-chart-1/20"}`}
              >
                {employee.role === "admin" ? "Administrateur" : "Employé"}
              </span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Consultez les performances et les clients gérés par cet employé.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-background border border-border rounded-md hover:bg-accent text-foreground flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenu Mensuel"
          value={formatDH(stats.revenu_mensuel)}
          icon={DollarSign}
          subtext="Ce mois-ci"
          trendColor="text-success"
        />
        <StatCard
          title="Revenu Annuel"
          value={formatDH(stats.revenu_annuel)}
          icon={Activity}
          subtext={`Année ${new Date().getFullYear()}`}
        />
        <StatCard
          title="Revenu Total"
          value={formatDH(stats.revenu_total)}
          icon={Wallet}
          subtext="Cumulatif"
        />
        <StatCard
          title="Clients Gérés"
          value={stats.clients_count || 0}
          icon={Users}
          subtext={`Conversion: ${stats.taux_conversion || 0}%`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RevenueTrendChart data={graphiques.revenus_historique} />
        <SubscriptionDistChart data={graphiques.repartition_abonnements} />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar: Employee Info */}
        <div className="lg:col-span-4">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold shadow-sm ${getAvatarColor(employee.nom)}`}
                >
                  {employee.nom?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{employee.nom}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail size={14} /> {employee.email}
                  </p>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Briefcase
                      size={16}
                      className="dark:text-foreground transition-colors"
                    />{" "}
                    Total Abonnements
                  </span>
                  <span className="font-semibold">
                    {stats.abonnements_total || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar
                      size={16}
                      className="dark:text-foreground transition-colors"
                    />{" "}
                    Abonnements Actifs
                  </span>
                  <span className="font-semibold text-success">
                    {stats.abonnements_actifs || 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 px-6 py-3 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                Inscrit le{" "}
                {new Date(employee.created_at || Date.now()).toLocaleDateString(
                  "fr-FR",
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Main Area: Clients List */}
        <div className="lg:col-span-8">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Users className="text-muted-foreground" size={18} /> Clients
                Récents
              </h3>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md font-medium">
                {clientsRecents.length} au total
              </span>
            </div>

            {clientsRecents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-foreground font-bold text-sm">
                  Aucun client trouvé
                </h4>
                <p className="text-muted-foreground text-xs mt-1">
                  Cet employé n'a pas encore ajouté de clients.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Contact
                        </th>
                        <th
                          className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none transition-colors"
                          onClick={() => handleSort("total_revenus")}
                        >
                          <span className="flex items-center gap-1">
                            Revenus{" "}
                            <ArrowUpDown
                              size={14}
                              className={`transition-opacity ${sortConfig.key === "total_revenus" ? "opacity-100 text-foreground" : "opacity-40"}`}
                            />
                          </span>
                        </th>
                        <th
                          className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none transition-colors"
                          onClick={() => handleSort("total_abonnements")}
                        >
                          <span className="flex items-center gap-1">
                            Abonnements{" "}
                            <ArrowUpDown
                              size={14}
                              className={`transition-opacity ${sortConfig.key === "total_abonnements" ? "opacity-100 text-foreground" : "opacity-40"}`}
                            />
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {currentClients.map((client) => (
                        <tr
                          key={client.id}
                          className="hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${getAvatarColor(client.nom)}`}
                              >
                                {client.nom?.charAt(0).toUpperCase()}
                              </div>
                              <p className="font-medium text-sm text-foreground">
                                {client.nom}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {client.email || client.telephone || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            {client.total_revenus
                              ? `${Number(client.total_revenus).toLocaleString()} DH`
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {client.total_abonnements || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
                    <span className="text-sm text-muted-foreground">
                      Affichage de {startIndex + 1} à{" "}
                      {Math.min(
                        startIndex + itemsPerPage,
                        sortedClients.length,
                      )}{" "}
                      sur {sortedClients.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-medium px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
