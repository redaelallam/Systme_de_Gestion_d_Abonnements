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
  Phone,
  MapPin,
  ShieldCheck,
  Filter,
  Eye,
  PlusCircle,
  CreditCard,
} from "lucide-react";

// --- Constants ---
const API_URL = "http://127.0.0.1:8000/api/clients";
const API_SUB_URL = "http://127.0.0.1:8000/api/abonnements";
const API_USERS_URL = "http://127.0.0.1:8000/api/users";
const ITEMS_PER_PAGE = 7;

// --- Design System UI Components ---
const UI = {
  input:
    "w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm placeholder:text-muted-foreground text-foreground",
  select:
    "w-full pl-10 pr-8 py-2 bg-background border border-input rounded-md outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm font-medium text-foreground cursor-pointer appearance-none",
  label:
    "block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-all shadow-sm text-sm disabled:opacity-70",
  btnGhost:
    "inline-flex items-center justify-center gap-2 px-4 py-2 bg-background border border-input text-foreground rounded-md hover:bg-accent hover:text-accent-foreground font-medium transition-all shadow-sm text-sm",
  card: "bg-card border border-border rounded-lg shadow-sm overflow-hidden",
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
  const colors = ["bg-primary/10 text-primary "];
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name) => name?.substring(0, 2).toUpperCase() || "??";

