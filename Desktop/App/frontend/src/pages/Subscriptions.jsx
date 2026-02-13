import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import {
  fetchSubscriptions,
  updateSubscription,
  deleteSubscription,
  updateSubscriptionStatus,
} from "../features/subscriptions/subscriptionsSlice";
import { fetchClients } from "../features/clients/clientsSlice";
import toast, { Toaster } from "react-hot-toast";
import {
  Search,
  Filter,
  CheckCircle,
  PauseCircle,
  RefreshCw,
  Loader2,
  Trash2,
  UserCheck,
  Edit,
  X,
  Save,
  Calendar,
  AlertTriangle,
  User,
  CreditCard,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Pagination from "../components/ui/Pagination";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import {
  getInitials,
  STATUS_CONFIG,
  calculateEndDate,
  formatDateForInput,
} from "../utils/helpers";

const ITEMS_PER_PAGE = 7;
const inputClass =
  "w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground text-foreground";
const selectClass =
  "w-full pl-10 pr-8 py-2 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring transition-all text-sm font-medium text-foreground cursor-pointer appearance-none";
const cardClass = "bg-card border border-border rounded-lg shadow-sm";

const Subscriptions = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: subscriptions, loading } = useAppSelector(
    (s) => s.subscriptions,
  );
  const { items: clients } = useAppSelector((s) => s.clients);

  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedClient, setSelectedClient] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    clientName: "",
  });
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchSubscriptions());
    dispatch(fetchClients());
  }, [dispatch]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, selectedClient]);

  const filtered = useMemo(() => {
    return subscriptions.filter((sub) => {
      const clientName = sub.client?.nom?.toLowerCase() || "";
      const matchSearch = clientName.includes(searchTerm.toLowerCase());
      const matchStatus =
        filterStatus === "all" ||
        sub.statut?.toLowerCase() === filterStatus.toLowerCase();
      const matchClient =
        selectedClient === "all" || sub.client?.id === parseInt(selectedClient);
      return matchSearch && matchStatus && matchClient;
    });
  }, [subscriptions, searchTerm, filterStatus, selectedClient]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const confirmDelete = useCallback(async () => {
    const toastId = toast.loading("Suppression...");
    const result = await dispatch(deleteSubscription(deleteModal.id));
    if (deleteSubscription.fulfilled.match(result))
      toast.success("Abonnement supprimé", { id: toastId });
    else toast.error("Erreur", { id: toastId });
    setDeleteModal({ isOpen: false, id: null, clientName: "" });
  }, [dispatch, deleteModal.id]);

  const handleStatusUpdate = useCallback(
    async (id, newStatus) => {
      const toastId = toast.loading("Mise à jour...");
      const sub = subscriptions.find((s) => s.id === id);
      const payload = { id, statut: newStatus };
      if (newStatus === "Active" && sub) {
        const today = new Date().toISOString().split("T")[0];
        if (new Date(sub.dateFin) < new Date(today)) {
          payload.dateDebut = today;
          payload.dateFin = calculateEndDate(today, sub.type);
        }
      }
      const result = await dispatch(updateSubscriptionStatus(payload));
      if (updateSubscriptionStatus.fulfilled.match(result))
        toast.success(`Statut: ${newStatus}`, { id: toastId });
      else toast.error("Erreur", { id: toastId });
    },
    [dispatch, subscriptions],
  );

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

  const handleEditSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      const { id, ...data } = editModal.data;
      const result = await dispatch(updateSubscription({ id, data }));
      setIsSubmitting(false);
      if (updateSubscription.fulfilled.match(result)) {
        toast.success("Modifications enregistrées");
        setEditModal({ isOpen: false, data: null });
      } else toast.error("Erreur.");
    },
    [dispatch, editModal.data],
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
            Voulez-vous supprimer l'abonnement de{" "}
            <strong>{deleteModal.clientName}</strong> ?
          </>
        }
      />

      {/* Edit Modal */}
      {editModal.isOpen && editModal.data && (
        <Modal
          isOpen
          onClose={() => setEditModal({ isOpen: false, data: null })}
          title="Modifier l'abonnement"
          icon={Edit}
          maxWidth="max-w-lg"
        >
          {new Date(editModal.data.dateFin) < new Date() && (
            <div className="bg-warning/10 border border-warning/20 rounded-md p-3 flex items-start gap-3 mb-4">
              <AlertTriangle className="text-warning shrink-0" size={20} />
              <div className="text-sm text-warning/80">
                <span className="font-bold">Attention:</span> Cet abonnement est
                expiré.
              </div>
            </div>
          )}
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  Type d'offre
                </label>
                <select
                  className={`${inputClass} pl-4`}
                  value={editModal.data.type}
                  onChange={(e) => {
                    const t = e.target.value;
                    setEditModal((m) => ({
                      ...m,
                      data: {
                        ...m.data,
                        type: t,
                        dateFin: calculateEndDate(m.data.dateDebut, t),
                      },
                    }));
                  }}
                >
                  <option value="Mensuel">Mensuel</option>
                  <option value="Trimestriel">Trimestriel</option>
                  <option value="Semestriel">Semestriel</option>
                  <option value="Annuel">Annuel</option>
                </select>
              </div>
              {[
                { key: "prix", label: "Prix (DH)", type: "number" },
                {
                  key: "statut",
                  label: "Statut",
                  select: true,
                  options: ["Active", "Suspendu", "Expiré", "Annulé"],
                },
                { key: "dateDebut", label: "Date Début", type: "date" },
                { key: "dateFin", label: "Date Fin", type: "date" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    {f.label}
                  </label>
                  {f.select ? (
                    <select
                      className={`${inputClass} pl-4`}
                      value={editModal.data[f.key]}
                      onChange={(e) =>
                        setEditModal((m) => ({
                          ...m,
                          data: { ...m.data, [f.key]: e.target.value },
                        }))
                      }
                    >
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type}
                      step={f.type === "number" ? "0.01" : undefined}
                      required
                      className={`${inputClass} pl-4`}
                      value={editModal.data[f.key]}
                      onChange={(e) =>
                        setEditModal((m) => ({
                          ...m,
                          data: { ...m.data, [f.key]: e.target.value },
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, data: null })}
                className="flex-1 py-2 bg-background border border-input text-foreground rounded-md hover:bg-accent font-medium text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
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
        </Modal>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Gestion des Abonnements
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez et suivez les contrats clients
          </p>
        </div>

        {/* Filters */}
        <div
          className={`${cardClass} p-2 flex flex-col md:flex-row gap-2 items-stretch md:items-center`}
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-2.5 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              className={inputClass}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-56">
              <User
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={16}
              />
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className={selectClass}
              >
                <option value="all">Tous les clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative w-full md:w-48">
              <Filter
                className="absolute left-3 top-2.5 text-muted-foreground"
                size={16}
              />
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
            <button
              onClick={() => {
                dispatch(fetchSubscriptions());
                dispatch(fetchClients());
              }}
              className="p-2.5 bg-background border border-input rounded-md hover:bg-accent text-foreground transition-colors flex items-center justify-center"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className={`${cardClass} overflow-hidden flex flex-col min-h-[400px]`}
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      {[
                        "Client / Gérant",
                        "Offre",
                        "Période",
                        "Statut",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider ${i === 4 ? "text-right" : ""}`}
                        >
                          {h || "Actions"}
                        </th>
                      ))}
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
                                <span
                                  className={`pl-4 font-bold mt-1 ${sub.statut === "Expiré" ? "text-destructive" : "text-foreground"}`}
                                >
                                  {new Date(sub.dateFin).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${status.style}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                {status.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(sub);
                                  }}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                                >
                                  <Edit size={16} />
                                </button>
                                <div className="w-px h-4 bg-border mx-1" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(sub.id, "Active");
                                  }}
                                  className="p-2 text-muted-foreground hover:text-success hover:bg-success/10 rounded-md transition-all"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(sub.id, "Suspendu");
                                  }}
                                  className="p-2 text-muted-foreground hover:text-warning hover:bg-warning/10 rounded-md transition-all"
                                >
                                  <PauseCircle size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteModal({
                                      isOpen: true,
                                      id: sub.id,
                                      clientName: sub.client?.nom,
                                    });
                                  }}
                                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
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
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
