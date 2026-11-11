import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GrantsContext } from "@/shared/permission";
import { mountAsSuperadmin } from "@/test/sign-in";

import UserList from "../UserList";

import type { TGrant } from "@/shared/permission";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "zh" } }),
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNavigate: () => navigate,
}));
vi.mock("@/shared/ui/navbar/navbar", () => ({ Navbar: () => <nav /> }));

const renderList = (grants: readonly TGrant[]) =>
  render(
    <GrantsContext.Provider value={() => grants}>
      <QueryClientProvider client={new QueryClient()}>
        <UserList />
      </QueryClientProvider>
    </GrantsContext.Provider>
  );

describe("UserList 新增按鈕（user-create AC-7）", () => {
  beforeEach(async () => {
    navigate.mockClear();
    await mountAsSuperadmin();
  });

  it("with users:create → button shown; click goes to /users/create", () => {
    renderList(["users:read", "users:create"]);
    fireEvent.click(screen.getByRole("button", { name: "users.addUser" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/users/create" });
  });

  it("users:read only → no button", () => {
    renderList(["users:read"]);
    expect(screen.queryByRole("button", { name: "users.addUser" })).toBeNull();
  });
});
