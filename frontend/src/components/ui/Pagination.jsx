import React, { memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = memo(function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-muted/20">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Page {currentPage} / {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 text-foreground transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
});

export default Pagination;
