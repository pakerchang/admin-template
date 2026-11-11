import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GrantsContext } from "@/shared/permission";
import { server } from "@/test/setup";
import { mountAsSuperadmin } from "@/test/sign-in";

import { users } from "../../mocks/seed";
import UserFormPage from "../UserForm";

import type { TGrant } from "@/shared/permission";

const route = vi.hoisted(() => ({ id: "", navigate: vi.fn() }));
const toastSpy = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "zh" } }),
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNavigate: () => route.navigate,
  useParams: () => ({ id: route.id }),
}));
vi.mock("@/shared/ui/navbar/navbar", () => ({
  Navbar: ({ children }: { children: React.ReactNode }) => (
    <nav>{children}</nav>
  ),
}));
vi.mock("@/shared/lib/use-toast", () => ({
  toast: toastSpy,
  useToast: () => ({ toast: toastSpy }),
}));

const writes: { method: string; path: string; body: unknown }[] = [];
const onRequest = async ({ request }: { request: Request }) => {
  if (request.method === "PUT")
    writes.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body: await request.clone().json(),
    });
};

const renderForm = (grants: readonly TGrant[] = ["*"]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <GrantsContext.Provider value={() => grants}>
      <QueryClientProvider client={client}>
        <UserFormPage />
      </QueryClientProvider>
    </GrantsContext.Provider>
  );
  return { invalidate };
};

describe("UserForm 編輯（user-form spec）", () => {
  beforeEach(async () => {
    writes.length = 0;
    toastSpy.mockClear();
    route.navigate.mockClear();
    await mountAsSuperadmin();
    server.events.on("request:start", onRequest);
  });
  afterEach(() => {
    server.events.removeListener("request:start", onRequest);
  });

  it("AC-1 載入：以 id 讀取使用者並填入表單", async () => {
    const target = users[4];
    route.id = target.user_id;
    renderForm();

    expect(await screen.findByDisplayValue(target.first_name)).toBeTruthy();
    expect(screen.getByDisplayValue(target.email)).toBeTruthy();
    expect(screen.getByDisplayValue(target.phone_number)).toBeTruthy();
  });

  it("AC-2 送出：PUT /users/{id} → 成功 toast → invalidate users → 回列表", async () => {
    const target = users[5];
    route.id = target.user_id;
    const { invalidate } = renderForm();

    const input = await screen.findByDisplayValue(target.first_name);
    fireEvent.change(input, { target: { value: "Franky" } });
    const submit = screen.getByRole("button", { name: "common.submit" });
    await waitFor(() => expect(submit).toHaveProperty("disabled", false));
    fireEvent.click(submit);

    await waitFor(() =>
      expect(route.navigate).toHaveBeenCalledWith({ to: "/users" })
    );
    expect(writes).toEqual([
      {
        method: "PUT",
        path: `/users/${target.user_id}`,
        body: expect.objectContaining({ first_name: "Franky" }),
      },
    ]);
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "success" })
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["users"] });
  });

  it("AC-3 id 不存在：錯誤 toast", async () => {
    route.id = "user-nope";
    renderForm();

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          description: "users.toast.get.error",
        })
      )
    );
  });

  it("AC-4 無 users:update：送出鈕 disabled", async () => {
    const target = users[1];
    route.id = target.user_id;
    renderForm(["users:read"]);

    await screen.findByDisplayValue(target.first_name);
    fireEvent.change(screen.getByDisplayValue(target.first_name), {
      target: { value: "Bobby" },
    });
    expect(
      screen.getByRole("button", { name: "common.submit" })
    ).toHaveProperty("disabled", true);
  });
});
