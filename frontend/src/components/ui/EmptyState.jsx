import React, { memo } from "react";
import { Search } from "lucide-react";

const EmptyState = memo(function EmptyState({
  icon: Icon = Search,
  message = "Aucun résultat trouvé.",
  colSpan = 4,
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16 text-center text-muted-foreground">
        <div className="flex flex-col items-center justify-center">
          <Icon size={40} strokeWidth={1} className="mb-3 opacity-20" />
          <p>{message}</p>
        </div>
      </td>
    </tr>
  );
});

export default EmptyState;
