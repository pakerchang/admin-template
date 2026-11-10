import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { ApiError } from "@/shared/api/fetcher";

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

const mockFetcher = vi.fn();
vi.mock("@/shared/api/fetcher", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  fetcher: (...args: unknown[]) => mockFetcher(...args),
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

  it("經 orval client（mutator）取得所有產品", async () => {
    const body = { code: 200, msg: "success", error: "", data: products };
    mockFetcher.mockResolvedValue(body);

    const { result } = renderHook(() => useGetAllProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetcher).toHaveBeenCalledWith(
      "/admin/products",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.current.data).toEqual(body);
  });

  it("API 非 200 時 toast 錯誤並進入 error 狀態", async () => {
    mockFetcher.mockRejectedValue(new ApiError(500, null));

    const { result } = renderHook(() => useGetAllProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(mockToast).toHaveBeenCalledWith({
      title: "common.error",
      description: "product.toast.get.error",
      variant: "destructive",
    });
  });

  it("網路錯誤時進入 error 狀態", async () => {
    mockFetcher.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGetAllProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error("Network error"));
  });
});
