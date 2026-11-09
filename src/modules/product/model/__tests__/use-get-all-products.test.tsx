import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { products } from "../../mocks/seed";
import { useGetAllProducts } from "../use-product";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockToast = vi.fn();
vi.mock("@/shared/lib/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const mockApiFetch = vi.fn();
vi.mock("@/shared/api/fetcher", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

describe("useGetAllProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("透過 apiFetch 取得所有產品", async () => {
    const body = { code: 200, msg: "success", error: "", data: products };
    mockApiFetch.mockResolvedValue({ status: 200, body });

    const { result } = renderHook(() => useGetAllProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiFetch).toHaveBeenCalledWith("/admin/products");
    expect(result.current.data).toEqual(body);
  });

  it("API 非 200 時 toast 錯誤並進入 error 狀態", async () => {
    mockApiFetch.mockResolvedValue({ status: 500, body: null });

    const { result } = renderHook(() => useGetAllProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(mockToast).toHaveBeenCalledWith({
      title: "common.error",
      description: "toast.product.get.error",
      variant: "destructive",
    });
  });

  it("網路錯誤時進入 error 狀態", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGetAllProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error("Network error"));
  });
});
