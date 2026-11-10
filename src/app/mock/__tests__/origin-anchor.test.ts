import { getResponse, isPassthroughResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import { operations } from "@/app/operations.gen";
import { DEMO_ACCOUNT } from "@/modules/auth/mocks/seed";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { clearAuth, setAuth } from "@/shared/api/session";
import { apiFetch } from "@/test/api-fetch";
import { server } from "@/test/setup";

import type { TAuthSession } from "@/shared/api/session";

// msw-origin-anchor spec：module handler（orval 產物 / 手寫）以 "*/path" 註冊，kernel 圍欄讓它們只吃 apiBaseUrl origin
const appOrigin = window.location.origin;
const mockHandlers = makeApp().build().registry.mockHandlers;

const intercepted = async (method: string, url: string) => {
  const res = await getResponse(mockHandlers, new Request(url, { method }));
  return res !== undefined && !isPassthroughResponse(res);
};

describe("MSW handlers are anchored to the apiBaseUrl origin", () => {
  it("test env: app origin differs from apiBaseUrl origin", () => {
    expect(new URL(apiBaseUrl).origin).not.toBe(appOrigin);
  });

  it("AC-1: app-origin GET /users and POST /admin/images are not intercepted", async () => {
    expect(await intercepted("GET", `${appOrigin}/users`)).toBe(false);
    expect(await intercepted("POST", `${appOrigin}/admin/images`)).toBe(false);
  });

  it("AC-1: no operation route is intercepted on the app origin", async () => {
    const hits: string[] = [];
    for (const { method, path } of operations.routes) {
      const url = appOrigin + path.replace(/:[^/]+/g, "x");
      if (await intercepted(method.toUpperCase(), url))
        hits.push(`${method} ${path}`);
    }
    expect(hits).toEqual([]);
  });

  it("guard stays first", () => {
    expect(String(mockHandlers[0].info.path)).toBe("*");
  });

  describe("AC-2: apiBaseUrl origin still mocked and guarded", () => {
    beforeEach(() => {
      clearAuth();
      server.resetHandlers(...mockHandlers);
    });

    it("GET /users without token → 403", async () => {
      expect((await apiFetch("/users")).status).toBe(403);
    });

    it("GET /users as superadmin → 200", async () => {
      const login = await apiFetch<TAuthSession>("/api/auth/login", {
        method: "POST",
        body: { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password },
      });
      setAuth(login.body);
      expect((await apiFetch("/users")).status).toBe(200);
    });
  });
});
