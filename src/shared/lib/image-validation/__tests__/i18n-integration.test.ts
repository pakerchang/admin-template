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

  it("規則 throw 時以 t 組出 ruleFailed 訊息（OD-HZ-1 A，取代無 t 的中文 fallback）", async () => {
    const manager = createValidationManager();
    manager.registerRule({
      name: "boom",
      validate: async () => {
        throw new Error("boom");
      },
    });
    manager.registerRule({
      name: "non-error",
      validate: async () => {
        throw "x";
      },
    });
    const t = (key: string, options?: Record<string, unknown>) =>
      `${key} ${JSON.stringify(options ?? {})}`;

    const result = await manager.validateImage(new File([""], "a.jpg"), { t });

    expect(result.errors.map((e) => e.message)).toEqual([
      t("validation.image.ruleFailed", { reason: "boom" }),
      t("validation.image.ruleFailed", {
        reason: t("validation.image.unknownError"),
      }),
    ]);
  });

  it("型別：validateImage 不傳 t 時 tsc 報錯（純型別，不執行）", () => {
    const manager = createValidationManager();
    const file = new File([""], "a.jpg");
    const noT = { imageType: "desktop" as const };
    const typeOnly = () => [
      // @ts-expect-error options 為必填
      manager.validateImage(file),
      // @ts-expect-error options.t 為必填
      manager.validateImage(file, noT),
    ];
    expect(typeof typeOnly).toBe("function");
  });
});
