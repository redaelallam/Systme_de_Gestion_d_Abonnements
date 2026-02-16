import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosConfig";

export const fetchSubscriptions = createAsyncThunk(
  "subscriptions/fetch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/abonnements", { params });

      const paginatedData = res.data.data;

      const items = (paginatedData.data || []).map((sub) => {
        const isExpired = new Date(sub.dateFin) < new Date();
        if (isExpired && sub.statut !== "Annulé")
          return { ...sub, statut: "Expiré" };
        return sub;
      });

      return {
        items,
        pagination: {
          currentPage: paginatedData.current_page,
          lastPage: paginatedData.last_page,
          total: paginatedData.total,
        },
      };
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
        if (isExpired && sub.statut !== "Annulé")
          sub = { ...sub, statut: "Expiré" };
      }
      return sub;
    } catch (err) {
      return rejectWithValue("Erreur lors de la récupération");
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
      return rejectWithValue("Erreur de création.");
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
      return rejectWithValue("Erreur de modification");
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
      return rejectWithValue("Erreur de suppression");
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

export const renewSubscription = createAsyncThunk(
  "subscriptions/renew",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/abonnements/${id}/renew`, data);
      return res.data.data;
    } catch {
      return rejectWithValue("Erreur lors du renouvellement");
    }
  },
);

const subscriptionsSlice = createSlice({
  name: "subscriptions",
  initialState: {
    items: [],
    pagination: { currentPage: 1, lastPage: 1, total: 0 },
    selectedItem: null,
    loading: false,
    error: null,
  },
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
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
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

      .addCase(createSubscription.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        state.items = state.items.map((s) =>
          s.id === id ? { ...s, ...data } : s,
        );
      })
      .addCase(deleteSubscription.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload);
      })
      .addCase(updateSubscriptionStatus.fulfilled, (state, action) => {
        const { id, ...updates } = action.payload;
        state.items = state.items.map((s) =>
          s.id === id ? { ...s, ...updates } : s,
        );
      })
      .addCase(renewSubscription.fulfilled, (state, action) => {
        const updatedSub = action.payload;
        state.items = state.items.map((s) =>
          s.id === updatedSub.id ? updatedSub : s,
        );
      });
  },
});
export const { clearSelectedSubscription } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;
