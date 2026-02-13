import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { registerUser } from "../features/auth/authSlice";
import toast, { Toaster } from "react-hot-toast";
import {
  User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, UserPlus, Sun, Moon,
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  const [formData, setFormData] = useState({
    nom: "", email: "", password: "", password_confirmation: "", role: "employee",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setErrors({});
      const loadingToast = toast.loading("Création du compte en cours...");
      const result = await dispatch(registerUser(formData));

      if (registerUser.fulfilled.match(result)) {
        toast.dismiss(loadingToast);
        toast.success("Compte créé avec succès !", { duration: 3000, icon: "🎉" });
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.dismiss(loadingToast);
        const payload = result.payload;
        if (payload?.errors) {
          setErrors(payload.errors);
          toast.error("Veuillez corriger les erreurs.");
        } else {
          toast.error(payload?.message || "Une erreur est survenue.");
        }
      }
    },
    [dispatch, formData, navigate]
  );

  const inputClass = (field) =>
    `block w-full pl-10 pr-3 py-3 border bg-background text-foreground ${
      errors[field]
        ? "border-destructive focus:ring-destructive"
        : "border-input focus:ring-ring"
    } rounded-lg focus:outline-none sm:text-sm transition-all`;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <Toaster position="top-center" />

      <button
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        className="absolute top-4 right-4 p-2 rounded-full bg-card border border-border text-foreground hover:bg-muted transition-all shadow-sm"
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
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
        <div className="bg-card py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {[
              { id: "nom", label: "Nom Complet", type: "text", icon: User },
              { id: "email", label: "Adresse Email", type: "email", icon: Mail },
            ].map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-medium text-foreground">
                  {field.label}
                </label>
                <div className="mt-1 relative group">
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
                    className={inputClass(field.id)}
                    placeholder={field.id === "email" ? "exemple@sga.com" : ""}
                  />
                </div>
                {errors[field.id] && (
                  <p className="mt-2 text-sm text-destructive">{errors[field.id][0]}</p>
                )}
              </div>
            ))}

            {[
              { id: "password", label: "Mot de passe" },
              { id: "password_confirmation", label: "Confirmer le mot de passe" },
            ].map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-medium text-foreground">
                  {field.label}
                </label>
                <div className="mt-1 relative group">
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
                    className={inputClass(field.id)}
                    placeholder="••••••••"
                  />
                  {field.id === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  )}
                </div>
                {errors[field.id] && (
                  <p className="mt-2 text-sm text-destructive">{errors[field.id][0]}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-70 transition-all shadow-md"
            >
              {loading ? (
                <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Traitement...</>
              ) : (
                <>S'inscrire <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Déjà membre ?</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link to="/login" className="font-medium text-primary hover:underline">
                Connectez-vous à votre compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
