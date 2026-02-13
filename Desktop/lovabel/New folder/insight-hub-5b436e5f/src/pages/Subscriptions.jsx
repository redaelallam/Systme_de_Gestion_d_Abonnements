import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import {
  Search,
  Filter,
  CheckCircle,
  PauseCircle,
  RefreshCw,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCheck,
  Edit,
  X,
  Save,
  Calendar,
  AlertTriangle,
  RefreshCcw,
  User,
  CreditCard,
} from "lucide-react";

// --- Constants ---
const API_URL = "http://127.0.0.1:8000/api/abonnements";
const API_CLIENTS_URL = "http://127.0.0.1:8000/api/clients";
const ITEMS_PER_PAGE = 7;

// تحديث الألوان لتتوافق مع Design System (Success, Warning, Destructive)
const STATUS_CONFIG = {
  active: {
    label: "Actif",
    style: "bg-success/10 text-success border-success/20",
  },
  actif: {
    label: "Actif",
    style: "bg-success/10 text-success border-success/20",
  },
  suspendu: {
    label: "Suspendu",
    style: "bg-warning/10 text-warning border-warning/20",
  },
  annulé: {
    label: "Annulé",
    style: "bg-destructive/10 text-destructive border-destructive/20",
  },
  expiré: {
    label: "Expiré",
    style: "bg-muted text-muted-foreground border-border",
  },
};

// --- Design System Styles ---
const inputClass =
  "w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all text-sm placeholder:text-muted-foreground text-foreground";
const selectClass =
  "w-full pl-10 pr-8 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all text-sm font-medium text-foreground cursor-pointer appearance-none";
const buttonPrimaryClass =
  "flex-1 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm";
const buttonGhostClass =
  "flex-1 py-2 bg-background border border-input text-foreground rounded-md hover:bg-accent hover:text-accent-foreground font-medium text-sm transition-all";
const cardClass = "bg-card border border-border rounded-lg shadow-sm";
const iconInputClass = "absolute left-3 top-2.5 text-muted-foreground";

// --- Helpers ---
const getInitials = (name) => name?.substring(0, 2).toUpperCase() || "??";

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0];
};

