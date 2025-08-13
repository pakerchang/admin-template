import i18next from "i18next";
import { type BackendModule } from "i18next";
import { initReactI18next } from "react-i18next";

import { LOCALES, DEFAULT_LOCALE } from "@/constants/locales";
import { resources } from "@/locales/types";

const LANGUAGE_KEY = "currLng";

const LazyImportPlugin: BackendModule = {
  type: "backend",
  init() {},
  read: (lang, _, cb) => {
    const resource = resources[lang as keyof typeof resources];
    if (resource) {
      cb(null, resource);
    } else {
      cb(new Error(`Language file for ${lang} not found`), null);
    }
  },
};

// 從 localStorage 獲取上次使用的語言
const getInitialLanguage = () => {
  try {
    const savedLang = localStorage.getItem(LANGUAGE_KEY);
    return savedLang || DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};

i18next
  .use(LazyImportPlugin)
  .use(initReactI18next)
  .init({
    debug: import.meta.env.MODE !== "production",
    fallbackLng: LOCALES.zh,
    lng: getInitialLanguage(),
    interpolation: {
      escapeValue: false,
    },
    react: { useSuspense: false },
  });

const setHtmlLangAttribute = (lng: string) => {
  document.documentElement.setAttribute("lang", lng);
  // 當語言改變時，保存到 localStorage
  localStorage.setItem(LANGUAGE_KEY, lng);
};

i18next.on("languageChanged", setHtmlLangAttribute);

export default i18next;
