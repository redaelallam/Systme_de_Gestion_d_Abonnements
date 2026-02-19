import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import {
  ArrowLeft,
  Loader2,
  User,
  FileText,
  Clock,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Database,
} from "lucide-react";
import showToast from "../components/ui/Toast"; // 👈 استيراد التوست

const ActivityLogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogDetails = async () => {
      try {
        const res = await api.get(`/activity-logs/${id}`);
        setLog(res.data.data);
      } catch (error) {
        console.error("Erreur", error);
        showToast.error(
          "Erreur lors de la récupération des détails de l'activité.",
        ); // 👈 عرض خطأ
      } finally {
        setLoading(false);
      }
    };
    fetchLogDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Journal introuvable ou supprimé.
        <button
          onClick={() => navigate(-1)}
          className="block mx-auto mt-4 text-primary hover:underline"
        >
          Retour
        </button>
      </div>
    );
  }

  // تنسيق الألوان حسب نوع الحدث
  const actionColors = {
    created: "bg-success/10 text-success border-success/20",
    updated: "bg-warning/10 text-warning border-warning/20",
    deleted: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const badgeStyle =
    actionColors[log.action] || "bg-secondary text-secondary-foreground";

  // استخراج التغييرات لعرضها في جدول
  const oldValues = log.properties?.old || {};
  const newValues = log.properties?.attributes || {};
  const allKeys = Array.from(
    new Set([...Object.keys(oldValues), ...Object.keys(newValues)]),
  ).filter((k) => k !== "updated_at");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Détails de l'activité #{log.id}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${badgeStyle}`}
            >
              {log.action}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Clock size={14} /> Enregistré il y a {log.time_ago}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={16} /> Auteur de l'action
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              {log.causer.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-foreground">{log.causer}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <ShieldCheck size={12} /> {log.causer_role.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Database size={16} /> Élément impacté
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <p className="font-bold text-foreground">{log.subject_type}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                ID d'enregistrement :{" "}
                <span className="font-mono bg-muted px-1 rounded">
                  #{log.subject_id}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
          <h3 className="font-bold">Modifications des données</h3>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar size={12} /> {log.date} à {log.time}
          </span>
        </div>

        {allKeys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-semibold text-muted-foreground">
                    Champ
                  </th>
                  {log.action !== "created" && (
                    <th className="px-6 py-3 font-semibold text-muted-foreground w-1/3">
                      Ancienne Valeur
                    </th>
                  )}
                  {log.action === "updated" && (
                    <th className="px-6 py-3 text-center w-12"></th>
                  )}
                  {log.action !== "deleted" && (
                    <th className="px-6 py-3 font-semibold text-muted-foreground w-1/3">
                      Nouvelle Valeur
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-xs">
                {allKeys.map((key) => {
                  const oldVal =
                    oldValues[key] !== undefined && oldValues[key] !== null
                      ? String(oldValues[key])
                      : "—";
                  const newVal =
                    newValues[key] !== undefined && newValues[key] !== null
                      ? String(newValues[key])
                      : "—";
                  const isChanged = oldVal !== newVal;

                  if (log.action === "updated" && !isChanged) return null;

                  return (
                    <tr
                      key={key}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-3 font-semibold text-foreground">
                        {key}
                      </td>

                      {log.action !== "created" && (
                        <td
                          className={`px-6 py-3 ${isChanged && log.action === "updated" ? "text-destructive line-through bg-destructive/5" : "text-muted-foreground"}`}
                        >
                          {oldVal}
                        </td>
                      )}

                      {log.action === "updated" && (
                        <td className="px-6 py-3 text-center text-muted-foreground">
                          <ArrowRight size={14} className="mx-auto" />
                        </td>
                      )}

                      {log.action !== "deleted" && (
                        <td
                          className={`px-6 py-3 ${isChanged && log.action === "updated" ? "text-success font-bold bg-success/5" : "text-foreground"}`}
                        >
                          {newVal}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Aucun détail de modification disponible pour cette action.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogDetails;
