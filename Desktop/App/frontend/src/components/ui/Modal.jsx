import React, { memo } from "react";
import { X } from "lucide-react";

const Modal = memo(function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = "max-w-md",
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className={`bg-card text-card-foreground rounded-lg border border-border shadow-lg w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {title && (
          <div className="border-b border-border px-6 py-4 flex justify-between items-center bg-muted/30">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {Icon && <Icon size={18} className="text-primary" />}
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-md transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
});

export default Modal;
