import { createContext, useContext } from "react";

import { can } from "./can";

import type { TGrant, TPermission } from "./types";

/**
 * grants 來源由 app 注入（kernel 在 protected layout 外層提供，§6.2 C2：shared 不 import app）。
 * render 期呼叫，登入 / 登出後不必重建 router。沒有 Provider = 沒有任何 grant（fail-closed）。
 */
export const GrantsContext = createContext<() => readonly TGrant[]>(() => []);

/** 元件層唯一的權限判斷入口（§6.4）；回傳 `(permission) => boolean` */
export const useCan = () => {
  const getGrants = useContext(GrantsContext);
  return (p: TPermission) => can(getGrants(), p);
};
