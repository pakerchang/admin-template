import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";

import {
  createValidationManager,
  fileTypeRule,
  filenameFormatRule,
} from "../index";

describe("Basic Usage", () => {
  let manager: ReturnType<typeof createValidationManager>;

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

  beforeEach(() => {
    manager = createValidationManager();
    manager.registerRule(fileTypeRule);
    manager.registerRule(filenameFormatRule);
  });

  it("should create validation manager successfully", () => {
    expect(manager).toBeDefined();
    expect(manager.getRules()).toHaveLength(2);
  });

  it("should register and unregister rules", () => {
    const initialCount = manager.getRules().length;

    // 移除一個規則
    manager.unregisterRule("file-type");
    expect(manager.getRules()).toHaveLength(initialCount - 1);

    // 重新註冊
    manager.registerRule(fileTypeRule);
    expect(manager.getRules()).toHaveLength(initialCount);
  });

  it("should clear all rules", () => {
    manager.clearRules();
    expect(manager.getRules()).toHaveLength(0);
  });

  it("should validate valid JPEG file", async () => {
    // 建立模擬的 JPEG 檔案
    const mockFile = new File([""], "d_banner.jpg", {
      type: "image/jpeg",
    });

    const result = await manager.validateImage(mockFile, {
      imageType: "desktop",
    });

    // 基本規則應該通過（除了可能的元數據檢查）
    expect(result).toBeDefined();
    expect(result.results).toBeDefined();
  });

  it("should reject invalid file type", async () => {
    // 建立模擬的無效檔案
    const mockFile = new File([""], "test.txt", {
      type: "text/plain",
    });

    const result = await manager.validateImage(mockFile, {
      imageType: "desktop",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should reject invalid filename format", async () => {
    // 建立包含中文的檔名
    const mockFile = new File([""], "中文檔名.jpg", {
      type: "image/jpeg",
    });

    const result = await manager.validateImage(mockFile, {
      imageType: "desktop",
    });

    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((error) => error.message?.includes("檔名只能包含"))
    ).toBe(true);
  });
});
