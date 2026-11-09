import { getResponse } from "msw";
import { describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import { operations } from "@/app/operations.gen";
import { DEMO_ACCOUNT } from "@/modules/auth/mocks/seed";
import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";

const BASE = "http://mock-api.test";

/** M6 起舊 handler 表拆到各 module 的 mocks/handlers.ts 與 kernel core handler，經 build() 組成 registry.mockHandlers */
describe("toHttpHandlers", () => {
  it("covers every METHOD path of the legacy handler table", () => {
    const [guard, ...rest] = makeApp().build().registry.mockHandlers;
    expect(String(guard.info.path)).toBe("*");
    const routes = rest.map((h) => `${h.info.method} ${String(h.info.path)}`);

    // 每個 operation 恰好一個 handler（拆表後沒有漏、沒有重複）
    expect([...routes].sort()).toEqual(
      operations.routes.map((r) => `${r.method} ${BASE}${r.path}`).sort()
    );
    expect(routes.sort()).toMatchSnapshot();
  });

  it("resolves base URL the same way apiFetch does (trailing slash)", async () => {
    const all = toHttpHandlers(
      { "POST /api/auth/login": ({ body }) => ({ body }) },
      { baseUrl: `${BASE}/` }
    );
    const res = await getResponse(
      all,
      new Request(new URL("/api/auth/login", `${BASE}/`), {
        method: "POST",
        body: JSON.stringify(DEMO_ACCOUNT),
      })
    );
    expect(res?.status).toBe(200);
    expect(await res?.json()).toEqual(DEMO_ACCOUNT);
  });
});
