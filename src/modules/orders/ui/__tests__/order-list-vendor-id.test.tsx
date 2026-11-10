import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GrantsContext } from "@/shared/permission";
import { mountAsSuperadmin } from "@/test/sign-in";

import { orders } from "../../mocks/seed";
import OrderList from "../OrderList";

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

describe("OrderList 代理商編號欄（P1）", () => {
  beforeEach(async () => {
    await mountAsSuperadmin();
  });

  it("顯示契約欄位 vendor_id 的值", async () => {
    render(
      <GrantsContext.Provider value={() => ["*"]}>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <OrderList />
        </QueryClientProvider>
      </GrantsContext.Provider>
    );

    // order_id 先出現代表列表已載入；同一列的代理商編號格要有 vendor_id
    const orderCell = await screen.findByText(orders[0].order_id);
    const row = orderCell.closest("tr");
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent(orders[0].vendor_id);
  });
});
