import { describe, it, expect, beforeAll, vi } from "vitest";

import {
  createDesktopBannerValidationManager,
  createMobileBannerValidationManager,
  type ImageValidationRule,
  type ValidationResult,
} from "../index";

// Banner 驗證預設配置（測試用期望值）
const BANNER_VALIDATION_CONFIG = {
  // 支援的檔案類型（Banner 專用：僅 WebP）
  allowedTypes: ["image/webp"],

  // 解析度限制
  desktop: {
    minWidth: 1280,
    minHeight: 720,
    maxWidth: 3840,
    maxHeight: 2160,
    aspectRatio: "16:9",
  },

  mobile: {
    minWidth: 720,
    minHeight: 720,
    maxWidth: 1920,
    maxHeight: 1920,
    aspectRatio: ["16:9", "1:1"],
  },

  // 檔案大小限制
  fileSize: {
    min: "10KB",
    maxDesktop: "5MB",
    maxMobile: "3MB",
    recommendedWebP: {
      desktop: "300KB-1.5MB",
      mobile: "150KB-800KB",
    },
  },
};

describe("Banner Preset", () => {
  beforeAll(() => {
    // Mock URL methods for image metadata tests
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: vi.fn((file: File) => `mock:${file.name}`),
    });

    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: vi.fn(),
    });

    // Mock Image constructor for image metadata tests
    class MockImage {
      width = 1920;
      height = 1080;
      src = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor() {
        // 模擬異步載入圖片
        setTimeout(() => {
          if (this.src && this.onload) {
            this.onload();
          }
        }, 0);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).Image = MockImage;
  });

  it("should create desktop banner validation manager with WebP-only rules", () => {
    const manager = createDesktopBannerValidationManager();

    expect(manager).toBeDefined();
    const rules = manager.getRules();

    // 應該包含所有桌面版 Banner 規則
    expect(rules.length).toBe(5);

    // 檢查是否包含 Banner 專用檔案格式規則
    const bannerFileTypeRule = rules.find(
      (rule: ImageValidationRule) => rule.name === "banner-file-type"
    );
    expect(bannerFileTypeRule).toBeDefined();

    // 檢查桌面版前綴規則
    const desktopPrefixRule = rules.find(
      (rule: ImageValidationRule) => rule.name === "desktop-filename-prefix"
    );
    expect(desktopPrefixRule).toBeDefined();

    // 檢查規則清單
    const ruleNames = rules.map((rule: ImageValidationRule) => rule.name);
    expect(ruleNames).toContain("banner-file-type");
    expect(ruleNames).toContain("filename-format");
    expect(ruleNames).toContain("desktop-filename-prefix");
    expect(ruleNames).toContain("desktop-resolution");
    expect(ruleNames).toContain("file-size");
  });

  it("should create mobile banner validation manager with WebP-only rules", () => {
    const manager = createMobileBannerValidationManager();

    expect(manager).toBeDefined();
    const rules = manager.getRules();

    // 應該包含所有手機版 Banner 規則
    expect(rules.length).toBe(5);

    // 檢查是否包含 Banner 專用檔案格式規則
    const bannerFileTypeRule = rules.find(
      (rule: ImageValidationRule) => rule.name === "banner-file-type"
    );
    expect(bannerFileTypeRule).toBeDefined();

    // 檢查手機版前綴規則
    const mobilePrefixRule = rules.find(
      (rule: ImageValidationRule) => rule.name === "mobile-filename-prefix"
    );
    expect(mobilePrefixRule).toBeDefined();

    // 檢查規則清單
    const ruleNames = rules.map((rule: ImageValidationRule) => rule.name);
    expect(ruleNames).toContain("banner-file-type");
    expect(ruleNames).toContain("filename-format");
    expect(ruleNames).toContain("mobile-filename-prefix");
    expect(ruleNames).toContain("mobile-resolution");
    expect(ruleNames).toContain("file-size");
  });

  it("should have correct banner validation config", () => {
    expect(BANNER_VALIDATION_CONFIG).toBeDefined();
    expect(BANNER_VALIDATION_CONFIG.allowedTypes).toContain("image/webp");
    expect(BANNER_VALIDATION_CONFIG.desktop.minWidth).toBe(1280);
    expect(BANNER_VALIDATION_CONFIG.mobile.aspectRatio).toContain("16:9");
    expect(BANNER_VALIDATION_CONFIG.mobile.aspectRatio).toContain("1:1");
  });

  it("should validate desktop WebP file successfully", async () => {
    const manager = createDesktopBannerValidationManager();

    // 建立模擬的 WebP 檔案
    const mockWebPFile = new File([""], "d_banner.webp", {
      type: "image/webp",
    });

    const result = await manager.validateImage(mockWebPFile);

    // WebP 檔案應該通過驗證
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should validate mobile WebP file successfully", async () => {
    const manager = createMobileBannerValidationManager();

    // 建立模擬的 WebP 檔案
    const mockWebPFile = new File([""], "m_banner.webp", {
      type: "image/webp",
    });

    const result = await manager.validateImage(mockWebPFile);

    // WebP 檔案應該通過驗證
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should reject non-WebP files for desktop", async () => {
    const manager = createDesktopBannerValidationManager();

    // 建立模擬的非 WebP 檔案
    const mockJpegFile = new File([""], "d_banner.jpg", {
      type: "image/jpeg",
    });

    const result = await manager.validateImage(mockJpegFile);

    // 非 WebP 檔案應該被拒絕
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // 檢查錯誤訊息是否包含格式相關的內容
    const hasFormatError = result.errors.some(
      (error: ValidationResult) =>
        error.message?.includes("WebP") || error.message?.includes(".webp")
    );
    expect(hasFormatError).toBe(true);
  });

  it("should reject non-WebP files for mobile", async () => {
    const manager = createMobileBannerValidationManager();

    // 建立模擬的非 WebP 檔案
    const mockJpegFile = new File([""], "m_banner.jpg", {
      type: "image/jpeg",
    });

    const result = await manager.validateImage(mockJpegFile);

    // 非 WebP 檔案應該被拒絕
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // 檢查錯誤訊息是否包含格式相關的內容
    const hasFormatError = result.errors.some(
      (error: ValidationResult) =>
        error.message?.includes("WebP") || error.message?.includes(".webp")
    );
    expect(hasFormatError).toBe(true);
  });
});
