import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchSubscriptions,
  updateSubscription,
  deleteSubscription,
  updateSubscriptionStatus,
  renewSubscription,
} from "../features/subscriptions/subscriptionsSlice";
import { fetchClients, fetchUsers } from "../features/clients/clientsSlice";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/axiosConfig"; // تأكد من وجود هذا الاستيراد لعملية الإلغاء
import {
  Search,
  Filter,
  PauseCircle,
  RefreshCw,
  Loader2,
  Trash2,
  Edit,
  Calendar,
  User,
  ShieldCheck,
  XCircle,
  CheckCircle,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import {
  getInitials,
  STATUS_CONFIG,
  calculateEndDate,
  formatDateForInput,
} from "../utils/helpers";

const ITEMS_PER_PAGE = 7;
const inputClass =
  "w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-primary transition-all text-sm";
const selectClass =
  "w-full pl-10 pr-8 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-medium cursor-pointer appearance-none text-foreground";
const cardClass = "bg-card border border-border rounded-lg shadow-sm";

const Subscriptions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    items: subscriptions,
    loading,
    pagination,
  } = useAppSelector((s) => s.subscriptions);
  const { items: clients, users: employees } = useAppSelector((s) => s.clients);
  const currentUser = useAppSelector((s) => s.auth.user);

  const totalPages = pagination?.lastPage || 1;
  const currentItems = subscriptions || [];

  const [filters, setFilters] = useState({
    status: "all",
    client: "all",
    employee: "all",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    clientName: "",
  });
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });
  const [renewModal, setRenewModal] = useState({ isOpen: false, data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClientsForDropdown = useMemo(() => {
    if (filters.employee === "all") return clients;
    return clients.filter(
      (c) =>
        c.employee?.id === parseInt(filters.employee) ||
        c.employee_id === parseInt(filters.employee),
    );
  }, [clients, filters.employee]);

  useEffect(() => {
    dispatch(fetchClients());
    if (currentUser?.role === "admin") {
      dispatch(fetchUsers());
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadSubscriptions = useCallback(
    (pageToLoad = currentPage) => {
      dispatch(
        fetchSubscriptions({
          page: pageToLoad,
          search: debouncedSearch,
          statut: filters.status,
          client_id: filters.client,
          employee_id: filters.employee,
          per_page: ITEMS_PER_PAGE,
        }),
      );
    },
    [dispatch, currentPage, debouncedSearch, filters],
  );

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key === "employee") {
        newFilters.client = "all";
      }
      return newFilters;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: "all", client: "all", employee: "all" });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.client !== "all" ||
    filters.employee !== "all" ||
    searchTerm !== "";

  // --- دوال الـ Actions ---
  const confirmDelete = useCallback(async () => {
    const toastId = toast.loading(t("common.deleting"));
    const result = await dispatch(deleteSubscription(deleteModal.id));
    if (deleteSubscription.fulfilled.match(result)) {
      toast.success(t("subscriptions.subscriptionDeleted"), { id: toastId });
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        loadSubscriptions();
      }
    } else toast.error(t("common.error"), { id: toastId });
    setDeleteModal({ isOpen: false, id: null, clientName: "" });
  }, [
    dispatch,
    deleteModal.id,
    currentItems.length,
    currentPage,
    loadSubscriptions,
    t,
  ]);

  const handleStatusUpdate = useCallback(
    async (id, newStatus) => {
      const toastId = toast.loading(t("common.updating"));
      const result = await dispatch(
        updateSubscriptionStatus({ id, statut: newStatus }),
      );
      if (updateSubscriptionStatus.fulfilled.match(result)) {
        toast.success(`${t("common.status")}: ${newStatus}`, { id: toastId });
        loadSubscriptions();
      } else {
        toast.error(t("common.error"), { id: toastId });
      }
    },
    [dispatch, loadSubscriptions, t],
  );

  // دالة الإلغاء الجديدة
  const handleCancelSub = async (id) => {
    if (
      !window.confirm(
        "Voulez-vous vraiment annuler cet abonnement définitivement ?",
      )
    )
      return;
    const toastId = toast.loading("Annulation en cours...");
    try {
      await api.put(`/abonnements/${id}/cancel`);
      toast.success("Abonnement annulé avec succès", { id: toastId });
      loadSubscriptions(); // تحديث القائمة لإظهار الحالة الجديدة
    } catch {
      toast.error("Erreur lors de l'annulation", { id: toastId });
    }
  };

  const openEditModal = useCallback((sub) => {
    setEditModal({
      isOpen: true,
      data: {
        id: sub.id,
        type: sub.type,
        prix: sub.prix,
        dateDebut: formatDateForInput(sub.dateDebut),
        dateFin: formatDateForInput(sub.dateFin),
        statut: sub.statut,
      },
    });
  }, []);

  const openRenewModal = useCallback((sub) => {
    const today = new Date().toISOString().split("T")[0];
    setRenewModal({
      isOpen: true,
      data: {
        id: sub.id,
        type: sub.type,
        prix: sub.prix,
        dateDebut: today,
        dateFin: calculateEndDate(today, sub.type),
      },
    });
  }, []);

  const handleEditSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      const { id, ...data } = editModal.data;
      const result = await dispatch(updateSubscription({ id, data }));
      setIsSubmitting(false);
      if (updateSubscription.fulfilled.match(result)) {
        toast.success(t("subscriptions.changesRecorded"));
        setEditModal({ isOpen: false, data: null });
        loadSubscriptions();
      } else toast.error(t("common.error"));
    },
    [dispatch, editModal.data, loadSubscriptions, t],
  );

  const handleRenewSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      const { id, ...data } = renewModal.data;
      const result = await dispatch(renewSubscription({ id, data }));
      setIsSubmitting(false);
      if (renewSubscription.fulfilled.match(result)) {
        toast.success("Abonnement renouvelé avec succès");
        setRenewModal({ isOpen: false, data: null });
        loadSubscriptions();
      } else toast.error(t("common.error"));
    },
    [dispatch, renewModal.data, loadSubscriptions, t],
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Toaster position="top-center" />

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, id: null, clientName: "" })
        }
        onConfirm={confirmDelete}
        message={
          <>
            {t("subscriptions.deleteSubscriptionMsg")}{" "}
            <strong>{deleteModal.clientName}</strong> ? <br />
            <br />
            <span className="text-warning text-sm">
              Attention : Un remboursement automatique sera généré si
              l'abonnement possède des transactions associées.
            </span>
          </>
        }
      />

      {/* Renew Modal */}
      {renewModal.isOpen && renewModal.data && (
        <Modal
          isOpen
          onClose={() => setRenewModal({ isOpen: false, data: null })}
          title="Renouveler"
          icon={RefreshCw}
          maxWidth="max-w-md"
        >
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg mb-4 text-sm text-primary">
            Le renouvellement clôturera cet abonnement et créera un{" "}
            <strong>nouveau dossier</strong> avec une nouvelle transaction.
          </div>
          <form onSubmit={handleRenewSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium uppercase mb-1">
                  Offre
                </label>
                <select
                  className="w-full p-2 border border-input bg-background rounded-md text-sm"
                  value={renewModal.data.type}
                  onChange={(e) => {
                    const tp = e.target.value;
                    setRenewModal((m) => ({
                      ...m,
                      data: {
                        ...m.data,
                        type: tp,
                        dateFin: calculateEndDate(m.data.dateDebut, tp),
                      },
                    }));
                  }}
                >
                  {["Mensuel", "Trimestriel", "Semestriel", "Annuel"].map(
                    (o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium uppercase mb-1">
                  Montant (DH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full p-2 border border-input bg-background rounded-md text-sm"
                  value={renewModal.data.prix}
                  onChange={(e) =>
                    setRenewModal((m) => ({
                      ...m,
                      data: { ...m.data, prix: e.target.value },
                    }))
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
                  value={renewModal.data.dateDebut}
                  onChange={(e) =>
                    setRenewModal((m) => ({
                      ...m,
                      data: { ...m.data, dateDebut: e.target.value },
                    }))
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
                  value={renewModal.data.dateFin}
                  onChange={(e) =>
                    setRenewModal((m) => ({
                      ...m,
                      data: { ...m.data, dateFin: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenewModal({ isOpen: false, data: null })}
                className="px-4 py-2 bg-background border border-input rounded-md text-sm hover:bg-accent"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium flex gap-2 items-center"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}{" "}
                Confirmer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && editModal.data && (
        <Modal
          isOpen
          onClose={() => setEditModal({ isOpen: false, data: null })}
          title={t("common.editSubscription")}
          icon={Edit}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("subscriptions.offerType")}
                </label>
                <select
                  className={`${inputClass}`}
                  value={editModal.data.type}
                  onChange={(e) => {
                    const tp = e.target.value;
                    setEditModal((m) => ({
                      ...m,
                      data: {
                        ...m.data,
                        type: tp,
                        dateFin: calculateEndDate(m.data.dateDebut, tp),
                      },
                    }));
                  }}
                >
                  {["Mensuel", "Trimestriel", "Semestriel", "Annuel"].map(
                    (o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("common.price")} (DH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={`${inputClass}`}
                  value={editModal.data.prix}
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      data: { ...m.data, prix: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("common.status")}
                </label>
                <select
                  className={`${inputClass}`}
                  value={editModal.data.statut}
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      data: { ...m.data, statut: e.target.value },
                    }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Suspendu">Suspendu</option>
                  <option value="Expiré">Expiré</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("subscriptions.startDate")}
                </label>
                <input
                  type="date"
                  className={`${inputClass}`}
                  value={editModal.data.dateDebut}
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      data: { ...m.data, dateDebut: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("subscriptions.endDate")}
                </label>
                <input
                  type="date"
                  className={`${inputClass}`}
                  value={editModal.data.dateFin}
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      data: { ...m.data, dateFin: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, data: null })}
                className="px-4 py-2 bg-background border border-input rounded-md text-sm hover:bg-accent"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium flex gap-2 items-center"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}{" "}
                {t("common.save")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Header and Filters */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("subscriptions.title")}
          </h1>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors"
            >
              <XCircle size={16} />
              {t("common.clearFilters", "Supprimer les filtres")}
            </button>
          )}
        </div>

        <div className={`${cardClass} p-4`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={18}
              />
              <input
                type="text"
                placeholder={t("subscriptions.searchPlaceholder")}
                className={inputClass}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {currentUser?.role === "admin" && (
              <div className="relative w-full">
                <ShieldCheck
                  className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none"
                  size={16}
                />
                <select
                  value={filters.employee}
                  onChange={(e) =>
                    handleFilterChange("employee", e.target.value)
                  }
                  className={selectClass}
                >
                  <option value="all">{t("common.allEmployees")}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative w-full">
              <User
                className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none"
                size={16}
              />
              <select
                value={filters.client}
                onChange={(e) => handleFilterChange("client", e.target.value)}
                className={selectClass}
              >
                <option value="all">{t("common.allClients")}</option>
                {filteredClientsForDropdown.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 w-full">
              <div className="relative w-full">
                <Filter
                  className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none"
                  size={16}
                />
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className={selectClass}
                >
                  <option value="all">{t("common.allStatuses")}</option>
                  <option value="active">{t("subscriptions.active")}</option>
                  <option value="suspendu">
                    {t("subscriptions.suspended")}
                  </option>
                  <option value="expiré">{t("subscriptions.expired")}</option>
                  <option value="annulé">{t("subscriptions.cancelled")}</option>
                </select>
              </div>
              <button
                onClick={() => loadSubscriptions()}
                className="px-3 bg-background border border-input rounded-md hover:bg-accent flex items-center justify-center flex-shrink-0"
                title="Actualiser"
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin text-primary" : ""}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div
          className={`${cardClass} overflow-hidden flex flex-col min-h-[400px] relative`}
        >
          <div className="overflow-x-auto relative">
            {loading && currentItems.length > 0 && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            )}

            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {currentUser?.role === "admin"
                      ? t("subscriptions.clientManager")
                      : t("clients.name")}
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("common.offer")}
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("common.period")}
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("common.status")}
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border relative">
                {loading && currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((sub) => {
                    const statusLower = sub.statut?.toLowerCase() || "expiré";
                    const statusConfig =
                      STATUS_CONFIG[statusLower] || STATUS_CONFIG.expiré;
                    const daysLeft = Math.ceil(
                      (new Date(sub.dateFin) - new Date()) /
                        (1000 * 60 * 60 * 24),
                    );

                    const isEditable = !["annulé", "expiré"].includes(
                      statusLower,
                    );
                    const isRenewable = daysLeft <= 7;

                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-muted/50 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/subscriptions/${sub.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                              {getInitials(sub.client?.nom)}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {sub.client?.nom || "—"}
                              </div>
                              {currentUser?.role === "admin" &&
                                sub.employee && (
                                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <ShieldCheck size={10} /> {sub.employee.nom}
                                  </div>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-sm">{sub.type}</div>
                          <div className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-md inline-block mt-1 border border-primary/10">
                            {parseFloat(sub.prix).toFixed(2)} DH
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />{" "}
                              {new Date(sub.dateDebut).toLocaleDateString()}
                            </span>
                            <span
                              className={`pl-4 font-bold mt-1 ${daysLeft < 0 ? "text-destructive" : "text-foreground"}`}
                            >
                              {new Date(sub.dateFin).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusConfig.style}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                            {statusConfig.label || sub.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div
                            className="flex justify-end items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isRenewable && (
                              <button
                                onClick={() => openRenewModal(sub)}
                                className="p-2 text-primary hover:bg-primary/20 bg-primary/10 rounded-md transition-all mr-1"
                                title="Renouveler"
                              >
                                <RefreshCw size={16} />
                              </button>
                            )}

                            {isEditable && (
                              <button
                                onClick={() => openEditModal(sub)}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </button>
                            )}

                            {isEditable && (
                              <div className="w-px h-4 bg-border mx-1" />
                            )}

                            {isEditable && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    sub.id,
                                    sub.statut === "Active"
                                      ? "Suspendu"
                                      : "Active",
                                  )
                                }
                                className="p-2 text-muted-foreground hover:text-warning hover:bg-warning/10 rounded-md transition-all"
                                title={
                                  sub.statut === "Active"
                                    ? t("subscriptions.suspend")
                                    : t("subscriptions.activate")
                                }
                              >
                                {sub.statut === "Active" ? (
                                  <PauseCircle size={16} />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                              </button>
                            )}

                            {isEditable && (
                              <button
                                onClick={() => handleCancelSub(sub.id)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                                title="Annuler l'abonnement"
                              >
                                <XCircle size={16} />
                              </button>
                            )}

                            {currentUser?.role === "admin" && (
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    isOpen: true,
                                    id: sub.id,
                                    clientName: sub.client?.nom,
                                  })
                                }
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                                title="Supprimer (Correction erreur)"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <EmptyState colSpan={5} />
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="mt-auto border-t border-border">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
