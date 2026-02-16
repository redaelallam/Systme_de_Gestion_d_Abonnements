import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { loginUser, clearError } from "../features/auth/authSlice";
import { setLanguage } from "../features/theme/themeSlice";
import { useTranslation } from "react-i18next";
import { Sun, Moon, Loader2, LayoutDashboard, Globe, ChevronDown } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

export default function Login() {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[1];

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

  const handleLangChange = useCallback((code) => {
    i18n.changeLanguage(code);
    dispatch(setLanguage(code));
    document.documentElement.setAttribute("dir", code === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", code);
    setShowLangDropdown(false);
  }, [i18n, dispatch]);

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
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border text-foreground hover:bg-muted transition-all shadow-sm text-sm font-medium"
          >
            <Globe size={16} />
            <span>{currentLang.flag} {currentLang.label}</span>
            <ChevronDown size={14} className={`transition-transform ${showLangDropdown ? "rotate-180" : ""}`} />
          </button>
          {showLangDropdown && (
            <div className="absolute top-full mt-1 end-0 w-44 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-start ${
                    lang.code === i18n.language
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          className="p-2 rounded-full bg-card border border-border text-foreground hover:bg-muted transition-all shadow-sm"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 flex items-center justify-center rounded-lg mb-4">
            <LayoutDashboard className="text-primary h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("auth.loginTitle")}</h1>
          <p className="text-muted-foreground text-sm">{t("auth.loginDescription")}</p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("auth.email")}</label>
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
            <label className="text-sm font-medium">{t("auth.password")}</label>
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
              t("auth.loginButton")
            )}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">{t("auth.noAccount")} </span>
          <Link
            to="/register"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            {t("auth.createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}
