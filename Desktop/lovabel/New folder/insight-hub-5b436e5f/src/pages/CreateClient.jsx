import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
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

export default function CreateClient() {
  const navigate = useNavigate();

  // --- États (Logic Inchangée) ---
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    employee_id: "",
  });

  // --- Initialisation (Logic Inchangée) ---
  useEffect(() => {
    const userStored = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(userStored);

    if (userStored && userStored.role === "admin") {
      fetchEmployees();
    }
  }, []);

  // --- Récupérer les employés (Logic Inchangée) ---
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://127.0.0.1:8000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data.data);
    } catch (err) {
      console.error("Erreur chargement employés", err);
      toast.error("Impossible de charger la liste des employés.");
    }
  };

  // --- Soumission (Logic Inchangée) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentUser?.role === "admin" && !formData.employee_id) {
      toast.error("Veuillez assigner un employé à ce client.");
      return;
    }

    setLoading(true);

    const payload = {
      nom: formData.nom,
      email: formData.email,
      telephone: formData.telephone,
      adresse: formData.adresse,
    };

    if (currentUser?.role === "admin") {
      payload.employee_id = formData.employee_id;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://127.0.0.1:8000/api/clients", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Client ajouté avec succès !");
      setTimeout(() => navigate("/clients"), 1500);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Erreur lors de la création.";
      const validationErrors = err.response?.data?.errors;

      if (validationErrors) {
        Object.values(validationErrors).forEach((errorMsg) => {
          toast.error(errorMsg[0]);
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Styles du Design System (Dark Mode Compatible) ---
  const inputClass =
    "w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all text-sm placeholder:text-muted-foreground text-foreground";
  const labelClass = "text-sm font-medium text-foreground mb-1.5 block";
  const iconClass =
    "absolute left-3 top-3 text-muted-foreground pointer-events-none";

  return (
    // الخلفية العامة bg-background والنص text-foreground
    <div className="min-h-screen bg-background p-6 md:p-10 animate-in fade-in duration-500 transition-colors duration-300">
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

      <div className="max-w-xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Nouveau Client
          </h1>
          <Link
            to="/clients"
            className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-md text-foreground hover:bg-accent hover:text-accent-foreground font-medium transition-colors shadow-sm text-sm"
          >
            <ArrowLeft size={16} /> Retour
          </Link>
        </div>

        {/* Formulaire Container - bg-card للبطاقة */}
        <div className="bg-card text-card-foreground p-8 rounded-lg shadow-sm border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom */}
            <div>
              <label className={labelClass}>Nom Complet</label>
              <div className="relative group">
                <User className={iconClass} size={18} />
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Nom du client"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email</label>
              <div className="relative group">
                <Mail className={iconClass} size={18} />
                <input
                  type="email"
                  className={inputClass}
                  placeholder="client@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Téléphone & Adresse */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Téléphone</label>
                <div className="relative group">
                  <Phone className={iconClass} size={18} />
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="+212..."
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData({ ...formData, telephone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Adresse</label>
                <div className="relative group">
                  <MapPin className={iconClass} size={18} />
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Ville, Quartier"
                    value={formData.adresse}
                    onChange={(e) =>
                      setFormData({ ...formData, adresse: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* --- ADMIN SELECT --- */}
            {currentUser?.role === "admin" && (
              <div className="pt-4 border-t border-border">
                <label className={`${labelClass} flex items-center gap-2`}>
                  Assigner à un employé
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold border border-primary/20">
                    Admin
                  </span>
                </label>
                <div className="relative group">
                  <Briefcase className={iconClass} size={18} />
                  <select
                    className={`${inputClass} appearance-none cursor-pointer`}
                    value={formData.employee_id}
                    onChange={(e) =>
                      setFormData({ ...formData, employee_id: e.target.value })
                    }
                  >
                    <option value="" className="bg-background text-foreground">
                      Sélectionner un employé...
                    </option>
                    {employees.map((emp) => (
                      <option
                        key={emp.id}
                        value={emp.id}
                        className="bg-background text-foreground"
                      >
                        {emp.nom} ({emp.email})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Obligatoire pour les administrateurs.
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
              )}
              Enregistrer le client
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
