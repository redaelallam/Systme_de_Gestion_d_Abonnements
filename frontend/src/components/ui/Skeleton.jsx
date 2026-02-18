import { memo } from "react";

/** Base pulse skeleton block */
const Skeleton = memo(function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted/70 ${className}`}
      {...props}
    />
  );
});

export default Skeleton;

/* ─── Composed Skeleton Variants ─── */

/** A single table row skeleton with N columns */
export const TableRowSkeleton = memo(function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton
            className={`h-4 ${i === 0 ? "w-32" : i === cols - 1 ? "w-16" : "w-24"}`}
          />
        </td>
      ))}
    </tr>
  );
});

/** Full table skeleton: header + N row skeletons */
export const TableSkeleton = memo(function TableSkeleton({
  cols = 5,
  rows = 5,
  title,
}) {
  return (
    <div className="table-card">
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
        {title ? (
          <span className="text-base font-semibold text-card-foreground">{title}</span>
        ) : (
          <Skeleton className="h-5 w-40" />
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

/** KPI card skeleton */
export const KpiCardSkeleton = memo(function KpiCardSkeleton() {
  return (
    <div className="kpi-card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-7 w-24" />
    </div>
  );
});

/** KPI section (4 cards) skeleton */
export const KpiSectionSkeleton = memo(function KpiSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
});

/** Chart card skeleton */
export const ChartSkeleton = memo(function ChartSkeleton({ height = "h-72" }) {
  return (
    <div className="chart-card space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-7 w-24 rounded-md" />
      </div>
      <Skeleton className={`w-full ${height} rounded-lg`} />
    </div>
  );
});

/** Form skeleton */
export const FormSkeleton = memo(function FormSkeleton({ fields = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-full rounded-md mt-2" />
    </div>
  );
});

/** Client / Employee card list skeleton */
export const CardListSkeleton = memo(function CardListSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
});

/** Dashboard full-page skeleton */
export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
      <KpiSectionSkeleton />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton cols={6} rows={5} />
    </div>
  );
});
