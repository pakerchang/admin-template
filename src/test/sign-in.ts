import { makeApp } from "@/app/__tests__/fixture";
import { DEMO_ACCOUNT } from "@/modules/auth/mocks/seed";
import { setAuth } from "@/shared/api/session";
import { server } from "@/test/setup";

import { apiFetch } from "./api-fetch";

import type { TAuthSession } from "@/shared/api/session";

/** 掛上已安裝 module 的全部 handler，並以 superadmin 登入（之後的 request 都帶它的 token） */
export const mountAsSuperadmin = async () => {
  server.resetHandlers(...makeApp().build().registry.mockHandlers);
  const { body } = await apiFetch<TAuthSession>("/api/auth/login", {
    method: "POST",
    body: DEMO_ACCOUNT,
  });
  setAuth(body);
};
