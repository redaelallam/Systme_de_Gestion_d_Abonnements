import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "../hooks/useRedux";
import { createEmployee } from "../features/employees/employeesSlice";
import { useTranslation } from "react-i18next";
import showToast from "../components/ui/Toast";
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
  const { t } = useTranslation();
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
      const loadingToast = showToast.loading(t("common.processing"));
      const result = await dispatch(createEmployee(formData));
      if (createEmployee.fulfilled.match(result)) {
        showToast.success(t("clients.clientCreated"), { id: loadingToast });
        setTimeout(() => navigate("/employees"), 1500);
      } else {
        showToast.dismiss(loadingToast);
        const payload = result.payload;
        if (payload?.errors) {
          setErrors(payload.errors);
          showToast.error(t("common.error"));
        } else {
          showToast.error(payload?.message || t("common.error"));
        }
      }
      setLoading(false);
    },
    [dispatch, formData, navigate, t],
  );

  const iconClass =
    "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground";

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center animate-in fade-in duration-500">
      {/* 🔴 تم حذف Toaster */}
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {t("employees.createTitle")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("employees.createSubtitle")}
            </p>
          </div>
          <Link
            to="/employees"
            className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-md text-foreground hover:bg-accent transition-all shadow-sm text-sm font-medium"
          >
            <ArrowLeft size={16} /> {t("common.cancel")}
          </Link>
        </div>

        <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                {
                  name: "nom",
                  label: t("employees.name"),
                  type: "text",
                  icon: User,
                  placeholder: t("employees.namePlaceholder"),
                },
                {
                  name: "email",
                  label: t("employees.email"),
                  type: "email",
                  icon: Mail,
                  placeholder: t("employees.emailPlaceholder"),
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
                  {t("employees.rolePermissions")}
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
                    <option value="employee">{t("employees.employee")}</option>
                    <option value="admin">{t("employees.admin")}</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t("auth.password")}
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
                    placeholder={t("employees.passwordPlaceholder")}
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
                <p
                  className="text-sm text-foreground/80 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: t("employees.roleInfo") }}
                />
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
                  {t("employees.saveEmployee")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
