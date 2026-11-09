import { createRoute } from "@tanstack/react-router";

import { can } from "./can";
import { ForbiddenError } from "./forbidden";

import type { TGrant, TPermission } from "./types";
import type { AnyRoute } from "@tanstack/react-router";

type TGuardedOpts = {
  permission: TPermission | "authenticated";
  staticData?: object;
  beforeLoad?: (ctx: never) => unknown;
};

/**
 * 只負責「判斷 + 拋錯」，不知道誰來畫 403（C2：shared 不 import app）；errorComponent 由 app 注入。
 * ponytail: grants 來源以參數注入 —— spec §6.2 寫 getSession()，但 session store（shared/api）不在 M1，M4 接線時再定。
 */
export const guardedRoute = <TOpts extends TGuardedOpts>(
  opts: TOpts,
  getGrants: () => readonly TGrant[]
): AnyRoute => {
  const { permission, ...rest } = opts;
  return createRoute({
    ...rest,
    staticData: { ...opts.staticData, permission },
    beforeLoad: (ctx: never) => {
      if (permission !== "authenticated" && !can(getGrants(), permission))
        throw new ForbiddenError(permission); // 不 redirect：URL 不變
      return opts.beforeLoad?.(ctx);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as AnyRoute;
};
