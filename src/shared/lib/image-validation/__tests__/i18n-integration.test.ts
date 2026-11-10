import { describe, it, expect, beforeAll, vi } from "vitest";

import { createValidationManager, fileTypeRule } from "../index";

describe("i18n Integration", () => {
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

  it("should use translation function when provided", async () => {
    const manager = createValidationManager();
    manager.registerRule(fileTypeRule);

    // 模擬翻譯函數
    const mockT = (key: string, options?: Record<string, unknown>) => {
      if (key === "validation.image.type.unsupported") {
        return `Unsupported file type. Please upload ${options?.extensions} format images`;
      }
      return key;
    };

    const mockFile = new File([""], "test.txt", {
      type: "text/plain",
    });

    const result = await manager.validateImage(mockFile, {
      t: mockT,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors[0]?.message).toContain("Unsupported file type");
  });

  it("should fallback to default message when no translation function", async () => {
    const manager = createValidationManager();
    manager.registerRule(fileTypeRule);

    const mockFile = new File([""], "test.txt", {
      type: "text/plain",
    });

    const result = await manager.validateImage(mockFile);

    expect(result.isValid).toBe(false);
    expect(result.errors[0]?.message).toContain("不支援的檔案類型");
  });
});
