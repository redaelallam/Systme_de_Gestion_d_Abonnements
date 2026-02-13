import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosConfig";

export const fetchSubscriptions = createAsyncThunk(
  "subscriptions/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/abonnements");
      const data = (res.data.data || []).map((sub) => {
        const isExpired = new Date(sub.dateFin) < new Date();
        if (isExpired && sub.statut !== "Annulé")
          return { ...sub, statut: "Expiré" };
        return sub;
      });
      return data;
    } catch (err) {
      if (err.response?.status === 401)
        return rejectWithValue("Session expirée");
      return rejectWithValue("Erreur de chargement des abonnements");
    }
  },
);
export const fetchSubscription = createAsyncThunk(
  "subscriptions/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/abonnements/${id}`);
      let sub = res.data.data;
      if (sub) {
        const isExpired = new Date(sub.dateFin) < new Date();
        if (isExpired && sub.statut !== "Annulé") {
          sub = { ...sub, statut: "Expiré" };
        }
      }
      return sub;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          "Erreur lors de la récupération de l'abonnement",
      );
    }
  },
);
export const createSubscription = createAsyncThunk(
  "subscriptions/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/abonnements", payload);
      return res.data.data || { ...payload, id: Date.now() };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Erreur lors de la création.",
      );
    }
  },
);

export const updateSubscription = createAsyncThunk(
  "subscriptions/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await api.put(`/abonnements/${id}`, data);
      return { id, data };
    } catch {
      return rejectWithValue("Erreur lors de la modification");
    }
  },
);

export const deleteSubscription = createAsyncThunk(
  "subscriptions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/abonnements/${id}`);
      return id;
    } catch {
      return rejectWithValue("Erreur lors de la suppression");
    }
  },
);

export const updateSubscriptionStatus = createAsyncThunk(
  "subscriptions/updateStatus",
  async ({ id, statut, dateDebut, dateFin }, { rejectWithValue }) => {
    try {
      const payload = { statut };
      if (dateDebut) payload.dateDebut = dateDebut;
      if (dateFin) payload.dateFin = dateFin;
      await api.put(`/abonnements/${id}`, payload);
      return { id, ...payload };
    } catch {
      return rejectWithValue("Erreur de mise à jour");
    }
  },
);

const subscriptionsSlice = createSlice({
  name: "subscriptions",
  initialState: { items: [], selectedItem: null, loading: false, error: null },
  reducers: {
    clearSelectedSubscription: (state) => {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedItem = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        state.items = state.items.map((s) =>
          s.id === id ? { ...s, ...data } : s,
        );
        if (state.selectedItem && state.selectedItem.id === id) {
          state.selectedItem = { ...state.selectedItem, ...data };
        }
      })
      .addCase(deleteSubscription.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload);
        if (state.selectedItem && state.selectedItem.id === action.payload) {
          state.selectedItem = null;
        }
      })
      .addCase(updateSubscriptionStatus.fulfilled, (state, action) => {
        const { id, ...updates } = action.payload;
        state.items = state.items.map((s) =>
          s.id === id ? { ...s, ...updates } : s,
        );
        if (state.selectedItem && state.selectedItem.id === id) {
          state.selectedItem = { ...state.selectedItem, ...updates };
        }
      });
  },
});
export const { clearSelectedSubscription } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;
