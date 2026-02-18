import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import api from "../api/axiosConfig";
import showToast from "../components/ui/Toast";
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
  Edit,
  Trash2,
  RefreshCw,
  Download,
  XCircle,
  History,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { TransactionsTable } from "../components/DataTable";
import { calculateEndDate, formatDateForInput } from "../utils/helpers";
import {
  updateSubscription,
  deleteSubscription,
  updateSubscriptionStatus,
  renewSubscription,
} from "../features/subscriptions/subscriptionsSlice";

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

const SubscriptionDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [renewModal, setRenewModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [editForm, setEditForm] = useState({
    type: "",
    prix: "",
    statut: "",
    dateDebut: "",
    dateFin: "",
  });
  const [renewForm, setRenewForm] = useState({
    type: "",
    prix: "",
    dateDebut: "",
    dateFin: "",
  });

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/abonnements/${id}`);
      const data = res.data.data || res.data;
      if (!data) throw new Error("Not found");
      setSubscription(data);
      setEditForm({
        type: data.type,
        prix: data.prix,
        statut: data.statut,
        dateDebut: formatDateForInput(data.dateDebut),
        dateFin: formatDateForInput(data.dateFin),
      });
    } catch (err) {
      setError(
        err.response?.status === 404
          ? t("common.noResults")
          : t("common.error"),
      );
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (editForm.dateDebut && editModal)
      setEditForm((p) => ({
        ...p,
        dateFin: calculateEndDate(p.dateDebut, p.type),
      }));
  }, [editForm.type, editForm.dateDebut, editModal]);

  useEffect(() => {
    if (renewForm.dateDebut && renewModal)
      setRenewForm((p) => ({
        ...p,
        dateFin: calculateEndDate(p.dateDebut, p.type),
      }));
  }, [renewForm.type, renewForm.dateDebut, renewModal]);

  const handleEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const loadingId = showToast.loading(t("common.updating"));
    try {
      await dispatch(
        updateSubscription({ id: subscription.id, data: editForm }),
      ).unwrap();
      setSubscription((prev) => ({ ...prev, ...editForm }));
      showToast.dismiss(loadingId);
      showToast.success(t("subscriptions.subscriptionUpdated"));
      setEditModal(false);
    } catch {
      showToast.dismiss(loadingId);
      showToast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const loadingId = showToast.loading("Renouvellement en cours...");
    try {
      await dispatch(
        renewSubscription({ id: subscription.id, data: renewForm }),
      ).unwrap();
      showToast.dismiss(loadingId);
      showToast.success("Abonnement renouvelé !");
      setRenewModal(false);
      fetchSubscription();
    } catch {
      showToast.dismiss(loadingId);
      showToast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelConfirm = async () => {
    const loadingId = showToast.loading("Annulation...");
    try {
      const res = await api.put(`/abonnements/${subscription.id}/cancel`);
      setSubscription(res.data.data);
      showToast.dismiss(loadingId);
      showToast.success("Abonnement annulé");
      setCancelModal(false);
      fetchSubscription();
    } catch {
      showToast.dismiss(loadingId);
      showToast.error("Erreur");
    }
  };

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    const toastId = showToast.loading("Génération du reçu...");
    try {
      const response = await api.get(
        `/abonnements/${subscription.id}/receipt`,
        { responseType: "blob" },
      );
      if (response.data) {
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Reçu_${subscription.client?.nom || "Client"}.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast.success("Téléchargé", { id: toastId });
      }
    } catch {
      showToast.error("Erreur", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = subscription.statut === "Active" ? "Suspendu" : "Active";
    const loadingId = showToast.loading("Mise à jour...");
    try {
      await dispatch(
        updateSubscriptionStatus({ id: subscription.id, statut: newStatus }),
      ).unwrap();
      setSubscription((prev) => ({ ...prev, statut: newStatus }));
      showToast.dismiss(loadingId);
      showToast.success(`Statut: ${newStatus}`);
    } catch {
      showToast.dismiss(loadingId);
      showToast.error("Erreur");
    }
  };

  const handleDelete = async () => {
    const loadingId = showToast.loading("Suppression...");
    try {
      await dispatch(deleteSubscription(subscription.id)).unwrap();
      showToast.dismiss(loadingId);
      showToast.success("Supprimé");
      navigate(-1);
    } catch {
      showToast.dismiss(loadingId);
      showToast.error("Erreur");
    }
  };

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  if (error || !subscription)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle size={40} className="text-destructive" />
        <h2>{error || t("common.error")}</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-secondary rounded-md text-sm"
        >
          {t("common.back")}
        </button>
      </div>
    );

  const client = subscription.client || {};
  const daysLeft = Math.ceil(
    (new Date(subscription.dateFin) - new Date()) / (1000 * 60 * 60 * 24),
  );
  const isExpired = daysLeft < 0 && subscription.statut !== "Annulé";
  const displayStatus = isExpired ? "Expiré" : subscription.statut;
  const isRenewable = daysLeft <= 7;
  const isEditable = !["annulé", "expiré"].includes(
    displayStatus?.toLowerCase(),
  );

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      <div className="border-b border-border pb-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                {t("subscriptions.details")} #{subscription.id}{" "}
                <StatusBadge status={displayStatus} size="lg" />
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t("subscriptions.createdOn")}{" "}
                {new Date(subscription.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
              className="px-4 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-lg flex items-center gap-2 font-medium text-sm transition-all shadow-sm"
            >
              {isDownloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}{" "}
              Reçu
            </button>
            {isRenewable && (
              <button
                onClick={() => setRenewModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center gap-2 font-medium text-sm transition-all shadow-sm"
              >
                <RefreshCw size={16} /> Renouveler
              </button>
            )}
            {isEditable && (
              <>
                <button
                  onClick={toggleStatus}
                  className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 border transition-colors ${displayStatus === "Active" ? "bg-warning/10 text-warning border-warning/30" : "bg-success/10 text-success border-success/30"}`}
                >
                  {displayStatus === "Active" ? (
                    <PauseCircle size={16} />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  {displayStatus === "Active"
                    ? t("subscriptions.suspend")
                    : t("subscriptions.activate")}
                </button>
                <button
                  onClick={() => setCancelModal(true)}
                  className="flex-1 md:flex-none justify-center px-4 py-2 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg font-medium text-sm flex items-center gap-2"
                >
                  <XCircle size={16} /> Annuler
                </button>
                <button
                  onClick={() => setEditModal(true)}
                  className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg transition-colors"
                >
                  <Edit size={18} />
                </button>
              </>
            )}
            <button
              onClick={() => setDeleteModal(true)}
              className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg border border-transparent transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText size={18} className="text-primary" />{" "}
                {t("subscriptions.details")}
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-border bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Offre
                </p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {subscription.type}
                </p>
              </div>
              <div className="p-4 border border-border bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Prix
                </p>
                <p className="text-lg font-bold text-success mt-1">
                  {parseFloat(subscription.prix).toFixed(2)} DH
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
              <History size={18} className="text-primary" />
              <h3 className="font-semibold">Historique des Transactions</h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <TransactionsTable data={subscription.transactions || []} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
              <User size={18} className="text-primary" />
              <h3 className="font-semibold">{t("subscriptions.clientInfo")}</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                  {client.nom?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-tight">
                    {client.nom}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ID: #{client.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/clients/${client.id}`)}
                className="w-full px-4 py-2.5 text-sm font-medium border border-input rounded-lg hover:bg-accent transition-colors"
              >
                {t("subscriptions.viewFullProfile")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title={t("common.editSubscription")}
        icon={Edit}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Offre</label>
              <select
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
                value={editForm.type}
                onChange={(e) =>
                  setEditForm({ ...editForm, type: e.target.value })
                }
              >
                {[
                  "Mensuel",
                  "Trimestriel",
                  "Semestriel",
                  "Annuel",
                  "Premium",
                ].map((o) => (
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
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
                value={editForm.prix}
                onChange={(e) =>
                  setEditForm({ ...editForm, prix: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
                value={editForm.statut}
                onChange={(e) =>
                  setEditForm({ ...editForm, statut: e.target.value })
                }
              >
                <option value="Active">Actif</option>
                <option value="Suspendu">Suspendu</option>
                <option value="Expiré">Expiré</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setEditModal(false)}
              className="px-4 py-2 border border-input rounded-lg text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={renewModal}
        onClose={() => setRenewModal(false)}
        title="Renouveler l'abonnement"
        icon={RefreshCw}
      >
        <form onSubmit={handleRenew} className="space-y-5">
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-sm text-primary flex items-start gap-3">
            <RefreshCw size={18} className="shrink-0 mt-0.5" />
            <p>
              Le renouvellement prolongera l'abonnement et créera une nouvelle
              transaction financière.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Offre</label>
              <select
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
                value={renewForm.type}
                onChange={(e) =>
                  setRenewForm({ ...renewForm, type: e.target.value })
                }
              >
                {[
                  "Mensuel",
                  "Trimestriel",
                  "Semestriel",
                  "Annuel",
                  "Premium",
                ].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Montant Payé (DH)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
                value={renewForm.prix}
                onChange={(e) =>
                  setRenewForm({ ...renewForm, prix: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Début</label>
              <input
                type="date"
                required
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
                value={renewForm.dateDebut}
                onChange={(e) =>
                  setRenewForm({ ...renewForm, dateDebut: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fin</label>
              <input
                type="date"
                required
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
                value={renewForm.dateFin}
                onChange={(e) =>
                  setRenewForm({ ...renewForm, dateFin: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setRenewModal(false)}
              className="px-4 py-2 border border-input rounded-lg text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-sm transition-all hover:bg-primary/90"
            >
              Confirmer
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        onConfirm={handleCancelConfirm}
        title="Annuler l'abonnement"
        message="Voulez-vous vraiment annuler cet abonnement définitivement ?"
        icon={XCircle}
        confirmLabel="Oui, annuler"
      />
      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title={t("common.deleteSubscription")}
        message="Attention : Action réservée aux erreurs de saisie. Un remboursement sera généré automatiquement."
      />
    </div>
  );
};

export default SubscriptionDetails;
