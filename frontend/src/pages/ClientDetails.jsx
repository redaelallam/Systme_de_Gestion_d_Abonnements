import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { fetchClientById } from "../features/clients/clientsSlice";
import { fetchDashboardData } from "../features/dashboard/dashboardSlice";
import { useTranslation } from "react-i18next";
import api from "../api/axiosConfig";
import showToast from "../components/ui/Toast";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ArrowLeft,
  Loader2,
  Package,
  DollarSign,
  Activity,
  Plus,
  Edit,
  RefreshCw,
  Trash2,
  CheckCircle,
  PauseCircle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  XCircle,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import {
  getStatusStyle,
  getAvatarColor,
  calculateEndDate,
  formatDateForInput,
} from "../utils/helpers";

const StatCard = ({ title, value, icon: Icon, subtext }) => (
  <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-sm hover:border-primary/50 transition-all group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight mt-1">{value}</h3>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </div>
      <div className="p-3 rounded-md bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const ClientDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    currentClient: client,
    loading,
    error,
  } = useAppSelector((s) => s.clients);
  const [localClient, setLocalClient] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, sub: null });
  const [renewModal, setRenewModal] = useState({ isOpen: false, sub: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const [cancelModal, setCancelModal] = useState({ isOpen: false, sub: null });

  const [isSaving, setIsSaving] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "desc",
  });

  const [subForm, setSubForm] = useState({
    type: "Mensuel",
    prix: "",
    statut: "Active",
    dateDebut: new Date().toISOString().split("T")[0],
    dateFin: "",
  });
  const [editForm, setEditForm] = useState({
    id: null,
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

  useEffect(() => {
    dispatch(fetchClientById(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (client) setLocalClient(client);
  }, [client]);

  useEffect(() => {
    if (subForm.dateDebut)
      setSubForm((p) => ({
        ...p,
        dateFin: calculateEndDate(p.dateDebut, p.type),
      }));
  }, [subForm.type, subForm.dateDebut]);

  useEffect(() => {
    if (editModal.sub) {
      setEditForm({
        id: editModal.sub.id,
        type: editModal.sub.type,
        prix: editModal.sub.prix,
        statut: editModal.sub.statut,
        dateDebut: formatDateForInput(editModal.sub.dateDebut),
        dateFin: formatDateForInput(editModal.sub.dateFin),
      });
    }
  }, [editModal.sub]);

  useEffect(() => {
    if (renewForm.dateDebut && renewModal.isOpen) {
      setRenewForm((p) => ({
        ...p,
        dateFin: calculateEndDate(p.dateDebut, p.type),
      }));
    }
  }, [renewForm.type, renewForm.dateDebut, renewModal.isOpen]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  }, []);

  const handleAdd = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSaving(true);
      const loadingId = showToast.loading(
        t("common.processing", "Traitement..."),
      );
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const payload = {
          ...subForm,
          client_id: localClient.id,
          employee_id: user?.id,
        };
        const res = await api.post("/abonnements", payload);
        const newSub = res.data.data || { ...payload, id: Date.now() };
        setLocalClient((p) => ({
          ...p,
          abonnements: [newSub, ...(p.abonnements || [])],
        }));
        showToast.dismiss(loadingId);
        showToast.success(t("subscriptions.subscriptionCreated"));
        setIsAddOpen(false);

        const d = new Date();
        dispatch(
          fetchDashboardData({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
          }),
        );
      } catch (err) {
        showToast.dismiss(loadingId);
        const errorMsg = err.response?.data?.message || t("common.error");
        showToast.error(errorMsg);
      } finally {
        setIsSaving(false);
      }
    },
    [subForm, localClient, t, dispatch],
  );

  const handleEdit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSaving(true);
      const loadingId = showToast.loading(
        t("common.updating", "Mise à jour..."),
      );
      try {
        const { id: subId, ...data } = editForm;
        await api.put(`/abonnements/${subId}`, data);
        setLocalClient((p) => ({
          ...p,
          abonnements: p.abonnements.map((s) =>
            s.id === subId ? { ...s, ...data } : s,
          ),
        }));
        showToast.dismiss(loadingId);
        showToast.success(t("subscriptions.subscriptionUpdated"));
        setEditModal({ isOpen: false, sub: null });

        const d = new Date();
        dispatch(
          fetchDashboardData({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
          }),
        );
      } catch (err) {
        showToast.dismiss(loadingId);
        const errorMsg = err.response?.data?.message || t("common.error");
        showToast.error(errorMsg);
      } finally {
        setIsSaving(false);
      }
    },
    [editForm, t, dispatch],
  );

  const handleRenew = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSaving(true);
      const loadingId = showToast.loading("Renouvellement en cours...");
      try {
        const res = await api.post(
          `/abonnements/${renewModal.sub.id}/renew`,
          renewForm,
        );
        const updatedSub = res.data.data;

        setLocalClient((p) => ({
          ...p,
          abonnements: p.abonnements.map((s) =>
            s.id === renewModal.sub.id ? { ...s, ...updatedSub } : s,
          ),
        }));
        showToast.dismiss(loadingId);
        showToast.success("Abonnement renouvelé avec succès");
        setRenewModal({ isOpen: false, sub: null });

        const d = new Date();
        dispatch(
          fetchDashboardData({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
          }),
        );
      } catch (err) {
        showToast.dismiss(loadingId);
        const errorMsg = err.response?.data?.message || t("common.error");
        showToast.error(errorMsg);
      } finally {
        setIsSaving(false);
      }
    },
    [renewForm, renewModal.sub, t, dispatch],
  );

  const confirmCancelSub = useCallback(async () => {
    if (!cancelModal.sub) return;
    const sub = cancelModal.sub;
    const loadingId = showToast.loading("Annulation en cours...");
    try {
      const res = await api.put(`/abonnements/${sub.id}/cancel`);
      setLocalClient((p) => ({
        ...p,
        abonnements: p.abonnements.map((s) =>
          s.id === sub.id
            ? { ...s, statut: "Annulé", dateFin: res.data.data.dateFin }
            : s,
        ),
      }));
      showToast.dismiss(loadingId);
      showToast.success("Abonnement annulé avec succès");

      const d = new Date();
      dispatch(
        fetchDashboardData({
          year: d.getFullYear(),
          month: d.getMonth() + 1,
        }),
      );
    } catch {
      showToast.dismiss(loadingId);
      showToast.error(t("common.error"));
    }
    setCancelModal({ isOpen: false, sub: null });
  }, [cancelModal.sub, t, dispatch, setCancelModal, setLocalClient]);

  const handleDeleteSub = useCallback(async () => {
    const loadingId = showToast.loading(t("common.deleting", "Suppression..."));
    try {
      await api.delete(`/abonnements/${deleteModal.id}`);
      setLocalClient((p) => ({
        ...p,
        abonnements: p.abonnements.filter((s) => s.id !== deleteModal.id),
      }));
      showToast.dismiss(loadingId);
      showToast.success(t("subscriptions.subscriptionDeleted"));

      const d = new Date();
      dispatch(
        fetchDashboardData({ year: d.getFullYear(), month: d.getMonth() + 1 }),
      );
    } catch {
      showToast.dismiss(loadingId);
      showToast.error(t("common.error"));
    }
    setDeleteModal({ isOpen: false, id: null });
  }, [deleteModal.id, t, dispatch]);

  const toggleStatus = useCallback(
    async (sub) => {
      const newStatus = sub.statut === "Active" ? "Suspendu" : "Active";
      const loadingId = showToast.loading(
        t("common.updating", "Mise à jour..."),
      );
      try {
        await api.put(`/abonnements/${sub.id}`, { statut: newStatus });
        setLocalClient((p) => ({
          ...p,
          abonnements: p.abonnements.map((s) =>
            s.id === sub.id ? { ...s, statut: newStatus } : s,
          ),
        }));
        showToast.dismiss(loadingId);
        showToast.success(`${t("common.status")}: ${newStatus}`);

        const d = new Date();
        dispatch(
          fetchDashboardData({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
          }),
        );
      } catch {
        showToast.dismiss(loadingId);
        showToast.error(t("common.error"));
      }
    },
    [t, dispatch],
  );

  if (loading || (!localClient && !error)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Oops!</h2>
          <p className="text-destructive font-medium">
            {error || t("common.error")}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-background border border-input rounded-md text-sm text-foreground hover:bg-accent"
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  if (!localClient) {
    return null;
  }

  const abonnements = localClient.abonnements || [];
  const activeSubs = abonnements.filter((s) =>
    ["active", "actif"].includes(s.statut?.toLowerCase()),
  ).length;
  const totalSpent = localClient.total_historique_financier || 0;

  const sortedSubs = [...abonnements].sort((a, b) => {
    if (sortConfig.key === "prix") {
      const aVal = parseFloat(a.prix || 0);
      const bVal = parseFloat(b.prix || 0);
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    }
    return new Date(b.dateDebut) - new Date(a.dateDebut);
  });

  const latestSub = [...abonnements].sort(
    (a, b) => new Date(b.dateDebut) - new Date(a.dateDebut),
  )[0];

  const SortIcon = ({ colKey }) => {
    if (sortConfig.key !== colKey)
      return <ArrowUpDown size={12} className="opacity-40" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={12} />
    ) : (
      <ChevronDown size={12} />
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t("common.addSubscription")}
        icon={CreditCard}
        maxWidth="max-w-lg"
      >
        <p className="text-sm text-muted-foreground mb-4">
          {t("subscriptions.for")}:{" "}
          <strong className="text-foreground">{localClient.nom}</strong>
        </p>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("common.offer")}
              </label>
              <select
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                value={subForm.type}
                onChange={(e) =>
                  setSubForm({ ...subForm, type: e.target.value })
                }
              >
                <option value="Mensuel">{t("subscriptions.monthly")}</option>
                <option value="Trimestriel">
                  {t("subscriptions.quarterly")}
                </option>
                <option value="Semestriel">
                  {t("subscriptions.semiAnnual")}
                </option>
                <option value="Annuel">{t("subscriptions.annual")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("common.price")} (DH)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                value={subForm.prix}
                onChange={(e) =>
                  setSubForm({ ...subForm, prix: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("common.status")}
              </label>
              <select
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                value={subForm.statut}
                onChange={(e) =>
                  setSubForm({ ...subForm, statut: e.target.value })
                }
              >
                <option value="Active">{t("subscriptions.active")}</option>
                <option value="Suspendu">{t("subscriptions.suspended")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("subscriptions.startDate")}
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                value={subForm.dateDebut}
                onChange={(e) =>
                  setSubForm({ ...subForm, dateDebut: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("subscriptions.endDate")}
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                value={subForm.dateFin}
                onChange={(e) =>
                  setSubForm({ ...subForm, dateFin: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}{" "}
              {t("common.confirm")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, sub: null })}
        title={t("common.editSubscription")}
        icon={Edit}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("common.offer")}
              </label>
              <select
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                value={editForm.type}
                onChange={(e) => {
                  const tp = e.target.value;
                  setEditForm((p) => ({
                    ...p,
                    type: tp,
                    dateFin: calculateEndDate(p.dateDebut, tp),
                  }));
                }}
              >
                <option value="Mensuel">{t("subscriptions.monthly")}</option>
                <option value="Trimestriel">
                  {t("subscriptions.quarterly")}
                </option>
                <option value="Semestriel">
                  {t("subscriptions.semiAnnual")}
                </option>
                <option value="Annuel">{t("subscriptions.annual")}</option>
              </select>
            </div>
            {[
              { k: "prix", l: t("common.price") + " (DH)", tp: "number" },
              { k: "dateDebut", l: t("subscriptions.startDate"), tp: "date" },
              { k: "dateFin", l: t("subscriptions.endDate"), tp: "date" },
            ].map((f) => (
              <div key={f.k}>
                <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                  {f.l}
                </label>
                <input
                  type={f.tp}
                  step={f.tp === "number" ? "0.01" : undefined}
                  required
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                  value={editForm[f.k]}
                  onChange={(e) =>
                    setEditForm({ ...editForm, [f.k]: e.target.value })
                  }
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("common.status")}
              </label>
              <select
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
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
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setEditModal({ isOpen: false, sub: null })}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}{" "}
              {t("common.save")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={renewModal.isOpen}
        onClose={() => setRenewModal({ isOpen: false, sub: null })}
        title="Renouveler"
        icon={RefreshCw}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRenew} className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg mb-4 text-sm text-primary">
            Le renouvellement mettra à jour cet abonnement et créera une{" "}
            <strong>nouvelle transaction</strong> pour documenter le paiement.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium uppercase mb-1">
                Offre
              </label>
              <select
                className="w-full p-2 border border-input bg-background rounded-md text-sm"
                value={renewForm.type}
                onChange={(e) =>
                  setRenewForm((f) => ({ ...f, type: e.target.value }))
                }
              >
                <option value="Mensuel">Mensuel</option>
                <option value="Trimestriel">Trimestriel</option>
                <option value="Semestriel">Semestriel</option>
                <option value="Annuel">Annuel</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium uppercase mb-1">
                Montant Payé (DH)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full p-2 border border-input bg-background rounded-md text-sm"
                value={renewForm.prix}
                onChange={(e) =>
                  setRenewForm((f) => ({ ...f, prix: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase mb-1">
                Nouveau Début
              </label>
              <input
                type="date"
                required
                className="w-full p-2 border border-input bg-background rounded-md text-sm"
                value={renewForm.dateDebut}
                onChange={(e) =>
                  setRenewForm((f) => ({ ...f, dateDebut: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase mb-1">
                Nouvelle Fin
              </label>
              <input
                type="date"
                required
                className="w-full p-2 border border-input bg-background rounded-md text-sm"
                value={renewForm.dateFin}
                onChange={(e) =>
                  setRenewForm((f) => ({ ...f, dateFin: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setRenewModal({ isOpen: false, sub: null })}
              className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex gap-2 items-center"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}{" "}
              Confirmer
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, sub: null })}
        onConfirm={confirmCancelSub}
        title="Annuler l'abonnement"
        message="Voulez-vous vraiment annuler cet abonnement définitivement ?"
        icon={XCircle}
        confirmLabel="Oui, annuler"
      />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDeleteSub}
        title={t("common.deleteSubscription")}
        message="Attention : Action réservée aux erreurs. Le montant associé sera ajusté (remboursement automatique pour équilibrer la transaction)."
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-background border border-border rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {localClient.nom}
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 flex items-center gap-2">
              <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-xs font-mono">
                ID: #{localClient.id}
              </span>
              {localClient.employee && (
                <span className="text-xs">• {localClient.employee.nom}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => dispatch(fetchClientById(id))}
            className="px-3 py-2 bg-background border border-border rounded-md hover:bg-accent text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} /> {t("common.refresh")}
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium shadow-sm flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> {t("common.addSubscription")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title={t("clients.totalSpent")}
          value={`${totalSpent.toLocaleString()} DH`}
          icon={DollarSign}
          subtext={t("clients.cumulative")}
        />
        <StatCard
          title={t("clients.activeSubscriptions")}
          value={activeSubs}
          icon={Activity}
          subtext={t("clients.ongoing")}
        />
        <StatCard
          title={t("clients.lastActivity")}
          value={
            latestSub ? new Date(latestSub.dateDebut).toLocaleDateString() : "—"
          }
          icon={Calendar}
          subtext={t("clients.lastSubscription")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold shadow-sm ${getAvatarColor(localClient.nom)}`}
                >
                  {localClient.nom.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{localClient.nom}</h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success mt-1 border border-success/20">
                    {t("clients.verifiedClient")}
                  </span>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                {[
                  {
                    icon: Mail,
                    label: t("clients.email"),
                    value: localClient.email,
                  },
                  {
                    icon: Phone,
                    label: t("clients.phone"),
                    value: localClient.telephone,
                  },
                  {
                    icon: MapPin,
                    label: t("clients.address"),
                    value: localClient.adresse || "—",
                  },
                ].map((f) => (
                  <div key={f.label} className="flex items-start gap-3 text-sm">
                    <f.icon
                      size={18}
                      className="text-muted-foreground mt-0.5"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase">
                        {f.label}
                      </p>
                      <p className="text-foreground font-medium">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/30 px-6 py-3 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                {t("common.memberSince")}{" "}
                {new Date(
                  localClient.created_at || Date.now(),
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border flex flex-col h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Package className="text-muted-foreground" size={18} />{" "}
                {t("clients.subscriptionHistory")}
              </h3>
            </div>
            {sortedSubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-foreground font-bold text-sm">
                  {t("clients.noSubscriptions")}
                </h4>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="text-sm font-medium text-primary hover:underline mt-4"
                >
                  {t("clients.createSubscription")}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("common.offer")}
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => handleSort("prix")}
                      >
                        <span className="inline-flex items-center gap-1">
                          {t("common.price")} <SortIcon colKey="prix" />
                        </span>
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("common.period")}
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("common.status")}
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                        {t("common.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedSubs.map((sub) => {
                      const daysLeft = Math.ceil(
                        (new Date(sub.dateFin) - new Date()) /
                          (1000 * 60 * 60 * 24),
                      );
                      const isRenewable = daysLeft <= 7;

                      const isEditable = !["annulé", "expiré"].includes(
                        sub.statut?.toLowerCase(),
                      );

                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-muted/50 transition-colors group cursor-pointer"
                          onClick={() => navigate(`/subscriptions/${sub.id}`)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-md bg-secondary text-secondary-foreground">
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
                              <span
                                className={`mt-0.5 ${daysLeft < 0 ? "text-destructive font-bold" : "text-muted-foreground text-[10px]"}`}
                              >
                                au {new Date(sub.dateFin).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusStyle(sub.statut)}`}
                            >
                              {sub.statut}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isRenewable && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const today = new Date()
                                      .toISOString()
                                      .split("T")[0];
                                    setRenewForm({
                                      type: sub.type,
                                      prix: sub.prix,
                                      dateDebut: today,
                                      dateFin: calculateEndDate(
                                        today,
                                        sub.type,
                                      ),
                                    });
                                    setRenewModal({ isOpen: true, sub });
                                  }}
                                  className="text-primary hover:bg-primary/20 bg-primary/10 p-1.5 rounded-md transition-all mr-1"
                                  title="Renouveler"
                                >
                                  <RefreshCw size={16} />
                                </button>
                              )}

                              {isEditable && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditModal({ isOpen: true, sub });
                                  }}
                                  className="text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-md transition-all"
                                  title={t("common.editSubscription")}
                                >
                                  <Edit size={16} />
                                </button>
                              )}

                              {isEditable &&
                                (sub.statut === "Active" ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleStatus(sub);
                                    }}
                                    className="text-muted-foreground hover:text-warning hover:bg-warning/10 p-1.5 rounded-md transition-all"
                                    title={t("subscriptions.suspend")}
                                  >
                                    <PauseCircle size={16} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleStatus(sub);
                                    }}
                                    className="text-muted-foreground hover:text-success hover:bg-success/10 p-1.5 rounded-md transition-all"
                                    title={t("subscriptions.activate")}
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                ))}

                              {isEditable && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancelModal({ isOpen: true, sub });
                                  }}
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-all"
                                  title="Annuler définitivement"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}

                              <div className="w-px h-4 bg-border mx-1" />

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModal({ isOpen: true, id: sub.id });
                                }}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-all"
                                title="Supprimer (Correction d'erreur)"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
