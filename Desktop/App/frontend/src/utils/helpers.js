export const getInitials = (name) =>
  name?.substring(0, 2).toUpperCase() || "??";

export const getAvatarStyle = () =>
  "bg-primary/10 text-primary border border-primary/20";

export const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
    case "actif":
      return "bg-success/15 text-success border-success/20";
    case "suspendu":
      return "bg-warning/15 text-warning border-warning/20";
    case "expiré":
    case "expire":
      return "bg-muted text-muted-foreground border-border";
    case "annulé":
    case "annule":
      return "bg-destructive/15 text-destructive border-destructive/20";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
};

export const getAvatarColor = (name) => {
  const colors = [
    "bg-chart-1 text-white",
    "bg-chart-2 text-white",
    "bg-chart-3 text-white",
    "bg-chart-4 text-white",
    "bg-chart-5 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0];
};

export const calculateEndDate = (startDate, type) => {
  const start = new Date(startDate);
  const end = new Date(start);
  switch (type) {
    case "Mensuel":
      end.setMonth(start.getMonth() + 1);
      break;
    case "Trimestriel":
      end.setMonth(start.getMonth() + 3);
      break;
    case "Semestriel":
      end.setMonth(start.getMonth() + 6);
      break;
    case "Annuel":
      end.setFullYear(start.getFullYear() + 1);
      break;
    default:
      break;
  }
  return end.toISOString().split("T")[0];
};

export const STATUS_CONFIG = {
  active: { label: "Actif", style: "bg-success/10 text-success border-success/20" },
  actif: { label: "Actif", style: "bg-success/10 text-success border-success/20" },
  suspendu: { label: "Suspendu", style: "bg-warning/10 text-warning border-warning/20" },
  annulé: { label: "Annulé", style: "bg-destructive/10 text-destructive border-destructive/20" },
  expiré: { label: "Expiré", style: "bg-muted text-muted-foreground border-border" },
};
