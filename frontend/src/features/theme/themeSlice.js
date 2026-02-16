import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => localStorage.getItem("theme") || "light";
const getInitialLang = () => localStorage.getItem("lang") || "fr";

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    mode: getInitialTheme(),
    language: getInitialLang(),
  },
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === "dark" ? "light" : "dark";
      localStorage.setItem("theme", state.mode);
    },
    setTheme(state, action) {
      state.mode = action.payload;
      localStorage.setItem("theme", state.mode);
    },
    setLanguage(state, action) {
      state.language = action.payload;
      localStorage.setItem("lang", state.language);
    },
  },
});

export const { toggleTheme, setTheme, setLanguage } = themeSlice.actions;
export default themeSlice.reducer;
