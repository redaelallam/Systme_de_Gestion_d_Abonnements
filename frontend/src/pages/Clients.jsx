import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchClients,
  updateClient,
  deleteClient,
  fetchUsers,
} from "../features/clients/clientsSlice";
import { createSubscription } from "../features/subscriptions/subscriptionsSlice";
import { useTranslation } from "react-i18next";
import showToast from "../components/ui/Toast";
import Select from "react-select";
import {
  Trash2,
  Edit,
  UserPlus,
  ArrowLeft,
  Users,
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  PlusCircle,
  CreditCard,
  Filter,
  Search,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import {
  getInitials,
  getAvatarStyle,
  calculateEndDate,
} from "../utils/helpers";

const inputClass =
  "w-full ps-10 pe-4 py-2.5 bg-background border border-input rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm placeholder:text-muted-foreground text-foreground shadow-sm";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-all shadow-sm text-sm disabled:opacity-70";
const btnGhost =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-background border border-input text-foreground rounded-lg hover:bg-accent font-medium transition-all shadow-sm text-sm";
const cardClass =
  "bg-card border border-border rounded-xl shadow-sm overflow-hidden";
const filterCardClass = "bg-card border border-border rounded-xl shadow-sm";
const thClass =
  "px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border text-start";
const tdClass = "px-6 py-4 whitespace-nowrap text-sm text-foreground";

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

export default function Clients() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const dispatch = useAppDispatch();

  const {
    items: clients,
    pagination,
    users: employees,
    loading,
  } = useAppSelector((s) => s.clients);
  const currentUser = useAppSelector((s) => s.auth.user);

  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [editingClient, setEditingClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [subModal, setSubModal] = useState({ isOpen: false, client: null });
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
  });
  const [subForm, setSubForm] = useState({
    type: "Mensuel",
    prix: "",
    dateDebut: new Date().toISOString().split("T")[0],
    dateFin: "",
    statut: "Active",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    dispatch(
      fetchClients({
        page: currentPage,
        employee_id: selectedEmployee,
        search: debouncedSearch,
      }),
    );
  }, [dispatch, currentPage, selectedEmployee, debouncedSearch]);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      dispatch(fetchUsers());
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    if (editingClient)
      setEditForm({
        nom: editingClient.nom || "",
        email: editingClient.email || "",
        telephone: editingClient.telephone || "",
        adresse: editingClient.adresse || "",
      });
  }, [editingClient]);

  useEffect(() => {
    if (subForm.dateDebut)
      setSubForm((prev) => ({
        ...prev,
        dateFin: calculateEndDate(prev.dateDebut, prev.type),
      }));
  }, [subForm.type, subForm.dateDebut]);

  const handleUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSaving(true);
      const loadingId = showToast.loading(
        t("common.updating", "Mise à jour en cours..."),
      );

      const result = await dispatch(
        updateClient({ id: editingClient.id, data: editForm }),
      );

      setIsSaving(false);
      showToast.dismiss(loadingId);

      if (updateClient.fulfilled.match(result)) {
        showToast.success(
          t("clients.clientUpdated", "Client mis à jour avec succès"),
        );
        setEditingClient(null);
        dispatch(
          fetchClients({
            page: currentPage,
            employee_id: selectedEmployee,
            search: debouncedSearch,
          }),
        );
      } else {
        const errorMsg =
          typeof result.payload === "string"
            ? result.payload
            : t("clients.updateFailed", "Échec de la mise à jour");
        showToast.error(errorMsg);
      }
    },
    [
      dispatch,
      editingClient,
      editForm,
      currentPage,
      selectedEmployee,
      debouncedSearch,
      t,
      setEditingClient,
    ],
  );

  const handleDelete = useCallback(async () => {
    const loadingId = showToast.loading(
      t("common.deleting", "Suppression en cours..."),
    );
    const result = await dispatch(deleteClient(clientToDelete.id));
    showToast.dismiss(loadingId);

    if (deleteClient.fulfilled.match(result)) {
      showToast.success(
        t("clients.clientDeleted", "Client supprimé avec succès"),
      );
      if (clients.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        dispatch(
          fetchClients({
            page: currentPage,
            employee_id: selectedEmployee,
            search: debouncedSearch,
          }),
        );
      }
    } else {
      const errorMsg =
        typeof result.payload === "string"
          ? result.payload
          : t("common.error", "Une erreur s'est produite");
      showToast.error(errorMsg);
    }
    setClientToDelete(null);
  }, [
    dispatch,
    clientToDelete,
    clients.length,
    currentPage,
    selectedEmployee,
    debouncedSearch,
    t,
    setClientToDelete,
    setCurrentPage,
  ]);

  const handleAddSub = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSaving(true);
      const loadingId = showToast.loading(
        t("common.processing", "Traitement en cours..."),
      );

      const payload = {
        ...subForm,
        client_id: subModal.client.id,
        employee_id: currentUser.id,
      };

      const result = await dispatch(createSubscription(payload));

      setIsSaving(false);
      showToast.dismiss(loadingId);

      if (createSubscription.fulfilled.match(result)) {
        showToast.success(
          t("subscriptions.subscriptionCreated", "Abonnement créé avec succès"),
        );
        setSubModal({ isOpen: false, client: null });
      } else {
        const errorMsg =
          typeof result.payload === "string"
            ? result.payload
            : t("common.error", "Erreur");
        showToast.error(errorMsg);
      }
    },
    [dispatch, subForm, subModal, currentUser, t, setSubModal],
  );

  const employeeOptions = [
    { value: "all", label: t("common.allEmployees", "Tous les employés") },
    ...employees.map((emp) => ({ value: emp.id, label: emp.nom })),
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Modal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        title={t("clients.edit", "Modifier le client")}
        icon={Edit}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {[
            { key: "nom", icon: User, placeholder: t("clients.name", "Nom") },
            {
              key: "email",
              icon: Mail,
              placeholder: t("clients.email", "Email"),
              type: "email",
            },
            {
              key: "telephone",
              icon: Phone,
              placeholder: t("clients.phone", "Téléphone"),
            },
            {
              key: "adresse",
              icon: MapPin,
              placeholder: t("clients.address", "Adresse"),
            },
          ].map((f) => (
            <div key={f.key} className="relative">
              <f.icon
                className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                type={f.type || "text"}
                className={inputClass}
                placeholder={f.placeholder}
                value={editForm[f.key]}
                onChange={(e) =>
                  setEditForm({ ...editForm, [f.key]: e.target.value })
                }
                required
              />
            </div>
          ))}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setEditingClient(null)}
              className={`${btnGhost} flex-1`}
            >
              {t("common.cancel", "Annuler")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`${btnPrimary} flex-1`}
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {t("common.save", "Enregistrer")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={subModal.isOpen}
        onClose={() => setSubModal({ isOpen: false, client: null })}
        title={t("common.addSubscription", "Ajouter un abonnement")}
        icon={CreditCard}
        maxWidth="max-w-lg"
      >
        <p className="text-muted-foreground text-xs mb-4">
          {t("subscriptions.for", "Pour")}: {subModal.client?.nom}
        </p>
        <form onSubmit={handleAddSub} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("common.offer", "Offre")}
              </label>
              <select
                className={`${inputClass} pl-4`}
                value={subForm.type}
                onChange={(e) =>
                  setSubForm({ ...subForm, type: e.target.value })
                }
              >
                <option value="Mensuel">
                  {t("subscriptions.monthly", "Mensuel")}
                </option>
                <option value="Trimestriel">
                  {t("subscriptions.quarterly", "Trimestriel")}
                </option>
                <option value="Semestriel">
                  {t("subscriptions.semiAnnual", "Semestriel")}
                </option>
                <option value="Annuel">
                  {t("subscriptions.annual", "Annuel")}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("common.price", "Prix")} (DH)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className={`${inputClass} pl-4`}
                value={subForm.prix}
                onChange={(e) =>
                  setSubForm({ ...subForm, prix: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("common.status", "Statut")}
              </label>
              <select
                className={`${inputClass} pl-4`}
                value={subForm.statut}
                onChange={(e) =>
                  setSubForm({ ...subForm, statut: e.target.value })
                }
              >
                <option value="Active">
                  {t("subscriptions.active", "Actif")}
                </option>
                <option value="Suspendu">
                  {t("subscriptions.suspended", "Suspendu")}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("subscriptions.startDate", "Date de début")}
              </label>
              <input
                type="date"
                required
                className={`${inputClass} pl-4`}
                value={subForm.dateDebut}
                onChange={(e) =>
                  setSubForm({ ...subForm, dateDebut: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                {t("subscriptions.endDate", "Date de fin")}
              </label>
              <input
                type="date"
                required
                className={`${inputClass} pl-4`}
                value={subForm.dateFin}
                onChange={(e) =>
                  setSubForm({ ...subForm, dateFin: e.target.value })
                }
              />
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setSubModal({ isOpen: false, client: null })}
              className={`${btnGhost} flex-1`}
            >
              {t("common.cancel", "Annuler")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`${btnPrimary} flex-1`}
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {t("common.create", "Créer")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDelete}
        message={
          <>
            {t("common.deleteConfirmMsg", "Voulez-vous vraiment supprimer")}{" "}
            <strong>{clientToDelete?.nom}</strong> ?
          </>
        }
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {t("clients.title", "Gestion des Clients")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t(
              "clients.subtitle",
              "Gérez votre portefeuille clients efficacement.",
            )}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link to="/dashboard" className={btnGhost}>
            <ArrowLeft size={16} /> {t("common.back", "Retour")}
          </Link>
          <Link to="/clients/create" className={btnPrimary}>
            <UserPlus size={16} /> {t("clients.create", "Nouveau Client")}
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div
          className={`${cardClass} lg:w-1/4 p-5 flex items-center gap-4 relative overflow-hidden bg-gradient-to-br from-background to-muted/20`}
        >
          <div className="p-3 bg-primary/10 text-primary rounded-xl relative z-10 border border-primary/20">
            <Users size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              {t("clients.totalClients", "Total Clients")}
            </p>
            <p className="text-2xl font-bold text-foreground leading-none">
              {pagination.total}
            </p>
          </div>
        </div>

        <div
          className={`${filterCardClass} lg:w-3/4 p-5 flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/10`}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground w-full md:w-auto">
            <Filter size={16} className="text-primary" />
            <span>Outils de filtrage</span>
          </div>

          <div className="w-full md:flex-1 flex flex-col md:flex-row items-center gap-3 justify-end">
            <div className="relative w-full md:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                placeholder={t("common.search", "Rechercher un client...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClass} pl-10 h-[42px] py-0`}
              />
            </div>

            {currentUser?.role === "admin" && (
              <div className="relative w-full md:w-64 group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none group-focus-within:text-primary transition-colors">
                  <ShieldCheck size={18} />
                </div>
                <Select
                  isSearchable
                  unstyled
                  classNames={selectClassNames}
                  options={employeeOptions}
                  value={employeeOptions.find(
                    (e) => e.value === selectedEmployee,
                  )}
                  onChange={(opt) => {
                    setSelectedEmployee(opt.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t("common.allEmployees", "Tous les employés")}
                  noOptionsMessage={() =>
                    t("common.noResults", "Aucun résultat trouvé")
                  }
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`${cardClass} flex flex-col min-h-[400px] relative`}>
        {loading && clients.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        {loading && clients.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className={thClass}>{t("clients.name", "Nom")}</th>
                    <th className={`${thClass} text-center`}>
                      {t("clients.responsible", "Responsable")}
                    </th>
                    <th className={`${thClass} text-right`}>
                      {t("common.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.length > 0 ? (
                    clients.map((client) => (
                      <tr
                        key={client.id}
                        className="group hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => nav(`/clients/${client.id}`)}
                      >
                        <td className={tdClass}>
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-sm ${getAvatarStyle()}`}
                            >
                              {getInitials(client.nom)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">
                                {client.nom}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {client.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={`${tdClass} text-center`}>
                          {client.employee ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border/50">
                              <ShieldCheck size={14} /> {client.employee.nom}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                              {t("clients.notAssigned", "Non assigné")}
                            </span>
                          )}
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                setSubModal({ isOpen: true, client });
                                e.stopPropagation();
                              }}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title={t(
                                "common.addSubscription",
                                "Ajouter un abonnement",
                              )}
                            >
                              <PlusCircle size={18} />
                            </button>
                            <div className="w-px h-5 bg-border mx-1" />
                            <button
                              onClick={(e) => {
                                setEditingClient(client);
                                e.stopPropagation();
                              }}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                              title={t("common.edit", "Modifier")}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                setClientToDelete(client);
                                e.stopPropagation();
                              }}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                              title={t("common.delete", "Supprimer")}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyState
                      colSpan={3}
                      message={t("common.noResults", "Aucun résultat trouvé")}
                    />
                  )}
                </tbody>
              </table>
            </div>

            {pagination.lastPage > 1 && (
              <div className="p-4 border-t border-border bg-muted/10">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.lastPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
