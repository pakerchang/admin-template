import { describe, it, expect, vi } from "vitest";

import { useCreateBannerSchema } from "../../hooks/use-banner";

/**
 * Banner 表單驗證邏輯測試
 *
 * 測試範圍：
 * 1. 表單欄位驗證規則
 * 2. 錯誤訊息的多語系處理
 * 3. 自定義驗證邏輯（如 HTTPS 協議檢查）
 *
 * 主要測試 useCreateBannerSchema hook 返回的 schema 物件：
 * - 標題（title）：必填
 * - 重定向網址（redirect_url）：必填、必須是有效的 URL、必須使用 HTTPS
 * - 圖片網址（desktop_image_url, mobile_image_url）：必填
 */

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "validation.url.invalid": "請輸入有效的網址",
        "validation.url.https": "網址必須以 https:// 開頭",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock validation message hook
vi.mock("@/lib/gen-validate-message", () => ({
  useValidationMessage: () => ({
    getRequiredMessage: (field: string) => `${field}為必填欄位`,
  }),
}));

describe("Banner Form Validation", () => {
  const schema = useCreateBannerSchema();

  describe("title validation", () => {
    /**
     * 測試標題欄位驗證
     * 1. 必填檢查：標題不能為空
     * 2. 有效值檢查：標題可以是任何非空字串
     */
    it("should require title", () => {
      const result = schema.safeParse({
        title: "",
        redirect_url: "https://example.com",
        banner_status: "active",
        desktop_image_url: "https://example.com/desktop.jpg",
        mobile_image_url: "https://example.com/mobile.jpg",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "pages.banner.bannerCreate.title為必填欄位"
        );
      }
    });

    it("should accept valid title", () => {
      const result = schema.safeParse({
        title: "Test Banner",
        redirect_url: "https://example.com",
        banner_status: "active",
        desktop_image_url: "https://example.com/desktop.jpg",
        mobile_image_url: "https://example.com/mobile.jpg",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("redirect_url validation", () => {
    /**
     * 測試重定向網址欄位驗證
     * 1. 必填檢查：網址不能為空
     * 2. URL 格式檢查：必須是有效的 URL 格式
     * 3. HTTPS 協議檢查：必須使用 HTTPS 協議
     */
    it("should require redirect_url", () => {
      const result = schema.safeParse({
        title: "Test Banner",
        redirect_url: "",
        banner_status: "active",
        desktop_image_url: "https://example.com/desktop.jpg",
        mobile_image_url: "https://example.com/mobile.jpg",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "pages.banner.bannerCreate.redirectUrl為必填欄位"
        );
      }
    });

    it("should reject invalid URL format", () => {
      const result = schema.safeParse({
        title: "Test Banner",
        redirect_url: "invalid-url",
        banner_status: "active",
        desktop_image_url: "https://example.com/desktop.jpg",
        mobile_image_url: "https://example.com/mobile.jpg",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("請輸入有效的網址");
      }
    });

    it("should reject http URL", () => {
      const result = schema.safeParse({
        title: "Test Banner",
        redirect_url: "http://example.com",
        banner_status: "active",
        desktop_image_url: "https://example.com/desktop.jpg",
        mobile_image_url: "https://example.com/mobile.jpg",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("網址必須以 https:// 開頭");
      }
    });

    it("should accept valid https URL", () => {
      const result = schema.safeParse({
        title: "Test Banner",
        redirect_url: "https://example.com",
        banner_status: "active",
        desktop_image_url: "https://example.com/desktop.jpg",
        mobile_image_url: "https://example.com/mobile.jpg",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("image URLs validation", () => {
    /**
     * 測試圖片網址欄位驗證
     * 1. 桌面版圖片必填檢查
     * 2. 手機版圖片必填檢查
     * 3. 有效圖片網址檢查
     */
    it("should require desktop_image_url", () => {
      const result = schema.safeParse({
        title: "Test Banner",
        redirect_url: "https://example.com",
        banner_status: "active",
        desktop_image_url: "",
        mobile_image_url: "https://example.com/mobile.jpg",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "pages.banner.bannerCreate.desktopImage為必填欄位"
        );
      }
    });

    it("should require mobile_image_url", () => {
      const result = schema.safeParse({
        title: "Test Banner",
        redirect_url: "https://example.com",
        banner_status: "active",
        desktop_image_url: "https://example.com/desktop.jpg",
        mobile_image_url: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "pages.banner.bannerCreate.mobileImage為必填欄位"
        );
      }
    });

    it("should accept valid image URLs", () => {
      const result = schema.safeParse({
        title: "Test Banner",
        redirect_url: "https://example.com",
        banner_status: "active",
        desktop_image_url: "https://example.com/desktop.jpg",
        mobile_image_url: "https://example.com/mobile.jpg",
      });

      expect(result.success).toBe(true);
    });
  });
});
