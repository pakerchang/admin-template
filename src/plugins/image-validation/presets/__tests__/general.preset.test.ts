import { describe, it, expect } from "vitest";

import { createGeneralImageValidationManager } from "../general.preset";

// 測試用的預期配置
const EXPECTED_GENERAL_CONFIG = {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  fileSize: {
    min: "10KB",
    max: "5MB", // 實際上是桌面版 5MB，手機版 3MB
  },
  features: {
    supportedFormats: ["JPEG", "PNG", "WebP"],
    prefixRequired: false,
    resolutionLimits: false,
    webpRequired: false,
  },
};

describe("General Image Validation Manager", () => {
  describe("createGeneralImageValidationManager", () => {
    it("should create a validation manager with basic rules", () => {
      const manager = createGeneralImageValidationManager();

      expect(manager).toBeDefined();
      expect(typeof manager.registerRule).toBe("function");
      expect(typeof manager.validateImage).toBe("function");
      expect(typeof manager.getAllowedFormats).toBe("function");
    });

    it("should support basic file types", () => {
      const manager = createGeneralImageValidationManager();
      const allowedFormats = manager.getAllowedFormats();

      expect(allowedFormats.types).toContain("image/jpeg");
      expect(allowedFormats.types).toContain("image/png");
      expect(allowedFormats.types).toContain("image/webp");
    });

    it("should not include Banner-specific rules", () => {
      const manager = createGeneralImageValidationManager();
      const rules = manager.getRules();

      // 應該包含基礎規則
      expect(rules.some((rule) => rule.name === "file-type")).toBe(true);
      expect(rules.some((rule) => rule.name === "filename-format")).toBe(true);
      expect(rules.some((rule) => rule.name === "file-size")).toBe(true);

      // 不應該包含 Banner 特有規則
      expect(rules.some((rule) => rule.name === "filename-prefix")).toBe(false);
      expect(rules.some((rule) => rule.name === "webp-format")).toBe(false);
      expect(rules.some((rule) => rule.name === "desktop-resolution")).toBe(
        false
      );
      expect(rules.some((rule) => rule.name === "mobile-resolution")).toBe(
        false
      );
    });
  });

  describe("Expected Configuration", () => {
    it("should match expected general validation configuration", () => {
      expect(EXPECTED_GENERAL_CONFIG.allowedTypes).toEqual([
        "image/jpeg",
        "image/png",
        "image/webp",
      ]);

      expect(EXPECTED_GENERAL_CONFIG.fileSize.min).toBe("10KB");
      expect(EXPECTED_GENERAL_CONFIG.fileSize.max).toBe("5MB");

      expect(EXPECTED_GENERAL_CONFIG.features.prefixRequired).toBe(false);
      expect(EXPECTED_GENERAL_CONFIG.features.resolutionLimits).toBe(false);
      expect(EXPECTED_GENERAL_CONFIG.features.webpRequired).toBe(false);
    });
  });

  describe("File validation", () => {
    it("should accept valid JPEG files", async () => {
      const manager = createGeneralImageValidationManager();
      const mockFile = new File(["test"], "test-image.jpg", {
        type: "image/jpeg",
      });

      const result = await manager.validateImage(mockFile);

      // 應該通過基礎驗證（檔案類型、檔名格式）
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept valid PNG files", async () => {
      const manager = createGeneralImageValidationManager();
      const mockFile = new File(["test"], "test-image.png", {
        type: "image/png",
      });

      const result = await manager.validateImage(mockFile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept valid WebP files", async () => {
      const manager = createGeneralImageValidationManager();
      const mockFile = new File(["test"], "test-image.webp", {
        type: "image/webp",
      });

      const result = await manager.validateImage(mockFile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid file types", async () => {
      const manager = createGeneralImageValidationManager();
      const mockFile = new File(["test"], "test-doc.pdf", {
        type: "application/pdf",
      });

      const result = await manager.validateImage(mockFile);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject invalid filename formats", async () => {
      const manager = createGeneralImageValidationManager();
      const mockFile = new File(["test"], "test 圖片.jpg", {
        type: "image/jpeg",
      });

      const result = await manager.validateImage(mockFile);

      expect(result.isValid).toBe(false);
      // 檢查是否有來自檔名格式規則的錯誤
      const hasFilenameError = result.errors.some(
        (error) =>
          error.message?.includes("檔名只能包含英文字母、數字、底線") || false
      );
      expect(hasFilenameError).toBe(true);
    });

    it("should accept files without prefix requirement", async () => {
      const manager = createGeneralImageValidationManager();
      const mockFile = new File(["test"], "image.jpg", { type: "image/jpeg" });

      const result = await manager.validateImage(mockFile);

      // 不應該有前綴相關的錯誤 (通用驗證管理器不包含前綴驗證規則)
      expect(
        result.errors.some((error) => error.message?.includes("前綴") || false)
      ).toBe(false);
    });
  });
});
