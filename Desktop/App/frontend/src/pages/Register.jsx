import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { registerUser } from "../features/auth/authSlice";
import { setLanguage } from "../features/theme/themeSlice";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import {
  User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, UserPlus, Sun, Moon, Globe, ChevronDown,
} from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.auth);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[1];

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [formData, setFormData] = useState({ nom: "", email: "", password: "", password_confirmation: "", role: "employee" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLangChange = useCallback((code) => {
    i18n.changeLanguage(code);
    dispatch(setLanguage(code));
    document.documentElement.setAttribute("dir", code === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", code);
    setShowLangDropdown(false);
  }, [i18n, dispatch]);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault(); setErrors({});
    const loadingToast = toast.loading(t("common.processing"));
    const result = await dispatch(registerUser(formData));
    if (registerUser.fulfilled.match(result)) {
      toast.dismiss(loadingToast);
      toast.success(t("common.success"), { duration: 3000, icon: "🎉" });
      setTimeout(() => navigate("/login"), 1500);
    } else {
      toast.dismiss(loadingToast);
      const payload = result.payload;
      if (payload?.errors) { setErrors(payload.errors); toast.error(t("common.error")); }
      else toast.error(payload?.message || t("common.error"));
    }
  }, [dispatch, formData, navigate, t]);

  const inputClass = (field) =>
    `block w-full pl-10 pr-3 py-3 border bg-background text-foreground ${
      errors[field] ? "border-destructive focus:ring-destructive" : "border-input focus:ring-ring"
    } rounded-lg focus:outline-none sm:text-sm transition-all`;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <Toaster position="top-center" />

      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="relative">
          <button onClick={() => setShowLangDropdown((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border text-foreground hover:bg-muted transition-all shadow-sm text-sm font-medium">
            <Globe size={16} /><span>{currentLang.flag} {currentLang.label}</span>
            <ChevronDown size={14} className={`transition-transform ${showLangDropdown ? "rotate-180" : ""}`} />
          </button>
          {showLangDropdown && (
            <div className="absolute top-full mt-1 end-0 w-44 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
              {LANGUAGES.map((lang) => (
                <button key={lang.code} onClick={() => handleLangChange(lang.code)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-start ${
                    lang.code === i18n.language ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                  }`}>
                  <span>{lang.flag}</span><span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          className="p-2 rounded-full bg-card border border-border text-foreground hover:bg-muted transition-all shadow-sm">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
          <UserPlus className="text-primary-foreground" size={28} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground tracking-tight">{t("auth.registerTitle")}</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t("auth.registerDescription")}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {[
              { id: "nom", label: t("auth.name"), type: "text", icon: User },
              { id: "email", label: t("auth.email"), type: "email", icon: Mail },
            ].map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-medium text-foreground">{field.label}</label>
                <div className="mt-1 relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <field.icon className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input id={field.id} name={field.id} type={field.type} required value={formData[field.id]} onChange={handleChange} className={inputClass(field.id)} />
                </div>
                {errors[field.id] && <p className="mt-2 text-sm text-destructive">{errors[field.id][0]}</p>}
              </div>
            ))}
            {[
              { id: "password", label: t("auth.password") },
              { id: "password_confirmation", label: t("auth.confirmPassword") },
            ].map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-medium text-foreground">{field.label}</label>
                <div className="mt-1 relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input id={field.id} name={field.id} type={showPassword ? "text" : "password"} required value={formData[field.id]} onChange={handleChange} className={inputClass(field.id)} placeholder="••••••••" />
                  {field.id === "password" && (
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  )}
                </div>
                {errors[field.id] && <p className="mt-2 text-sm text-destructive">{errors[field.id][0]}</p>}
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="group w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-70 transition-all shadow-md">
              {loading ? <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> {t("common.processing")}</> :
                <>{t("auth.registerButton")} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-card text-muted-foreground">{t("auth.alreadyMember")}</span></div>
            </div>
            <div className="mt-6 text-center">
              <Link to="/login" className="font-medium text-primary hover:underline">{t("auth.loginLink")}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
