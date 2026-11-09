export const DEFAULT_LOCALE = "zh";

export const LOCALES = {
  zh: "zh",
  en: "en",
} as const;

export const LOCALES_LIST = Object.values(LOCALES);

export type LocaleKey = keyof typeof LOCALES;