const calculateEndDate = (startDate, type) => {
  const start = new Date(startDate);
  let end = new Date(start);

  switch (type) {
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
  return end.toISOString().split("T")[0];
};

const Subscriptions = () => {
  const navigate = useNavigate();

  // --- States ---
  const [subscriptions, setSubscriptions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedClient, setSelectedClient] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    clientName: "",
  });
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth
  const token = localStorage.getItem("token");
  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),
    [token],
  );

  // --- Fetch Data ---
  const fetchSubscriptions = async () => {
    if (!token) return navigate("/login");
    setLoading(true);
    try {
      const response = await axios.get(API_URL, authConfig);
      const processedData = (response.data.data || []).map((sub) => {
        const isExpired = new Date(sub.dateFin) < new Date();
        if (isExpired && sub.statut !== "Annulé") {
          return { ...sub, statut: "Expiré" };
        }
        return sub;
      });
      setSubscriptions(processedData);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expirée");
        navigate("/login");
      } else {
        toast.error("Erreur de chargement des abonnements");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    if (!token) return;
    try {
      const response = await axios.get(API_CLIENTS_URL, authConfig);
      setClients(response.data.data || []);
    } catch (err) {
      console.error("Erreur chargement clients", err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchClients();
  }, [authConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, selectedClient]);

  // --- Filter Logic ---
  const filteredSubs = useMemo(() => {
    return subscriptions.filter((sub) => {
      const clientName = sub.client?.nom?.toLowerCase() || "";
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = clientName.includes(searchLower);
      const matchesStatus =
        filterStatus === "all" ||
        sub.statut?.toLowerCase() === filterStatus.toLowerCase();
      const matchesClient =
        selectedClient === "all" || sub.client?.id === parseInt(selectedClient);
      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [subscriptions, searchTerm, filterStatus, selectedClient]);

  const totalPages = Math.ceil(filteredSubs.length / ITEMS_PER_PAGE);
  const currentItems = filteredSubs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // --- Handlers ---
  const confirmDelete = async () => {
    const toastId = toast.loading("Suppression...");
    try {
      await axios.delete(`${API_URL}/${deleteModal.id}`, authConfig);
      setSubscriptions((prev) => prev.filter((s) => s.id !== deleteModal.id));
      toast.success("Abonnement supprimé", { id: toastId });
      setDeleteModal({ isOpen: false, id: null, clientName: "" });
    } catch (error) {
      toast.error("Erreur lors de la suppression", { id: toastId });
    }
  };

  const updateStatus = async (id, newStatus) => {
    const toastId = toast.loading("Mise à jour...");
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return;
    let payload = { statut: newStatus };
    let renewalMsg = null;
    if (newStatus === "Active") {
      const today = new Date().toISOString().split("T")[0];
      const isExpired = new Date(sub.dateFin) < new Date(today);
      if (isExpired) {
        const newEndDate = calculateEndDate(today, sub.type);
        payload.dateDebut = today;
        payload.dateFin = newEndDate;
        renewalMsg = `Renouvelé jusqu'au ${newEndDate}`;
      }
    }
    try {
      await axios.put(`${API_URL}/${id}`, payload, authConfig);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...payload } : s)),
      );
      if (renewalMsg) {
        toast.success(renewalMsg, { id: toastId, icon: <RefreshCcw /> });
      } else {
        toast.success(`Statut: ${newStatus}`, { id: toastId });
      }
    } catch (error) {
      toast.error("Erreur de mise à jour", { id: toastId });
    }
  };

  const openEditModal = (sub) => {
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
  };

  const handleModalStatusChange = (e) => {
    const newStatus = e.target.value;
    let updatedData = { ...editModal.data, statut: newStatus };
    if (newStatus === "Active") {
      const today = new Date().toISOString().split("T")[0];
      const currentEndDate = editModal.data.dateFin;
      if (new Date(currentEndDate) < new Date(today)) {
        const newEndDate = calculateEndDate(today, editModal.data.type);
        updatedData.dateDebut = today;
        updatedData.dateFin = newEndDate;
        toast.custom(
          (t) => (
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
              <RefreshCw className="animate-spin" size={16} />
              <span>Dates mises à jour automatiquement !</span>
            </div>
          ),
          { duration: 3000 },
        );
      }
    }
    setEditModal({ ...editModal, data: updatedData });
  };

  const handleModalTypeChange = (e) => {
    const newType = e.target.value;
    const newEndDate = calculateEndDate(editModal.data.dateDebut, newType);
    setEditModal({
      ...editModal,
      data: { ...editModal.data, type: newType, dateFin: newEndDate },
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Enregistrement...");
    try {
      const { id, ...data } = editModal.data;
      await axios.put(`${API_URL}/${id}`, data, authConfig);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s)),
      );
      toast.success("Modifications enregistrées", { id: toastId });
      setEditModal({ isOpen: false, data: null });
    } catch (error) {
      toast.error("Erreur lors de la modification", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Toaster position="top-center" />

      {/* --- Delete Modal --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setDeleteModal({ isOpen: false, id: null })}
          ></div>
          <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Voulez-vous vraiment supprimer l'abonnement de{" "}
              <span className="font-bold text-foreground">
                {deleteModal.clientName}
              </span>{" "}
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, id: null })}
                className={buttonGhostClass}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-all font-medium text-sm shadow-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Modal --- */}
      {editModal.isOpen && editModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setEditModal({ isOpen: false, data: null })}
          ></div>
          <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="border-b border-border p-4 flex justify-between items-center bg-muted/20">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Edit size={18} className="text-primary" /> Modifier
                l'abonnement
              </h3>
              <button
                onClick={() => setEditModal({ isOpen: false, data: null })}
                className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-md p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {new Date(editModal.data.dateFin) < new Date() && (
                <div className="bg-warning/10 border border-warning/20 rounded-md p-3 flex items-start gap-3">
                  <AlertTriangle className="text-warning shrink-0" size={20} />
                  <div className="text-sm text-warning/80">
                    <span className="font-bold">Attention:</span> Cet abonnement
                    est expiré.
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    Type d'offre
                  </label>
                  <select
                    required
                    className={selectClass}
                    value={editModal.data.type}
                    onChange={handleModalTypeChange}
                  >
                    <option value="Mensuel">Mensuel</option>
                    <option value="Trimestriel">Trimestriel</option>
                    <option value="Semestriel">Semestriel</option>
                    <option value="Annuel">Annuel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    Prix (DH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring focus:border-input text-sm"
                    value={editModal.data.prix}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        data: { ...editModal.data, prix: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    Statut
                  </label>
                  <select
                    className={selectClass}
                    value={editModal.data.statut}
                    onChange={handleModalStatusChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Expiré">Expiré</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    Date Début
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring focus:border-input text-sm"
                    value={editModal.data.dateDebut}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        data: { ...editModal.data, dateDebut: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    Date Fin
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring focus:border-input text-sm"
                    value={editModal.data.dateFin}
                    onChange={(e) =>
                      setEditModal({
                        ...editModal,
                        data: { ...editModal.data, dateFin: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, data: null })}
                  className={buttonGhostClass}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={buttonPrimaryClass}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}{" "}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Gestion des Abonnements
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez et suivez les contrats clients
            </p>
          </div>
        </div>

        {/* --- Filters Area --- */}
        <div
          className={`${cardClass} p-2 flex flex-col md:flex-row gap-2 items-stretch md:items-center`}
        >
          {/* 1. Search Bar */}
          <div className="relative flex-1 group">
            <Search className={iconInputClass} size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              className={inputClass}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            {/* 2. Client Filter */}
            <div className="relative w-full md:w-56">
              <User className={iconInputClass} size={16} />
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className={selectClass}
              >
                <option value="all">Tous les clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Status Filter */}
            <div className="relative w-full md:w-48">
              <Filter className={iconInputClass} size={16} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={selectClass}
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspendu">Suspendu</option>
                <option value="expiré">Expiré</option>
                <option value="annulé">Annulé</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                fetchSubscriptions();
                fetchClients();
              }}
              className="p-2.5 bg-background border border-input rounded-md hover:bg-accent text-foreground transition-colors flex items-center justify-center"
              title="Actualiser"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* --- Table Area --- */}
        <div
          className={`${cardClass} overflow-hidden flex flex-col min-h-[400px]`}
        >
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
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Client / Gérant
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Offre
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Période
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {currentItems.length > 0 ? (
                      currentItems.map((sub) => {
                        const status =
                          STATUS_CONFIG[sub.statut?.toLowerCase()] ||
                          STATUS_CONFIG.expiré;
                        return (
                          <tr
                            key={sub.id}
                            className="hover:bg-muted/50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                  {getInitials(sub.client?.nom)}
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">
                                    {sub.client?.nom || "Inconnu"}
                                  </div>
                                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                    <UserCheck
                                      size={12}
                                      className="text-primary/70"
                                    />{" "}
                                    {sub.employee?.nom || "Admin"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-foreground text-sm">
                                {sub.type}
                              </div>
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
                                <span className="text-border pl-4">|</span>
                                <span
                                  className={`pl-4 font-bold ${sub.statut === "Expiré" ? "text-destructive" : "text-foreground"}`}
                                >
                                  {new Date(sub.dateFin).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${status.style}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <Link
                                  to={`/subscriptions/${sub.id}`}
                                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all"
                                  title="Voir détails"
                                >
                                  <Eye size={16} />
                                </Link>
                                <button
                                  onClick={() => openEditModal(sub)}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                                  title="Modifier"
                                >
                                  <Edit size={16} />
                                </button>
                                <div className="w-px h-4 bg-border mx-1"></div>
                                <button
                                  onClick={() => updateStatus(sub.id, "Active")}
                                  className="p-2 text-muted-foreground hover:text-success hover:bg-success/10 rounded-md transition-all"
                                  title="Activer"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    updateStatus(sub.id, "Suspendu")
                                  }
                                  className="p-2 text-muted-foreground hover:text-warning hover:bg-warning/10 rounded-md transition-all"
                                  title="Suspendre"
                                >
                                  <PauseCircle size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteModal({
                                      isOpen: true,
                                      id: sub.id,
                                      clientName: sub.client?.nom,
                                    })
                                  }
                                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                                  title="Supprimer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-16 text-center text-muted-foreground"
                        >
                          <p>Aucun résultat trouvé.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-card border-t border-border flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Page {currentPage} / {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 text-foreground transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 text-foreground transition-colors"
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
    </div>
  );
};

export default Subscriptions;
