import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "../hooks/useRedux";
import { createEmployee } from "../features/employees/employeesSlice";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Lock,
  Shield,
  ChevronDown,
  Info,
  Loader2,
} from "lucide-react";

const inputClass =
  "w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground text-foreground";

export default function CreateEmployee() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrors({});
      const loadingToast = toast.loading("Création en cours...");

      const result = await dispatch(createEmployee(formData));
      if (createEmployee.fulfilled.match(result)) {
        toast.success("Membre ajouté avec succès !", { id: loadingToast });
        setTimeout(() => navigate("/employees"), 1500);
      } else {
        toast.dismiss(loadingToast);
        const payload = result.payload;
        if (payload?.errors) {
          setErrors(payload.errors);
          toast.error("Veuillez corriger les erreurs du formulaire.");
        } else {
          toast.error(payload?.message || "Erreur serveur.");
        }
      }
      setLoading(false);
    },
    [dispatch, formData, navigate],
  );

  const iconClass =
    "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Nouveau Membre
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ajoutez un nouvel utilisateur et définissez son rôle.
          </p>
        </div>
        <Link
          to="/employees"
          className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-md text-foreground hover:bg-accent transition-all shadow-sm text-sm font-medium"
        >
          <ArrowLeft size={16} /> Annuler
        </Link>
      </div>

      <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border overflow-hidden max-w-full">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {[
              {
                name: "nom",
                label: "Nom Complet",
                type: "text",
                icon: User,
                placeholder: "Ex: Reda El Allam",
              },
              {
                name: "email",
                label: "Adresse Email",
                type: "email",
                icon: Mail,
                placeholder: "Ex: user@company.com",
              },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {f.label}
                </label>
                <div className="relative group">
                  <div className={iconClass}>
                    <f.icon size={18} />
                  </div>
                  <input
                    type={f.type}
                    name={f.name}
                    value={formData[f.name]}
                    onChange={handleChange}
                    className={`${inputClass} ${errors[f.name] ? "border-destructive" : ""}`}
                    placeholder={f.placeholder}
                  />
                </div>
                {errors[f.name] && (
                  <p className="text-destructive text-xs mt-1">
                    {errors[f.name][0]}
                  </p>
                )}
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Rôle & Permissions
              </label>
              <div className="relative group">
                <div className={iconClass}>
                  <Shield size={18} />
                </div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none cursor-pointer pr-10`}
                >
                  <option value="employee">Employé</option>
                  <option value="admin">Administrateur</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Mot de passe
              </label>
              <div className="relative group">
                <div className={iconClass}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.password ? "border-destructive" : ""}`}
                  placeholder="Minimum 6 caractères"
                />
              </div>
              {errors.password && (
                <p className="text-destructive text-xs mt-1">
                  {errors.password[0]}
                </p>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/10 p-4 rounded-md flex gap-3 items-start">
              <Info size={18} className="mt-0.5 text-primary shrink-0" />
              <p className="text-sm text-foreground/80 leading-relaxed">
                Sélectionnez{" "}
                <strong className="text-primary">«Administrateur»</strong> pour
                un accès total, ou{" "}
                <strong className="text-primary">«Employé»</strong> pour un
                accès standard.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-70"
              >
                {loading ? (
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
    </div>
  );
}