// --- Sub-Components ---
const DeleteModal = ({ isOpen, onClose, onConfirm, clientName }) => {
  if (!isOpen) return null;
  return (
    <div className={UI.modalOverlay}>
      <div className={`${UI.modalContent} max-w-sm p-6 text-center`}>
        <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Confirmer la suppression
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Voulez-vous vraiment supprimer{" "}
          <span className="font-bold text-foreground">{clientName}</span> ?
          <span className="text-xs text-destructive mt-1 block">
            Cette action est irréversible.
          </span>
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className={`${UI.btnGhost} flex-1`}>
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`${UI.btnPrimary} bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1`}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

const EditModal = ({ isOpen, onClose, onSubmit, client, isSaving }) => {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
  });

  useEffect(() => {
    if (client)
      setFormData({
        nom: client.nom || "",
        email: client.email || "",
        telephone: client.telephone || "",
        adresse: client.adresse || "",
      });
  }, [client]);

  if (!isOpen || !client) return null;

  return (
    <div className={UI.modalOverlay}>
      <div className={UI.modalContent}>
        <div className="border-b border-border p-4 flex justify-between items-center bg-muted/30">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Edit size={18} className="text-primary" /> Modifier Client
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="p-6 space-y-4"
        >
          <div className="space-y-4">
            <div className="relative">
              <User
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                className={UI.input}
                placeholder="Nom complet"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                required
              />
            </div>
            <div className="relative">
              <Mail
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={16}
              />
              <input
                type="email"
                className={UI.input}
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="relative">
              <Phone
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                className={UI.input}
                placeholder="Téléphone"
                value={formData.telephone}
                onChange={(e) =>
                  setFormData({ ...formData, telephone: e.target.value })
                }
                required
              />
            </div>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                className={UI.input}
                placeholder="Adresse"
                value={formData.adresse}
                onChange={(e) =>
                  setFormData({ ...formData, adresse: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
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
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddSubscriptionModal = ({
  isOpen,
  onClose,
  onSubmit,
  client,
  isSaving,
}) => {
  const [subData, setSubData] = useState({
    type: "Mensuel",
    prix: "",
    dateDebut: new Date().toISOString().split("T")[0],
    dateFin: "",
    statut: "Active",
  });

  useEffect(() => {
    if (subData.dateDebut) {
      const start = new Date(subData.dateDebut);
      let end = new Date(start);
      switch (subData.type) {
        case "Mensuel":
          end.setMonth(start.getMonth() + 1);
          break;
        case "Trimestriel":
          end.setMonth(start.getMonth() + 3);
          break;
        case "Semestriel":
          end.setMonth(start.getMonth() + 6);
          break;
        case "Annuel":
          end.setFullYear(start.getFullYear() + 1);
          break;
        default:
          break;
      }
      setSubData((prev) => ({
        ...prev,
        dateFin: end.toISOString().split("T")[0],
      }));
    }
  }, [subData.type, subData.dateDebut]);

  if (!isOpen || !client) return null;

  return (
    <div className={UI.modalOverlay}>
      <div className={`${UI.modalContent} max-w-lg`}>
        <div className="border-b border-border p-4 flex justify-between items-center bg-muted/30">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CreditCard size={18} className="text-primary" /> Nouvel
              Abonnement
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              Pour: {client.nom}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(subData);
          }}
          className="p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={UI.label}>Offre</label>
              <div className="relative">
                <select
                  className={UI.select}
                  value={subData.type}
                  onChange={(e) =>
                    setSubData({ ...subData, type: e.target.value })
                  }
                >
                  <option value="Mensuel">Mensuel (1 Mois)</option>
                  <option value="Trimestriel">Trimestriel (3 Mois)</option>
                  <option value="Semestriel">Semestriel (6 Mois)</option>
                  <option value="Annuel">Annuel (12 Mois)</option>
                </select>
                <Filter
                  className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none"
                  size={16}
                />
              </div>
            </div>
            <div>
              <label className={UI.label}>Prix (DH)</label>
              <input
                type="number"
                step="0.01"
                required
                className={`${UI.input} pl-4`}
                value={subData.prix}
                onChange={(e) =>
                  setSubData({ ...subData, prix: e.target.value })
                }
              />
            </div>
            <div>
              <label className={UI.label}>Statut</label>
              <div className="relative">
                <select
                  className={UI.select}
                  value={subData.statut}
                  onChange={(e) =>
                    setSubData({ ...subData, statut: e.target.value })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
                <Filter
                  className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none"
                  size={16}
                />
              </div>
            </div>
            <div>
              <label className={UI.label}>Date Début</label>
              <input
                type="date"
                required
                className={`${UI.input} pl-4`}
                value={subData.dateDebut}
                onChange={(e) =>
                  setSubData({ ...subData, dateDebut: e.target.value })
                }
              />
            </div>
            <div>
              <label className={UI.label}>Date Fin</label>
              <input
                type="date"
                required
                className={`${UI.input} pl-4`}
                value={subData.dateFin}
                onChange={(e) =>
                  setSubData({ ...subData, dateFin: e.target.value })
                }
              />
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
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
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function Clients() {
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingClient, setEditingClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [subscriptionModal, setSubscriptionModal] = useState({
    isOpen: false,
    client: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
    fetchClients();
    fetchEmployees();
  }, [authHeader]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, authHeader);
      setClients(response.data.data || []);
    } catch (err) {
      toast.error("Impossible de charger les clients.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(API_USERS_URL, authHeader);
      setEmployees(response.data.data || response.data || []);
    } catch (err) {
      console.error("Erreur chargement employés:", err);
    }
  };

  const handleUpdate = async (formData) => {
    setIsSaving(true);
    try {
      await axios.put(`${API_URL}/${editingClient.id}`, formData, authHeader);
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingClient.id ? { ...c, ...formData } : c,
        ),
      );
      toast.success("Client mis à jour !");
      setEditingClient(null);
    } catch (error) {
      toast.error("Échec de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const toastId = toast.loading("Suppression...");
    try {
      await axios.delete(`${API_URL}/${clientToDelete.id}`, authHeader);
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      toast.success("Client supprimé.", { id: toastId });
      if (currentData.length === 1 && currentPage > 1)
        setCurrentPage((p) => p - 1);
    } catch (err) {
      toast.error("Erreur lors de la suppression.", { id: toastId });
    } finally {
      setClientToDelete(null);
    }
  };

  const handleAddSubscription = async (subData) => {
    setIsSaving(true);
    const payload = {
      ...subData,
      client_id: subscriptionModal.client.id,
      employee_id: currentUser.id,
    };
    try {
      await axios.post(API_SUB_URL, payload, authHeader);
      toast.success("Abonnement créé avec succès !");
      setSubscriptionModal({ isOpen: false, client: null });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la création.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return clients.filter((c) => {
      const matchesSearch =
        c.nom.toLowerCase().includes(lowerSearch) ||
        c.email.toLowerCase().includes(lowerSearch);
      let matchesEmployee = true;
      if (currentUser?.role === "admin" && selectedEmployee !== "all") {
        matchesEmployee = c.employee?.id === parseInt(selectedEmployee);
      }
      return matchesSearch && matchesEmployee;
    });
  }, [clients, searchTerm, selectedEmployee, currentUser]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const currentData = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      <DeleteModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDelete}
        clientName={clientToDelete?.nom}
      />
      <EditModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        onSubmit={handleUpdate}
        client={editingClient}
        isSaving={isSaving}
      />
      <AddSubscriptionModal
        isOpen={subscriptionModal.isOpen}
        onClose={() => setSubscriptionModal({ isOpen: false, client: null })}
        onSubmit={handleAddSubscription}
        client={subscriptionModal.client}
        isSaving={isSaving}
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
          <Link to="/dashboard" className={UI.btnGhost}>
            <ArrowLeft size={16} /> Retour
          </Link>
          <Link to="/clients/create" className={UI.btnPrimary}>
            <UserPlus size={16} /> Nouveau Client
          </Link>
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`${UI.card} lg:col-span-4 p-6 flex items-center gap-5 relative group`}
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8"></div>
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
          className={`${UI.card} lg:col-span-8 p-2 flex flex-col md:flex-row items-center gap-2`}
        >
          <div className="relative flex-grow w-full">
            <Search
              className="absolute left-3 top-2.5 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
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
                className={UI.select}
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
                    <th className={UI.tableHead}>Client</th>
                    <th className={UI.tableHead + " text-center"}>
                      Responsable
                    </th>
                    <th className={UI.tableHead + " text-right"}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentData.length > 0 ? (
                    currentData.map((client) => (
                      <tr
                        key={client.id}
                        className="group hover:bg-muted/50 transition-colors duration-200"
                      >
                        <td className={UI.tableCell}>
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border shadow-sm ${getAvatarStyle(client.nom)}`}
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
                        <td className={UI.tableCell + " text-center"}>
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
                        <td className={UI.tableCell + " text-right"}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                setSubscriptionModal({
                                  isOpen: true,
                                  client: client,
                                })
                              }
                              className="p-2 text-primary hover:bg-primary/10 rounded-md transition-all"
                              title="Ajouter un abonnement"
                            >
                              <PlusCircle size={16} />
                            </button>
                            <div className="w-px h-4 bg-border mx-1"></div>
                            <Link
                              to={`/clients/${client.id}`}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all"
                              title="Voir détails"
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              onClick={() => setEditingClient(client)}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setClientToDelete(client)}
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
                        colSpan="3"
                        className="px-6 py-24 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <Search
                            size={48}
                            strokeWidth={1}
                            className="mb-4 opacity-20"
                          />
                          <p>Aucun client trouvé</p>
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
