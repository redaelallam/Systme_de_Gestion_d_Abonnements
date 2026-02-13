import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { createClient } from "../features/clients/clientsSlice";
import { fetchUsers } from "../features/clients/clientsSlice";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Briefcase,
} from "lucide-react";

const inputClass =
  "w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground text-foreground";

export default function CreateClient() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { users: employees } = useAppSelector((s) => s.clients);
  const currentUser = useAppSelector((s) => s.auth.user);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    employee_id: "",
  });

  useEffect(() => {
    if (currentUser?.role === "admin") dispatch(fetchUsers());
  }, [currentUser, dispatch]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (currentUser?.role === "admin" && !formData.employee_id) {
        toast.error("Veuillez assigner un employé à ce client.");
        return;
      }
      setLoading(true);
      const payload = {
        nom: formData.nom,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresse,
      };
      if (currentUser?.role === "admin")
        payload.employee_id = formData.employee_id;

      const result = await dispatch(createClient(payload));
      if (createClient.fulfilled.match(result)) {
        toast.success("Client ajouté avec succès !");
        setTimeout(() => navigate("/clients"), 1500);
      } else {
        const err = result.payload;
        if (err?.errors)
          Object.values(err.errors).forEach((msg) => toast.error(msg[0]));
        else toast.error(err?.message || "Erreur lors de la création.");
      }
      setLoading(false);
    },
    [dispatch, formData, currentUser, navigate],
  );

  const iconClass =
    "absolute left-3 top-3 text-muted-foreground pointer-events-none";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 ">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Nouveau Client
        </h1>
        <Link
          to="/clients"
          className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-md text-foreground hover:bg-accent transition-colors shadow-sm text-sm font-medium"
        >
          <ArrowLeft size={16} /> Retour
        </Link>
      </div>

      <div className="bg-card text-card-foreground p-8 rounded-lg shadow-sm border border-border max-w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {[
            {
              key: "nom",
              label: "Nom Complet",
              icon: User,
              type: "text",
              placeholder: "Nom du client",
            },
            {
              key: "email",
              label: "Email",
              icon: Mail,
              type: "email",
              placeholder: "client@example.com",
            },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {f.label}
              </label>
              <div className="relative">
                <f.icon className={iconClass} size={18} />
                <input
                  type={f.type}
                  className={inputClass}
                  placeholder={f.placeholder}
                  value={formData[f.key]}
                  onChange={(e) =>
                    setFormData({ ...formData, [f.key]: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Téléphone
              </label>
              <div className="relative">
                <Phone className={iconClass} size={18} />
                <input
                  type="text"
                  className={inputClass}
                  placeholder="+212..."
                  value={formData.telephone}
                  onChange={(e) =>
                    setFormData({ ...formData, telephone: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Adresse
              </label>
              <div className="relative">
                <MapPin className={iconClass} size={18} />
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Ville, Quartier"
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>

          {currentUser?.role === "admin" && (
            <div className="pt-4 border-t border-border">
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                Assigner à un employé
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold border border-primary/20">
                  Admin
                </span>
              </label>
              <div className="relative">
                <Briefcase className={iconClass} size={18} />
                <select
                  className={`${inputClass} appearance-none cursor-pointer`}
                  value={formData.employee_id}
                  onChange={(e) =>
                    setFormData({ ...formData, employee_id: e.target.value })
                  }
                >
                  <option value="">Sélectionner un employé...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nom} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Obligatoire pour les administrateurs.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}{" "}
            Enregistrer le client
          </button>
        </form>
      </div>
    </div>
  );
}
