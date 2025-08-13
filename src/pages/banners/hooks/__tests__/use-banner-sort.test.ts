import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useBannerSort } from "../use-banner-sort";

import type { TBanner } from "@/services/contracts/banner";

/**
 * Banner 排序功能測試
 *
 * 測試範圍：
 * 1. 基本排序功能：重新排序、提升、降級
 * 2. 狀態管理：操作鎖定、錯誤處理、狀態恢復
 * 3. 節流機制：拖拽排序的延遲執行
 * 4. 業務邏輯：sort_order 計算、遞補機制
 * 5. 用戶體驗：操作衝突檢測、UI 狀態反饋
 */

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock updateBanner mutation
const mockMutateAsync = vi.fn();
vi.mock("../use-banner", () => ({
  useUpdateBanner: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// 測試用的 Banner 資料
const createMockBanner = (
  id: string,
  sortOrder: number,
  isActive = true
): TBanner => ({
  banner_id: id,
  title: `Banner ${id}`,
  desktop_image_url: {
    file_name: `d_banner_${id}.jpg`,
    file_url: `https://example.com/desktop_${id}.jpg`,
  },
  mobile_image_url: {
    file_name: `m_banner_${id}.jpg`,
    file_url: `https://example.com/mobile_${id}.jpg`,
  },
  redirect_url: `https://example.com/${id}`,
  sort_order: sortOrder,
  banner_status: isActive ? "active" : "inactive",
  created_at: new Date(
    `2024-01-${id.padStart(2, "0")}T00:00:00Z`
  ).toISOString(),
  updated_at: new Date(
    `2024-01-${id.padStart(2, "0")}T00:00:00Z`
  ).toISOString(),
});

describe("useBannerSort", () => {
  // 測試資料設定
  const mockActiveBanners: TBanner[] = [
    createMockBanner("1", 1),
    createMockBanner("2", 2),
    createMockBanner("3", 3),
  ];

  const mockInactiveBanners: TBanner[] = [
    createMockBanner("4", 9, false),
    createMockBanner("5", 9, false),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockMutateAsync.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("初始化狀態", () => {
    it("應該正確初始化排序狀態", () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      expect(result.current.sortedActiveBanners).toHaveLength(3);
      expect(result.current.sortedActiveBanners[0].banner_id).toBe("1");
      expect(result.current.sortedActiveBanners[1].banner_id).toBe("2");
      expect(result.current.sortedActiveBanners[2].banner_id).toBe("3");
    });

    it("應該正確設定初始操作狀態", () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      expect(result.current.isPromoting).toBe(null);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isReordering).toBe(false);
      expect(result.current.isDemoting).toBe(false);
    });

    it("應該處理空的 activeBanners 陣列", () => {
      const { result } = renderHook(() =>
        useBannerSort([], mockInactiveBanners)
      );

      expect(result.current.sortedActiveBanners).toHaveLength(0);
    });
  });

  describe("拖拽重新排序功能", () => {
    it("應該立即更新 UI 狀態", () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      const newOrder = [
        mockActiveBanners[2],
        mockActiveBanners[0],
        mockActiveBanners[1],
      ];

      act(() => {
        result.current.handleReorder(newOrder);
      });

      // UI 應該立即更新
      expect(result.current.sortedActiveBanners[0].banner_id).toBe("3");
      expect(result.current.sortedActiveBanners[1].banner_id).toBe("1");
      expect(result.current.sortedActiveBanners[2].banner_id).toBe("2");
      expect(result.current.isReordering).toBe(true);
    });

    it("應該在 500ms 後執行 API 調用", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      const newOrder = [
        mockActiveBanners[2],
        mockActiveBanners[0],
        mockActiveBanners[1],
      ];

      act(() => {
        result.current.handleReorder(newOrder);
      });

      // 立即檢查 - API 尚未調用
      expect(mockMutateAsync).not.toHaveBeenCalled();

      // 推進 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(3);
      });

      // 檢查 sort_order 更新
      expect(mockMutateAsync).toHaveBeenCalledWith({
        ...mockActiveBanners[2],
        sort_order: 1,
      });
      expect(mockMutateAsync).toHaveBeenCalledWith({
        ...mockActiveBanners[0],
        sort_order: 2,
      });
      expect(mockMutateAsync).toHaveBeenCalledWith({
        ...mockActiveBanners[1],
        sort_order: 3,
      });
    });

    it("應該在連續拖拽時重設計時器", () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      const firstOrder = [
        mockActiveBanners[1],
        mockActiveBanners[0],
        mockActiveBanners[2],
      ];
      const secondOrder = [
        mockActiveBanners[2],
        mockActiveBanners[0],
        mockActiveBanners[1],
      ];

      act(() => {
        result.current.handleReorder(firstOrder);
      });

      // 等待 250ms
      act(() => {
        vi.advanceTimersByTime(250);
      });

      act(() => {
        result.current.handleReorder(secondOrder);
      });

      // 再等待 250ms (總共 500ms，但第二次重設了計時器)
      act(() => {
        vi.advanceTimersByTime(250);
      });

      // API 不應該被調用 (因為計時器被重設)
      expect(mockMutateAsync).not.toHaveBeenCalled();

      // 再等待 250ms (從第二次拖拽算起滿 500ms)
      act(() => {
        vi.advanceTimersByTime(250);
      });

      // 現在應該調用 API
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    it("應該在操作進行中拒絕新的排序請求", () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      // 模擬操作正在進行
      act(() => {
        result.current.promoteToActive(mockInactiveBanners[0]);
      });

      const newOrder = [
        mockActiveBanners[2],
        mockActiveBanners[0],
        mockActiveBanners[1],
      ];

      act(() => {
        result.current.handleReorder(newOrder);
      });

      // 排序應該被拒絕，UI 不應該更新
      expect(result.current.sortedActiveBanners[0].banner_id).toBe("1");
    });
  });

  describe("手動完成拖拽功能", () => {
    it("應該立即執行待處理的排序", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      const newOrder = [
        mockActiveBanners[2],
        mockActiveBanners[0],
        mockActiveBanners[1],
      ];

      act(() => {
        result.current.handleReorder(newOrder);
      });

      // 立即完成拖拽
      act(() => {
        result.current.finalizeDragReorder();
      });

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(3);
      });
    });

    it("應該清除延遲執行的計時器", () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      const newOrder = [
        mockActiveBanners[2],
        mockActiveBanners[0],
        mockActiveBanners[1],
      ];

      act(() => {
        result.current.handleReorder(newOrder);
      });

      act(() => {
        result.current.finalizeDragReorder();
      });

      // 推進 500ms - 應該不會觸發額外的 API 調用
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // API 應該只被調用一次 (在 finalizeDragReorder 時)
      expect(mockMutateAsync).toHaveBeenCalledTimes(3);
    });
  });

  describe("提升為 Active 功能", () => {
    it("應該正確計算新的 sort_order", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      await act(async () => {
        await result.current.promoteToActive(mockInactiveBanners[0]);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        ...mockInactiveBanners[0],
        banner_status: "active",
        sort_order: 4, // 3 個 active banners + 1
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "toast.banner.promoteToActive.success",
        description: "toast.banner.promoteToActive.success",
        variant: "success",
      });
    });

    it("應該設定正確的操作狀態", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      const promiseResolve = vi.fn();
      mockMutateAsync.mockImplementation(() => new Promise(promiseResolve));

      act(() => {
        result.current.promoteToActive(mockInactiveBanners[0]);
      });

      expect(result.current.isPromoting).toBe(mockInactiveBanners[0].banner_id);

      // 完成操作
      act(() => {
        promiseResolve({ success: true });
      });

      await waitFor(() => {
        expect(result.current.isPromoting).toBe(null);
      });
    });

    it("應該處理 API 錯誤", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      mockMutateAsync.mockRejectedValue(new Error("API Error"));

      await act(async () => {
        const success = await result.current.promoteToActive(
          mockInactiveBanners[0]
        );
        expect(success).toBe(false);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "toast.banner.promoteToActive.error",
        description: "toast.banner.promoteToActive.error",
        variant: "destructive",
      });
    });

    it("應該在有其他操作進行時拒絕提升請求", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      // 開始第一個操作
      act(() => {
        result.current.promoteToActive(mockInactiveBanners[0]);
      });

      // 嘗試第二個操作
      await act(async () => {
        const success = await result.current.promoteToActive(
          mockInactiveBanners[1]
        );
        expect(success).toBe(false);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "toast.banner.operationConflict.title",
        description: "toast.banner.operationConflict.promoteDescription",
        variant: "destructive",
      });
    });
  });

  describe("移除 Active 狀態功能", () => {
    it("應該正確處理遞補邏輯", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      // 移除 sort_order = 2 的 banner
      const targetBanner = mockActiveBanners[1]; // sort_order = 2

      await act(async () => {
        await result.current.removeFromActive(targetBanner);
      });

      expect(mockMutateAsync).toHaveBeenCalledTimes(2);

      // 第一個調用：設定目標 banner 為 inactive
      expect(mockMutateAsync).toHaveBeenCalledWith({
        ...targetBanner,
        banner_status: "inactive",
        sort_order: 9,
      });

      // 第二個調用：遞補 sort_order = 3 的 banner
      expect(mockMutateAsync).toHaveBeenCalledWith({
        ...mockActiveBanners[2],
        sort_order: 2, // 3 - 1 = 2
      });
    });

    it("應該正確處理移除第一個 banner", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      // 移除 sort_order = 1 的 banner
      const targetBanner = mockActiveBanners[0];

      await act(async () => {
        await result.current.removeFromActive(targetBanner);
      });

      expect(mockMutateAsync).toHaveBeenCalledTimes(3);

      // 檢查遞補邏輯：2 -> 1, 3 -> 2
      expect(mockMutateAsync).toHaveBeenCalledWith({
        ...mockActiveBanners[1],
        sort_order: 1,
      });
      expect(mockMutateAsync).toHaveBeenCalledWith({
        ...mockActiveBanners[2],
        sort_order: 2,
      });
    });

    it("應該處理移除失敗時的狀態恢復", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      mockMutateAsync.mockRejectedValue(new Error("API Error"));

      await act(async () => {
        const success = await result.current.removeFromActive(
          mockActiveBanners[1]
        );
        expect(success).toBe(false);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "toast.banner.removeFromActive.error",
        description: "toast.banner.removeFromActive.error",
        variant: "destructive",
      });

      // 檢查狀態是否恢復
      expect(result.current.sortedActiveBanners).toHaveLength(3);
      expect(result.current.sortedActiveBanners[0].banner_id).toBe("1");
    });
  });

  describe("排序錯誤處理", () => {
    it("應該在排序失敗時恢復原始狀態", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      mockMutateAsync.mockRejectedValue(new Error("API Error"));

      const newOrder = [
        mockActiveBanners[2],
        mockActiveBanners[0],
        mockActiveBanners[1],
      ];

      act(() => {
        result.current.handleReorder(newOrder);
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "toast.banner.reorder.error",
          description: "toast.banner.reorder.errorDescription",
          variant: "destructive",
        });
      });

      // 狀態應該恢復到原始順序
      expect(result.current.sortedActiveBanners[0].banner_id).toBe("1");
      expect(result.current.sortedActiveBanners[1].banner_id).toBe("2");
      expect(result.current.sortedActiveBanners[2].banner_id).toBe("3");
    });

    it("應該在錯誤後釋放操作鎖定", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      mockMutateAsync.mockRejectedValue(new Error("API Error"));

      const newOrder = [
        mockActiveBanners[2],
        mockActiveBanners[0],
        mockActiveBanners[1],
      ];

      act(() => {
        result.current.handleReorder(newOrder);
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.isReordering).toBe(false);
      });

      // 應該可以執行新的操作
      await act(async () => {
        const success = await result.current.promoteToActive(
          mockInactiveBanners[0]
        );
        expect(success).toBe(false); // 因為 API 還是會失敗，但不是因為操作鎖定
      });
    });
  });

  describe("排序邏輯測試", () => {
    it("應該按 sort_order 排序，相同時按 created_at 排序", () => {
      const unsortedBanners: TBanner[] = [
        createMockBanner("1", 2),
        createMockBanner("2", 1),
        createMockBanner("3", 1), // 相同 sort_order，但 created_at 較晚
      ];

      const { result } = renderHook(() =>
        useBannerSort(unsortedBanners, mockInactiveBanners)
      );

      expect(result.current.sortedActiveBanners[0].banner_id).toBe("2"); // sort_order = 1, created_at 較早
      expect(result.current.sortedActiveBanners[1].banner_id).toBe("3"); // sort_order = 1, created_at 較晚
      expect(result.current.sortedActiveBanners[2].banner_id).toBe("1"); // sort_order = 2
    });

    it("應該只更新實際需要變更的 banner", async () => {
      const { result } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      // 只交換前兩個 banner
      const newOrder = [
        mockActiveBanners[1],
        mockActiveBanners[0],
        mockActiveBanners[2],
      ];

      act(() => {
        result.current.handleReorder(newOrder);
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(2); // 只更新前兩個
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        ...mockActiveBanners[1],
        sort_order: 1,
      });
      expect(mockMutateAsync).toHaveBeenCalledWith({
        ...mockActiveBanners[0],
        sort_order: 2,
      });
      // 第三個 banner 不應該被更新，因為 sort_order 沒變
    });
  });

  describe("清理功能", () => {
    it("應該在組件卸載時清理計時器", () => {
      const { result, unmount } = renderHook(() =>
        useBannerSort(mockActiveBanners, mockInactiveBanners)
      );

      const newOrder = [
        mockActiveBanners[2],
        mockActiveBanners[0],
        mockActiveBanners[1],
      ];

      act(() => {
        result.current.handleReorder(newOrder);
      });

      unmount();

      // 推進計時器不應該觸發 API 調用
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });
});
