import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Trash2,
  Edit,
  UserPlus,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  Save,
  Loader2,
  User,
  Mail,
  Lock,
  Shield,
  Filter,
} from "lucide-react";

// --- Design System UI Components ---
const UI = {
  input:
    "w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all text-sm placeholder:text-muted-foreground text-foreground",
  select:
    "w-full pl-10 pr-8 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all text-sm font-medium text-foreground cursor-pointer appearance-none",
  label:
    "block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-all shadow-sm text-sm disabled:opacity-70",
  btnGhost:
    "inline-flex items-center justify-center gap-2 px-4 py-2 bg-background border border-input text-foreground rounded-md hover:bg-accent hover:text-accent-foreground font-medium transition-all shadow-sm text-sm",
  card: "bg-card text-card-foreground border border-border rounded-lg shadow-sm overflow-hidden",
  tableHead:
    "px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border",
  tableCell: "px-6 py-4 whitespace-nowrap text-sm text-foreground",
  modalOverlay:
    "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200",
  modalContent:
    "bg-card text-card-foreground rounded-lg border border-border shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200",
};

// --- Helper: Consistent Avatars ---
const getAvatarStyle = (name) => {
  // ألوان متوافقة مع الوضعين
  const colors = ["bg-primary/10 text-primary border border-primary/20"];
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name) => name?.substring(0, 2).toUpperCase() || "??";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nom: "",
    email: "",
    role: "",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://127.0.0.1:8000/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data.data || []);
    } catch (err) {
      toast.error("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || emp.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [employees, searchTerm, roleFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const currentData = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setEditFormData({
      nom: employee.nom,
      email: employee.email,
      role: employee.role,
      password: "",
    });
    setIsEditModalOpen(true);
  };

  // ✅ تم إضافة دالة فتح نافذة الحذف التي كانت مفقودة
  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = { ...editFormData };
      if (!payload.password) delete payload.password;
      await axios.put(
        `http://127.0.0.1:8000/api/employees/${editingEmployee.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const updatedEmployees = employees.map((emp) =>
        emp.id === editingEmployee.id
          ? { ...emp, ...editFormData, password: emp.password }
          : emp,
      );
      setEmployees(updatedEmployees);
      setIsEditModalOpen(false);
      toast.success("Profil mis à jour !");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleteModalOpen(false);
    const loadingToast = toast.loading("Suppression...");
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://127.0.0.1:8000/api/employees/${employeeToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEmployees((prev) =>
        prev.filter((emp) => emp.id !== employeeToDelete.id),
      );
      toast.success("Employé supprimé", { id: loadingToast });
      if (currentData.length === 1 && currentPage > 1)
        setCurrentPage((prev) => prev - 1);
    } catch (err) {
      toast.error("Erreur suppression", { id: loadingToast });
    } finally {
      setEmployeeToDelete(null);
    }
  };

  return (
    // استخدام bg-background للنظام بأكمله
    <div className="space-y-6 animate-in fade-in duration-500 bg-background min-h-screen p-6 transition-colors duration-300">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--border))",
          },
        }}
      />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className={UI.modalOverlay}>
          <div className={UI.modalContent}>
            <div className="border-b border-border p-4 flex justify-between items-center bg-muted/30">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Edit size={18} className="text-primary" /> Modifier le profil
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-center -mt-10 mb-6">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-sm ring-4 ring-card border ${editingEmployee ? getAvatarStyle(editingEmployee.nom) : "bg-muted"}`}
                >
                  {editingEmployee
                    ? getInitials(editFormData.nom || editingEmployee.nom)
                    : "?"}
                </div>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className={UI.label}>Nom complet</label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-2.5 text-muted-foreground"
                      size={16}
                    />
                    <input
                      type="text"
                      className={UI.input}
                      value={editFormData.nom}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          nom: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={UI.label}>Email</label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-2.5 text-muted-foreground"
                      size={16}
                    />
                    <input
                      type="email"
                      className={UI.input}
                      value={editFormData.email}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={UI.label}>Rôle</label>
                  <div className="relative">
                    <Shield
                      className="absolute left-3 top-2.5 text-muted-foreground"
                      size={16}
                    />
                    <select
                      className={UI.select}
                      value={editFormData.role}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          role: e.target.value,
                        })
                      }
                    >
                      <option value="employee" className="bg-background">
                        Employé
                      </option>
                      <option value="admin" className="bg-background">
                        Administrateur
                      </option>
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={UI.label}>Mot de passe (Optionnel)</label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-2.5 text-muted-foreground"
                      size={16}
                    />
                    <input
                      type="password"
                      className={UI.input}
                      value={editFormData.password}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          password: e.target.value,
                        })
                      }
                      placeholder="Nouveau mot de passe"
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className={`${UI.btnGhost} flex-1`}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`${UI.btnPrimary} flex-1`}
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}{" "}
                    Mettre à jour
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className={UI.modalOverlay}>
          <div className={`${UI.modalContent} max-w-sm p-6 text-center`}>
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4 border border-destructive/20">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Voulez-vous vraiment supprimer{" "}
              <strong className="text-foreground">
                {employeeToDelete?.nom}
              </strong>{" "}
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className={`${UI.btnGhost} flex-1`}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className={`${UI.btnPrimary} bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1`}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Gestion d'Équipe
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble et gestion des accès.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link to="/dashboard" className={UI.btnGhost}>
            <ArrowLeft size={16} /> Retour
          </Link>
          <Link to="/employees/create" className={UI.btnPrimary}>
            <UserPlus size={16} /> Nouveau Membre
          </Link>
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`${UI.card} lg:col-span-4 p-6 flex items-center gap-5 relative group`}
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8"></div>
          <div className="p-4 bg-primary/10 text-primary rounded-lg relative z-10 border border-primary/20">
            <Users size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
              Total Employés
            </p>
            <p className="text-3xl font-bold text-foreground">
              {employees.length}
            </p>
          </div>
        </div>

        <div
          className={`${UI.card} lg:col-span-8 p-2 flex flex-col md:flex-row items-center gap-2`}
        >
          <div className="relative flex-grow w-full">
            <Search
              className="absolute left-3 top-2.5 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher un employé..."
              className={UI.input}
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
              className={UI.select}
            >
              <option value="all" className="bg-background">
                Tous les rôles
              </option>
              <option value="employee" className="bg-background">
                Employé
              </option>
              <option value="admin" className="bg-background">
                Administrateur
              </option>
            </select>
            {/* Custom Arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`${UI.card} flex flex-col min-h-[400px]`}>
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium animate-pulse">
              Chargement des données...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className={UI.tableHead}>Membre</th>
                    <th className={UI.tableHead}>Email</th>
                    {roleFilter === "all" && (
                      <th className={UI.tableHead + " text-center"}>Rôle</th>
                    )}
                    <th className={UI.tableHead + " text-right"}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentData.length > 0 ? (
                    currentData.map((employee) => (
                      <tr
                        key={employee.id}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <td className={UI.tableCell}>
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border shadow-sm ${getAvatarStyle(employee.nom)}`}
                            >
                              {getInitials(employee.nom)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {employee.nom}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: #{employee.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={UI.tableCell}>
                          <span className="text-sm text-muted-foreground">
                            {employee.email}
                          </span>
                        </td>
                        {roleFilter === "all" && (
                          <td className={UI.tableCell + " text-center"}>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${employee.role === "admin" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"}`}
                            >
                              {employee.role}
                            </span>
                          </td>
                        )}
                        <td className={UI.tableCell + " text-right"}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(employee)}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(employee)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={roleFilter === "all" ? 4 : 3}
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <Search size={32} className="mb-2 opacity-20" />
                          <p>Aucun résultat trouvé.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-muted/20">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Page {currentPage} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 text-foreground transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 text-foreground transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
