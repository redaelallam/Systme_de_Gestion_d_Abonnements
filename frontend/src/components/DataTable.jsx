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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="table-card"
    >
      {/* Table header bar */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-card-foreground truncate">
          {title}
        </h3>
        {paginated && sortedData.length > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground font-medium bg-muted/60 px-2.5 py-1 rounded-full">
            {sortedData.length}
          </span>
        )}
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns?.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap ${
                    col.sortable
                      ? "cursor-pointer select-none hover:text-foreground transition-colors"
                      : ""
                  }`}
                  onClick={col.sortable ? () => handleSort(col.sortKey || col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex flex-col opacity-60">
                        {sortConfig.key === (col.sortKey || col.key) ? (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp size={13} />
                          ) : (
                            <ChevronDown size={13} />
                          )
                        ) : (
                          <ArrowUpDown size={13} className="opacity-40" />
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
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage ?? "No data available"}
                </td>
              </tr>
            ) : (
              displayData.map((row, idx) => (
                <tr
                  key={row?.id ?? idx}
                  className={`transition-colors hover:bg-muted/25 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
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

      {/* Pagination bar */}
      {paginated && totalPages > 1 && (
        <div className="px-6 py-3.5 border-t border-border flex items-center justify-between bg-muted/15">
          <span className="text-xs font-medium text-muted-foreground">
            Page {currentPage} / {totalPages}
          </span>
          <div className="flex gap-1.5">
            {/* Previous */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-40 text-foreground transition-colors"
            >
              <ChevronLeft size={15} />
            </button>

            {/* Page numbers – show up to 5 */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const page = start + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${
                    currentPage === page
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-input bg-background hover:bg-accent text-foreground"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {/* Next */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-40 text-foreground transition-colors"
            >
              <ChevronRight size={15} />
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
          const isUrgent = r?.urgence === "high";
          const isExpiring = r?.urgence === "medium";

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
                  {t("dashboard.expiresSoon", "Très Proche")}
                </span>
              )}
              {!isUrgent && isExpiring && (
                <span className="ms-2 inline-block rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                  {t("dashboard.expiresMonth", "Bientôt")}
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
            className={`font-semibold ${r?.urgence === "high" ? "text-destructive" : "text-warning"}`}
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
        label: t("dashboard.revenue", "Revenu"),
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

export const TransactionsTable = ({ data }) => {
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      {
        key: "id",
        label: t("common.id", "ID"),
        render: (r) => <span className="text-muted-foreground">#{r?.id}</span>,
      },
      {
        key: "date_paiement",
        label: t("common.date", "Date"),
        sortable: true,
        render: (r) => (
          <span className="font-medium">
            {new Date(r?.date_paiement).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: "type_paiement",
        label: t("common.type", "Type"),
        render: (r) => {
          const isPayment = r?.type_paiement === "paiement";
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isPayment
                  ? "bg-success/15 text-success border-success/20"
                  : "bg-warning/15 text-warning border-warning/20"
              }`}
            >
              {r?.type_paiement}
            </span>
          );
        },
      },
      {
        key: "montant",
        label: t("common.amount", "Montant"),
        sortable: true,
        render: (r) => (
          <span
            className={`font-semibold ${r?.type_paiement === "paiement" ? "text-success" : "text-warning"}`}
          >
            {r?.type_paiement === "paiement" ? "+" : "-"}
            {revenueFormat(r?.montant)}
          </span>
        ),
      },
      {
        key: "description",
        label: t("common.description", "Description"),
        render: (r) => (
          <span
            className="text-sm text-muted-foreground truncate max-w-[250px] inline-block"
            title={r?.description}
          >
            {r?.description ?? "—"}
          </span>
        ),
      },
    ],
    [t],
  );

  return (
    <DataTable
      title={t("subscriptions.history", "Historique des Transactions")}
      columns={columns}
      data={data}
      sortable
      paginated
      pageSize={5}
      emptyMessage={t("common.noResults", "Aucune transaction trouvée")}
    />
  );
};
