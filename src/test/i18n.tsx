import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";

import type { ReactNode } from "react";

type TDicts = Record<"zh" | "en", Record<string, unknown>>;

/**
 * 測試用 i18next instance（i18n-scope-migration I1 步驟 7）：以傳入的字典（例 `registry.i18n`，已 scope 的 module 字典）
 * 建立獨立 instance，不讀 shared/i18n 的 backend、不碰全域 instance。回傳 wrapper 供 render / renderHook 使用。
 */
export const createTestI18n = (dicts: TDicts, lng: "zh" | "en" = "zh") => {
  const i18n = i18next.createInstance();
  void i18n.use(initReactI18next).init({
    lng,
    fallbackLng: false,
    initAsync: false,
    resources: {
      zh: { translation: dicts.zh },
      en: { translation: dicts.en },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  const I18nWrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );
  return { i18n, I18nWrapper };
};
