import { beforeEach, describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import { mockHandlers } from "@/app/mock";
import { operations } from "@/app/operations.gen";
import {
  apiBaseUrl,
  apiFetch,
  clearAuth,
  setAuth,
} from "@/services/api-client";
import { DEMO_ACCOUNT, users } from "@/services/mock/data";
import { server } from "@/test/setup";

import type { TAuthSession } from "@/services/api-client";

const login = (email: string) =>
  apiFetch<TAuthSession>("/api/auth/login", {
    method: "POST",
    body: { email, password: DEMO_ACCOUNT.password },
  });

const emailOf = (role: string) => users.find((u) => u.role === role)!.email;

/** 登入後把 session 存起來，apiFetch 之後的 request 都帶它的 token */
const signIn = async (email: string) => {
  const res = await login(email);
  setAuth(res.body);
  return res.body;
};

describe("kernel mock handlers wired with the real operation table (AC-2, R22 / R25)", () => {
  beforeEach(() => clearAuth());

  it("test env uses a dedicated mock origin and the four API prefixes are unchanged (R24)", () => {
    expect(apiBaseUrl).toBe("http://mock-api.test");
    expect(new Set(operations.routes.map((r) => r.path.split("/")[1]))).toEqual(
      new Set(["api", "users", "user", "admin"])
    );
  });

  it("guard is the first handler", () => {
    expect(String(mockHandlers[0].info.path)).toBe("*");
  });

  describe("with the installed modules' grant matrix (registry.mockHandlers)", () => {
    beforeEach(() =>
      server.resetHandlers(...makeApp().build().registry.mockHandlers)
    );

    it("login (public) returns grants expanded from the role matrix", async () => {
      expect((await login(DEMO_ACCOUNT.email)).body.grants).toEqual(["*"]);
      const support = (await login(emailOf("support"))).body;
      expect(support.user.role).toBe("support");
      expect(support.grants).toEqual(["app:access", "orders:*"]);
    });

    it("no token on a non-public operation → 403, not 401", async () => {
      const res = await apiFetch<{ error: string }>("/admin/tag");
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("forbidden: listTags requires tags:read");
    });

    it("support: orders allowed, users denied", async () => {
      await signIn(emailOf("support"));
      expect((await apiFetch("/admin/order")).status).toBe(200);
      expect((await apiFetch("/users")).status).toBe(403);
      expect(
        (
          await apiFetch("/admin/user/role", {
            method: "POST",
            body: { target_user_id: "user-1", role: "guest" },
          })
        ).status
      ).toBe(403);
    });

    it("superadmin reaches every operation (AC-6 API side)", async () => {
      await signIn(DEMO_ACCOUNT.email);
      for (const { method, path } of operations.routes) {
        if (method !== "GET") continue;
        const res = await apiFetch(path);
        expect([path, res.status]).toEqual([path, 200]);
      }
    });

    it("unknown route → 404 with the legacy body, even for superadmin", async () => {
      await signIn(DEMO_ACCOUNT.email);
      const res = await apiFetch<{ error: string }>("/admin/nope");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("No mock handler for GET /admin/nope");
    });

    it("an unknown token gets no grants", async () => {
      setAuth({
        token: "forged",
        user: { user_id: "x", email: "x", name: "x", role: "superadmin" },
        grants: ["*"],
      });
      expect((await apiFetch("/admin/tag")).status).toBe(403);
    });
  });
});
