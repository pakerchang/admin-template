import { createContext, useContext } from "react";

import { useCan } from "@/shared/permission";

import type { TNavItem } from "./types";

/** 已排序、未過濾的 registry nav，由 kernel 注入（§4.3 步驟 3）；shell 不直接讀它 */
export const NavContext = createContext<readonly TNavItem[]>([]);

/** §6.3：shell 取 nav 的唯一入口。filter(can)；children 全被濾掉時父項一併隱藏 */
export const useVisibleNav = (): TNavItem[] => {
  const nav = useContext(NavContext);
  const allowed = useCan();
  return nav.flatMap((item) => {
    if (!allowed(item.permission)) return [];
    if (!item.children) return [item];
    const children = item.children.filter((c) => allowed(c.permission));
    return children.length ? [{ ...item, children }] : [];
  });
};
