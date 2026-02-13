import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchClients,
  updateClient,
  deleteClient,
  fetchUsers,
} from "../features/clients/clientsSlice";
import { createSubscription } from "../features/subscriptions/subscriptionsSlice";
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
  Phone,
  MapPin,
  ShieldCheck,
  Filter,
  Eye,
  PlusCircle,
  CreditCard,
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

const ITEMS_PER_PAGE = 7;
const inputClass =
  "w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md outline-none focus:ring-1 focus:ring-primary transition-all text-sm placeholder:text-muted-foreground text-foreground";
const selectClass =
  "w-full pl-10 pr-8 py-2 bg-background border border-input rounded-md outline-none focus:ring-1 focus:ring-primary transition-all text-sm font-medium text-foreground cursor-pointer appearance-none";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-all shadow-sm text-sm disabled:opacity-70";
const btnGhost =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-background border border-input text-foreground rounded-md hover:bg-accent font-medium transition-all shadow-sm text-sm";
const cardClass =
  "bg-card border border-border rounded-lg shadow-sm overflow-hidden";
const thClass =
  "px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border";
const tdClass = "px-6 py-4 whitespace-nowrap text-sm text-foreground";

export default function Clients() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const {
    items: clients,
    users: employees,
    loading,
  } = useAppSelector((s) => s.clients);
  const currentUser = useAppSelector((s) => s.auth.user);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
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
    dispatch(fetchClients());
    dispatch(fetchUsers());
  }, [dispatch]);

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
    if (subForm.dateDebut) {
      setSubForm((prev) => ({
        ...prev,
        dateFin: calculateEndDate(prev.dateDebut, prev.type),
      }));
    }
  }, [subForm.type, subForm.dateDebut]);

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return clients.filter((c) => {
      const matchSearch =
        c.nom.toLowerCase().includes(s) || c.email.toLowerCase().includes(s);
      let matchEmp = true;
      if (currentUser?.role === "admin" && selectedEmployee !== "all")
        matchEmp = c.employee?.id === parseInt(selectedEmployee);
      return matchSearch && matchEmp;
    });
  }, [clients, searchTerm, selectedEmployee, currentUser]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSaving(true);
      const result = await dispatch(
        updateClient({ id: editingClient.id, data: editForm }),
      );
      setIsSaving(false);
      if (updateClient.fulfilled.match(result)) {
        toast.success("Client mis à jour !");
        setEditingClient(null);
      } else toast.error("Échec de la mise à jour.");
    },
    [dispatch, editingClient, editForm],
  );

  const handleDelete = useCallback(async () => {
    const toastId = toast.loading("Suppression...");
    const result = await dispatch(deleteClient(clientToDelete.id));
    setClientToDelete(null);
    if (deleteClient.fulfilled.match(result)) {
      toast.success("Client supprimé.", { id: toastId });
      if (currentData.length === 1 && currentPage > 1)
        setCurrentPage((p) => p - 1);
    } else toast.error("Erreur.", { id: toastId });
  }, [dispatch, clientToDelete, currentData.length, currentPage]);

  const handleAddSub = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSaving(true);
      const payload = {
        ...subForm,
        client_id: subModal.client.id,
        employee_id: currentUser.id,
      };
      const result = await dispatch(createSubscription(payload));
      setIsSaving(false);
      if (createSubscription.fulfilled.match(result)) {
        toast.success("Abonnement créé !");
        setSubModal({ isOpen: false, client: null });
      } else toast.error(result.payload || "Erreur.");
    },
    [dispatch, subForm, subModal, currentUser],
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Toaster position="top-right" />

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        title="Modifier Client"
        icon={Edit}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {[
            { key: "nom", icon: User, placeholder: "Nom complet" },
            { key: "email", icon: Mail, placeholder: "Email", type: "email" },
            { key: "telephone", icon: Phone, placeholder: "Téléphone" },
            { key: "adresse", icon: MapPin, placeholder: "Adresse" },
          ].map((f) => (
            <div key={f.key} className="relative">
              <f.icon
                className="absolute left-3 top-2.5 text-muted-foreground"
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
              Annuler
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
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      {/* Sub Modal */}
      <Modal
        isOpen={subModal.isOpen}
        onClose={() => setSubModal({ isOpen: false, client: null })}
        title="Nouvel Abonnement"
        icon={CreditCard}
        maxWidth="max-w-lg"
      >
        <p className="text-muted-foreground text-xs mb-4">
          Pour: {subModal.client?.nom}
        </p>
        <form onSubmit={handleAddSub} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                Offre
              </label>
              <select
                className={`${inputClass} pl-4`}
                value={subForm.type}
                onChange={(e) =>
                  setSubForm({ ...subForm, type: e.target.value })
                }
              >
                <option value="Mensuel">Mensuel (1 Mois)</option>
                <option value="Trimestriel">Trimestriel (3 Mois)</option>
                <option value="Semestriel">Semestriel (6 Mois)</option>
                <option value="Annuel">Annuel (12 Mois)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                Prix (DH)
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
                Statut
              </label>
              <select
                className={`${inputClass} pl-4`}
                value={subForm.statut}
                onChange={(e) =>
                  setSubForm({ ...subForm, statut: e.target.value })
                }
              >
                <option value="Active">Active</option>
                <option value="Suspendu">Suspendu</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">
                Date Début
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
                Date Fin
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
              Annuler
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
              Créer
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
            Voulez-vous vraiment supprimer{" "}
            <strong>{clientToDelete?.nom}</strong> ?<br />
            <span className="text-xs text-destructive">
              Cette action est irréversible.
            </span>
          </>
        }
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Gestion des Clients
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre portefeuille clients efficacement.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link to="/dashboard" className={btnGhost}>
            <ArrowLeft size={16} /> Retour
          </Link>
          <Link to="/clients/create" className={btnPrimary}>
            <UserPlus size={16} /> Nouveau Client
          </Link>
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`${cardClass} lg:col-span-4 p-6 flex items-center gap-5 relative`}
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8" />
          <div className="p-4 bg-primary/10 text-primary rounded-lg relative z-10">
            <Users size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
              Total Clients
            </p>
            <p className="text-3xl font-bold text-foreground">
              {clients.length}
            </p>
          </div>
        </div>
        <div
          className={`${cardClass} lg:col-span-8 p-2 flex flex-col md:flex-row items-center gap-2`}
        >
          <div className="relative flex-grow w-full">
            <Search
              className="absolute left-3 top-2.5 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
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
          {currentUser?.role === "admin" && (
            <div className="relative w-full md:w-64">
              <Filter
                className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none"
                size={16}
              />
              <select
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  setCurrentPage(1);
                }}
                className={selectClass}
              >
                <option value="all">Tous les employés</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nom}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={`${cardClass} flex flex-col min-h-[400px]`}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className={thClass}>Client</th>
                    <th className={`${thClass} text-center`}>Responsable</th>
                    <th className={`${thClass} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentData.length > 0 ? (
                    currentData.map((client) => (
                      <tr
                        key={client.id}
                        className="group hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => nav(`/clients/${client.id}`)}
                      >
                        <td className={tdClass}>
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border shadow-sm ${getAvatarStyle()}`}
                            >
                              {getInitials(client.nom)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">
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
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-border/50">
                              <ShieldCheck size={12} /> {client.employee.nom}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Non assigné
                            </span>
                          )}
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                setSubModal({ isOpen: true, client });
                                e.stopPropagation();
                              }}
                              className="p-2 text-primary hover:bg-primary/10 rounded-md transition-all"
                              title="Ajouter un abonnement"
                            >
                              <PlusCircle size={16} />
                            </button>
                            <div className="w-px h-4 bg-border mx-1" />
                            <button
                              onClick={(e) => {
                                setEditingClient(client);
                                e.stopPropagation();
                              }}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                setClientToDelete(client);
                                e.stopPropagation();
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
                    <EmptyState colSpan={3} message="Aucun client trouvé" />
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
