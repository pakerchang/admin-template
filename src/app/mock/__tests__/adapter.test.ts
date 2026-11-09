import { getResponse } from "msw";
import { describe, expect, it } from "vitest";

import { toHttpHandlers, toNotFoundHandlers } from "@/app/mock/adapter";
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

describe("toNotFoundHandlers", () => {
  const notFound = toNotFoundHandlers({ baseUrl: BASE });

  it("404s any apiFetch-style request on the base origin", async () => {
    const res = await getResponse(
      notFound,
      new Request(`${BASE}/nope`, {
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res?.status).toBe(404);
  });

  it("passes through non-API requests (vite assets / HMR)", async () => {
    const res = await getResponse(
      notFound,
      new Request(`${BASE}/src/main.tsx`)
    );
    expect(res).toBeUndefined();
  });
});
