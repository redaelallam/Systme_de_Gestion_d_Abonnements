import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchEmployees,
  updateEmployee,
  deleteEmployee,
} from "../features/employees/employeesSlice";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import {
  Trash2,
  Edit,
  UserPlus,
  ArrowLeft,
  Search,
  Users,
  X,
  Save,
  Loader2,
  User,
  Mail,
  Lock,
  Shield,
  Filter,
  AlertTriangle,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import Pagination from "../components/ui/Pagination";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import { getInitials, getAvatarStyle } from "../utils/helpers";

const ITEMS_PER_PAGE = 6;
const inputClass =
  "w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground text-foreground";
const selectClass =
  "w-full pl-10 pr-8 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring transition-all text-sm font-medium text-foreground cursor-pointer appearance-none";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-all shadow-sm text-sm disabled:opacity-70";
const btnGhost =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-background border border-input text-foreground rounded-md hover:bg-accent hover:text-accent-foreground font-medium transition-all shadow-sm text-sm";
const cardClass =
  "bg-card text-card-foreground border border-border rounded-lg shadow-sm overflow-hidden";
const thClass =
  "px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border";
const tdClass = "px-6 py-4 whitespace-nowrap text-sm text-foreground";

export default function Employees() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { items: employees, loading } = useAppSelector((s) => s.employees);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
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

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === "all" || emp.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [employees, searchTerm, roleFilter]);

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
        toast.success(t("employees.profileUpdated"));
        setEditTarget(null);
      } else toast.error(t("employees.updateError"));
    },
    [dispatch, editTarget, editForm, t],
  );

  const handleDeleteSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!deleteTarget) return;

      setIsDeleting(true);
      const loadingToast = toast.loading(t("common.deleting"));

      const payload = transferToId
        ? { id: deleteTarget.id, transfer_to_employee_id: transferToId }
        : { id: deleteTarget.id };

      const result = await dispatch(deleteEmployee(payload));
      setIsDeleting(false);

      if (deleteEmployee.fulfilled.match(result)) {
        toast.success("Employé supprimé avec succès.", { id: loadingToast });
        setDeleteTarget(null);
        setTransferToId("");
        if (currentData.length === 1 && currentPage > 1)
          setCurrentPage((p) => p - 1);
      } else {
        toast.error(result.payload || t("employees.deleteError"), {
          id: loadingToast,
        });
      }
    },
    [dispatch, deleteTarget, transferToId, currentData.length, currentPage, t],
  );

  const transferOptions = employees.filter(
    (emp) => emp.id !== deleteTarget?.id && emp.role === "employee",
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Toaster position="top-right" />

      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={t("employees.edit")}
        icon={Edit}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {[
            {
              label: t("employees.name"),
              icon: User,
              value: editForm.nom,
              key: "nom",
              type: "text",
            },
            {
              label: t("employees.email"),
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
              {t("employees.role")}
            </label>
            <div className="relative">
              <Shield
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={16}
              />
              <select
                className={selectClass}
                value={editForm.role}
                onChange={(e) =>
                  setEditForm({ ...editForm, role: e.target.value })
                }
              >
                <option value="employee">{t("employees.employee")}</option>
                <option value="admin">{t("employees.admin")}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("employees.passwordOptional")}
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
                placeholder={t("employees.newPassword")}
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className={`${btnGhost} flex-1`}
            >
              {t("common.cancel")}
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
              {t("employees.updateEmployee")}
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
                  className={selectClass}
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
                <strong>devez obligatoirement</strong> sélectionner un employé
                remplaçant ci-dessus pour transférer la gestion des clients et
                abonnements. Les transactions financières resteront au nom de
                l'ancien employé.
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
              {t("common.cancel")}
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
            {t("employees.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("employees.subtitle")}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link to="/dashboard" className={btnGhost}>
            <ArrowLeft size={16} /> {t("common.back")}
          </Link>
          <Link to="/employees/create" className={btnPrimary}>
            <UserPlus size={16} /> {t("employees.create")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`${cardClass} lg:col-span-4 p-2 flex items-center gap-5 relative`}
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8" />
          <div className="p-2 bg-primary/10 text-primary rounded-lg relative z-10 border border-primary/20">
            <Users size={22} />
          </div>
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
              {t("employees.totalEmployees")}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {employees.length}
            </p>
          </div>
        </div>
        <div
          className={`${cardClass} lg:col-span-8 p-2 flex flex-col md:flex-row items-center gap-2`}
        >
          <div className="relative grow w-full">
            <Search
              className="absolute left-3 top-2.5 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder={t("employees.searchPlaceholder")}
              className={inputClass}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="relative w-full md:w-64">
            <Filter
              className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none"
              size={16}
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={selectClass}
            >
              <option value="all">{t("common.allRoles")}</option>
              <option value="employee">{t("employees.employee")}</option>
              <option value="admin">{t("employees.admin")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className={`${cardClass} flex flex-col min-h-[400px]`}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className={thClass}>{t("employees.member")}</th>
                    <th className={thClass}>{t("employees.email")}</th>
                    {roleFilter === "all" && (
                      <th className={`${thClass} text-center`}>
                        {t("employees.role")}
                      </th>
                    )}
                    <th className={`${thClass} text-right`}>
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentData.length > 0 ? (
                    currentData.map((emp) => (
                      <tr
                        key={emp.id}
                        className="group hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => nav(`/employee/${emp.id}`)}
                      >
                        <td className={tdClass}>
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border shadow-sm ${getAvatarStyle()}`}
                            >
                              {getInitials(emp.nom)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {emp.nom}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: #{emp.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={tdClass}>
                          <span className="text-sm text-muted-foreground">
                            {emp.email}
                          </span>
                        </td>
                        {roleFilter === "all" && (
                          <td className={`${tdClass} text-center`}>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${emp.role === "admin" ? "bg-chart-4/10 text-chart-4 border-chart-4/20" : "bg-chart-1/10 text-chart-1 border-chart-1/20"}`}
                            >
                              {emp.role === "admin"
                                ? t("employees.admin")
                                : t("employees.employee")}
                            </span>
                          </td>
                        )}
                        <td className={`${tdClass} text-right`}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(emp);
                              }}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(emp);
                              }}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyState colSpan={roleFilter === "all" ? 4 : 3} />
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
