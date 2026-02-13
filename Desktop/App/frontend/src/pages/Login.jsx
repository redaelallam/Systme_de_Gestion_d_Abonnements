import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { loginUser, clearError } from "../features/auth/authSlice";
import { Sun, Moon, Loader2, LayoutDashboard } from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);

  const handleChange = useCallback(
    (e) => {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
      if (error) dispatch(clearError());
    },
    [error, dispatch],
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const result = await dispatch(loginUser(formData));
      if (loginUser.fulfilled.match(result)) navigate("/dashboard");
    },
    [dispatch, formData, navigate],
  );

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 transition-colors duration-300">
      <button
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        className="absolute top-4 right-4 p-2 rounded-full bg-card border border-border text-foreground hover:bg-muted transition-all shadow-sm"
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 flex items-center justify-center rounded-lg mb-4">
            <LayoutDashboard className="text-primary h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
          <p className="text-muted-foreground text-sm">
            Entrez vos identifiants pour accéder au système.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="exemple@email.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mot de passe</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Pas encore de compte ? </span>
          <Link
            to="/register"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
