import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosConfig";

export const fetchClients = createAsyncThunk(
  "clients/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/clients");
      return res.data.data || [];
    } catch {
      return rejectWithValue("Impossible de charger les clients.");
    }
  }
);

export const fetchClientById = createAsyncThunk(
  "clients/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/clients/${id}`);
      return res.data.data || res.data;
    } catch (err) {
      if (err.response?.status === 404)
        return rejectWithValue("Client introuvable.");
      if (err.response?.status === 403)
        return rejectWithValue("Accès refusé.");
      return rejectWithValue("Erreur serveur.");
    }
  }
);

export const createClient = createAsyncThunk(
  "clients/create",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post("/clients", formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Erreur lors de la création." }
      );
    }
  }
);

export const updateClient = createAsyncThunk(
  "clients/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await api.put(`/clients/${id}`, data);
      return { id, data };
    } catch {
      return rejectWithValue("Échec de la mise à jour.");
    }
  }
);

export const deleteClient = createAsyncThunk(
  "clients/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/clients/${id}`);
      return id;
    } catch {
      return rejectWithValue("Erreur lors de la suppression.");
    }
  }
);

export const fetchUsers = createAsyncThunk(
  "clients/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/users");
      return res.data.data || res.data || [];
    } catch {
      return rejectWithValue("Erreur chargement employés.");
    }
  }
);

const clientsSlice = createSlice({
  name: "clients",
  initialState: {
    items: [],
    users: [],
    currentClient: null,
    loading: false,
    error: null,
  },
  reducers: {
    updateClientLocal(state, action) {
      state.currentClient = { ...state.currentClient, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchClientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentClient = action.payload;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        state.items = state.items.map((c) =>
          c.id === id ? { ...c, ...data } : c
        );
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      });
  },
});

export const { updateClientLocal } = clientsSlice.actions;
export default clientsSlice.reducer;
