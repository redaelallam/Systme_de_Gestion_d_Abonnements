import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import employeesReducer from "../features/employees/employeesSlice";
import clientsReducer from "../features/clients/clientsSlice";
import subscriptionsReducer from "../features/subscriptions/subscriptionsSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import themeReducer from "../features/theme/themeSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeesReducer,
    clients: clientsReducer,
    subscriptions: subscriptionsReducer,
    dashboard: dashboardReducer,
    theme: themeReducer,
  },
});

export default store;
