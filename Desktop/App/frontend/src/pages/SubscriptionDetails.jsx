import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api/axiosConfig";
import { Toaster, toast } from "react-hot-toast";
import {
  Calendar,
  CreditCard,
  ArrowLeft,
  Loader2,
  User,
  CheckCircle,
  PauseCircle,
  AlertCircle,
  Clock,
  FileText,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { calculateEndDate, formatDateForInput } from "../utils/helpers";

// استيراد الأكشنز
import {
  updateSubscription,
  deleteSubscription,
  updateSubscriptionStatus,
} from "../features/subscriptions/subscriptionsSlice";

/* --- مكونات مساعدة --- */
const DetailItem = ({ label, value, icon: Icon, className = "" }) => (
  <div
    className={`flex items-center gap-4 p-4 rounded-lg border border-border bg-card/50 ${className}`}
  >
    <div className="p-3 rounded-full bg-secondary text-secondary-foreground">
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status, size = "md" }) => {
  const s = status?.toLowerCase() || "";
  let styles = "bg-secondary text-secondary-foreground";
  if (["active", "actif"].includes(s))
    styles = "bg-success/15 text-success border-success/20";
  else if (["suspendu", "suspended"].includes(s))
    styles = "bg-warning/15 text-warning border-warning/20";
  else if (["expiré", "expired", "annulé"].includes(s))
    styles = "bg-destructive/15 text-destructive border-destructive/20";

  const sizeClasses =
    size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${styles} ${sizeClasses}`}
    >
      {status}
    </span>
  );
};

/* --- المكون الرئيسي --- */

const SubscriptionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    type: "",
    prix: "",
    statut: "",
    dateDebut: "",
    dateFin: "",
  });

  // --- جلب بيانات الاشتراك ---
  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/abonnements/${id}`);
      const data = res.data.data || res.data;

      if (!data) throw new Error("Subscription not found");

      setSubscription(data);

      // إعداد فورم التعديل مسبقاً
      setEditForm({
        type: data.type,
        prix: data.prix,
        statut: data.statut,
        dateDebut: formatDateForInput(data.dateDebut),
        dateFin: formatDateForInput(data.dateFin),
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.status === 404
          ? "Abonnement introuvable"
          : "Erreur serveur",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // تحديث تاريخ الانتهاء تلقائياً عند التعديل
  useEffect(() => {
    if (editForm.dateDebut && editModal)
      setEditForm((p) => ({
        ...p,
        dateFin: calculateEndDate(p.dateDebut, p.type),
      }));
  }, [editForm.type, editForm.dateDebut, editModal]);

  // --- Actions ---

  const handleEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await dispatch(
        updateSubscription({ id: subscription.id, data: editForm }),
      ).unwrap();

      setSubscription((prev) => ({ ...prev, ...editForm }));
      toast.success("Abonnement mis à jour");
      setEditModal(false);
    } catch (err) {
      toast.error("Erreur lors de la modification");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = subscription.statut === "Active" ? "Suspendu" : "Active";
    try {
      await dispatch(
        updateSubscriptionStatus({ id: subscription.id, statut: newStatus }),
      ).unwrap();
      setSubscription((prev) => ({ ...prev, statut: newStatus }));
      toast.success(`Statut: ${newStatus}`);
    } catch {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteSubscription(subscription.id)).unwrap();
      toast.success("Abonnement supprimé");
      navigate(-1); // العودة للخلف بعد الحذف
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  // --- Render ---

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  if (error || !subscription)
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 text-center">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-xl font-bold">{error || "Erreur"}</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-secondary rounded-md"
        >
          Retour
        </button>
      </div>
    );

  const client = subscription.client || {};
  const isExpired =
    new Date(subscription.dateFin) < new Date() &&
    subscription.statut !== "Annulé";
  const displayStatus = isExpired ? "Expiré" : subscription.statut;

  return (
    <div className="min-h-screen bg-background text-foreground pb-12 animate-in fade-in duration-500">
      <Toaster position="top-right" />

      {/* Header with Breadcrumb & Actions */}
      <div className="bg-card border-b border-border mb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  Abonnement #{subscription.id}
                  <StatusBadge status={displayStatus} size="lg" />
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Crée le{" "}
                  {new Date(subscription.created_at).toLocaleDateString()} •
                  Dernière mise à jour le{" "}
                  {new Date(subscription.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={toggleStatus}
                className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 border transition-colors ${
                  displayStatus === "Active"
                    ? "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20 hover:text-warning hover:border-warning/40"
                    : "bg-green-300/10 text-green-600 hover:bg-green-700/20"
                }`}
              >
                {displayStatus === "Active" ? (
                  <>
                    <PauseCircle size={16} /> Suspendre
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Activer
                  </>
                )}
              </button>

              <button
                onClick={() => setEditModal(true)}
                className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 border border-transparent"
              >
                <Edit size={18} />
              </button>

              <button
                onClick={() => setDeleteModal(true)}
                className="px-3 py-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 border border-transparent"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Info Card */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText size={18} className="text-primary" /> Détails de
                l'abonnement
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem
                label="Type d'offre"
                value={subscription.type}
                icon={Shield}
              />
              <DetailItem
                label="Prix"
                value={`${parseFloat(subscription.prix).toFixed(2)} DH`}
                icon={DollarSign}
              />
              <DetailItem
                label="Date de début"
                value={new Date(subscription.dateDebut).toLocaleDateString(
                  "fr-FR",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
                icon={Calendar}
              />
              <DetailItem
                label="Date de fin"
                value={new Date(subscription.dateFin).toLocaleDateString(
                  "fr-FR",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
                icon={Clock}
                className={
                  isExpired ? "border-destructive/30 bg-destructive/5" : ""
                }
              />
            </div>
          </div>
        </div>

        {/* Sidebar Column (Client & Meta) */}
        <div className="space-y-6">
          {/* Client Card */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2">
                <User size={18} className="text-primary" /> Informations Client
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {client.nom ? client.nom.charAt(0).toUpperCase() : "?"}
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-tight">
                    {client.nom || "Inconnu"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    ID Client: #{client.id}
                  </p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-6">
                    <CreditCard size={16} />
                  </span>
                  <span className="font-medium">
                    {client.email || "Pas d'email"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {/* يمكنك إضافة المزيد من بيانات العميل هنا إذا توفرت */}
                </div>
                <button
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="w-full mt-4 px-4 py-2 text-xs font-medium border border-input rounded-md hover:bg-accent transition-colors text-center block"
                >
                  Voir le profil complet
                </button>
              </div>
            </div>
          </div>

          {/* Employee / Meta Card */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Gestion
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé par:</span>
                <span className="font-medium">
                  {subscription.employee_id
                    ? `Employé #${subscription.employee_id}`
                    : "Système"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernière modif:</span>
                <span className="font-medium">
                  {new Date(subscription.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Edit Modal --- */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Modifier l'abonnement"
        icon={Edit}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Offre</label>
              <select
                className="w-full p-2 bg-background border rounded-md"
                value={editForm.type}
                onChange={(e) =>
                  setEditForm({ ...editForm, type: e.target.value })
                }
              >
                {["Mensuel", "Trimestriel", "Semestriel", "Annuel"].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Prix (DH)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 bg-background border rounded-md"
                value={editForm.prix}
                onChange={(e) =>
                  setEditForm({ ...editForm, prix: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                className="w-full p-2 bg-background border rounded-md"
                value={editForm.statut}
                onChange={(e) =>
                  setEditForm({ ...editForm, statut: e.target.value })
                }
              >
                <option value="Active">Active</option>
                <option value="Suspendu">Suspendu</option>
                <option value="Expiré">Expiré</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Date Début
              </label>
              <input
                type="date"
                className="w-full p-2 bg-background border rounded-md"
                value={editForm.dateDebut}
                onChange={(e) =>
                  setEditForm({ ...editForm, dateDebut: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date Fin</label>
              <input
                type="date"
                className="w-full p-2 bg-background border rounded-md"
                value={editForm.dateFin}
                onChange={(e) =>
                  setEditForm({ ...editForm, dateFin: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setEditModal(false)}
              className="px-4 py-2 border rounded-md"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-2"
            >
              {isSaving && <Loader2 className="animate-spin" size={16} />}{" "}
              Sauvegarder
            </button>
          </div>
        </form>
      </Modal>

      {/* --- Delete Confirmation --- */}
      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer l'abonnement"
        message="Cette action supprimera définitivement cet abonnement. Continuer ?"
      />
    </div>
  );
};

export default SubscriptionDetails;
