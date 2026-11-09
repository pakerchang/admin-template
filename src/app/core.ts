import { coreMockHandlers, guard } from "@/app/mock";
import { createAppRootRoute } from "@/app/router/root";
import { getAuth } from "@/services/api-client";

import type { TCore } from "@/app/kernel/build";
import type { TGrant } from "@/shared/permission";

// ponytail: M3 已登入 = ["*"]（行為不變：所有頁面與 nav 對已登入者可見）；M4 改讀登入回傳的 session.grants
const sessionGrants = (): readonly TGrant[] => (getAuth() ? ["*"] : []);

/** kernel 自有零件（§4.2 TCore）；測試可覆寫 getGrants / isAuthenticated */
export const createCore = (overrides: Partial<TCore> = {}): TCore => ({
  root: createAppRootRoute(),
  // ponytail: core 字典仍由 locales/i18n.ts 的 backend 載入；M6 搬 core key 後再填
  i18n: { en: {}, zh: {} },
  guard,
  mockHandlers: coreMockHandlers,
  getGrants: sessionGrants,
  isAuthenticated: () => !!getAuth(),
  ...overrides,
});
