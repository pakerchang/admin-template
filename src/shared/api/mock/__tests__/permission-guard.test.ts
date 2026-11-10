import { getResponse, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { createPermissionGuard } from "@/shared/api/mock/permission-guard";
import { server } from "@/test/setup";

import type { TGrant } from "@/shared/permission";

/** AC-2（R22 / a3）：以 setupServer 實發 fetch 驗證 guard 判定；guard 以 server.use 排在所有 handler 之前 */
const BASE = "http://api.test";
// typed-contracts T1：domain 權限在 core-only 不在 registry → 以 string 宣告再 cast（執行期行為不變）
const TOKEN_GRANTS = {
  "t-admin": ["users:*"],
  "t-support": ["orders:*"],
} as Record<string, string[]> as Record<string, TGrant[]>;

const guard = (apiBaseUrl = BASE) =>
  createPermissionGuard({
    apiBaseUrl,
    routes: [
      { method: "POST", path: "/api/auth/login", operationId: "login" },
      { method: "GET", path: "/admin/users", operationId: "listUsers" },
      {
        method: "PUT",
        path: "/admin/users/:id",
        operationId: "updateUserRole",
      },
      { method: "GET", path: "/admin/x", operationId: "undeclaredOp" },
    ],
    permissions: {
      login: "public",
      listUsers: "users:read",
      updateUserRole: "users:update-role",
    },
    getGrants: (request) =>
      TOKEN_GRANTS[
        request.headers.get("Authorization")?.replace("Bearer ", "") ?? ""
      ] ?? [],
  });

/** 模擬 module handler：guard 放行後才會到這裡 */
const moduleHandlers = [
  http.post(`${BASE}/api/auth/login`, () => HttpResponse.json({ ok: "login" })),
  http.get(`${BASE}/admin/users`, () => HttpResponse.json({ ok: "list" })),
  http.put(`${BASE}/admin/users/:id`, ({ params }) =>
    HttpResponse.json({ ok: "update", id: params.id })
  ),
];

const call = (url: string, init: RequestInit & { token?: string } = {}) =>
  fetch(url, {
    ...init,
    headers: init.token ? { Authorization: `Bearer ${init.token}` } : {},
  });

describe("permission guard over setupServer (AC-2, R22)", () => {
  const use = (...extra: Parameters<typeof server.use>) =>
    server.use(guard(), ...extra, ...moduleHandlers);

  it("1. passes through requests outside apiBaseUrl", async () => {
    use(http.get("http://cdn.test/x", () => HttpResponse.text("cdn")));
    const res = await call("http://cdn.test/x");
    expect(await res.text()).toBe("cdn");
  });

  it("2. base URL boundary: api.testing is not api.test; trailing slash makes no difference", async () => {
    use(
      http.get("http://api.testing/admin/users", () =>
        HttpResponse.text("other origin")
      )
    );
    expect(await (await call("http://api.testing/admin/users")).text()).toBe(
      "other origin"
    );

    for (const base of [BASE, `${BASE}/`]) {
      const g = createPermissionGuard({
        apiBaseUrl: base,
        routes: [],
        permissions: {},
        getGrants: () => [],
      });
      const out = new Request("http://api.testing/admin/users");
      expect(await getResponse([g], out)).toBeUndefined();
      const inside = await getResponse([g], new Request(`${BASE}/admin/users`));
      expect(inside?.status).toBe(404);
    }
  });

  it("3. unknown route → 404, and a hand-written handler on the same path never runs", async () => {
    const handwritten = vi.fn(() => HttpResponse.json({ leaked: true }));
    use(http.get(`${BASE}/admin/nope`, handwritten));
    const res = await call(`${BASE}/admin/nope`, { token: "t-admin" });
    expect(res.status).toBe(404);
    expect(handwritten).not.toHaveBeenCalled();
  });

  it("4. route without a permission declaration → 403 naming the operation", async () => {
    use();
    const res = await call(`${BASE}/admin/x`, { token: "t-admin" });
    expect(res.status).toBe(403);
    const { error } = await res.json();
    expect(error).toContain("undeclaredOp");
    expect(error).toContain("has no permission declaration");
  });

  it("5. public operation passes without a token", async () => {
    use();
    const res = await call(`${BASE}/api/auth/login`, { method: "POST" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: "login" });
  });

  it("6. missing grant → 403; no token on a non-public operation → 403, not 401 (R25)", async () => {
    use();
    const denied = await call(`${BASE}/admin/users/42`, {
      method: "PUT",
      token: "t-support",
    });
    expect(denied.status).toBe(403);
    expect((await denied.json()).error).toBe(
      "forbidden: updateUserRole requires users:update-role"
    );

    const anonymous = await call(`${BASE}/admin/users`);
    expect(anonymous.status).toBe(403);
  });

  it("7. granted request falls through to the module handler, path params included", async () => {
    use();
    expect(
      await (await call(`${BASE}/admin/users`, { token: "t-admin" })).json()
    ).toEqual({ ok: "list" });
    const res = await call(`${BASE}/admin/users/42`, {
      method: "PUT",
      token: "t-admin",
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: "update", id: "42" });
  });
});

describe("createPermissionGuard origin normalization (M3 C1 regression)", () => {
  it("MOCK-API.test:80 still scopes mock-api.test, not :8080", async () => {
    const g = createPermissionGuard({
      apiBaseUrl: "http://MOCK-API.test:80",
      routes: [],
      permissions: {},
      getGrants: () => [],
    });
    const res = await getResponse(
      [g],
      new Request("http://mock-api.test/nope")
    );
    expect(res?.status).toBe(404);
    expect(await res?.json()).toEqual({
      error: "not found: no operation for GET /nope",
    });
    expect(
      await getResponse([g], new Request("http://mock-api.test:8080/nope"))
    ).toBeUndefined();
  });
});
