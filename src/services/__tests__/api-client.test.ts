import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import {
  apiBaseUrl,
  apiFetch,
  clearAuth,
  getAuth,
  setAuth,
} from "@/services/api-client";
import { DEMO_ACCOUNT, products } from "@/services/mock/data";
import { server } from "@/test/setup";

import type { TAuthSession } from "@/services/api-client";
import type { TProduct } from "@/services/schemas/product";
import type { TGetResponseContent } from "@/services/types/schema";

describe("apiFetch + MSW setupServer", () => {
  beforeEach(() => {
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

    const unknownMethod = await apiFetch("/users", { method: "DELETE" });
    expect(unknownMethod.status).toBe(404);
  });
});
