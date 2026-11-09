import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import { DEMO_ACCOUNT } from "@/modules/auth/mocks/seed";
import { products } from "@/modules/product/mocks/seed";
import { apiBaseUrl, apiFetch } from "@/shared/api/fetcher";
import { clearAuth, getAuth, setAuth } from "@/shared/api/session";
import { server } from "@/test/setup";

import type { TProduct } from "@/modules/product/model/schema";
import type { TAuthSession } from "@/shared/api/session";
import type { TGetResponseContent } from "@/shared/api/types";

/** M4 起 mock API 依 grants 判權（R22）：資料類測試以 superadmin 登入 */
const signInAsSuperadmin = async () =>
  setAuth(
    (
      await apiFetch<TAuthSession>("/api/auth/login", {
        method: "POST",
        body: DEMO_ACCOUNT,
      })
    ).body
  );

describe("apiFetch + MSW setupServer", () => {
  beforeEach(() => {
    // M6 起 module 的 mock handler 由各 module 提供（setup 的預設 server 只有 kernel 的 guard + core handler）
    server.resetHandlers(...makeApp().build().registry.mockHandlers);
    clearAuth();
  });

  it("登入成功回傳 token + user 角色，可存入 localStorage", async () => {
    const res = await apiFetch<TAuthSession>("/api/auth/login", {
      method: "POST",
      body: DEMO_ACCOUNT,
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe("superadmin");
    expect(res.body.grants).toEqual(["*"]);

    setAuth(res.body);
    expect(getAuth()).toEqual(res.body);
    clearAuth();
    expect(getAuth()).toBeNull();
  });

  it("密碼錯誤回 401", async () => {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { email: DEMO_ACCOUNT.email, password: "wrong" },
    });
    expect(res.status).toBe(401);
  });

  it("登入後請求帶 Authorization header", async () => {
    setAuth({
      token: "t-123",
      user: { user_id: "u", email: "e", name: "n", role: "admin" },
    });
    let seen: string | null = null;
    server.use(
      http.get(`${apiBaseUrl}/admin/tag`, ({ request }) => {
        seen = request.headers.get("Authorization");
        return HttpResponse.json({});
      })
    );
    await apiFetch("/admin/tag");

    expect(seen).toBe("Bearer t-123");
  });

  it("GET 依 query 過濾與分頁，回傳 total", async () => {
    await signInAsSuperadmin();
    const res = await apiFetch<TGetResponseContent<TProduct[]>>(
      "/admin/products",
      { query: { page: 1, limit: 3, product_status: "active" } }
    );
    const activeCount = products.filter(
      (p) => p.product_status === "active"
    ).length;

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.total).toBe(activeCount);
    expect(res.body.data?.every((p) => p.product_status === "active")).toBe(
      true
    );
  });

  it("寫入操作更新記憶體狀態（create / update / delete）", async () => {
    await signInAsSuperadmin();
    await apiFetch("/admin/tag", {
      method: "POST",
      body: { tag_name: "From Test" },
    });
    const afterCreate = await apiFetch<
      TGetResponseContent<{ tag_id: string; tag_name: string }[]>
    >("/admin/tag", { query: { search: "From Test" } });
    const created = afterCreate.body.data![0];
    expect(created.tag_name).toBe("From Test");

    await apiFetch("/admin/tag", {
      method: "PUT",
      body: { tag_id: created.tag_id, tag_name: "Renamed" },
    });
    const afterUpdate = await apiFetch<
      TGetResponseContent<{ tag_name: string }[]>
    >("/admin/tag", { query: { tag_id: created.tag_id } });
    expect(afterUpdate.body.data![0].tag_name).toBe("Renamed");

    await apiFetch("/admin/tag", {
      method: "DELETE",
      body: { tag_id: created.tag_id },
    });
    const afterDelete = await apiFetch<TGetResponseContent<unknown[]>>(
      "/admin/tag",
      { query: { tag_id: created.tag_id } }
    );
    expect(afterDelete.body.data).toHaveLength(0);
  });

  it("未知路由回 404（fallback）", async () => {
    const res = await apiFetch<{ error: string }>("/admin/nope");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No mock handler for GET /admin/nope");

    const outsidePrefixes = await apiFetch<{ error: string }>("/nope");
    expect(outsidePrefixes.status).toBe(404);
    expect(outsidePrefixes.body.error).toBe("No mock handler for GET /nope");

    const unknownMethod = await apiFetch("/users", { method: "DELETE" });
    expect(unknownMethod.status).toBe(404);
  });
});
