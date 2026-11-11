import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import { apiBaseUrl } from "@/shared/api/fetcher";
import coreEn from "@/shared/i18n/locales/en.json";
import coreZh from "@/shared/i18n/locales/zh.json";
import { createTestI18n } from "@/test/i18n";
import { server } from "@/test/setup";

import { useCreateStaff } from "../use-staff";

import type { ReactNode } from "react";

/** 硬寫中文 i18n 化 AC-5：建立員工失敗時 toast description 走 throw → error.message，依語系顯示 */
const toastSpy = vi.hoisted(() => vi.fn());
vi.mock("@/shared/lib/use-toast", () => ({
  toast: toastSpy,
  useToast: () => ({ toast: toastSpy }),
}));

const { registry } = makeApp().build();
const dicts = {
  zh: { ...coreZh, ...registry.i18n.zh },
  en: { ...coreEn, ...registry.i18n.en },
};

const runCreateFailure = async (lng: "zh" | "en") => {
  server.use(
    http.post(`${apiBaseUrl}/admin/staff`, () =>
      HttpResponse.json({ message: "boom" }, { status: 500 })
    )
  );
  const { I18nWrapper } = createTestI18n(dicts, lng);
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nWrapper>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </I18nWrapper>
  );
  const { result } = renderHook(() => useCreateStaff(), { wrapper });
  act(() => {
    result.current.mutate({
      account: "a",
      email: "a@example.com",
      password: "Passw0rd!",
      first_name: "a",
      last_name: "b",
      role: "admin",
    } as Parameters<typeof result.current.mutate>[0]);
  });
  await waitFor(() => expect(result.current.isError).toBe(true));
  return toastSpy.mock.calls.at(-1)?.[0] as { description: string };
};

describe("useCreateStaff 失敗 toast（AC-5）", () => {
  beforeEach(() => toastSpy.mockClear());

  it("en：Staff creation failed", async () => {
    expect((await runCreateFailure("en")).description).toBe(
      "Staff creation failed"
    );
  });

  it("zh：與原硬寫文字逐字相同", async () => {
    expect((await runCreateFailure("zh")).description).toBe("創建員工失敗");
  });
});
