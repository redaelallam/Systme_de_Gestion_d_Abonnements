import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Package,
  DollarSign,
  Activity,
  Plus,
  Edit,
  RefreshCw,
  X,
  Trash2,
  CheckCircle,
  PauseCircle,
} from "lucide-react";

// --- Constants ---
const API_BASE_URL = "http://127.0.0.1:8000/api";

// --- Utility Functions ---

// تحسين دالة الألوان لتعتمد على متغيرات النظام (Success, Warning, Destructive)
const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
    case "actif":
      // استخدام ألوان النجاح من النظام
      return "bg-success/15 text-success border-success/20 border";
    case "suspendu":
      return "bg-warning/15 text-warning border-warning/20 border";
    case "expiré":
    case "expire":
      return "bg-muted text-muted-foreground border-border border";
    case "annulé":
    case "annule":
      return "bg-destructive/15 text-destructive border-destructive/20 border";
    default:
      return "bg-secondary text-secondary-foreground border-border border";
  }
};

// استخدام ألوان المخططات (Charts) من النظام للصور الرمزية
const getAvatarColor = (name) => {
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

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0];
};

const calculateEndDate = (startDate, type) => {
  const start = new Date(startDate);
  let end = new Date(start);
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

// --- Reusable UI Components (Based on Design System) ---

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-card text-card-foreground rounded-lg border border-border shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  variant = "primary",
  size = "default",
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    secondary:
      "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
    outline:
      "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive:
      "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
  };

  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    icon: "h-9 w-9",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size] || sizes.default} ${className}`}
      {...props}
    />
  );
};

const Input = (props) => (
  <input
    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  />
);

const Select = ({ className = "", ...props }) => (
  <div className="relative">
    <select
      className={`flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none ${className}`}
      {...props}
    />
    {/* Custom Arrow for consistency */}
    <div className="absolute right-3 top-2.5 pointer-events-none opacity-50">
      <svg
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 1L5 5L9 1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
);

const Label = ({ children, className = "" }) => (
  <label
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
  >
    {children}
  </label>
);

// --- Component: Stat Card ---
const StatCard = ({ title, value, icon: Icon, subtext }) => (
  <Card className="p-6 hover:border-primary/50 transition-all duration-200">
    <div className="flex items-center justify-between space-y-0 pb-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="text-muted-foreground">
        <Icon size={18} />
      </div>
    </div>
    <div>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && (
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      )}
    </div>
  </Card>
);

// --- Component: Modal Wrapper ---
const ModalWrapper = ({ isOpen, onClose, title, icon: Icon, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg shadow-lg scale-100 animate-in zoom-in-95 duration-200 border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {Icon && <Icon size={20} className="text-primary" />} {title}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X size={16} />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </Card>
    </div>
  );
};

// --- Component: Add Subscription Modal ---
const AddSubscriptionModal = ({
  isOpen,
  onClose,
  onSubmit,
  clientName,
  isSaving,
}) => {
  const [subData, setSubData] = useState({
    type: "Mensuel",
    prix: "",
    statut: "Active",
    dateDebut: new Date().toISOString().split("T")[0],
    dateFin: "",
  });

  useEffect(() => {
    if (subData.dateDebut) {
      setSubData((prev) => ({
        ...prev,
        dateFin: calculateEndDate(subData.dateDebut, subData.type),
      }));
    }
  }, [subData.type, subData.dateDebut]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvel Abonnement"
      icon={CreditCard}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(subData);
        }}
        className="space-y-4"
      >
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          Création d'abonnement pour{" "}
          <span className="font-medium text-foreground">{clientName}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label>Offre</Label>
            <Select
              required
              value={subData.type}
              onChange={(e) => setSubData({ ...subData, type: e.target.value })}
            >
              <option value="Mensuel">Mensuel (1 Mois)</option>
              <option value="Trimestriel">Trimestriel (3 Mois)</option>
              <option value="Semestriel">Semestriel (6 Mois)</option>
              <option value="Annuel">Annuel (12 Mois)</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prix (DH)</Label>
            <Input
              type="number"
              step="0.01"
              required
              value={subData.prix}
              onChange={(e) => setSubData({ ...subData, prix: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={subData.statut}
              onChange={(e) =>
                setSubData({ ...subData, statut: e.target.value })
              }
            >
              <option value="Active">Active</option>
              <option value="Suspendu">Suspendu</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Début</Label>
            <Input
              type="date"
              required
              value={subData.dateDebut}
              onChange={(e) =>
                setSubData({ ...subData, dateDebut: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Date Fin</Label>
            <Input
              type="date"
              required
              value={subData.dateFin}
              onChange={(e) =>
                setSubData({ ...subData, dateFin: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
            Confirmer
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// --- Component: Edit Subscription Modal ---
const EditSubscriptionModal = ({
  isOpen,
  onClose,
  onSubmit,
  subscription,
  isSaving,
}) => {
  const [subData, setSubData] = useState({
    id: null,
    type: "",
    prix: "",
    statut: "",
    dateDebut: "",
    dateFin: "",
  });

  useEffect(() => {
    if (subscription) {
      setSubData({
        id: subscription.id,
        type: subscription.type,
        prix: subscription.prix,
        statut: subscription.statut,
        dateDebut: formatDateForInput(subscription.dateDebut),
        dateFin: formatDateForInput(subscription.dateFin),
      });
    }
  }, [subscription]);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    const newEndDate = calculateEndDate(subData.dateDebut, newType);
    setSubData({ ...subData, type: newType, dateFin: newEndDate });
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier l'abonnement"
      icon={Edit}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(subData);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label>Offre</Label>
            <Select required value={subData.type} onChange={handleTypeChange}>
              <option value="Mensuel">Mensuel</option>
              <option value="Trimestriel">Trimestriel</option>
              <option value="Semestriel">Semestriel</option>
              <option value="Annuel">Annuel</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prix (DH)</Label>
            <Input
              type="number"
              step="0.01"
              required
              value={subData.prix}
              onChange={(e) => setSubData({ ...subData, prix: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={subData.statut}
              onChange={(e) =>
                setSubData({ ...subData, statut: e.target.value })
              }
            >
              <option value="Active">Active</option>
              <option value="Suspendu">Suspendu</option>
              <option value="Expiré">Expiré</option>
              <option value="Annulé">Annulé</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Début</Label>
            <Input
              type="date"
              required
              value={subData.dateDebut}
              onChange={(e) =>
                setSubData({ ...subData, dateDebut: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Date Fin</Label>
            <Input
              type="date"
              required
              value={subData.dateFin}
              onChange={(e) =>
                setSubData({ ...subData, dateFin: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// --- Component: Delete Subscription Modal ---
const DeleteSubscriptionModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-sm p-6 text-center shadow-lg border-border">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          Supprimer l'abonnement ?
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Cette action est irréversible. Toutes les données associées seront
          perdues.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            Supprimer
          </Button>
        </div>
      </Card>
    </div>
  );
};

// --- Main Component ---
const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({
    isOpen: false,
    subscription: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    subscriptionId: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Auth Header
  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchClientDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/clients/${id}`,
        authHeader,
      );
      setClient(response.data.data || response.data);
    } catch (err) {
      if (err.response?.status === 404) setError("Client introuvable.");
      else if (err.response?.status === 403) setError("Accès refusé.");
      else setError("Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [id, authHeader]);

  // --- Handlers (Logic Unchanged) ---
  const handleAddSubscription = async (subData) => {
    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const payload = {
        ...subData,
        client_id: client.id,
        employee_id: user?.id,
      };
      const response = await axios.post(
        `${API_BASE_URL}/abonnements`,
        payload,
        authHeader,
      );
      const newSub = response.data.data || { ...payload, id: Date.now() };
      setClient((prev) => ({
        ...prev,
        abonnements: [newSub, ...(prev.abonnements || [])],
      }));
      toast.success("Abonnement créé avec succès !");
      setIsAddModalOpen(false);
    } catch (err) {
      toast.error("Erreur lors de la création.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSubscription = async (updatedData) => {
    setIsSaving(true);
    try {
      await axios.put(
        `${API_BASE_URL}/abonnements/${updatedData.id}`,
        updatedData,
        authHeader,
      );
      setClient((prev) => ({
        ...prev,
        abonnements: prev.abonnements.map((sub) =>
          sub.id === updatedData.id ? { ...sub, ...updatedData } : sub,
        ),
      }));
      toast.success("Abonnement mis à jour !");
      setEditModal({ isOpen: false, subscription: null });
    } catch (err) {
      toast.error("Erreur lors de la modification.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubscription = async () => {
    try {
      await axios.delete(
        `${API_BASE_URL}/abonnements/${deleteModal.subscriptionId}`,
        authHeader,
      );
      setClient((prev) => ({
        ...prev,
        abonnements: prev.abonnements.filter(
          (sub) => sub.id !== deleteModal.subscriptionId,
        ),
      }));
      toast.success("Abonnement supprimé.");
      setDeleteModal({ isOpen: false, subscriptionId: null });
    } catch (err) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const toggleStatus = async (sub) => {
    const newStatus = sub.statut === "Active" ? "Suspendu" : "Active";
    try {
      await axios.put(
        `${API_BASE_URL}/abonnements/${sub.id}`,
        { statut: newStatus },
        authHeader,
      );
      setClient((prev) => ({
        ...prev,
        abonnements: prev.abonnements.map((s) =>
          s.id === sub.id ? { ...s, statut: newStatus } : s,
        ),
      }));
      toast.success(`Statut modifié : ${newStatus}`);
    } catch (err) {
      toast.error("Erreur lors du changement de statut.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  if (error || !client)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Oops!</h2>
          <p className="text-destructive font-medium">{error || "Erreur"}</p>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="mt-4"
          >
            Retour
          </Button>
        </div>
      </div>
    );

  const abonnements = client.abonnements || [];
  const activeSubs = abonnements.filter((sub) =>
    ["active", "actif"].includes(sub.statut?.toLowerCase()),
  ).length;
  const totalSpent = abonnements.reduce(
    (acc, sub) => acc + parseFloat(sub.prix || 0),
    0,
  );
  const sortedSubs = [...abonnements].sort(
    (a, b) => new Date(b.dateDebut) - new Date(a.dateDebut),
  );
  const latestSub = sortedSubs.length > 0 ? sortedSubs[0] : null;
  const avatarStyle = getAvatarColor(client.nom);

  return (
    <div className="min-h-screen bg-muted/20 font-sans text-foreground pb-20">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--color-card)",
            color: "var(--color-foreground)",
            border: "1px solid var(--color-border)",
          },
        }}
      />

      <AddSubscriptionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubscription}
        clientName={client.nom}
        isSaving={isSaving}
      />
      <EditSubscriptionModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, subscription: null })}
        onSubmit={handleEditSubscription}
        subscription={editModal.subscription}
        isSaving={isSaving}
      />
      <DeleteSubscriptionModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, subscriptionId: null })}
        onConfirm={handleDeleteSubscription}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {client.nom}
              </h1>
              <p className="text-muted-foreground text-sm mt-1.5 flex items-center gap-2">
                <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground">
                  ID: #{client.id}
                </span>
                {client.employee && (
                  <span className="text-xs">
                    • Géré par {client.employee.nom}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchClientDetails}
              className="gap-2"
            >
              <RefreshCw size={16} /> Actualiser
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <Plus size={16} /> Nouvel Abonnement
            </Button>
          </div>
        </div>

        {/* --- Stats Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Dépensé"
            value={`${totalSpent.toLocaleString()} DH`}
            icon={DollarSign}
            subtext="Revenu total généré"
          />
          <StatCard
            title="Abonnements Actifs"
            value={activeSubs}
            icon={Activity}
            subtext="Abonnements en cours"
          />
          <StatCard
            title="Dernière Activité"
            value={
              latestSub
                ? new Date(latestSub.dateDebut).toLocaleDateString()
                : "—"
            }
            icon={Calendar}
            subtext="Date du dernier ajout"
          />
        </div>

        {/* --- Main Content Split --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* --- Left: Profile Info --- */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shadow-sm ${avatarStyle}`}
                  >
                    {client.nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{client.nom}</h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/15 text-success mt-1">
                      Client Vérifié
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="group flex items-start gap-3 text-sm">
                    <Mail
                      size={18}
                      className="text-muted-foreground mt-0.5 group-hover:text-primary transition-colors"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase">
                        Email
                      </p>
                      <p className="font-medium">{client.email}</p>
                    </div>
                  </div>
                  <div className="group flex items-start gap-3 text-sm">
                    <Phone
                      size={18}
                      className="text-muted-foreground mt-0.5 group-hover:text-primary transition-colors"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase">
                        Téléphone
                      </p>
                      <p className="font-medium">{client.telephone}</p>
                    </div>
                  </div>
                  <div className="group flex items-start gap-3 text-sm">
                    <MapPin
                      size={18}
                      className="text-muted-foreground mt-0.5 group-hover:text-primary transition-colors"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase">
                        Adresse
                      </p>
                      <p className="font-medium">
                        {client.adresse || "Non renseignée"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 px-6 py-3 border-t border-border">
                <p className="text-xs text-center text-muted-foreground">
                  Membre depuis{" "}
                  {new Date(
                    client.created_at || Date.now(),
                  ).toLocaleDateString()}
                </p>
              </div>
            </Card>
          </div>

          {/* --- Right: Subscriptions Table --- */}
          <div className="lg:col-span-8">
            <Card className="flex flex-col h-full overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Package className="text-muted-foreground" size={18} />{" "}
                  Historique des abonnements
                </h3>
              </div>

              {sortedSubs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-bold text-sm">Aucun abonnement trouvé</h4>
                  <p className="text-muted-foreground text-xs mt-1 mb-4 max-w-xs mx-auto">
                    Ce client n'a pas encore d'abonnement actif ou passé.
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    Créer un abonnement
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Offre
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Prix
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Période
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sortedSubs.map((sub) => (
                        <tr
                          key={sub.id}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-md bg-primary/10 text-primary">
                                <CreditCard size={14} />
                              </span>
                              <span className="font-medium text-sm">
                                {sub.type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-sm">
                            {parseFloat(sub.prix).toFixed(2)}{" "}
                            <span className="text-muted-foreground text-xs">
                              DH
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-xs">
                              <span className="font-medium">
                                {new Date(sub.dateDebut).toLocaleDateString()}
                              </span>
                              <span className="text-muted-foreground text-[10px] mt-0.5">
                                au {new Date(sub.dateFin).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusStyle(sub.statut)}`}
                            >
                              {sub.statut}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setEditModal({
                                    isOpen: true,
                                    subscription: sub,
                                  })
                                }
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                              >
                                <Edit size={16} />
                              </Button>

                              {sub.statut === "Active" ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleStatus(sub)}
                                  className="h-8 w-8 text-muted-foreground hover:text-warning"
                                >
                                  <PauseCircle size={16} />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleStatus(sub)}
                                  className="h-8 w-8 text-muted-foreground hover:text-success"
                                >
                                  <CheckCircle size={16} />
                                </Button>
                              )}

                              <div className="w-px h-4 bg-border mx-1"></div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setDeleteModal({
                                    isOpen: true,
                                    subscriptionId: sub.id,
                                  })
                                }
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
