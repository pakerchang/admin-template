import type { TGrant, TPermission } from "./types";

/** 唯一判斷函式；支援 "*" 與 "resource:*" */
export const can = (grants: readonly TGrant[], p: TPermission): boolean => {
  const resourceWildcard = `${p.slice(0, p.indexOf(":"))}:*`;
  return grants.some((g) => g === "*" || g === p || g === resourceWildcard);
};
