import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mountAsSuperadmin } from "@/test/sign-in";

import { useCreateUser, useGetUserList, useUpdateUser } from "../use-user";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/shared/lib/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// 重現瀏覽器 F1：列表頁 unmount → 在新增／編輯頁 mutate → 導回列表重新 mount
const PAGE = { page: 1, limit: 100 };

const setup = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const list = renderHook(() => useGetUserList(PAGE), { wrapper });
  await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
  list.unmount();
  return wrapper;
};

describe("useGetUserList 在別頁 mutate 後重新 mount", () => {
  beforeEach(mountAsSuperadmin);

  it("create 後回列表會重新請求並顯示新使用者", async () => {
    const wrapper = await setup();

    const create = renderHook(() => useCreateUser(), { wrapper });
    await create.result.current.mutateAsync({
      email: "refetch-create@example.com",
      first_name: "Fresh",
      last_name: "User",
      phone_number: "0912345678",
      address: "Somewhere",
      remark: "",
    });
    create.unmount();

    const list = renderHook(() => useGetUserList(PAGE), { wrapper });
    await waitFor(() =>
      expect(
        list.result.current.data?.data?.some(
          (u) => u.email === "refetch-create@example.com"
        )
      ).toBe(true)
    );
  });

  it("update 後回列表會重新請求並顯示新資料", async () => {
    const wrapper = await setup();

    const update = renderHook(() => useUpdateUser(), { wrapper });
    await update.result.current.mutateAsync({
      user_id: "user-2",
      email: "bob@example.com",
      first_name: "Robert",
      last_name: "Lee",
      phone_number: "0912345678",
      address: "Somewhere",
      remark: "",
    });
    update.unmount();

    const list = renderHook(() => useGetUserList(PAGE), { wrapper });
    await waitFor(() =>
      expect(
        list.result.current.data?.data?.find((u) => u.user_id === "user-2")
          ?.first_name
      ).toBe("Robert")
    );
  });
});
