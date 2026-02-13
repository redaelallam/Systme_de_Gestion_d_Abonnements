import React, { memo } from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = memo(function LoadingSpinner({ message = "Chargement des données..." }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground font-medium animate-pulse">{message}</p>
    </div>
  );
});

export default LoadingSpinner;
