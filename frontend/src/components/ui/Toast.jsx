import toast from "react-hot-toast";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
} from "lucide-react";

const BASE =
  "flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-xl text-sm font-medium min-w-[280px] max-w-[380px]";

const VARIANTS = {
  success: {
    Icon: CheckCircle2,
    className:
      "bg-card border-success/30 text-card-foreground shadow-success/10",
    iconClass: "text-success shrink-0 mt-0.5",
  },
  error: {
    Icon: XCircle,
    className:
      "bg-card border-destructive/30 text-card-foreground shadow-destructive/10",
    iconClass: "text-destructive shrink-0 mt-0.5",
  },
  warning: {
    Icon: AlertTriangle,
    className:
      "bg-card border-warning/30 text-card-foreground shadow-warning/10",
    iconClass: "text-warning shrink-0 mt-0.5",
  },
  info: {
    Icon: Info,
    className:
      "bg-card border-primary/30 text-card-foreground shadow-primary/10",
    iconClass: "text-primary shrink-0 mt-0.5",
  },
  loading: {
    Icon: Loader2,
    className: "bg-card border-border text-card-foreground",
    iconClass: "text-primary shrink-0 mt-0.5 animate-spin",
  },
};

const ToastContent = ({ message, variant = "info", tId }) => {
  const { Icon, className, iconClass } = VARIANTS[variant] ?? VARIANTS.info;
  return (
    <div className={`${BASE} ${className} pointer-events-auto`}>
      <Icon size={18} className={iconClass} />
      <span className="leading-snug flex-1">{message}</span>

      {tId && variant !== "loading" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(tId);
          }}
          className="p-1 -mr-2 -mt-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors shrink-0"
          title="Fermer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

const wrapperClass = (visible) =>
  `relative z-[99999] transition-all duration-300 ${
    visible
      ? "animate-in fade-in slide-in-from-top-4"
      : "animate-out fade-out slide-out-to-top-4 opacity-0"
  }`;

export const showToast = {
  success: (message, opts) =>
    toast.custom(
      (t) => (
        <div className={wrapperClass(t.visible)}>
          <ToastContent message={message} variant="success" tId={t.id} />
        </div>
      ),
      { duration: 3000, id: opts?.id, ...opts }, // 👈 تحديد مدة 3 ثواني إجبارية
    ),

  error: (message, opts) =>
    toast.custom(
      (t) => (
        <div className={wrapperClass(t.visible)}>
          <ToastContent message={message} variant="error" tId={t.id} />
        </div>
      ),
      { duration: 4000, id: opts?.id, ...opts },
    ),

  warning: (message, opts) =>
    toast.custom(
      (t) => (
        <div className={wrapperClass(t.visible)}>
          <ToastContent message={message} variant="warning" tId={t.id} />
        </div>
      ),
      { duration: 4000, id: opts?.id, ...opts },
    ),

  info: (message, opts) =>
    toast.custom(
      (t) => (
        <div className={wrapperClass(t.visible)}>
          <ToastContent message={message} variant="info" tId={t.id} />
        </div>
      ),
      { duration: 3500, id: opts?.id, ...opts },
    ),

  loading: (message, opts) =>
    toast.custom(
      (t) => (
        <div className={wrapperClass(t.visible)}>
          <ToastContent message={message} variant="loading" tId={t.id} />
        </div>
      ),
      { duration: Infinity, id: opts?.id, ...opts },
    ),

  promise: (promise, messages, opts) =>
    toast.promise(
      promise,
      {
        loading: (
          <ToastContent
            message={messages.loading ?? "Chargement..."}
            variant="loading"
          />
        ),
        success: (data) => (
          <ToastContent
            message={messages.success ?? "Terminé avec succès!"}
            variant="success"
          />
        ),
        error: (err) => (
          <ToastContent
            message={messages.error ?? "Une erreur est survenue!"}
            variant="error"
          />
        ),
      },
      {
        style: {
          minWidth: "0",
          padding: 0,
          background: "transparent",
          boxShadow: "none",
        },
        ...opts,
      },
    ),

  dismiss: (id) => toast.dismiss(id),
};

export default showToast;
