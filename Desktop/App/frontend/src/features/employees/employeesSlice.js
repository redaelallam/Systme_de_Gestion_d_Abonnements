import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosConfig";

export const fetchEmployees = createAsyncThunk(
  "employees/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/employees");
      return res.data.data || [];
    } catch {
      return rejectWithValue("Impossible de charger les données.");
    }
  },
);

export const createEmployee = createAsyncThunk(
  "employees/create",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post("/employees", formData);
      return res.data;
    } catch (err) {
      if (err.response?.status === 422)
        return rejectWithValue({ errors: err.response.data.errors });
      return rejectWithValue({ message: "Une erreur serveur est survenue." });
    }
  },
);

export const updateEmployee = createAsyncThunk(
  "employees/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const payload = { ...data };
      if (!payload.password) delete payload.password;
      await api.put(`/employees/${id}`, payload);
      return { id, data: payload };
    } catch (err) {
      if (err.response?.status === 422)
        return rejectWithValue({ errors: err.response.data.errors });
      return rejectWithValue({ message: "Erreur lors de la mise à jour." });
    }
  },
);

export const deleteEmployee = createAsyncThunk(
  "employees/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/employees/${id}`);
      return id;
    } catch {
      return rejectWithValue("Erreur suppression");
    }
  },
);

export const fetchEmployeeById = createAsyncThunk(
  "employees/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/employees/${id}`);
      return res.data.data;
    } catch {
      return rejectWithValue("Impossible de charger les données.");
    }
  },
);

const employeesSlice = createSlice({
  name: "employees",
  initialState: {
    items: [],
    loading: false,
    error: null,
    currentEmployee: null,
  },
  reducers: {
    clearCurrentEmployee: (state) => {
      state.currentEmployee = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e.id !== action.payload);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        state.items = state.items.map((e) =>
          e.id === id ? { ...e, ...data } : e,
        );
      })
      .addCase(fetchEmployeeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEmployee = action.payload; // تخزين البيانات الكاملة (info, stats, etc)
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});
export const { clearCurrentEmployee } = employeesSlice.actions;
export default employeesSlice.reducer;
