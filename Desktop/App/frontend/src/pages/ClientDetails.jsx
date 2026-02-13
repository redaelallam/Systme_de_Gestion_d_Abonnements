import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { fetchClientById } from "../features/clients/clientsSlice";
import api from "../api/axiosConfig";
import { Toaster, toast } from "react-hot-toast";
import {
  Mail, Phone, MapPin, Calendar, CreditCard, ArrowLeft, Loader2, Package,
  DollarSign, Activity, Plus, Edit, RefreshCw, X, Trash2, CheckCircle, PauseCircle,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { getStatusStyle, getAvatarColor, calculateEndDate, formatDateForInput } from "../utils/helpers";

const StatCard = ({ title, value, icon: Icon, subtext }) => (
  <div className="bg-card text-card-foreground p-6 rounded-lg border border-border shadow-sm hover:border-primary/50 transition-all group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight mt-1">{value}</h3>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </div>
      <div className="p-3 rounded-md bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentClient: client, loading, error } = useAppSelector((s) => s.clients);
  const [localClient, setLocalClient] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, sub: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [isSaving, setIsSaving] = useState(false);
  const [subForm, setSubForm] = useState({ type: "Mensuel", prix: "", statut: "Active", dateDebut: new Date().toISOString().split("T")[0], dateFin: "" });
  const [editForm, setEditForm] = useState({ id: null, type: "", prix: "", statut: "", dateDebut: "", dateFin: "" });

  useEffect(() => { dispatch(fetchClientById(id)); }, [id, dispatch]);
  useEffect(() => { if (client) setLocalClient(client); }, [client]);
  useEffect(() => { if (subForm.dateDebut) setSubForm((p) => ({ ...p, dateFin: calculateEndDate(p.dateDebut, p.type) })); }, [subForm.type, subForm.dateDebut]);

  useEffect(() => {
    if (editModal.sub) {
      setEditForm({
        id: editModal.sub.id, type: editModal.sub.type, prix: editModal.sub.prix,
        statut: editModal.sub.statut, dateDebut: formatDateForInput(editModal.sub.dateDebut), dateFin: formatDateForInput(editModal.sub.dateFin),
      });
    }
  }, [editModal.sub]);

  const handleAdd = useCallback(async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const payload = { ...subForm, client_id: localClient.id, employee_id: user?.id };
      const res = await api.post("/abonnements", payload);
      const newSub = res.data.data || { ...payload, id: Date.now() };
      setLocalClient((p) => ({ ...p, abonnements: [newSub, ...(p.abonnements || [])] }));
      toast.success("Abonnement créé !");
      setIsAddOpen(false);
    } catch { toast.error("Erreur."); }
    finally { setIsSaving(false); }
  }, [subForm, localClient]);

  const handleEdit = useCallback(async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { id: subId, ...data } = editForm;
      await api.put(`/abonnements/${subId}`, data);
      setLocalClient((p) => ({ ...p, abonnements: p.abonnements.map((s) => s.id === subId ? { ...s, ...data } : s) }));
      toast.success("Mis à jour !");
      setEditModal({ isOpen: false, sub: null });
    } catch { toast.error("Erreur."); }
    finally { setIsSaving(false); }
  }, [editForm]);

  const handleDeleteSub = useCallback(async () => {
    try {
      await api.delete(`/abonnements/${deleteModal.id}`);
      setLocalClient((p) => ({ ...p, abonnements: p.abonnements.filter((s) => s.id !== deleteModal.id) }));
      toast.success("Supprimé.");
    } catch { toast.error("Erreur."); }
    setDeleteModal({ isOpen: false, id: null });
  }, [deleteModal.id]);

  const toggleStatus = useCallback(async (sub) => {
    const newStatus = sub.statut === "Active" ? "Suspendu" : "Active";
    try {
      await api.put(`/abonnements/${sub.id}`, { statut: newStatus });
      setLocalClient((p) => ({ ...p, abonnements: p.abonnements.map((s) => s.id === sub.id ? { ...s, statut: newStatus } : s) }));
      toast.success(`Statut: ${newStatus}`);
    } catch { toast.error("Erreur."); }
  }, []);

  if (loading && !localClient) return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;
  if (error || !localClient) return (
    <div className="flex items-center justify-center min-h-[400px] text-center">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Oops!</h2>
        <p className="text-destructive font-medium">{error || "Erreur"}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-background border border-input rounded-md text-sm text-foreground hover:bg-accent">Retour</button>
      </div>
    </div>
  );

  const abonnements = localClient.abonnements || [];
  const activeSubs = abonnements.filter((s) => ["active", "actif"].includes(s.statut?.toLowerCase())).length;
  const totalSpent = abonnements.reduce((a, s) => a + parseFloat(s.prix || 0), 0);
  const sortedSubs = [...abonnements].sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));
  const latestSub = sortedSubs[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Nouvel Abonnement" icon={CreditCard} maxWidth="max-w-lg">
        <p className="text-sm text-muted-foreground mb-4">Client: <strong className="text-foreground">{localClient.nom}</strong></p>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">Offre</label>
              <select className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm" value={subForm.type} onChange={(e) => setSubForm({ ...subForm, type: e.target.value })}>
                <option value="Mensuel">Mensuel</option><option value="Trimestriel">Trimestriel</option><option value="Semestriel">Semestriel</option><option value="Annuel">Annuel</option>
              </select></div>
            <div><label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">Prix (DH)</label>
              <input type="number" step="0.01" required className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm" value={subForm.prix} onChange={(e) => setSubForm({ ...subForm, prix: e.target.value })} /></div>
            <div><label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">Statut</label>
              <select className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm" value={subForm.statut} onChange={(e) => setSubForm({ ...subForm, statut: e.target.value })}>
                <option value="Active">Active</option><option value="Suspendu">Suspendu</option></select></div>
            <div><label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">Date Début</label>
              <input type="date" required className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm" value={subForm.dateDebut} onChange={(e) => setSubForm({ ...subForm, dateDebut: e.target.value })} /></div>
            <div><label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">Date Fin</label>
              <input type="date" required className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm" value={subForm.dateFin} onChange={(e) => setSubForm({ ...subForm, dateFin: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent">Annuler</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2">
              {isSaving && <Loader2 size={16} className="animate-spin" />} Confirmer</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, sub: null })} title="Modifier l'abonnement" icon={Edit} maxWidth="max-w-lg">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">Offre</label>
              <select className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm" value={editForm.type}
                onChange={(e) => { const t = e.target.value; setEditForm((p) => ({ ...p, type: t, dateFin: calculateEndDate(p.dateDebut, t) })); }}>
                <option value="Mensuel">Mensuel</option><option value="Trimestriel">Trimestriel</option><option value="Semestriel">Semestriel</option><option value="Annuel">Annuel</option>
              </select></div>
            {[{ k: "prix", l: "Prix (DH)", t: "number" }, { k: "dateDebut", l: "Date Début", t: "date" }, { k: "dateFin", l: "Date Fin", t: "date" }].map((f) => (
              <div key={f.k}><label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">{f.l}</label>
                <input type={f.t} step={f.t === "number" ? "0.01" : undefined} required className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                  value={editForm[f.k]} onChange={(e) => setEditForm({ ...editForm, [f.k]: e.target.value })} /></div>
            ))}
            <div><label className="block text-xs font-medium text-muted-foreground uppercase mb-1.5">Statut</label>
              <select className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm" value={editForm.statut} onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}>
                <option value="Active">Active</option><option value="Suspendu">Suspendu</option><option value="Expiré">Expiré</option><option value="Annulé">Annulé</option></select></div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={() => setEditModal({ isOpen: false, sub: null })} className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent">Annuler</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2">
              {isSaving && <Loader2 size={16} className="animate-spin" />} Enregistrer</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={handleDeleteSub}
        title="Supprimer l'abonnement ?" message="Cette action est irréversible." />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-background border border-border rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{localClient.nom}</h1>
            <p className="text-muted-foreground text-sm mt-1.5 flex items-center gap-2">
              <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-xs font-mono">ID: #{localClient.id}</span>
              {localClient.employee && <span className="text-xs">• Géré par {localClient.employee.nom}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => dispatch(fetchClientById(id))} className="px-3 py-2 bg-background border border-border rounded-md hover:bg-accent text-foreground flex items-center gap-2 text-sm font-medium transition-colors">
            <RefreshCw size={16} /> Actualiser
          </button>
          <button onClick={() => setIsAddOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium shadow-sm flex items-center gap-2 text-sm">
            <Plus size={16} /> Nouvel Abonnement
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Dépensé" value={`${totalSpent.toLocaleString()} DH`} icon={DollarSign} subtext="Cumulatif" />
        <StatCard title="Abonnements Actifs" value={activeSubs} icon={Activity} subtext="En cours" />
        <StatCard title="Dernière Activité" value={latestSub ? new Date(latestSub.dateDebut).toLocaleDateString() : "—"} icon={Calendar} subtext="Dernier abonnement" />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold shadow-sm ${getAvatarColor(localClient.nom)}`}>
                  {localClient.nom.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{localClient.nom}</h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success mt-1 border border-success/20">Client Vérifié</span>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border">
                {[
                  { icon: Mail, label: "Email", value: localClient.email },
                  { icon: Phone, label: "Téléphone", value: localClient.telephone },
                  { icon: MapPin, label: "Adresse", value: localClient.adresse || "Non renseignée" },
                ].map((f) => (
                  <div key={f.label} className="flex items-start gap-3 text-sm">
                    <f.icon size={18} className="text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase">{f.label}</p>
                      <p className="text-foreground font-medium">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/30 px-6 py-3 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">Membre depuis {new Date(localClient.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border flex flex-col h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2"><Package className="text-muted-foreground" size={18} /> Historique des abonnements</h3>
            </div>
            {sortedSubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4"><Package className="w-8 h-8 text-muted-foreground" /></div>
                <h4 className="text-foreground font-bold text-sm">Aucun abonnement trouvé</h4>
                <button onClick={() => setIsAddOpen(true)} className="text-sm font-medium text-primary hover:underline mt-4">Créer un abonnement</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>{["Offre", "Prix", "Période", "Statut", "Actions"].map((h) => (
                      <th key={h} className={`px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-muted/50 transition-colors group">
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><span className="p-1.5 rounded-md bg-secondary text-secondary-foreground"><CreditCard size={14} /></span><span className="font-medium text-sm">{sub.type}</span></div></td>
                        <td className="px-6 py-4 font-medium text-sm">{parseFloat(sub.prix).toFixed(2)} <span className="text-muted-foreground text-xs">DH</span></td>
                        <td className="px-6 py-4"><div className="flex flex-col text-xs"><span className="font-medium">{new Date(sub.dateDebut).toLocaleDateString()}</span><span className="text-muted-foreground text-[10px] mt-0.5">au {new Date(sub.dateFin).toLocaleDateString()}</span></div></td>
                        <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusStyle(sub.statut)}`}>{sub.statut}</span></td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditModal({ isOpen: true, sub })} className="text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-md transition-all"><Edit size={16} /></button>
                            {sub.statut === "Active" ? (
                              <button onClick={() => toggleStatus(sub)} className="text-muted-foreground hover:text-warning hover:bg-warning/10 p-1.5 rounded-md transition-all"><PauseCircle size={16} /></button>
                            ) : (
                              <button onClick={() => toggleStatus(sub)} className="text-muted-foreground hover:text-success hover:bg-success/10 p-1.5 rounded-md transition-all"><CheckCircle size={16} /></button>
                            )}
                            <div className="w-px h-4 bg-border mx-1" />
                            <button onClick={() => setDeleteModal({ isOpen: true, id: sub.id })} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
