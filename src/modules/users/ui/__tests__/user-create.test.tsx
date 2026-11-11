import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { errorResponse } from "@/shared/api/mock-db";
import { GrantsContext } from "@/shared/permission";
import { server } from "@/test/setup";
import { mountAsSuperadmin } from "@/test/sign-in";

import { users } from "../../mocks/seed";
import UserFormPage from "../UserForm";

import type { TGrant } from "@/shared/permission";

const route = vi.hoisted(() => ({ navigate: vi.fn() }));
const toastSpy = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "zh" } }),
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNavigate: () => route.navigate,
  useParams: () => ({}),
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

const requests: { method: string; path: string; body?: unknown }[] = [];
const onRequest = async ({ request }: { request: Request }) => {
  requests.push({
    method: request.method,
    path: new URL(request.url).pathname,
    body: request.method === "GET" ? undefined : await request.clone().json(),
  });
};

const VALID = {
  first_name: "New",
  last_name: "User",
  email: "create-ui@example.com",
  phone_number: "0912345678",
  address: "Somewhere",
};

const field = (name: string) =>
  document.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
const submit = () => screen.getByRole("button", { name: "common.submit" });

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

const fill = (values: Record<string, string>) => {
  for (const [name, value] of Object.entries(values))
    fireEvent.change(field(name), { target: { value } });
};

describe("UserForm 新增模式（user-create AC-6）", () => {
  beforeEach(async () => {
    requests.length = 0;
    toastSpy.mockClear();
    route.navigate.mockClear();
    await mountAsSuperadmin();
    server.events.on("request:start", onRequest);
  });
  afterEach(() => {
    server.events.removeListener("request:start", onRequest);
  });

  it("(a) no GET /users/{id}; empty fields; create title", async () => {
    renderForm();
    expect(screen.getByText("users.userForm.createTitle")).toBeTruthy();
    for (const name of [...Object.keys(VALID), "remark"])
      expect(field(name).value).toBe("");
    await new Promise((r) => setTimeout(r, 50));
    expect(requests.filter((r) => r.method === "GET")).toEqual([]);
  });

  it("(b) submit → POST /users → invalidate users → success toast → /users", async () => {
    const { invalidate } = renderForm();
    fill(VALID);
    await waitFor(() => expect(submit()).toHaveProperty("disabled", false));
    fireEvent.click(submit());

    await waitFor(() =>
      expect(route.navigate).toHaveBeenCalledWith({ to: "/users" })
    );
    expect(requests).toEqual([
      { method: "POST", path: "/users", body: { ...VALID, remark: "" } },
    ]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["users"] });
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "success",
        description: "users.toast.create.success",
      })
    );
  });

  it.each([
    [
      "400",
      () => server.use(http.post("*/users", () => errorResponse(400, "bad"))),
      VALID.email,
    ],
    ["409 (duplicate email)", () => {}, users[1].email.toUpperCase()],
  ])(
    "(c) %s → create error toast, stays, inputs kept",
    async (_, arrange, email) => {
      arrange();
      renderForm();
      fill({ ...VALID, email });
      await waitFor(() => expect(submit()).toHaveProperty("disabled", false));
      fireEvent.click(submit());

      await waitFor(() =>
        expect(toastSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            description: "users.toast.create.error",
          })
        )
      );
      expect(route.navigate).not.toHaveBeenCalled();
      expect(field("email").value).toBe(email);
      expect(field("first_name").value).toBe(VALID.first_name);
    }
  );

  it("(d) without users:create → submit disabled", async () => {
    renderForm(["users:read", "users:update"]);
    fill(VALID);
    await waitFor(() => expect(field("address").value).toBe(VALID.address));
    expect(submit()).toHaveProperty("disabled", true);
  });

  it("(e) no role field", () => {
    renderForm();
    expect(document.querySelector('[name="role"]')).toBeNull();
  });
});
