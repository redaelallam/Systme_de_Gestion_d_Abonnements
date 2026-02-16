import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import frTranslations from "./locales/fr.json";
import arTranslations from "./locales/ar.json";

const savedLang = localStorage.getItem("lang") || "fr";

const resources = {
  en: { translation: enTranslations },
  fr: { translation: frTranslations },
  ar: { translation: arTranslations },
};

i18n.use(initReactI18next).init({
  resources,
  lng: savedLang,
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false,
  },
});

// Set initial dir
const dir = savedLang === "ar" ? "rtl" : "ltr";
document.documentElement.setAttribute("dir", dir);
document.documentElement.setAttribute("lang", savedLang);

export default i18n;
