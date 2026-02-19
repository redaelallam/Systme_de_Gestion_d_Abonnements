import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchEmployees,
  updateEmployee,
  deleteEmployee,
} from "../features/employees/employeesSlice";
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
  Lock,
  Shield,
  AlertTriangle,
  Filter,
  BadgeCheck,
  Search,
  X,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import Pagination from "../components/ui/Pagination";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import { getInitials, getAvatarStyle } from "../utils/helpers";

const ITEMS_PER_PAGE = 6;
const inputClass =
  "w-full ps-10 pe-4 py-2.5 bg-background border border-input rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm placeholder:text-muted-foreground text-foreground shadow-sm";
const selectHtmlClass =
  "w-full ps-10 pe-8 py-2.5 bg-background border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring transition-all text-sm font-medium text-foreground cursor-pointer appearance-none shadow-sm";
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

export default function Employees() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { items: employees, loading } = useAppSelector((s) => s.employees);

  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [transferToId, setTransferToId] = useState("");

  const [editForm, setEditForm] = useState({
    nom: "",
    email: "",
    role: "",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const matchesRole = roleFilter === "all" || emp.role === roleFilter;
      const lowerSearch = debouncedSearch.toLowerCase();
      const matchesSearch =
        debouncedSearch === "" ||
        emp.nom.toLowerCase().includes(lowerSearch) ||
        emp.email.toLowerCase().includes(lowerSearch);

      return matchesRole && matchesSearch;
    });
  }, [employees, roleFilter, debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const openEdit = useCallback((emp) => {
    setEditTarget(emp);
    setEditForm({
      nom: emp.nom,
      email: emp.email,
      role: emp.role,
      password: "",
    });
  }, []);

  const handleEditSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSaving(true);
      const result = await dispatch(
        updateEmployee({ id: editTarget.id, data: editForm }),
      );
      setIsSaving(false);
      if (updateEmployee.fulfilled.match(result)) {
        showToast.success(
          t("employees.profileUpdated", "Profil mis à jour avec succès"),
        );
        setEditTarget(null);
      } else {
        const errorMsg =
          typeof result.payload === "string"
            ? result.payload
            : t("employees.updateError", "Erreur lors de la mise à jour");
        showToast.error(errorMsg);
      }
    },
    [dispatch, editTarget, editForm, t],
  );

  const handleDeleteSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!deleteTarget) return;
      setIsDeleting(true);
      const loadingToast = showToast.loading(
        t("common.deleting", "Suppression en cours..."),
      );

      const payload = transferToId
        ? { id: deleteTarget.id, transfer_to_employee_id: transferToId }
        : { id: deleteTarget.id };

      const result = await dispatch(deleteEmployee(payload));
      setIsDeleting(false);

      showToast.dismiss(loadingToast);
      if (deleteEmployee.fulfilled.match(result)) {
        showToast.success("Employé supprimé avec succès.");
        setDeleteTarget(null);
        setTransferToId("");
        if (currentData.length === 1 && currentPage > 1)
          setCurrentPage((p) => p - 1);
      } else {
        // قراءة وتمرير رسالة الخطأ بشكل صحيح (سواء كانت من الـ Payload أو الـ error الافتراضي)
        const errorMsg =
          result.payload ||
          result.error?.message ||
          t("employees.deleteError", "Erreur de suppression");

        showToast.error(errorMsg);
      }
    },
    [dispatch, deleteTarget, transferToId, currentData.length, currentPage, t],
  );

  const transferOptions = employees.filter(
    (emp) => emp.id !== deleteTarget?.id && emp.role === "employee",
  );
  const roleOptions = [
    { value: "all", label: t("common.allRoles", "Tous les rôles") },
    { value: "employee", label: t("employees.employee", "Employé") },
    { value: "admin", label: t("employees.admin", "Administrateur") },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={t("employees.edit", "Modifier l'employé")}
        icon={Edit}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {[
            {
              label: t("employees.name", "Nom"),
              icon: User,
              value: editForm.nom,
              key: "nom",
              type: "text",
            },
            {
              label: t("employees.email", "Email"),
              icon: Mail,
              value: editForm.email,
              key: "email",
              type: "email",
            },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                {f.label}
              </label>
              <div className="relative">
                <f.icon
                  className="absolute left-3 top-2.5 text-muted-foreground"
                  size={16}
                />
                <input
                  type={f.type}
                  className={inputClass}
                  value={f.value}
                  onChange={(e) =>
                    setEditForm({ ...editForm, [f.key]: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("employees.role", "Rôle")}
            </label>
            <div className="relative">
              <Shield
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={16}
              />
              <select
                className={selectHtmlClass}
                value={editForm.role}
                onChange={(e) =>
                  setEditForm({ ...editForm, role: e.target.value })
                }
              >
                <option value="employee">
                  {t("employees.employee", "Employé")}
                </option>
                <option value="admin">
                  {t("employees.admin", "Administrateur")}
                </option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("employees.passwordOptional", "Mot de passe (Optionnel)")}
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={16}
              />
              <input
                type="password"
                className={inputClass}
                value={editForm.password}
                onChange={(e) =>
                  setEditForm({ ...editForm, password: e.target.value })
                }
                placeholder={t("employees.newPassword", "Nouveau mot de passe")}
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
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
              )}{" "}
              {t("employees.updateEmployee", "Mettre à jour")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setTransferToId("");
        }}
        title="Supprimer l'employé"
        icon={Trash2}
      >
        <form onSubmit={handleDeleteSubmit} className="space-y-5">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-start gap-3 text-sm">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <div>
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong>{deleteTarget?.nom}</strong> ? Cette action est
              irréversible.
            </div>
          </div>
          <div className="bg-muted/30 border border-border p-4 rounded-lg space-y-3">
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                Transférer les clients vers :
              </label>
              <div className="relative">
                <Users
                  className="absolute left-3 top-2.5 text-muted-foreground"
                  size={16}
                />
                <select
                  className={selectHtmlClass}
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                >
                  <option value="">
                    -- Ignorer s'il n'a pas de clients --
                  </option>
                  {transferOptions.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nom}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                <span className="font-bold text-warning">Important :</span> Si
                cet employé possède des clients actifs, vous{" "}
                <strong>devez obligatoirement</strong> sélectionner un
                remplaçant.
              </p>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setDeleteTarget(null);
                setTransferToId("");
              }}
              className={`${btnGhost} flex-1`}
            >
              {t("common.cancel", "Annuler")}
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 font-medium text-sm flex items-center justify-center gap-2 transition-all"
            >
              {isDeleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}{" "}
              Supprimer
            </button>
          </div>
        </form>
      </Modal>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {t("employees.title", "Gestion des Employés")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("employees.subtitle", "Gérez votre équipe efficacement.")}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link to="/dashboard" className={btnGhost}>
            <ArrowLeft size={16} /> {t("common.back", "Retour")}
          </Link>
          <Link to="/employees/create" className={btnPrimary}>
            <UserPlus size={16} /> {t("employees.create", "Nouvel Employé")}
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div
          className={`${cardClass} lg:w-1/4 p-5 flex items-center gap-4 relative overflow-hidden bg-gradient-to-br from-background to-muted/20`}
        >
          <div className="p-3 bg-primary/10 text-primary rounded-xl relative z-10 border border-primary/20">
            <BadgeCheck size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
              {t("employees.totalEmployees", "Total Employés")}
            </p>
            <p className="text-2xl font-bold text-foreground leading-none">
              {employees.length}
            </p>
          </div>
        </div>

        <div
          className={`${filterCardClass} lg:w-3/4 p-5 flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/10`}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground w-full md:w-auto">
            <Filter size={16} className="text-primary" />
            <span>Outils de recherche et filtrage</span>
          </div>

          <div className="w-full md:w-auto flex-grow flex flex-col md:flex-row gap-3">
            <div className="relative w-full group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10"
                size={18}
              />
              <input
                type="text"
                placeholder={t(
                  "employees.searchPlaceholder",
                  "Rechercher un employé...",
                )}
                className={`w-full pl-10 pr-10 py-[9px] bg-background border rounded-lg transition-all duration-200 text-sm shadow-sm hover:border-primary/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border-input`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted z-10"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative w-full md:w-64 group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none group-focus-within:text-primary transition-colors">
                <Shield size={18} />
              </div>
              <Select
                isSearchable
                unstyled
                classNames={selectClassNames}
                options={roleOptions}
                value={roleOptions.find((r) => r.value === roleFilter)}
                onChange={(e) => {
                  setRoleFilter(e.value);
                  setCurrentPage(1);
                }}
                placeholder={t("common.allRoles", "Tous les rôles")}
                noOptionsMessage={() =>
                  t("common.noResults", "Aucun résultat trouvé")
                }
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`${cardClass} flex flex-col min-h-[400px]`}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className={thClass}>
                      {t("employees.member", "Membre")}
                    </th>
                    <th className={thClass}>{t("employees.email", "Email")}</th>
                    {roleFilter === "all" && (
                      <th className={`${thClass} text-center`}>
                        {t("employees.role", "Rôle")}
                      </th>
                    )}
                    <th className={`${thClass} text-right`}>
                      {t("common.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentData.length > 0 ? (
                    currentData.map((emp) => (
                      <tr
                        key={emp.id}
                        className="group hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => nav(`/employee/${emp.id}`)}
                      >
                        <td className={tdClass}>
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-sm ${getAvatarStyle()}`}
                            >
                              {getInitials(emp.nom)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">
                                {emp.nom}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                ID: #{emp.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={tdClass}>
                          <span className="text-sm font-medium text-muted-foreground">
                            {emp.email}
                          </span>
                        </td>
                        {roleFilter === "all" && (
                          <td className={`${tdClass} text-center`}>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold border ${emp.role === "admin" ? "bg-chart-4/10 text-chart-4 border-chart-4/20" : "bg-chart-1/10 text-chart-1 border-chart-1/20"}`}
                            >
                              {emp.role === "admin"
                                ? t("employees.admin", "Administrateur")
                                : t("employees.employee", "Employé")}
                            </span>
                          </td>
                        )}
                        <td className={`${tdClass} text-right`}>
                          <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(emp);
                              }}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(emp);
                              }}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyState
                      colSpan={roleFilter === "all" ? 4 : 3}
                      message={t("common.noResults", "Aucun résultat trouvé")}
                    />
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t border-border bg-muted/10">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
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
