import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "../hooks/useRedux";
import {
  fetchEmployeeById,
  updateEmployee,
} from "../features/employees/employeesSlice";
import { useTranslation } from "react-i18next";
import showToast from "../components/ui/Toast";
import { ArrowLeft, Save, User, Mail, Lock, Loader2 } from "lucide-react";

const inputClass =
  "w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground text-foreground";

export default function EditEmployee() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      const result = await dispatch(fetchEmployeeById(id));
      if (fetchEmployeeById.fulfilled.match(result)) {
        const { nom, email } = result.payload;
        setFormData({ nom, email, password: "" });
      } else {
        showToast.error(t("common.error"));
        navigate("/employees");
      }
      setFetching(false);
    })();
  }, [id, dispatch, navigate, t]);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrors({});
      const updateToast = showToast.loading(t("common.updating"));
      const result = await dispatch(updateEmployee({ id, data: formData }));
      if (updateEmployee.fulfilled.match(result)) {
        showToast.success(t("employees.profileUpdated"), { id: updateToast });
        setTimeout(() => navigate("/employees"), 1500);
      } else {
        showToast.dismiss(updateToast);
        const payload = result.payload;
        if (payload?.errors) {
          setErrors(payload.errors);
          showToast.error(t("common.error"));
        } else showToast.error(t("common.error"));
      }
      setLoading(false);
    },
    [dispatch, id, formData, navigate, t],
  );

  const iconClass =
    "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground";

  if (fetching)
    return (
      <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> {t("common.loading")}
      </div>
    );

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center animate-in fade-in duration-500">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {t("employees.editTitle")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("employees.editSubtitle")}
            </p>
          </div>
          <Link
            to="/employees"
            className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-md text-foreground hover:bg-accent transition-all shadow-sm text-sm font-medium"
          >
            <ArrowLeft size={16} /> {t("common.back")}
          </Link>
        </div>

        <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {[
                {
                  name: "nom",
                  label: t("employees.name"),
                  type: "text",
                  icon: User,
                },
                {
                  name: "email",
                  label: t("employees.email"),
                  type: "email",
                  icon: Mail,
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
                  {t("auth.password")}{" "}
                  <span className="text-muted-foreground font-normal text-xs ml-1">
                    {t("employees.leaveBlank")}
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
                    className={`${inputClass} ${errors.password ? "border-destructive" : ""}`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.password[0]}
                  </p>
                )}
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
                  {t("employees.updateEmployee")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
