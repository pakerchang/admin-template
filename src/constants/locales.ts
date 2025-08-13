import type zh from "@/locales/zh.json";

export const DEFAULT_LOCALE = "zh";

export const LOCALES = {
  zh: "zh",
  en: "en",
} as const;

export const LOCALES_LIST = Object.values(LOCALES);

export type LocaleKey = keyof typeof LOCALES;

type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: TObj[TKey] extends object
    ? `${TKey}` | `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
    : `${TKey}`;
}[keyof TObj & (string | number)];

export type TransKey = RecursiveKeyOf<typeof zh>;

export type TranslationKeyMap = { [key: string]: TransKey };
