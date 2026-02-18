import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axiosConfig";

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetch",
  async ({ employeeId, year, month } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (employeeId) params.employee_id = employeeId;
      if (year) params.year = year;
      if (month) params.month = month;

      params._t = new Date().getTime();

      const res = await api.get("/dashboard", { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Erreur de chargement du dashboard",
      );
    }
  },
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
