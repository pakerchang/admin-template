import { describe, expect, it } from "vitest";

import { toHttpHandlers } from "@/app/mock/adapter";
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
});
