import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

const ITEMS_PER_PAGE = 5;

const DataTable = ({
  title,
  columns,
  data,
  emptyMessage,
  sortable = false,
  onRowClick,
  paginated = false,
  pageSize = ITEMS_PER_PAGE,
}) => {
  const safeData = useMemo(() => data ?? [], [data]);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  }, []);

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortable) return safeData;
    return [...safeData].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? 0;
      const bVal = b[sortConfig.key] ?? 0;
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [safeData, sortConfig, sortable]);

  const totalPages = paginated ? Math.ceil(sortedData.length / pageSize) : 1;
  const displayData = paginated
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="table-card"
    >
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-card-foreground">
          {title}
        </h3>
        {paginated && totalPages > 1 && (
          <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-md">
            {sortedData.length} total
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns?.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                    col.sortable
                      ? "cursor-pointer select-none hover:text-foreground transition-colors"
                      : ""
                  }`}
                  onClick={
                    col.sortable
                      ? () => handleSort(col.sortKey || col.key)
                      : undefined
                  }
                  title={col.sortable ? "Cliquez pour trier" : undefined}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        {sortConfig.key === (col.sortKey || col.key) ? (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns?.length ?? 1}
                  className="px-6 py-8 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage ?? "No data available"}
                </td>
              </tr>
            ) : (
              displayData.map((row, idx) => (
                <tr
                  key={row?.id ?? idx}
                  className={`transition-colors hover:bg-muted/30 ${onRowClick ? "cursor-pointer" : ""}`}
                  // هنا يتم تنفيذ التوجيه عند النقر على الصف tr
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns?.map((col) => (
                    <td
                      key={col.key}
                      className="whitespace-nowrap px-6 py-4 text-sm text-card-foreground"
                    >
                      {col.render ? col.render(row) : (row?.[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {paginated && totalPages > 1 && (
        <div className="px-6 py-3 border-t border-border flex justify-between items-center bg-muted/20">
          <span className="text-xs font-medium text-muted-foreground">
            Page {currentPage} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 text-foreground transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 text-foreground transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DataTable;

const revenueFormat = (val) => {
  if (val == null) return "—";
  const num = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(num) ? val : `${num.toLocaleString()} DH`;
};

export const EmployeeLeaderboard = ({ data }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      {
        key: "nom",
        label: t("common.name"),
        render: (r) => <span className="font-medium">{r?.nom ?? "—"}</span>,
      },
      {
        key: "email",
        label: t("clients.email"),
        render: (r) => (
          <span className="text-muted-foreground">{r?.email ?? "—"}</span>
        ),
      },
      {
        key: "revenu_mensuel",
        label: t("dashboard.revMonth", "Revenu Mensuel"),
        sortable: true,
        render: (r) => revenueFormat(r?.revenu_mensuel),
      },
      {
        key: "revenu_annuel",
        label: t("dashboard.revYear", "Revenu Annuel"),
        sortable: true,
        render: (r) => revenueFormat(r?.revenu_annuel),
      },
      {
        key: "revenu_total",
        label: t("dashboard.revTotal", "Revenu Total"),
        sortable: true,
        render: (r) => revenueFormat(r?.revenu_total),
      },
      {
        key: "clients_count",
        label: t("dashboard.clients"),
        sortable: true,
        render: (r) => r?.clients_count ?? 0,
      },
      {
        key: "active_subs",
        label: t("dashboard.activeSubs"),
        sortable: true,
        render: (r) => r?.active_subs ?? 0,
      },
      {
        key: "taux_conversion",
        label: t("dashboard.conversionRate"),
        sortable: true,
        render: (r) => (
          <span
            className={`font-semibold ${(r?.taux_conversion ?? 0) >= 75 ? "text-success" : "text-warning"}`}
          >
            {r?.taux_conversion ?? 0}%
          </span>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable
      title={t("dashboard.employeeLeaderboard")}
      columns={columns}
      data={data}
      sortable
      paginated
      pageSize={5}
      onRowClick={(row) => navigate(`/employee/${row.id}`)}
      emptyMessage={t("common.noResults")}
    />
  );
};

export const ExpiringSubscriptionsTable = ({ data }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      {
        key: "client",
        label: t("clients.name"),
        render: (r) => <span className="font-medium">{r?.client ?? "—"}</span>,
      },
      {
        key: "date_fin",
        label: t("common.endDate"),
        render: (r) => {
          const days = r?.jours_restants ?? Infinity;
          const isUrgent = days <= 7;
          const isExpiring = days <= 30;
          return (
            <span
              className={
                isUrgent
                  ? "font-bold text-destructive"
                  : isExpiring
                    ? "font-semibold text-warning"
                    : ""
              }
            >
              {r?.date_fin ?? "—"}
              {isUrgent && (
                <span className="ms-2 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                  {t("dashboard.expiresSoon")}
                </span>
              )}
              {!isUrgent && isExpiring && (
                <span className="ms-2 inline-block rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                  {t("dashboard.expiresMonth")}
                </span>
              )}
            </span>
          );
        },
      },
      {
        key: "prix",
        label: t("common.amount"),
        render: (r) => (
          <span className="font-semibold">{revenueFormat(r?.prix)}</span>
        ),
      },
      {
        key: "jours_restants",
        label: t("dashboard.daysLeft"),
        sortable: true,
        render: (r) => (
          <span
            className={`font-semibold ${(r?.jours_restants ?? 0) <= 7 ? "text-destructive" : "text-warning"}`}
          >
            {r?.jours_restants ?? "—"}
          </span>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable
      title={t("dashboard.expiringSubscriptions")}
      columns={columns}
      data={data}
      sortable
      paginated
      pageSize={5}
      onRowClick={(row) => navigate(`/subscriptions/${row.id}`)}
      emptyMessage={t("common.noResults")}
    />
  );
};

export const ClientsTable = ({ data, isAdmin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      {
        key: "nom",
        label: t("clients.name", "Nom du Client"),
        sortable: true,
        render: (r) => (
          <span className="font-medium text-foreground">{r?.nom ?? "—"}</span>
        ),
      },
      {
        key: "email",
        label: t("clients.email", "Email"),
        sortable: true,
        render: (r) => (
          <span className="text-muted-foreground">{r?.email ?? "—"}</span>
        ),
      },
      {
        key: "abonnements_actifs",
        label: t("dashboard.activeSubs", "Abonnements Actifs"),
        sortable: true,
        render: (r) => (
          <span
            className={`font-semibold ${r?.abonnements_actifs > 0 ? "text-success" : "text-muted-foreground"}`}
          >
            {r?.abonnements_actifs ?? 0}
          </span>
        ),
      },
      {
        key: "revenu_total",
        label: t("dashboard.revTotal", "Revenu Total"),
        sortable: true,
        render: (r) => (
          <span className="font-semibold text-primary">
            {revenueFormat(r?.revenu_total)}
          </span>
        ),
      },
      {
        key: "created_at",
        label: t("common.date", "Date d'ajout"),
        sortable: true,
      },
    ],
    [t],
  );

  return (
    <DataTable
      title={
        isAdmin
          ? t("dashboard.topClients", "Meilleurs Clients")
          : t("dashboard.myClients", "Mes Clients")
      }
      columns={columns}
      data={data}
      sortable
      paginated
      pageSize={5}
      onRowClick={(row) => navigate(`/clients/${row.id}`)}
      emptyMessage={t("common.noResults", "Aucun client trouvé")}
    />
  );
};

export const EmployeesTable = EmployeeLeaderboard;
