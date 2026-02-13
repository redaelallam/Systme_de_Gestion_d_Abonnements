import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  UserPlus,
  Sun,
  Moon,
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  // --- Theme Logic ---
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  // -------------------

  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "employee",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const loadingToast = toast.loading("Création du compte en cours...");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/register",
        formData,
        { headers: { Accept: "application/json" } },
      );

      if (response.data.status) {
        toast.dismiss(loadingToast);
        toast.success("Compte créé avec succès !", {
          duration: 3000,
          icon: "🎉",
        });
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors);
        toast.error("Veuillez corriger les erreurs.");
      } else {
        toast.error("Une erreur interne est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // تم تغيير bg-gray-50 إلى bg-background ليدعم الدارك مود
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <Toaster position="top-center" />

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-card border border-border text-foreground hover:bg-muted transition-all shadow-sm"
        title="Changer le thème"
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
          <UserPlus className="text-primary-foreground" size={28} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground tracking-tight">
          Créer un compte
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Rejoignez l'équipe SGA dès aujourd'hui
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* تم تغيير bg-white إلى bg-card وتعديل البوردر */}
        <div className="bg-card py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Input Wrapper Style Reusable */}
            {[
              { id: "nom", label: "Nom Complet", type: "text", icon: User },
              {
                id: "email",
                label: "Adresse Email",
                type: "email",
                icon: Mail,
              },
            ].map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-foreground"
                >
                  {field.label}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <field.icon className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    required
                    value={formData[field.id]}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 border bg-background text-foreground ${
                      errors[field.id]
                        ? "border-destructive focus:ring-destructive focus:border-destructive"
                        : "border-input focus:ring-ring focus:border-ring"
                    } rounded-lg focus:outline-none sm:text-sm transition-all`}
                    placeholder={field.id === "email" ? "exemple@sga.com" : ""}
                  />
                </div>
                {errors[field.id] && (
                  <p className="mt-2 text-sm text-destructive animate-pulse">
                    {errors[field.id][0]}
                  </p>
                )}
              </div>
            ))}

            {/* Password Fields */}
            {[
              { id: "password", label: "Mot de passe" },
              {
                id: "password_confirmation",
                label: "Confirmer le mot de passe",
              },
            ].map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-foreground"
                >
                  {field.label}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id={field.id}
                    name={field.id}
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData[field.id]}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-3 border bg-background text-foreground ${
                      errors[field.id]
                        ? "border-destructive focus:ring-destructive focus:border-destructive"
                        : "border-input focus:ring-ring focus:border-ring"
                    } rounded-lg focus:outline-none sm:text-sm transition-all`}
                    placeholder="••••••••"
                  />
                  {field.id === "password" && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {errors[field.id] && (
                  <p className="mt-2 text-sm text-destructive animate-pulse">
                    {errors[field.id][0]}
                  </p>
                )}
              </div>
            ))}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />{" "}
                    Traitement...
                  </>
                ) : (
                  <>
                    S'inscrire
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  Déjà membre ?
                </span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="font-medium text-primary hover:underline transition-all"
              >
                Connectez-vous à votre compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
