import { getResponse } from "msw";
import { describe, expect, it } from "vitest";

import { mockHandlers } from "@/app/mock";
import { createPermissionGuard } from "@/app/mock/guard";
import { apiBaseUrl } from "@/services/api-client";

const json = { "Content-Type": "application/json" };

describe("M3 guard mounting (AC-6: legacy all-public table)", () => {
  const [guard] = mockHandlers;
  const req = (url: string, method = "GET") =>
    new Request(url, { method, headers: json });

  it("test env uses a dedicated mock origin", () => {
    expect(apiBaseUrl).toBe("http://mock-api.test");
  });

  it("passes through requests outside apiBaseUrl", async () => {
    expect(
      await getResponse([guard], req("http://cdn.test/x"))
    ).toBeUndefined();
    expect(
      await getResponse([guard], new Request("http://localhost:3000/users"))
    ).toBeUndefined();
    // 前綴補 "/"：相似 origin 不算 API
    expect(
      await getResponse([guard], req("http://mock-api.testing/admin/tag"))
    ).toBeUndefined();
  });

  it("lets in-table operations through to the legacy handler", async () => {
    expect(
      await getResponse([guard], req(`${apiBaseUrl}/admin/tag`))
    ).toBeUndefined();
    const res = await getResponse(mockHandlers, req(`${apiBaseUrl}/admin/tag`));
    expect(res?.status).toBe(200);
  });

  it("404s paths and methods outside the table with the legacy body", async () => {
    const res = await getResponse(mockHandlers, req(`${apiBaseUrl}/nope`));
    expect(res?.status).toBe(404);
    expect(await res?.json()).toEqual({
      error: "No mock handler for GET /nope",
    });

    const wrongMethod = await getResponse(
      mockHandlers,
      req(`${apiBaseUrl}/users`, "DELETE")
    );
    expect(wrongMethod?.status).toBe(404);
  });
});

describe("createPermissionGuard decisions (R22)", () => {
  const guard = (grants: string[], permissions = {}) =>
    createPermissionGuard({
      apiBaseUrl: "http://api.test/",
      routes: [
        { method: "PUT", path: "/admin/users/:id", operationId: "updateUser" },
        { method: "GET", path: "/admin/x", operationId: "undeclared" },
      ],
      permissions: { updateUser: "users:update", ...permissions },
      getGrants: () => grants as never,
    });
  const put = new Request("http://api.test/admin/users/42", { method: "PUT" });

  it("403 without the grant, passes with it (path params matched)", async () => {
    expect((await getResponse([guard([])], put))?.status).toBe(403);
    expect(await getResponse([guard(["users:*"])], put)).toBeUndefined();
  });

  it("403 for a route without a permission declaration", async () => {
    const res = await getResponse(
      [guard(["*"])],
      new Request("http://api.test/admin/x")
    );
    expect(res?.status).toBe(403);
    expect((await res?.json()).error).toMatch(
      /undeclared has no permission declaration/
    );
  });
});
