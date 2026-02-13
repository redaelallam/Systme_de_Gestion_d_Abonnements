import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "../hooks/useRedux";
import { fetchEmployeeById, updateEmployee } from "../features/employees/employeesSlice";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, Save, User, Mail, Lock, Loader2 } from "lucide-react";

const inputClass = "w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring transition-all text-sm placeholder:text-muted-foreground text-foreground";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({ nom: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      const result = await dispatch(fetchEmployeeById(id));
      if (fetchEmployeeById.fulfilled.match(result)) {
        const { nom, email } = result.payload;
        setFormData({ nom, email, password: "" });
      } else {
        toast.error("Impossible de charger les données.");
        navigate("/employees");
      }
      setFetching(false);
    })();
  }, [id, dispatch, navigate]);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const updateToast = toast.loading("Mise à jour en cours...");

    const result = await dispatch(updateEmployee({ id, data: formData }));
    if (updateEmployee.fulfilled.match(result)) {
      toast.success("Employé mis à jour avec succès !", { id: updateToast });
      setTimeout(() => navigate("/employees"), 1500);
    } else {
      toast.dismiss(updateToast);
      const payload = result.payload;
      if (payload?.errors) {
        setErrors(payload.errors);
        toast.error("Veuillez vérifier les champs.");
      } else {
        toast.error("Erreur serveur.");
      }
    }
    setLoading(false);
  }, [dispatch, id, formData, navigate]);

  const iconClass = "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground";

  if (fetching) return (
    <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Chargement...
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Modifier l'Employé</h1>
          <p className="text-muted-foreground mt-1 text-sm">Mettre à jour les informations du membre.</p>
        </div>
        <Link to="/employees" className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-md text-foreground hover:bg-accent transition-all shadow-sm text-sm font-medium">
          <ArrowLeft size={16} /> Retour
        </Link>
      </div>

      <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border overflow-hidden max-w-2xl">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {[
              { name: "nom", label: "Nom Complet", type: "text", icon: User },
              { name: "email", label: "Adresse Email", type: "email", icon: Mail },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                <div className="relative group">
                  <div className={iconClass}><f.icon size={18} /></div>
                  <input type={f.type} name={f.name} value={formData[f.name]} onChange={handleChange}
                    className={`${inputClass} ${errors[f.name] ? "border-destructive" : ""}`} />
                </div>
                {errors[f.name] && <p className="text-destructive text-xs mt-1">{errors[f.name][0]}</p>}
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nouveau Mot de passe <span className="text-muted-foreground font-normal text-xs ml-1">(Laisser vide pour ne pas changer)</span>
              </label>
              <div className="relative group">
                <div className={iconClass}><Lock size={18} /></div>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  className={`${inputClass} ${errors.password ? "border-destructive" : ""}`} placeholder="••••••••" />
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password[0]}</p>}
            </div>
            <div className="pt-2 flex justify-end">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-70">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Mettre à jour
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
