import "i18next";
import type { TranslationResources } from "@/shared/i18n/types";
import type zh from "@/shared/i18n/locales/zh.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    keySeparator: ".";
    returnNull: false;
    /** core 字典 + module 擴充（TranslationResources）：t() 的 key 由此推導，typo 在 tsc 失敗（i18n-scope-migration AC-4） */
    resources: { translation: typeof zh & TranslationResources };
  }
}
