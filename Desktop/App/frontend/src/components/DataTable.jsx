import { useMemo } from "react";
import { ExternalLink } from "lucide-react";

const DataTable = ({ title, columns, data, emptyMessage }) => {
  const safeData = useMemo(() => data ?? [], [data]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-base font-semibold text-card-foreground">
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns?.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {safeData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns?.length ?? 1}
                  className="px-6 py-8 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage ?? "No data available"}
                </td>
              </tr>
            ) : (
              safeData.map((row, idx) => (
                <tr
                  key={row?.id ?? idx}
                  className="transition-colors hover:bg-muted/30"
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
    </div>
  );
};

/* ── Pre-configured table builders ── */

const revenueFormat = (val) => {
  if (val == null) return "—";
  return typeof val === "number" ? `$${val.toLocaleString()}` : val;
};

const linkCell = (link) =>
  link ? (
    <a
      href={link}
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-info hover:underline"
    >
      View <ExternalLink className="h-3.5 w-3.5" />
    </a>
  ) : (
    "—"
  );

const isExpiringSoon = (dateStr) => {
  if (!dateStr) return false;
  const diff = (new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 30;
};

export const EmployeesTable = ({ data }) => {
  const columns = useMemo(
    () => [
      { key: "name", label: "Name", render: (r) => r?.name ?? "Unknown" },
      {
        key: "revenue",
        label: "Revenue",
        render: (r) => revenueFormat(r?.revenue),
      },
      { key: "link", label: "Action", render: (r) => linkCell(r?.link) },
    ],
    [],
  );
  return (
    <DataTable
      title="Top Employees"
      columns={columns}
      data={data}
      emptyMessage="No employees found"
    />
  );
};

export const ClientsTable = ({ data }) => {
  const columns = useMemo(
    () => [
      { key: "name", label: "Name", render: (r) => r?.name ?? "Unknown" },
      {
        key: "revenue",
        label: "Revenue",
        render: (r) => revenueFormat(r?.revenue),
      },
      { key: "link", label: "Action", render: (r) => linkCell(r?.link) },
    ],
    [],
  );
  return (
    <DataTable
      title="Top Clients"
      columns={columns}
      data={data}
      emptyMessage="No clients found"
    />
  );
};

export const ExpiringSubscriptionsTable = ({ data }) => {
  const columns = useMemo(
    () => [
      {
        key: "client_name",
        label: "Client",
        render: (r) => r?.client_name ?? "—",
      },
      {
        key: "end_date",
        label: "End Date",
        render: (r) => {
          const expiring = isExpiringSoon(r?.end_date);
          return (
            <span className={expiring ? "font-semibold text-destructive" : ""}>
              {r?.end_date ?? "—"}
              {expiring && (
                <span className="ml-2 inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  Soon
                </span>
              )}
            </span>
          );
        },
      },
      {
        key: "amount",
        label: "Amount",
        render: (r) => (
          <span className="inline-block rounded-md bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
            {r?.amount ?? "—"}
          </span>
        ),
      },
      { key: "link", label: "Action", render: (r) => linkCell(r?.link) },
    ],
    [],
  );
  return (
    <DataTable
      title="Expiring Subscriptions"
      columns={columns}
      data={data}
      emptyMessage="No expiring subscriptions"
    />
  );
};

export default DataTable;
