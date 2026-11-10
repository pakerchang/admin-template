import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GrantsContext } from "@/shared/permission";
import { server } from "@/test/setup";
import { mountAsSuperadmin } from "@/test/sign-in";

import { banners } from "../../mocks/seed";
import BannerList from "../BannerList";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "zh" } }),
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNavigate: () => vi.fn(),
}));
vi.mock("@/shared/ui/navbar/navbar", () => ({
  Navbar: ({ children }: { children: React.ReactNode }) => (
    <nav>{children}</nav>
  ),
}));

const deleteBodies: unknown[] = [];
const onRequest = async ({ request }: { request: Request }) => {
  if (
    request.method === "DELETE" &&
    new URL(request.url).pathname === "/admin/banners"
  )
    deleteBodies.push(await request.clone().json());
};

describe("BannerList 刪除（P2）", () => {
  beforeEach(async () => {
    deleteBodies.length = 0;
    await mountAsSuperadmin();
    server.events.on("request:start", onRequest);
  });
  afterEach(() => {
    server.events.removeListener("request:start", onRequest);
  });

  it("確認後打 DELETE 並從列表移除該筆", async () => {
    // seed 第 4 筆是 inactive，位於下方列表
    const target = banners[3];
    render(
      <GrantsContext.Provider value={() => ["*"]}>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <BannerList />
        </QueryClientProvider>
      </GrantsContext.Provider>
    );

    const img = await screen.findByAltText(target.title);
    const card = img.parentElement as HTMLElement;
    const deleteButton = card.querySelector<HTMLButtonElement>(
      'button[aria-label="common.delete"]'
    );
    expect(deleteButton).not.toBeNull();
    fireEvent.click(deleteButton!);

    fireEvent.click(
      await screen.findByRole("button", {
        name: /pages\.banner\.confirmDelete/,
      })
    );

    await waitFor(() =>
      expect(deleteBodies).toEqual([{ banner_id: target.banner_id }])
    );
    await waitFor(() =>
      expect(screen.queryByAltText(target.title)).not.toBeInTheDocument()
    );
  });
});
