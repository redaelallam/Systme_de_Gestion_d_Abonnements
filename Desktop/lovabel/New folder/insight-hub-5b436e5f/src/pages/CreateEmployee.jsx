import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";

export default function CreateEmployee() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    password: "",
    role: "employee", // القيمة الافتراضية
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const loadingToast = toast.loading("Création en cours...");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://127.0.0.1:8000/api/employees",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (response.data.status) {
        toast.success("Membre ajouté avec succès !", { id: loadingToast });
        setTimeout(() => navigate("/employees"), 1500);
      }
    } catch (err) {
      toast.dismiss(loadingToast);

      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors);
        toast.error("Veuillez corriger les erreurs du formulaire.");
      } else {
        toast.error("Une erreur serveur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Styles du Design System (Dark Mode Compatible) ---
  const inputClass =
    "w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all text-sm placeholder:text-muted-foreground text-foreground";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";
  const iconClass =
    "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground";

  return (
    // استخدام transition-colors لضمان سلاسة التغيير بين الوضعين
    <div
      className="min-h-screen bg-background p-6 md:p-10 animate-in fade-in duration-500 transition-colors duration-300"
      dir="ltr"
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--border))",
          },
        }}
      />

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
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
            className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-all shadow-sm text-sm font-medium"
          >
            <ArrowLeft size={16} />
            <span>Annuler</span>
          </Link>
        </div>

        {/* Form Card */}
        {/* استخدام bg-card للنصوص والخلفية */}
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom Complet */}
              <div>
                <label className={labelClass}>Nom Complet</label>
                <div className="relative group">
                  <div className={iconClass}>
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.nom ? "border-destructive focus:ring-destructive/20" : ""}`}
                    placeholder="Ex: Reda El Allam"
                  />
                </div>
                {errors.nom && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.nom[0]}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>Adresse Email</label>
                <div className="relative group">
                  <div className={iconClass}>
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.email ? "border-destructive focus:ring-destructive/20" : ""}`}
                    placeholder="Ex: user@company.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.email[0]}
                  </p>
                )}
              </div>

              {/* Rôle */}
              <div>
                <label className={labelClass}>Rôle & Permissions</label>
                <div className="relative group">
                  <div className={iconClass}>
                    <Shield size={18} />
                  </div>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none cursor-pointer pr-10 ${errors.role ? "border-destructive focus:ring-destructive/20" : ""}`}
                  >
                    <option
                      value="employee"
                      className="bg-background text-foreground"
                    >
                      Employé
                    </option>
                    <option
                      value="admin"
                      className="bg-background text-foreground"
                    >
                      Administrateur
                    </option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">
                    <ChevronDown size={16} />
                  </div>
                </div>
                {errors.role && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.role[0]}
                  </p>
                )}
              </div>

              {/* Mot de passe */}
              <div>
                <label className={labelClass}>Mot de passe</label>
                <div className="relative group">
                  <div className={iconClass}>
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.password ? "border-destructive focus:ring-destructive/20" : ""}`}
                    placeholder="Minimum 6 caractères"
                  />
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.password[0]}
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-md flex gap-3 items-start">
                <div className="mt-0.5 text-primary">
                  <Info size={18} />
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Sélectionnez{" "}
                  <strong className="text-primary font-semibold">
                    "Administrateur"
                  </strong>{" "}
                  pour un accès total à la gestion, ou{" "}
                  <strong className="text-primary font-semibold">
                    "Employé"
                  </strong>{" "}
                  pour un accès standard.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-all shadow-sm ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
