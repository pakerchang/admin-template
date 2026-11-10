import { createMockHandlers } from "@/app/mock";
import { createAppRootRoute } from "@/app/router/root";
import { getAuth } from "@/shared/api/session";
import { can } from "@/shared/permission";

import type { TCore } from "@/app/kernel/build";
import type { TGrant } from "@/shared/permission";

/**
 * 登入回傳的 session.grants（§6.1）。缺 core `app:access` 視同沒有任何 grant：
 * protected layout 照常渲染、nav 全濾掉、每個頁面內容區 403（§6.2「protected route 自身缺 app:access」）。
 */
export const sessionGrants = (): readonly TGrant[] => {
  const grants = getAuth()?.grants ?? [];
  return can(grants, "app:access") ? grants : [];
};

/** kernel 自有零件（§4.2 TCore）；測試可覆寫 getGrants / isAuthenticated */
export const createCore = (overrides: Partial<TCore> = {}): TCore => ({
  root: createAppRootRoute(),
  // ponytail: core 字典仍由 shared/i18n/i18n.ts 的 backend 載入；M6 搬 core key 後再填
  i18n: { en: {}, zh: {} },
  mock: createMockHandlers,
  getGrants: sessionGrants,
  isAuthenticated: () => !!getAuth(),
  ...overrides,
});
