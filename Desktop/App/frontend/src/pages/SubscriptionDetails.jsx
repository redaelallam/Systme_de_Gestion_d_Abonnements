import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
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
  Edit,
  Trash2,
  RefreshCw,
  Download,
  XCircle, // تمت إضافة أيقونة الإلغاء
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
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
    try {
      await dispatch(
        updateSubscription({ id: subscription.id, data: editForm }),
      ).unwrap();
      setSubscription((prev) => ({ ...prev, ...editForm }));
      toast.success(t("subscriptions.subscriptionUpdated"));
      setEditModal(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // بعد التجديد، يرجع الباك-إند الاشتراك الجديد
      const result = await dispatch(
        renewSubscription({ id: subscription.id, data: renewForm }),
      ).unwrap();
      toast.success("Abonnement renouvelé avec succès");
      setRenewModal(false);
      // توجيه المستخدم لصفحة الاشتراك الجديد
      navigate(`/subscriptions/${result.id}`, { replace: true });
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  // دالة الإلغاء الجديدة
  const handleCancel = async () => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir annuler cet abonnement définitivement ?",
      )
    )
      return;
    try {
      const res = await api.put(`/abonnements/${subscription.id}/cancel`);
      setSubscription(res.data.data);
      toast.success("Abonnement annulé avec succès");
    } catch (e) {
      toast.error("Erreur lors de l'annulation");
    }
  };

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    const toastId = toast.loading(
      t("common.loading") || "Génération du reçu...",
    );

    try {
      const response = await api.get(
        `/abonnements/${subscription.id}/receipt`,
        {
          responseType: "blob",
        },
      );

      if (response.data) {
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" }),
        );
        const link = document.createElement("a");
        link.href = url;

        const clientName = subscription.client?.nom || "Client";
        const fileName = `Reçu_${clientName}_${subscription.id}.pdf`;
        link.setAttribute("download", fileName);

        document.body.appendChild(link);
        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);

        toast.success("Reçu téléchargé avec succès", { id: toastId });
      }
    } catch (error) {
      console.error("Download error:", error);

      if (error.response && error.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            toast.error(errorData.message || "Erreur lors de la génération.", {
              id: toastId,
            });
          } catch (e) {
            toast.error("Erreur serveur : Vérifiez l'installation de DomPDF.", {
              id: toastId,
            });
          }
        };
        reader.readAsText(error.response.data);
      } else {
        toast.error("Erreur lors de la connexion au serveur.", { id: toastId });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = subscription.statut === "Active" ? "Suspendu" : "Active";
    try {
      await dispatch(
        updateSubscriptionStatus({ id: subscription.id, statut: newStatus }),
      ).unwrap();
      setSubscription((prev) => ({ ...prev, statut: newStatus }));
      toast.success(`${t("common.status")}: ${newStatus}`);
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteSubscription(subscription.id)).unwrap();
      toast.success(t("subscriptions.subscriptionDeleted"));
      navigate(-1);
    } catch {
      toast.error(t("common.error"));
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
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-xl font-bold">{error || t("common.error")}</h2>
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

  const openRenewModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setRenewForm({
      type: subscription.type,
      prix: subscription.prix,
      dateDebut: today,
      dateFin: calculateEndDate(today, subscription.type),
    });
    setRenewModal(true);
  };

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      <Toaster position="top-right" />

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
                {new Date(subscription.created_at).toLocaleDateString()} •{" "}
                {t("subscriptions.lastUpdate")}{" "}
                {new Date(subscription.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
              className="px-4 py-2 bg-foreground text-background hover:bg-foreground/90 rounded-lg flex items-center gap-2 font-medium text-sm transition-all shadow-sm disabled:opacity-70"
            >
              {isDownloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Reçu
            </button>

            {isRenewable && (
              <button
                onClick={openRenewModal}
                className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 rounded-lg flex items-center gap-2 font-medium text-sm transition-all shadow-sm"
              >
                <RefreshCw size={16} /> Renouveler
              </button>
            )}

            {/* إخفاء هذه الأزرار إذا كان الاشتراك منتهياً أو ملغى */}
            {isEditable && (
              <>
                <button
                  onClick={toggleStatus}
                  className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 border transition-colors ${
                    displayStatus === "Active"
                      ? "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20"
                      : "bg-success/10 text-success border-success/30 hover:bg-success/20"
                  }`}
                >
                  {displayStatus === "Active" ? (
                    <>
                      <PauseCircle size={16} /> {t("subscriptions.suspend")}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> {t("subscriptions.activate")}
                    </>
                  )}
                </button>

                {/* زر الإلغاء الجديد */}
                <button
                  onClick={handleCancel}
                  className="flex-1 md:flex-none justify-center px-4 py-2 bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                >
                  <XCircle size={16} /> Annuler
                </button>

                <button
                  onClick={() => setEditModal(true)}
                  className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 border border-transparent transition-colors"
                >
                  <Edit size={18} />
                </button>
              </>
            )}

            <button
              onClick={() => setDeleteModal(true)}
              className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 border border-transparent transition-colors"
              title="Supprimer (Correction erreur)"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: CreditCard,
            label: t("subscriptions.offerType"),
            value: subscription.type,
            color: "text-primary",
          },
          {
            icon: DollarSign,
            label: t("common.price"),
            value: `${parseFloat(subscription.prix).toFixed(2)} DH`,
            color: "text-success",
          },
          {
            icon: Clock,
            label: t("dashboard.daysLeft"),
            value: isExpired
              ? t("subscriptions.expired")
              : `${daysLeft} ${t("dashboard.daysLeft").toLowerCase()}`,
            color:
              daysLeft <= 7
                ? "text-destructive"
                : daysLeft <= 30
                  ? "text-warning"
                  : "text-foreground",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-muted">
                <item.icon size={18} className="text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {item.label}
            </p>
            <p className={`text-lg font-bold mt-1 ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
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
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: Calendar,
                    label: t("subscriptions.startDate"),
                    value: new Date(
                      subscription.dateDebut,
                    ).toLocaleDateString(),
                  },
                  {
                    icon: Clock,
                    label: t("subscriptions.endDate"),
                    value: new Date(subscription.dateFin).toLocaleDateString(),
                    urgent: isExpired || daysLeft <= 7,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${item.urgent ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/30"}`}
                  >
                    <div className="p-2.5 rounded-lg bg-background border border-border">
                      <item.icon size={18} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-1">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {isExpired && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <AlertCircle
                    size={20}
                    className="text-destructive shrink-0"
                  />
                  <p className="text-sm text-destructive font-medium">
                    {t("subscriptions.expiredWarning")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2">
                <User size={18} className="text-primary" />{" "}
                {t("subscriptions.clientInfo")}
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shadow-sm">
                  {client.nom ? client.nom.charAt(0).toUpperCase() : "?"}
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-tight">
                    {client.nom || "—"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ID: #{client.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/clients/${client.id}`)}
                className="w-full mt-5 px-4 py-2.5 text-sm font-medium border border-input rounded-lg hover:bg-accent transition-colors text-center"
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
              <label className="block text-sm font-medium mb-1">
                {t("common.offer")}
              </label>
              <select
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
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
                {t("common.price")} (DH)
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
              <label className="block text-sm font-medium mb-1">
                {t("common.status")}
              </label>
              <select
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
                value={editForm.statut}
                onChange={(e) =>
                  setEditForm({ ...editForm, statut: e.target.value })
                }
              >
                <option value="Active">{t("subscriptions.active")}</option>
                <option value="Suspendu">{t("subscriptions.suspended")}</option>
                <option value="Expiré">{t("subscriptions.expired")}</option>
                <option value="Annulé">{t("subscriptions.cancelled")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("subscriptions.startDate")}
              </label>
              <input
                type="date"
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
                value={editForm.dateDebut}
                onChange={(e) =>
                  setEditForm({ ...editForm, dateDebut: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("subscriptions.endDate")}
              </label>
              <input
                type="date"
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
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
              className="px-4 py-2 border border-input rounded-lg text-sm hover:bg-accent"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 text-sm font-medium disabled:opacity-70"
            >
              {isSaving && <Loader2 className="animate-spin" size={16} />}{" "}
              {t("common.save")}
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
        <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg mb-4 text-sm text-primary">
          Le renouvellement clôturera cet abonnement et créera un
          <strong> nouveau dossier d'abonnement</strong> avec une nouvelle
          transaction financière.
        </div>
        <form onSubmit={handleRenew} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                {t("common.offer")}
              </label>
              <select
                className="w-full p-2.5 bg-background border border-input rounded-lg text-sm"
                value={renewForm.type}
                onChange={(e) =>
                  setRenewForm({ ...renewForm, type: e.target.value })
                }
              >
                {["Mensuel", "Trimestriel", "Semestriel", "Annuel"].map((o) => (
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
              <label className="block text-sm font-medium mb-1">
                Nouveau Début
              </label>
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
              <label className="block text-sm font-medium mb-1">
                Nouvelle Fin
              </label>
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
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setRenewModal(false)}
              className="px-4 py-2 border border-input rounded-lg text-sm hover:bg-accent"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 text-sm font-medium disabled:opacity-70 shadow-sm"
            >
              {isSaving && <Loader2 className="animate-spin" size={16} />}{" "}
              Confirmer
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title={t("common.deleteSubscription")}
        message="Attention : Cette action est réservée aux erreurs de saisie. Un remboursement automatique sera généré si l'abonnement possède des transactions associées."
      />
    </div>
  );
};

export default SubscriptionDetails;
