import { memo } from "react";
import { DashboardSkeleton } from "./Skeleton";

/**
 * Replace plain spinner with a meaningful skeleton.
 * Falls back to skeleton when used as a page-level loader.
 */
const LoadingSpinner = memo(function LoadingSpinner({
  message,
  skeleton = true,
}) {
  if (skeleton) return <DashboardSkeleton />;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
      <div className="w-9 h-9 rounded-full border-[3px] border-muted border-t-primary animate-spin" />
      {message && (
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
});

export default LoadingSpinner;
