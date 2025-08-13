import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import BannerForm from "../../BannerForm";

/**
 * Banner 表單組件測試
 * 主要測試以下功能：
 * 1. 表單渲染：確保所有必要的表單欄位都正確渲染
 * 2. 表單驗證：確保表單在驗證失敗時禁用提交按鈕
 * 3. 多語系：確保所有文字都正確使用翻譯 key
 */

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock react-hook-form
const mockUseForm = vi.fn(() => ({
  register: vi.fn(),
  handleSubmit: vi.fn(),
  formState: {
    errors: {},
    isValid: true,
    isDirty: false,
    isSubmitting: false,
    isSubmitted: false,
    isSubmitSuccessful: false,
    isLoading: false,
    submitCount: 0,
    dirtyFields: {},
    touchedFields: {},
  },
  setValue: vi.fn(),
  watch: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("react-hook-form", async () => {
  const actual = await vi.importActual("react-hook-form");
  return {
    ...actual,
    useForm: () => mockUseForm(),
  };
});

// Mock @tanstack/react-router
vi.mock("@tanstack/react-router", () => ({
  useMatchRoute: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({
    pathname: "/banners/create",
    search: "",
    hash: "",
  }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock sidebar
vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => ({
    state: "expanded",
    open: true,
    setOpen: vi.fn(),
    openMobile: false,
    setOpenMobile: vi.fn(),
    isMobile: false,
    toggleSidebar: vi.fn(),
  }),
  SidebarTrigger: () => null,
  SidebarProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock custom hooks
vi.mock("../../hooks/use-banner", () => ({
  useCreateBanner: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateBanner: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useGetBanner: () => ({
    data: null,
    isLoading: false,
  }),
  useCreateBannerSchema: () => ({
    parse: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-img-upload", () => ({
  useImgUpload: () => ({
    upload: vi.fn(),
    removeImage: vi.fn(),
    isUploading: false,
    uploadedImages: [],
  }),
}));

describe("BannerForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseForm.mockImplementation(() => ({
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: {
        errors: {},
        isValid: true,
        isDirty: false,
        isSubmitting: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isLoading: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
      },
      setValue: vi.fn(),
      watch: vi.fn(),
      reset: vi.fn(),
    }));
  });

  /**
   * 測試表單標題渲染
   * 確保頁面標題正確顯示，並使用正確的翻譯 key
   */
  it("應該正確渲染表單標題", () => {
    render(<BannerForm />);
    expect(
      screen.getByRole("heading", { name: "pages.banner.bannerCreate.title" })
    ).toBeInTheDocument();
  });

  /**
   * 測試表單欄位渲染
   * 確保所有必要的表單欄位都存在且可見：
   * 1. 標題輸入框
   * 2. 重定向 URL 輸入框
   * 3. 狀態選擇器
   * 4. 桌面版圖片上傳區
   * 5. 手機版圖片上傳區
   */
  it("應該包含所有必要的表單欄位", () => {
    render(<BannerForm />);

    // 檢查標題欄位
    expect(
      screen.getByLabelText("pages.banner.bannerCreate.title")
    ).toBeInTheDocument();

    // 檢查重定向 URL 欄位
    expect(
      screen.getByLabelText("pages.banner.bannerCreate.redirectUrl")
    ).toBeInTheDocument();

    // 檢查狀態選擇器
    expect(
      screen.getByText("pages.banner.bannerCreate.status")
    ).toBeInTheDocument();

    // 檢查圖片上傳區域
    expect(
      screen.getByText("pages.banner.bannerCreate.desktopImage")
    ).toBeInTheDocument();
    expect(
      screen.getByText("pages.banner.bannerCreate.mobileImage")
    ).toBeInTheDocument();
  });

  /**
   * 測試表單驗證
   * 確保在表單驗證失敗時（例如有必填欄位未填寫），提交按鈕會被禁用
   */
  it("提交按鈕應該在表單驗證失敗時被禁用", () => {
    mockUseForm.mockImplementationOnce(() => ({
      register: vi.fn(),
      handleSubmit: vi.fn(),
      formState: {
        errors: { title: { message: "錯誤訊息", type: "required" } },
        isValid: false,
        isDirty: false,
        isSubmitting: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isLoading: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
      },
      setValue: vi.fn(),
      watch: vi.fn(),
      reset: vi.fn(),
    }));

    render(<BannerForm />);
    const submitButton = screen.getByRole("button", { name: "common.submit" });
    expect(submitButton).toBeDisabled();
  });
});
