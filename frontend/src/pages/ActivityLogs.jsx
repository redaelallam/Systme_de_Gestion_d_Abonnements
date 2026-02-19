import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axiosConfig";
import {
  ShieldAlert,
  Clock,
  User,
  FileText,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import showToast from "../components/ui/Toast"; // 👈 استيراد التوست

const ActivityLogs = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const fetchLogs = async (pageNumber) => {
    setLoading(true);
    try {
      const res = await api.get(`/activity-logs?page=${pageNumber}`);
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error("Erreur lors de la récupération des logs", error);
      showToast.error(
        "Erreur lors de la récupération des journaux d'activités.",
      ); // 👈 عرض خطأ
    } finally {
      setLoading(false);
    }
  };

  const formatEvent = (event) => {
    switch (event) {
      case "created":
        return (
          <span className="px-2 py-1 bg-success/10 text-success rounded text-xs font-bold">
            Création
          </span>
        );
      case "updated":
        return (
          <span className="px-2 py-1 bg-warning/10 text-warning rounded text-xs font-bold">
            Modification
          </span>
        );
      case "deleted":
        return (
          <span className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-bold">
            Suppression
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-bold">
            {event}
          </span>
        );
    }
  };

  const renderChanges = (properties) => {
    if (!properties || (!properties.old && !properties.attributes))
      return (
        <span className="text-muted-foreground text-xs">Aucun détail</span>
      );

    if (properties.old && properties.attributes) {
      return Object.keys(properties.attributes).map((key) => {
        const oldVal = properties.old[key];
        const newVal = properties.attributes[key];
        if (oldVal === newVal || key === "updated_at") return null;

        return (
          <div
            key={key}
            className="text-xs flex items-center gap-2 mb-1 bg-muted/30 p-1.5 rounded"
          >
            <span className="font-semibold uppercase text-[10px] text-muted-foreground w-16">
              {key}:
            </span>
            <span className="text-destructive line-through">
              {oldVal || "Vide"}
            </span>
            <ArrowRight size={12} className="text-muted-foreground" />
            <span className="text-success font-medium">{newVal || "Vide"}</span>
          </div>
        );
      });
    }

    if (properties.attributes) {
      return (
        <div className="text-xs text-muted-foreground line-clamp-2">
          {Object.entries(properties.attributes)
            .filter(([key]) => !["created_at", "updated_at"].includes(key))
            .map(([key, val]) => `${key}: ${val}`)
            .join(" | ")}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 text-primary rounded-lg">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Audit & Journal d'activités
          </h1>
          <p className="text-muted-foreground text-sm">
            Traçabilité complète des actions effectuées sur le système.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden min-h-[400px] relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Utilisateur
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Action
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Cible
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">
                  Détails des changements
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase text-right">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => navigate(`/activity-logs/${log.id}`)}
                    className="hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {log.causer.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{log.causer}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {log.causer_role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{formatEvent(log.action)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <FileText size={14} className="text-muted-foreground" />
                        {log.subject_type}{" "}
                        <span className="text-muted-foreground">
                          #{log.subject_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {renderChanges(log.properties)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end text-sm">
                        <span className="font-medium">{log.time_ago}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock size={10} /> {log.date}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-10 text-muted-foreground"
                  >
                    Aucune activité enregistrée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-muted/20">
            <span className="text-sm text-muted-foreground">
              Page {pagination.current_page} sur {pagination.last_page}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-input rounded text-sm disabled:opacity-50 hover:bg-accent"
              >
                Précédent
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.last_page, p + 1))
                }
                disabled={page === pagination.last_page}
                className="px-3 py-1 border border-input rounded text-sm disabled:opacity-50 hover:bg-accent"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
