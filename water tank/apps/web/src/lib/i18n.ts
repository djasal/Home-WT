import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "../locales/en.json";
import arTranslations from "../locales/ar.json";

const savedLang = localStorage.getItem("watertank.lang") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations }
    },
    lng: savedLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

export default i18n;
