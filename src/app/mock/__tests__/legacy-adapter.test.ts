import { getResponse } from "msw";
import { describe, expect, it } from "vitest";

import { legacyOperations, toHttpHandlers } from "@/app/mock/legacy-adapter";
import { DEMO_ACCOUNT } from "@/services/mock/data";
import { handlers } from "@/services/mock/handlers";

const BASE = "http://mock-api.test";

describe("toHttpHandlers", () => {
  it("covers every METHOD path of the legacy handler table", () => {
    const routes = toHttpHandlers(handlers, { baseUrl: BASE }).map(
      (h) => `${h.info.method} ${String(h.info.path)}`
    );

    expect(routes).toEqual(
      Object.keys(handlers).map((key) => key.replace(" ", ` ${BASE}`))
    );
    expect(routes.sort()).toMatchSnapshot();
  });

  it("resolves base URL the same way apiFetch does (trailing slash)", async () => {
    const all = toHttpHandlers(handlers, { baseUrl: `${BASE}/` });
    const res = await getResponse(
      all,
      new Request(new URL("/api/auth/login", `${BASE}/`), {
        method: "POST",
        body: JSON.stringify(DEMO_ACCOUNT),
      })
    );
    expect(res?.status).toBe(200);
  });
});

describe("legacyOperations (M3 過渡表，R28)", () => {
  const ops = legacyOperations(handlers);

  it("one route per legacy METHOD path, every permission explicitly public", () => {
    expect(ops.routes.map((r) => `${r.method} ${r.path}`)).toEqual(
      Object.keys(handlers)
    );
    expect(Object.keys(ops.permissions)).toEqual(
      ops.routes.map((r) => r.operationId)
    );
    expect(new Set(Object.values(ops.permissions))).toEqual(
      new Set(["public"])
    );
  });

  it("keeps the four existing API prefixes unchanged (R24)", () => {
    const prefixes = new Set(ops.routes.map((r) => r.path.split("/")[1]));
    expect(prefixes).toEqual(new Set(["api", "users", "user", "admin"]));
  });
});
