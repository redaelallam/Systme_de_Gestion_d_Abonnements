import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, Save, User, Mail, Lock, Loader2 } from "lucide-react";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  // 1. تحميل البيانات
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://127.0.0.1:8000/api/employees/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.status) {
          const { nom, email } = response.data.data;
          setFormData({ nom, email, password: "" });
        }
      } catch (err) {
        toast.error("Impossible de charger les données.");
        navigate("/employees");
      } finally {
        setFetching(false);
      }
    };

    fetchEmployee();
  }, [id, navigate]);

  // 2. معالجة التغييرات
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  // 3. الحفظ
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const updateToast = toast.loading("Mise à jour en cours...");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://127.0.0.1:8000/api/employees/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (response.data.status) {
        toast.success("Employé mis à jour avec succès !", { id: updateToast });
        setTimeout(() => navigate("/employees"), 1500);
      }
    } catch (err) {
      toast.dismiss(updateToast);
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors);
        toast.error("Veuillez vérifier les champs.");
      } else {
        toast.error("Erreur serveur.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- أنماط التصميم (Design System Styles) ---
  const inputClass =
    "w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all text-sm placeholder:text-muted-foreground text-foreground";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";
  const iconClass =
    "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground";

  if (fetching)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Chargement...
      </div>
    );

  return (
    // الخلفية العامة bg-background
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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Modifier l'Employé
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Mettre à jour les informations du membre.
            </p>
          </div>
          <Link
            to="/employees"
            className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-all shadow-sm text-sm font-medium"
          >
            <ArrowLeft size={16} />
            <span>Retour</span>
          </Link>
        </div>

        {/* Form Card */}
        {/* استخدام bg-card للبطاقة */}
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
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
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.email[0]}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className={labelClass}>
                  Nouveau Mot de passe{" "}
                  <span className="text-muted-foreground font-normal text-xs ml-1">
                    (Laisser vide pour ne pas changer)
                  </span>
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
                    className={`${inputClass} ${errors.password ? "border-destructive focus:ring-destructive/20" : ""}`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.password[0]}
                  </p>
                )}
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
                      <Loader2 className="animate-spin" size={18} />
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Mettre à jour</span>
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
