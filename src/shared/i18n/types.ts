import en from "./locales/en.json";
import zh from "./locales/zh.json";

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

type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: TObj[TKey] extends object
    ? `${TKey}` | `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
    : `${TKey}`;
}[keyof TObj & (string | number)];

// ponytail: 仍由整份 zh.json 推導；M6 改 module declaration merging（spec §5.4）
export type TransKey = RecursiveKeyOf<typeof zh>;

export type TranslationKeyMap = { [key: string]: TransKey };
