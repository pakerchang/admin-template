import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import i18next from "i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";

import "@/shared/i18n/i18n";
import { SidebarProvider } from "@/shared/ui/sidebar";

import { AppSidebar } from "../app-sidebar";

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));

// shadcn sidebar 的 useIsMobile 需要 matchMedia（jsdom 沒有）
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

describe("AppSidebar 標題（docs/specs/app-title.spec.md AC-a）", () => {
  it.each([
    ["zh", "後台管理範本"],
    ["en", "Admin Template"],
  ])("%s → %s", async (lng, title) => {
    await i18next.changeLanguage(lng);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </QueryClientProvider>
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(title);
  });
});
