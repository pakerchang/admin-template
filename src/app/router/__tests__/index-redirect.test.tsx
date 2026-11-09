import { RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeApp, routerAt } from "@/app/__tests__/fixture";

import type { TGrant } from "@/shared/permission";

const at = (grants: TGrant[]) =>
  routerAt(makeApp({ getGrants: () => grants }), "/");

describe("'/' index redirect (AC-3, R9)", () => {
  it("superadmin-like grants land on the first nav item", async () => {
    const router = at(["*"]);
    await router.load();
    expect(router.state.location.pathname).toBe("/customers");
  });

  it("skips nav items the grants cannot see", async () => {
    const router = at(["orders:read", "tags:read"]);
    await router.load();
    expect(router.state.location.pathname).toBe("/tags");
  });

  it("renders shell.Forbidden inside the protected layout when no nav is visible", async () => {
    const router = at([]);
    render(<RouterProvider router={router} />);
    const forbidden = await screen.findByTestId("forbidden");
    expect(screen.getByTestId("protected-layout")).toContainElement(forbidden);
    expect(router.state.location.pathname).toBe("/");
  });
});
