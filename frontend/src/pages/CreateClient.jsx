import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { createClient, fetchUsers } from "../features/clients/clientsSlice";
import { useTranslation } from "react-i18next";
import showToast from "../components/ui/Toast";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Briefcase,
} from "lucide-react";

const inputClass =
  "w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground text-foreground";

export default function CreateClient() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { users: employees } = useAppSelector((s) => s.clients);
  const currentUser = useAppSelector((s) => s.auth.user);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    employee_id: "",
  });

  useEffect(() => {
    if (currentUser?.role === "admin") dispatch(fetchUsers());
  }, [currentUser, dispatch]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (currentUser?.role === "admin" && !formData.employee_id) {
        showToast.error(t("clients.requiredForAdmin"));
        return;
      }
      setLoading(true);
      const payload = {
        nom: formData.nom,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresse,
      };
      if (currentUser?.role === "admin")
        payload.employee_id = formData.employee_id;

      const result = await dispatch(createClient(payload));
      if (createClient.fulfilled.match(result)) {
        showToast.success(t("clients.clientCreated"));
        setTimeout(() => navigate("/clients"), 1500);
      } else {
        const err = result.payload;
        if (err?.errors)
          Object.values(err.errors).forEach((msg) => showToast.error(msg[0]));
        else showToast.error(err?.message || t("common.error"));
      }
      setLoading(false);
    },
    [dispatch, formData, currentUser, navigate, t],
  );

  const iconClass =
    "absolute left-3 top-3 text-muted-foreground pointer-events-none";

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center animate-in fade-in duration-500">
      <div className="w-full max-w-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {t("clients.createTitle")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("clients.createSubtitle")}
            </p>
          </div>
          <Link
            to="/clients"
            className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-md text-foreground hover:bg-accent transition-colors shadow-sm text-sm font-medium"
          >
            <ArrowLeft size={16} /> {t("common.back")}
          </Link>
        </div>

        <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                {
                  key: "nom",
                  label: t("clients.fullName"),
                  icon: User,
                  type: "text",
                  placeholder: t("clients.namePlaceholder"),
                },
                {
                  key: "email",
                  label: t("clients.email"),
                  icon: Mail,
                  type: "email",
                  placeholder: t("clients.emailPlaceholder"),
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {f.label}
                  </label>
                  <div className="relative">
                    <f.icon className={iconClass} size={18} />
                    <input
                      type={f.type}
                      className={inputClass}
                      placeholder={f.placeholder}
                      value={formData[f.key]}
                      onChange={(e) =>
                        setFormData({ ...formData, [f.key]: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {t("clients.phone")}
                  </label>
                  <div className="relative">
                    <Phone className={iconClass} size={18} />
                    <input
                      type="text"
                      className={inputClass}
                      placeholder={t("clients.phonePlaceholder")}
                      value={formData.telephone}
                      onChange={(e) =>
                        setFormData({ ...formData, telephone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {t("clients.address")}
                  </label>
                  <div className="relative">
                    <MapPin className={iconClass} size={18} />
                    <input
                      type="text"
                      className={inputClass}
                      placeholder={t("clients.addressPlaceholder")}
                      value={formData.adresse}
                      onChange={(e) =>
                        setFormData({ ...formData, adresse: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {currentUser?.role === "admin" && (
                <div className="pt-4 border-t border-border">
                  <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                    {t("common.assignEmployee")}
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold border border-primary/20">
                      {t("clients.adminAssign")}
                    </span>
                  </label>
                  <div className="relative">
                    <Briefcase className={iconClass} size={18} />
                    <select
                      className={`${inputClass} appearance-none cursor-pointer`}
                      value={formData.employee_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employee_id: e.target.value,
                        })
                      }
                    >
                      <option value="">{t("clients.selectEmployee")}</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nom} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {t("clients.requiredForAdmin")}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}{" "}
                {t("clients.saveClient")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
