import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosConfig";

export const fetchClients = createAsyncThunk(
  "clients/fetch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/clients", { params });
      return res.data.data;
    } catch {
      return rejectWithValue("Impossible de charger les clients.");
    }
  },
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
      if (err.response?.status === 403) return rejectWithValue("Accès refusé.");
      return rejectWithValue("Erreur serveur.");
    }
  },
);

export const createClient = createAsyncThunk(
  "clients/create",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post("/clients", formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Erreur lors de la création." },
      );
    }
  },
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
  },
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
  },
);

export const fetchUsers = createAsyncThunk(
  "clients/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/employees");
      return res.data.data || res.data || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Erreur chargement employés.",
      );
    }
  },
);

const clientsSlice = createSlice({
  name: "clients",
  initialState: {
    items: [],
    pagination: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
    },
    users: [],
    currentClient: null,
    loading: false,
    error: null,
  },
  reducers: {
    updateClientLocal(state, action) {
      state.currentClient = { ...state.currentClient, ...action.payload };
    },
    clearClientError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Clients ---
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = {
          currentPage: action.payload.current_page,
          lastPage: action.payload.last_page,
          total: action.payload.total,
        };
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Users ---
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        console.warn("Fetch users failed:", action.payload);
      })

      // --- Fetch Client By Id ---
      .addCase(fetchClientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentClient = action.payload;
        state.error = null;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Update Client ---
      .addCase(updateClient.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        state.items = state.items.map((c) =>
          c.id === id ? { ...c, ...data } : c,
        );
      })

      // --- Delete Client ---
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
      });
  },
});

export const { updateClientLocal, clearClientError } = clientsSlice.actions;
export default clientsSlice.reducer;
