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
import { fetchUsers } from "../features/clients/clientsSlice";
import { fetchDashboardData } from "../features/dashboard/dashboardSlice";
import { useTranslation } from "react-i18next";
import showToast from "../components/ui/Toast";
import api from "../api/axiosConfig";
import Select from "react-select";
import {
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
  LayoutGrid,
  DollarSign,
  Activity,
  Save,
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
  "w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm placeholder:text-muted-foreground shadow-sm text-foreground";
const selectHtmlClass =
  "w-full pl-10 pr-8 py-2.5 bg-background border border-input rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm font-medium text-foreground cursor-pointer appearance-none shadow-sm";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-all shadow-sm text-sm disabled:opacity-70";
const btnGhost =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-background border border-input text-foreground rounded-lg hover:bg-accent font-medium transition-all shadow-sm text-sm";
const cardClass =
  "bg-card border border-border rounded-xl shadow-sm overflow-hidden";
const filterCardClass = "bg-card border border-border rounded-xl shadow-sm";

const selectClassNames = {
  control: (state) =>
    `flex w-full items-center min-h-[42px] bg-background border rounded-lg transition-all duration-200 text-sm shadow-sm hover:border-primary/50 ${
      state.isFocused
        ? "border-primary ring-2 ring-primary/20 outline-none"
        : "border-input"
    }`,
  valueContainer: () => "pl-10 pr-2",
  menu: () =>
    "mt-1.5 bg-card border border-border rounded-lg shadow-xl overflow-hidden",
  menuList: () => "p-1.5 flex flex-col gap-0.5",
  option: (state) =>
    `px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
      state.isFocused
        ? "bg-primary/10 text-primary font-medium"
        : "text-foreground hover:bg-muted"
    }`,
  singleValue: () => "text-foreground text-sm font-medium",
  input: () => "text-foreground text-sm m-0 p-0",
  placeholder: () => "text-muted-foreground text-sm",
  indicatorSeparator: () => "hidden",
  dropdownIndicator: () =>
    "text-muted-foreground hover:text-foreground cursor-pointer p-2",
  noOptionsMessage: () => "p-4 text-muted-foreground text-sm text-center",
};

const Subscriptions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    items: subscriptions = [],
    loading,
    pagination,
  } = useAppSelector((s) => s.subscriptions || {});

  const { users: employees = [] } = useAppSelector((s) => s.clients || {});
  const currentUser = useAppSelector((s) => s.auth?.user);

  const totalPages = pagination?.lastPage || 1;
  const currentItems = subscriptions || [];

  const [filters, setFilters] = useState({
    status: "all",
    client: "all",
    employee: "all",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [dropdownClients, setDropdownClients] = useState([]);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    clientName: "",
  });

  const [cancelModal, setCancelModal] = useState({ isOpen: false, id: null });

  const [editModal, setEditModal] = useState({ isOpen: false, data: null });
  const [renewModal, setRenewModal] = useState({ isOpen: false, data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAllClientsForDropdown = async () => {
      try {
        const res = await api.get("/clients");
        const clientsData = Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data?.data || [];
        setDropdownClients(clientsData);
      } catch (error) {
        console.error("Erreur:", error);
      }
    };
    fetchAllClientsForDropdown();
    if (currentUser?.role === "admin") {
      dispatch(fetchUsers());
    }
  }, [dispatch, currentUser]);

  const filteredClientsForDropdown = useMemo(() => {
    if (!filters.employee || filters.employee === "all") return dropdownClients;
    const selectedEmpId = String(filters.employee);
    return dropdownClients.filter((client) => {
      const clientEmpId = client.employee_id
        ? String(client.employee_id)
        : client.employee?.id
          ? String(client.employee.id)
          : null;
      return clientEmpId === selectedEmpId;
    });
  }, [dropdownClients, filters.employee]);

  const loadSubscriptions = useCallback(
    (pageToLoad = currentPage) => {
      const apiFilters = {
        page: pageToLoad,
        statut: filters.status === "all" ? "" : filters.status,
        client_id: filters.client === "all" ? "" : filters.client,
        employee_id: filters.employee === "all" ? "" : filters.employee,
        per_page: ITEMS_PER_PAGE,
      };
      dispatch(fetchSubscriptions(apiFilters));
    },
    [dispatch, currentPage, filters],
  );

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key === "employee") newFilters.client = "all";
      return newFilters;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: "all", client: "all", employee: "all" });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.client !== "all" ||
    filters.employee !== "all";

  const confirmDelete = useCallback(async () => {
    const loadingId = showToast.loading(t("common.deleting", "Suppression..."));
    const result = await dispatch(deleteSubscription(deleteModal.id));
    showToast.dismiss(loadingId);

    if (deleteSubscription.fulfilled.match(result)) {
      showToast.success(
        t("subscriptions.subscriptionDeleted", "Abonnement supprimé"),
      );
      if (currentItems.length === 1 && currentPage > 1)
        setCurrentPage((p) => p - 1);
      else loadSubscriptions();

      const d = new Date();
      dispatch(
        fetchDashboardData({ year: d.getFullYear(), month: d.getMonth() + 1 }),
      );
    } else {
      showToast.error(t("common.error", "Erreur"));
    }

    setDeleteModal({ isOpen: false, id: null, clientName: "" });
  }, [
    dispatch,
    deleteModal.id,
    currentItems.length,
    currentPage,
    loadSubscriptions,
    t,
    setCurrentPage,
    setDeleteModal,
  ]);

  const handleStatusUpdate = useCallback(
    async (id, newStatus) => {
      const loadingId = showToast.loading(
        t("common.updating", "Mise à jour..."),
      );
      const result = await dispatch(
        updateSubscriptionStatus({ id, statut: newStatus }),
      );
      showToast.dismiss(loadingId);
      if (updateSubscriptionStatus.fulfilled.match(result)) {
        showToast.success(`${t("common.status", "Statut")}: ${newStatus}`);
        loadSubscriptions();
        const d = new Date();
        dispatch(
          fetchDashboardData({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
          }),
        );
      } else {
        showToast.error(t("common.error", "Erreur"));
      }
    },
    [dispatch, loadSubscriptions, t],
  );

  const confirmCancelSub = async () => {
    const loadingId = showToast.loading("Annulation en cours...");
    try {
      await api.put(`/abonnements/${cancelModal.id}/cancel`);
      showToast.dismiss(loadingId);
      showToast.success("Abonnement annulé avec succès");
      loadSubscriptions();
      const d = new Date();
      dispatch(
        fetchDashboardData({ year: d.getFullYear(), month: d.getMonth() + 1 }),
      );
    } catch {
      showToast.dismiss(loadingId);
      showToast.error("Erreur lors de l'annulation");
    }
    setCancelModal({ isOpen: false, id: null });
  };

  const openEditModal = useCallback(
    (sub) => {
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
    },
    [setEditModal],
  );

  const openRenewModal = useCallback(
    (sub) => {
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
    },
    [setRenewModal],
  );

  const handleEditSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      const { id, ...data } = editModal.data;
      const result = await dispatch(updateSubscription({ id, data }));
      setIsSubmitting(false);
      if (updateSubscription.fulfilled.match(result)) {
        showToast.success(
          t("subscriptions.changesRecorded", "Modifications enregistrées"),
        );
        setEditModal({ isOpen: false, data: null });
        loadSubscriptions();
        const d = new Date();
        dispatch(
          fetchDashboardData({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
          }),
        );
      } else {
        showToast.error(t("common.error", "Erreur"));
      }
    },
    [dispatch, editModal.data, loadSubscriptions, t, setEditModal],
  );

  const handleRenewSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      const { id, ...data } = renewModal.data;
      const result = await dispatch(renewSubscription({ id, data }));
      setIsSubmitting(false);
      if (renewSubscription.fulfilled.match(result)) {
        showToast.success("Abonnement renouvelé avec succès");
        setRenewModal({ isOpen: false, data: null });
        loadSubscriptions();
        const d = new Date();
        dispatch(
          fetchDashboardData({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
          }),
        );
      } else {
        showToast.error(t("common.error", "Erreur"));
      }
    },
    [dispatch, renewModal.data, loadSubscriptions, t, setRenewModal],
  );

  const empOptions = [
    { value: "all", label: t("common.allEmployees", "Tous les employés") },
    ...employees.map((emp) => ({ value: emp.id, label: emp.nom })),
  ];
  const clientOptions = [
    { value: "all", label: t("common.allClients", "Tous les clients") },
    ...filteredClientsForDropdown.map((c) => ({ value: c.id, label: c.nom })),
  ];
  const statusOptions = [
    { value: "all", label: t("common.allStatuses", "Tous les statuts") },
    { value: "Active", label: t("subscriptions.active", "Actif") },
    { value: "Suspendu", label: t("subscriptions.suspended", "Suspendu") },
    { value: "Expiré", label: t("subscriptions.expired", "Expiré") },
    { value: "Annulé", label: t("subscriptions.cancelled", "Annulé") },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, id: null, clientName: "" })
        }
        onConfirm={confirmDelete}
        message={
          <>
            {t(
              "subscriptions.deleteSubscriptionMsg",
              "Voulez-vous vraiment supprimer l'abonnement de",
            )}{" "}
            <strong>{deleteModal.clientName}</strong> ? <br />
            <br />
            <span className="text-warning text-sm">
              Attention : Un remboursement automatique sera généré si
              l'abonnement possède des transactions associées.
            </span>
          </>
        }
      />

      <ConfirmDialog
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, id: null })}
        onConfirm={confirmCancelSub}
        title="Annuler l'abonnement"
        message="Êtes-vous sûr de vouloir annuler cet abonnement définitivement ?"
        icon={XCircle}
        confirmLabel="Oui, annuler"
      />

      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("subscriptions.title", "Gestion des Abonnements")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Gérez et suivez les abonnements de vos clients facilement.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm flex items-center gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <XCircle size={16} />
              {t("common.clearFilters", "Effacer les filtres")}
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div
            className={`${cardClass} lg:w-1/4 p-5 flex items-center gap-4 relative overflow-hidden bg-gradient-to-br from-background to-muted/20`}
          >
            <div className="p-3 bg-primary/10 text-primary rounded-xl relative z-10 border border-primary/20">
              <Calendar size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                {t("subscriptions.totalSubscriptions", "Total Abonnements")}
              </p>
              <p className="text-2xl font-bold text-foreground leading-none">
                {pagination?.total || 0}
              </p>
            </div>
          </div>

          {/* Professional Filter Toolbar */}
          <div
            className={`${filterCardClass} lg:w-3/4 p-5 bg-muted/10 flex flex-col justify-center`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4 border-b border-border pb-3">
              <LayoutGrid size={18} className="text-primary" />
              <span>Outils de recherche et filtrage</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between w-full">
              {/* الحاوية الخاصة بالفلاتر تأخذ باقي المساحة المرنة */}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 ${currentUser?.role === "admin" ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-4 w-full lg:flex-1`}
              >
                {/* Employee Filter */}
                {currentUser?.role === "admin" && (
                  <div className="relative w-full group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none group-focus-within:text-primary transition-colors">
                      <ShieldCheck size={18} />
                    </div>
                    <Select
                      isSearchable
                      unstyled
                      classNames={selectClassNames}
                      options={empOptions}
                      value={empOptions.find(
                        (o) => o.value === filters.employee,
                      )}
                      onChange={(e) => handleFilterChange("employee", e.value)}
                      placeholder={t(
                        "common.allEmployees",
                        "Tous les employés",
                      )}
                      noOptionsMessage={() =>
                        t("common.noResults", "Aucun résultat")
                      }
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </div>
                )}

                {/* Client Filter */}
                <div className="relative w-full group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none group-focus-within:text-primary transition-colors">
                    <User size={18} />
                  </div>
                  <Select
                    isSearchable
                    unstyled
                    classNames={selectClassNames}
                    options={clientOptions}
                    value={clientOptions.find(
                      (o) => o.value === filters.client,
                    )}
                    onChange={(e) => handleFilterChange("client", e.value)}
                    placeholder={t("common.allClients", "Tous les clients")}
                    noOptionsMessage={() =>
                      t("common.noResults", "Aucun résultat")
                    }
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>

                {/* Status Filter */}
                <div className="relative w-full group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none group-focus-within:text-primary transition-colors">
                    <Filter size={18} />
                  </div>
                  <Select
                    isSearchable
                    unstyled
                    classNames={selectClassNames}
                    options={statusOptions}
                    value={statusOptions.find(
                      (o) => o.value === filters.status,
                    )}
                    onChange={(e) => handleFilterChange("status", e.value)}
                    placeholder={t("common.allStatuses", "Tous les statuts")}
                    noOptionsMessage={() =>
                      t("common.noResults", "Aucun résultat")
                    }
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>
              </div>

              <div className="w-full lg:w-auto shrink-0 flex justify-end">
                <button
                  onClick={() => loadSubscriptions()}
                  className="h-[42px] px-6 bg-background border border-border shadow-sm rounded-lg hover:border-primary/50 hover:text-primary flex items-center justify-center gap-2 transition-all font-medium text-sm w-full lg:w-auto"
                  title="Actualiser les données"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin text-primary" : ""}
                  />
                  Actualiser
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Area */}
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
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {currentUser?.role === "admin"
                      ? t("subscriptions.clientManager", "Client / Responsable")
                      : t("clients.name", "Client")}
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("common.offer", "Offre")}
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("common.period", "Période")}
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("common.status", "Statut")}
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                    {t("common.actions", "Actions")}
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
                        className="hover:bg-muted/40 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/subscriptions/${sub.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border shadow-sm border-primary/20">
                              {getInitials(sub.client?.nom)}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-sm">
                                {sub.client?.nom || "—"}
                              </div>
                              {currentUser?.role === "admin" &&
                                sub.employee && (
                                  <div className="text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <ShieldCheck size={12} /> {sub.employee.nom}
                                  </div>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-sm text-foreground">
                            {sub.type}
                          </div>
                          <div className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block mt-1 border border-primary/20">
                            {parseFloat(sub.prix).toFixed(2)} DH
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} />{" "}
                              {new Date(sub.dateDebut).toLocaleDateString()}
                            </span>
                            <span
                              className={`pl-5 font-bold mt-1 ${daysLeft < 0 ? "text-destructive" : "text-foreground"}`}
                            >
                              {new Date(sub.dateFin).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold border ${statusConfig.style}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                            {statusConfig.label || sub.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div
                            className="flex justify-end items-center gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isRenewable && (
                              <button
                                onClick={() => openRenewModal(sub)}
                                className="p-2 text-primary hover:bg-primary/20 bg-primary/10 rounded-lg transition-all mr-1 shadow-sm"
                                title="Renouveler"
                              >
                                <RefreshCw size={18} />
                              </button>
                            )}
                            {isEditable && (
                              <button
                                onClick={() => openEditModal(sub)}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                title="Modifier"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {isEditable && (
                              <div className="w-px h-5 bg-border mx-1" />
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
                                className="p-2 text-muted-foreground hover:text-warning hover:bg-warning/10 rounded-lg transition-all"
                                title={
                                  sub.statut === "Active"
                                    ? t("subscriptions.suspend", "Suspendre")
                                    : t("subscriptions.activate", "Activer")
                                }
                              >
                                {sub.statut === "Active" ? (
                                  <PauseCircle size={18} />
                                ) : (
                                  <CheckCircle size={18} />
                                )}
                              </button>
                            )}
                            {isEditable && (
                              <button
                                onClick={() =>
                                  setCancelModal({ isOpen: true, id: sub.id })
                                }
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                title="Annuler l'abonnement"
                              >
                                <XCircle size={18} />
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
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                title="Supprimer"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <EmptyState
                    colSpan={5}
                    message={t("common.noResults", "Aucun résultat trouvé")}
                  />
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="mt-auto border-t border-border p-4 bg-muted/10">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal.isOpen && editModal.data && (
        <Modal
          isOpen
          onClose={() => setEditModal({ isOpen: false, data: null })}
          title={t("common.editSubscription", "Modifier l'Abonnement")}
          icon={Edit}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  {t("common.offer", "Offre")}
                </label>
                <div className="relative">
                  <LayoutGrid
                    className="absolute left-3 top-3 text-muted-foreground"
                    size={16}
                  />
                  <select
                    className={selectHtmlClass}
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
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  {t("common.price", "Prix")} (DH)
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-3 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={editModal.data.prix}
                    onChange={(e) =>
                      setEditModal((m) => ({
                        ...m,
                        data: { ...m.data, prix: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  {t("common.status", "Statut")}
                </label>
                <div className="relative">
                  <Activity
                    className="absolute left-3 top-3 text-muted-foreground"
                    size={16}
                  />
                  <select
                    className={selectHtmlClass}
                    value={editModal.data.statut}
                    onChange={(e) =>
                      setEditModal((m) => ({
                        ...m,
                        data: { ...m.data, statut: e.target.value },
                      }))
                    }
                  >
                    <option value="Active">Actif</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Expiré">Expiré</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  {t("subscriptions.startDate", "Date de début")}
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-3 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="date"
                    className={inputClass}
                    value={editModal.data.dateDebut}
                    onChange={(e) =>
                      setEditModal((m) => ({
                        ...m,
                        data: { ...m.data, dateDebut: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  {t("subscriptions.endDate", "Date de fin")}
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-3 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="date"
                    className={inputClass}
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
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, data: null })}
                className={`${btnGhost} flex-1`}
              >
                {t("common.cancel", "Annuler")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${btnPrimary} flex-1`}
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}{" "}
                {t("common.save", "Enregistrer")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Renew Modal */}
      {renewModal.isOpen && renewModal.data && (
        <Modal
          isOpen
          onClose={() => setRenewModal({ isOpen: false, data: null })}
          title="Renouveler l'abonnement"
          icon={RefreshCw}
          maxWidth="max-w-md"
        >
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mb-5 text-sm text-primary font-medium flex items-start gap-3">
            <RefreshCw size={18} className="shrink-0 mt-0.5" />
            <p>
              Le renouvellement créera une <strong>nouvelle transaction</strong>{" "}
              pour documenter le paiement.
            </p>
          </div>
          <form onSubmit={handleRenewSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  Offre
                </label>
                <div className="relative">
                  <LayoutGrid
                    className="absolute left-3 top-3 text-muted-foreground"
                    size={16}
                  />
                  <select
                    className={selectHtmlClass}
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
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  Montant Payé (DH)
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-3 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    className={inputClass}
                    value={renewModal.data.prix}
                    onChange={(e) =>
                      setRenewModal((m) => ({
                        ...m,
                        data: { ...m.data, prix: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  Nouveau Début
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-3 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="date"
                    required
                    className={inputClass}
                    value={renewModal.data.dateDebut}
                    onChange={(e) =>
                      setRenewModal((m) => ({
                        ...m,
                        data: { ...m.data, dateDebut: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">
                  Nouvelle Fin
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-3 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="date"
                    required
                    className={inputClass}
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
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRenewModal({ isOpen: false, data: null })}
                className={`${btnGhost} flex-1`}
              >
                {t("common.cancel", "Annuler")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${btnPrimary} flex-1`}
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}{" "}
                Confirmer
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Subscriptions;
