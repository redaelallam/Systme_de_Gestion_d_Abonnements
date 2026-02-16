import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosConfig";

// Admin mock data matching Laravel API
const ADMIN_MOCK = {
  role: "admin",
  resume_financier: {
    mensuel: { montant: 1199, montant_precedent: 2117, croissance_pourcentage: -43.36, tendance: "baisse" },
    annuel: 3316,
    total_global: 32426,
  },
  performance_saas: { mrr: 14617, arpu: 504.03, churn_rate: 7.14, ltv: 7056.48 },
  graphiques: {
    revenus_historique: {
      labels: ["Mar 2025","Apr 2025","May 2025","Jun 2025","Jul 2025","Aug 2025","Sep 2025","Oct 2025","Nov 2025","Dec 2025","Jan 2026","Feb 2026"],
      data: [1088,1088,839,327,139,2287,2937,2765,3920,3106,2117,1199],
    },
    repartition_abonnements: [
      { name: "Annuel", value: 12 },
      { name: "Mensuel", value: 1 },
      { name: "Premium", value: 5 },
      { name: "Semestriel", value: 14 },
      { name: "Trimestriel", value: 12 },
    ],
  },
  clients_analytics: { total: 50, actifs: 29, inactifs: 21, taux_activite: 58 },
  abonnements_expirant: {
    total_count: 9,
    liste: [
      { id: 10, client: "Terry Cremin", prix: "139.00", date_fin: "2026-02-24", jours_restants: 10, urgence: "medium" },
      { id: 18, client: "Grayson Cartwright", prix: "139.00", date_fin: "2026-02-24", jours_restants: 10, urgence: "medium" },
      { id: 49, client: "Precious Herman", prix: "139.00", date_fin: "2026-02-24", jours_restants: 10, urgence: "medium" },
      { id: 36, client: "Mrs. Marilyne Herzog", prix: "139.00", date_fin: "2026-03-01", jours_restants: 15, urgence: "medium" },
      { id: 73, client: "Pierre Ernser", prix: "139.00", date_fin: "2026-03-01", jours_restants: 15, urgence: "medium" },
    ],
  },
  performance_equipe: [
    { id: 10, nom: "Mrs. Cecilia Boyer MD", email: "isai.mante@example.org", clients_count: 7, active_subs: 9, mrr_genere: 4078, revenu_total_apporte: 5043, taux_conversion: 128.6 },
    { id: 6, nom: "Icie Medhurst", email: "otis.mertz@example.com", clients_count: 4, active_subs: 6, mrr_genere: 2500, revenu_total_apporte: 3488, taux_conversion: 150 },
    { id: 2, nom: "Ahmed Employee", email: "employee@app.com", clients_count: 5, active_subs: 7, mrr_genere: 2056, revenu_total_apporte: 3506, taux_conversion: 140 },
    { id: 4, nom: "Prof. River Gleason", email: "destany84@example.com", clients_count: 4, active_subs: 7, mrr_genere: 1728, revenu_total_apporte: 4293, taux_conversion: 175 },
    { id: 8, nom: "Brett Pollich", email: "derrick.farrell@example.net", clients_count: 7, active_subs: 5, mrr_genere: 1578, revenu_total_apporte: 3304, taux_conversion: 71.4 },
    { id: 3, nom: "Ms. Pearlie Parker", email: "gerlach.ivy@example.com", clients_count: 3, active_subs: 4, mrr_genere: 1178, revenu_total_apporte: 3293, taux_conversion: 133.3 },
    { id: 9, nom: "Alessia Lynch", email: "oma20@example.org", clients_count: 9, active_subs: 2, mrr_genere: 700, revenu_total_apporte: 2648, taux_conversion: 22.2 },
    { id: 7, nom: "Zola Bosco", email: "yolanda.maggio@example.org", clients_count: 5, active_subs: 3, mrr_genere: 549, revenu_total_apporte: 2276, taux_conversion: 60 },
    { id: 5, nom: "Maybell Schroeder PhD", email: "obie.kovacek@example.com", clients_count: 6, active_subs: 1, mrr_genere: 250, revenu_total_apporte: 4575, taux_conversion: 16.7 },
  ],
};

// Employee mock data matching Laravel API
const EMPLOYEE_MOCK = {
  role: "employee",
  resume_financier: {
    mensuel: { montant: 0, montant_precedent: 389, croissance_pourcentage: -100, tendance: "baisse" },
    annuel: 389,
    total_global: 3506,
  },
  performance_saas: { mrr: 2056, arpu: 685.33, churn_rate: 9.09, ltv: 7538.67 },
  graphiques: {
    revenus_historique: {
      labels: ["Mar 2025","Apr 2025","May 2025","Jun 2025","Jul 2025","Aug 2025","Sep 2025","Oct 2025","Nov 2025","Dec 2025","Jan 2026","Feb 2026"],
      data: [0,450,0,0,0,800,250,0,778,389,389,0],
    },
    repartition_abonnements: [
      { name: "Annuel", value: 1 },
      { name: "Premium", value: 1 },
      { name: "Semestriel", value: 1 },
      { name: "Trimestriel", value: 4 },
    ],
  },
  clients_analytics: { total: 5, actifs: 3, inactifs: 2, taux_activite: 60 },
  abonnements_expirant: {
    total_count: 3,
    liste: [
      { id: 49, client: "Precious Herman", prix: "139.00", date_fin: "2026-02-24", jours_restants: 10, urgence: "medium" },
      { id: 36, client: "Mrs. Marilyne Herzog", prix: "139.00", date_fin: "2026-03-01", jours_restants: 15, urgence: "medium" },
      { id: 73, client: "Pierre Ernser", prix: "139.00", date_fin: "2026-03-01", jours_restants: 15, urgence: "medium" },
    ],
  },
};

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetch",
  async (employeeId, { rejectWithValue }) => {
    try {
      const url = employeeId
        ? `/dashboard?employee_id=${employeeId}`
        : "/dashboard";
      const res = await api.get(url);
      return res.data;
    } catch {
      const role = localStorage.getItem("role") || "admin";
      return role === "admin" ? ADMIN_MOCK : EMPLOYEE_MOCK;
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    data: null,
    role: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.role = action.payload.role;
        state.data = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
