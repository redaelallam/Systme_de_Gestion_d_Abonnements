import React, { memo } from "react";
import { Trash2, AlertTriangle } from "lucide-react";

const ConfirmDialog = memo(function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmer la suppression",
  message,
  confirmLabel = "Supprimer",
  icon: Icon = Trash2,
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground rounded-lg border border-border shadow-lg w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4 border border-destructive/20">
          <Icon size={24} />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
        {message && (
          <p className="text-muted-foreground text-sm mb-6">{message}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-background border border-input text-foreground rounded-md hover:bg-accent font-medium text-sm transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 font-medium text-sm transition-colors shadow-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ConfirmDialog;
