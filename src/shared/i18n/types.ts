import en from "./locales/en.json";
import zh from "./locales/zh.json";

import type { ParseKeys } from "i18next";

export type TranslationKey = keyof typeof zh;

export type TransTypes = "zh" | "en";

/** core 字典（由 i18n.ts 的 backend plugin 載入） */
type TCoreResources = {
  zh: typeof zh;
  en: typeof en;
};

export const resources: TCoreResources = {
  zh,
  en,
};

type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: TObj[TKey] extends object
    ? `${TKey}` | `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
    : `${TKey}`;
}[keyof TObj & (string | number)];

/**
 * module 字典的型別擴充點（spec §5.4，i18n-scope-migration OD-I18N-1 A）：各 module 以 declaration merging 加入
 * `{ <id>: typeof zh }`。**不得**帶 index signature（`extends Record<string, unknown>` 會讓 `keyof` 變成 string、
 * `TransKey` 撐寬成 string，typo 也能過 `tsc`）
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TranslationResources {}

export type TransKey = RecursiveKeyOf<typeof zh & TranslationResources>;

export type TranslationKeyMap = { [key: string]: TransKey };

/**
 * `t()` 實際接受的 key：i18next 由 `CustomTypeOptions.resources`（`i18next.d.ts`）推導，只含 leaf。
 * `TransKey` 也收物件節點（`RecursiveKeyOf`，改 leaf-only 另案），不能直接傳給 `t()`；動態組 key 處 cast 成本型別
 */
export type TLeafKey = ParseKeys;
