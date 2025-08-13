import en from "./en.json";
import zh from "./zh.json";

export type TranslationKey = keyof typeof zh;

export type TransTypes = "zh" | "en";

export type TranslationResources = {
  zh: typeof zh;
  en: typeof en;
};

export const resources: TranslationResources = {
  zh,
  en,
};
