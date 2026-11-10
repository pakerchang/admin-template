import { createContext, useCallback, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useCan } from "@/shared/permission";

import type { TRegistryNavItem, TResolvedNavItem } from "./types";

/** 已排序、未過濾的 registry nav（label 為全域 key），由 kernel 注入（§4.3 步驟 3）；shell 不直接讀它 */
export const NavContext = createContext<readonly TRegistryNavItem[]>([]);

/** registry 的 route 標題表：`to` → 全域 key（nav、children 與 routeTitles），由 kernel 注入 */
export const RouteTitlesContext = createContext<ReadonlyMap<string, string>>(
  new Map()
);

/**
 * §6.3：shell 取 nav 的唯一入口。filter(can)；children 全被濾掉時父項一併隱藏。
 * label 在這裡翻譯成文字、不外流 key（i18n-scope-migration 補裁 3）；`useTranslation` 綁 languageChanged，切語系即回傳新 string
 */
export const useVisibleNav = (): TResolvedNavItem[] => {
  const nav = useContext(NavContext);
  const allowed = useCan();
  const { t } = useTranslation();
  return useMemo(
    () =>
      nav.flatMap(({ labelKey, children, ...item }) => {
        if (!allowed(item.permission)) return [];
        const resolved = { ...item, label: t(labelKey) };
        if (!children) return [resolved];
        const visible = children
          .filter((c) => allowed(c.permission))
          .map(({ labelKey: key, ...c }) => ({ ...c, label: t(key) }));
        return visible.length ? [{ ...resolved, children: visible }] : [];
      }),
    [nav, allowed, t]
  );
};

/**
 * 補裁 4：route 標題 resolver（breadcrumb 用）。在元件 / hook 頂層呼叫一次，對路徑呼叫回傳的函式；
 * 查 registry 標題表並翻譯，查不到為 `undefined`。不經權限過濾（403 由 route 守衛處理）
 */
export const useRouteTitleResolver = (): ((
  path: string
) => string | undefined) => {
  const titles = useContext(RouteTitlesContext);
  const { t } = useTranslation();
  return useCallback(
    (path: string) => {
      const key = titles.get(path);
      return key === undefined ? undefined : t(key);
    },
    [titles, t]
  );
};
