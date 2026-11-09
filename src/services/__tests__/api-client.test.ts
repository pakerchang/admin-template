import { beforeEach, describe, expect, it } from "vitest";

import { apiFetch, clearAuth, getAuth, setAuth } from "@/services/api-client";
import { DEMO_ACCOUNT, products } from "@/services/mock/data";
import { mockFetch } from "@/services/mock/handlers";

import type { TAuthSession } from "@/services/api-client";
import type { TProduct } from "@/services/schemas/product";
import type { TGetResponseContent } from "@/services/types/schema";

describe("apiFetch + mock handlers", () => {
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
    // 直接打 mockFetch 驗 header 由 apiFetch 組出：用不存在的路由取回 404 也無妨
    let seen: string | null = null;
    const original = globalThis.Request;
    globalThis.Request = class extends original {
      constructor(...args: ConstructorParameters<typeof Request>) {
        super(...args);
        seen = this.headers.get("Authorization");
      }
    } as typeof Request;
    await apiFetch("/admin/tag");
    globalThis.Request = original;

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

  it("未知路由回 404", async () => {
    const res = await mockFetch(new Request("http://x/nope"));
    expect(res.status).toBe(404);
  });
});
