import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axiosConfig";
import toast, { Toaster } from "react-hot-toast";
import {
  RotateCcw,
  Trash2,
  ArchiveRestore,
  Loader2,
  AlertCircle,
} from "lucide-react";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const RecycleBin = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("clients");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    action: null,
  });

  const tabs = [
    { id: "clients", label: t("common.clients") || "Clients" },
    { id: "abonnements", label: t("common.subscriptions") || "Abonnements" },
    { id: "employees", label: t("common.employees") || "Employés" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/trash/${activeTab}`);
      setData(res.data.data);
    } catch (error) {
      toast.error("Erreur lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleAction = async () => {
    const { id, action } = confirmModal;
    const toastId = toast.loading("Traitement en cours...");

    try {
      if (action === "restore") {
        await api.post(`/trash/${activeTab}/${id}/restore`);
        toast.success("Élément restauré avec succès", { id: toastId });
      } else {
        await api.delete(`/trash/${activeTab}/${id}/force`);
        toast.success("Élément supprimé définitivement", { id: toastId });
      }
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de l'opération.", { id: toastId });
    }
    setConfirmModal({ isOpen: false, id: null, action: null });
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="4" className="text-center py-10">
            <Loader2 className="animate-spin text-primary mx-auto" size={24} />
          </td>
        </tr>
      );
    }

    if (data.length === 0) {
      return (
        <tr>
          <td colSpan="4" className="text-center py-16 text-muted-foreground">
            <ArchiveRestore className="mx-auto mb-3 opacity-20" size={48} />
            La corbeille est vide pour cette catégorie.
          </td>
        </tr>
      );
    }

    return data.map((item) => (
      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
        <td className="px-6 py-4">
          <div className="font-medium">
            {activeTab === "abonnements"
              ? `Abonnement ${item.type} (${item.prix} DH)`
              : item.nom}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            ID: #{item.id}{" "}
            {activeTab === "abonnements" && `• Client: ${item.client?.nom}`}
          </div>
        </td>
        <td className="px-6 py-4 text-sm">
          {item.employee ? item.employee.nom : "Système"}
        </td>
        <td className="px-6 py-4 text-sm text-destructive">
          {new Date(item.deleted_at).toLocaleString()}
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end items-center gap-2">
            <button
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  id: item.id,
                  action: "restore",
                })
              }
              className="p-2 text-success bg-success/10 hover:bg-success/20 rounded-md transition-all"
              title="Restaurer"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() =>
                setConfirmModal({ isOpen: true, id: item.id, action: "force" })
              }
              className="p-2 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-all"
              title="Supprimer définitivement"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <Toaster position="top-center" />
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, id: null, action: null })
        }
        onConfirm={handleAction}
        title={
          confirmModal.action === "restore"
            ? "Restaurer l'élément"
            : "Suppression définitive"
        }
        message={
          confirmModal.action === "restore"
            ? "Cet élément sera replacé dans le système et redeviendra visible et actif."
            : "Attention ! Cette action est irréversible. L'élément sera effacé de la base de données de manière permanente."
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
          <ArchiveRestore size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Corbeille</h1>
          <p className="text-muted-foreground text-sm">
            Gérez les éléments supprimés (Restauration ou Suppression
            définitive).
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        <div className="flex border-b border-border bg-muted/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Élément (Nom / Type)
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Géré par
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Date de suppression
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {renderTableContent()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecycleBin;
