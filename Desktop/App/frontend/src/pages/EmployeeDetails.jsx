import React, { useEffect } from "react";
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
} from "lucide-react";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { getAvatarColor } from "../utils/helpers";

const StatCard = ({ title, value, icon: Icon, subtext }) => (
  <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-sm hover:border-primary/50 transition-all group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight mt-1">{value}</h3>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </div>
      <div className="p-3 rounded-md bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { currentEmployee, loading, error } = useAppSelector(
    (state) => state.employees,
  );

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
            {error || "Employé introuvable"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-background border border-input rounded-md text-sm text-foreground hover:bg-accent"
          >
            Retour
          </button>
        </div>
      </div>
    );

  const {
    info: employee = {},
    stats = {},
    clients = [],
    abonnements = [],
  } = currentEmployee;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {employee.nom}
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 flex items-center gap-2">
              <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-xs font-mono">
                ID: #{employee.id}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                  employee.role === "admin"
                    ? "bg-chart-4/10 text-chart-4 border-chart-4/20"
                    : "bg-chart-1/10 text-chart-1 border-chart-1/20"
                }`}
              >
                {employee.role === "admin" ? "Administrateur" : "Employé"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="px-3 py-2 bg-background border border-border rounded-md hover:bg-accent text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} /> Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Clients"
          value={stats.clients_count || 0}
          icon={Users}
          subtext="Clients gérés"
        />
        <StatCard
          title="Revenus Générés"
          value={`${parseFloat(stats.total_revenue || 0).toLocaleString()} DH`}
          icon={DollarSign}
          subtext="Cumulatif"
        />
        <StatCard
          title="Abonnements Actifs"
          value={stats.active_subscriptions || 0}
          icon={Activity}
          subtext={`${stats.subscriptions_count || 0} Abonnements total`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 border ${
                      employee.role === "admin"
                        ? "bg-chart-4/10 text-chart-4 border-chart-4/20"
                        : "bg-success/10 text-success border-success/20"
                    }`}
                  >
                    {employee.role === "admin" ? "Administrateur" : "Employé"}
                  </span>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                {[
                  { icon: Mail, label: "Email", value: employee.email },
                  {
                    icon: Shield,
                    label: "Rôle",
                    value:
                      employee.role === "admin" ? "Administrateur" : "Employé",
                  },
                  {
                    icon: Users,
                    label: "Clients",
                    value: `${stats.clients_count || 0} client(s)`,
                  },
                ].map((f) => (
                  <div key={f.label} className="flex items-start gap-3 text-sm">
                    <f.icon
                      size={18}
                      className="text-muted-foreground mt-0.5"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase">
                        {f.label}
                      </p>
                      <p className="text-foreground font-medium">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/30 px-6 py-3 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                Membre depuis{" "}
                {new Date(
                  employee.created_at || Date.now(),
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border flex flex-col h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Briefcase className="text-muted-foreground" size={18} />{" "}
                Clients gérés
              </h3>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md font-medium">
                {stats.clients_count || 0} client(s)
              </span>
            </div>
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-foreground font-bold text-sm">
                  Aucun client trouvé
                </h4>
                <p className="text-muted-foreground text-xs mt-1">
                  Cet employé ne gère aucun client pour le moment.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      {["Client", "Email", "Abonnements", "Revenus"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {clients.map((client) => {
                      const clientSubs = abonnements.filter(
                        (sub) => sub.client_id === client.id,
                      );
                      const clientRevenue = clientSubs.reduce(
                        (s, ab) => s + parseFloat(ab.prix || 0),
                        0,
                      );
                      const activeCount = clientSubs.filter((s) =>
                        ["active", "active"].includes(s.statut?.toLowerCase()),
                      ).length;

                      return (
                        <tr
                          key={client.id}
                          className="hover:bg-muted/50 transition-colors group cursor-pointer"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${getAvatarColor(client.nom)}`}
                              >
                                {client.nom?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-foreground">
                                  {client.nom}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ID: #{client.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {client.email}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                {clientSubs.length} total
                              </span>
                              {activeCount > 0 && (
                                <span className="inline-block rounded-md bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                                  {activeCount} actif(s)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-sm">
                              {clientRevenue.toLocaleString()}{" "}
                              <span className="text-muted-foreground text-xs">
                                DH
                              </span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
