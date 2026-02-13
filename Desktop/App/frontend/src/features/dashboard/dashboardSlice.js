import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosConfig";

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
      return rejectWithValue("Erreur de chargement du tableau de bord");
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    data: null,
    role: null,
    userName: null,
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
        state.data = action.payload.data;
        state.role = action.payload.role;
        state.userName = action.payload.user_name;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
