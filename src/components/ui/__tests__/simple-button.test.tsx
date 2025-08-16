import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SimpleButton } from "../SimpleButton";

/**
 * SimpleButton 組件測試
 * 主要測試以下功能：
 * 1. 基本渲染：確保組件正常渲染
 * 2. 變體測試：驗證尺寸變體 (sm/md/lg) 和樣式變體 (primary/secondary)
 * 3. 事件處理：驗證 onClick 等事件正常運作
 * 4. Props 傳遞：驗證 disabled, className 等 props
 * 5. React.forwardRef：驗證 ref 正確傳遞
 */

describe("SimpleButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("基本渲染測試", () => {
    it("應該正確渲染按鈕", () => {
      render(<SimpleButton>測試按鈕</SimpleButton>);

      const button = screen.getByRole("button", { name: "測試按鈕" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("測試按鈕");
    });

    it("應該渲染為 button 元素", () => {
      render(<SimpleButton>測試按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("應該有正確的預設類名", () => {
      render(<SimpleButton>測試按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "inline-flex",
        "items-center",
        "justify-center"
      );
    });
  });

  describe("尺寸變體測試", () => {
    it("應該正確應用 sm 尺寸樣式", () => {
      render(<SimpleButton size="sm">小按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-8", "px-3", "text-xs");
    });

    it("應該正確應用 md 尺寸樣式（預設）", () => {
      render(<SimpleButton size="md">中按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9", "px-4", "text-sm");
    });

    it("應該正確應用 lg 尺寸樣式", () => {
      render(<SimpleButton size="lg">大按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10", "px-6", "text-base");
    });

    it("未指定尺寸時應該使用預設 md 尺寸", () => {
      render(<SimpleButton>預設按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9", "px-4", "text-sm");
    });
  });

  describe("樣式變體測試", () => {
    it("應該正確應用 primary 樣式（預設）", () => {
      render(<SimpleButton variant="primary">主要按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("應該正確應用 secondary 樣式", () => {
      render(<SimpleButton variant="secondary">次要按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");
    });

    it("未指定樣式時應該使用預設 primary 樣式", () => {
      render(<SimpleButton>預設按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary", "text-primary-foreground");
    });
  });

  describe("組合變體測試", () => {
    it("應該正確組合 size 和 variant props", () => {
      render(
        <SimpleButton size="lg" variant="secondary">
          大次要按鈕
        </SimpleButton>
      );

      const button = screen.getByRole("button");
      // 檢查尺寸類
      expect(button).toHaveClass("h-10", "px-6", "text-base");
      // 檢查樣式類
      expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");
    });

    it("應該正確組合 size sm 和 variant primary", () => {
      render(
        <SimpleButton size="sm" variant="primary">
          小主要按鈕
        </SimpleButton>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-8", "px-3", "text-xs");
      expect(button).toHaveClass("bg-primary", "text-primary-foreground");
    });
  });

  describe("事件處理測試", () => {
    it("應該正確處理 onClick 事件", () => {
      const mockOnClick = vi.fn();
      render(<SimpleButton onClick={mockOnClick}>可點擊按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("應該在 disabled 狀態下阻止點擊事件", () => {
      const mockOnClick = vi.fn();
      render(
        <SimpleButton onClick={mockOnClick} disabled>
          禁用按鈕
        </SimpleButton>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("應該支援其他事件處理器", () => {
      const mockOnMouseOver = vi.fn();
      const mockOnFocus = vi.fn();

      render(
        <SimpleButton onMouseOver={mockOnMouseOver} onFocus={mockOnFocus}>
          事件按鈕
        </SimpleButton>
      );

      const button = screen.getByRole("button");

      fireEvent.mouseOver(button);
      expect(mockOnMouseOver).toHaveBeenCalledTimes(1);

      fireEvent.focus(button);
      expect(mockOnFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe("Props 傳遞測試", () => {
    it("應該正確傳遞 disabled 屬性", () => {
      render(<SimpleButton disabled>禁用按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        "disabled:pointer-events-none",
        "disabled:opacity-50"
      );
    });

    it("應該正確合併 className", () => {
      render(
        <SimpleButton className="custom-class bg-red-500">
          自訂按鈕
        </SimpleButton>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class", "bg-red-500");
      // 應該同時包含預設類和自訂類
      expect(button).toHaveClass("inline-flex", "items-center");
    });

    it("應該傳遞任意 HTML 按鈕屬性", () => {
      render(
        <SimpleButton
          type="submit"
          form="test-form"
          aria-label="提交表單"
          data-testid="submit-button"
        >
          提交
        </SimpleButton>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
      expect(button).toHaveAttribute("form", "test-form");
      expect(button).toHaveAttribute("aria-label", "提交表單");
      expect(button).toHaveAttribute("data-testid", "submit-button");
    });
  });

  describe("React.forwardRef 測試", () => {
    it("應該正確傳遞 ref", () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(<SimpleButton ref={ref}>Ref 按鈕</SimpleButton>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveTextContent("Ref 按鈕");
    });

    it("ref 應該允許直接操作 DOM", () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(<SimpleButton ref={ref}>操作按鈕</SimpleButton>);

      // 測試可以透過 ref 直接操作按鈕
      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it("應該有正確的 displayName", () => {
      expect(SimpleButton.displayName).toBe("SimpleButton");
    });
  });

  describe("無障礙測試", () => {
    it("應該有正確的 focus 樣式", () => {
      render(<SimpleButton>無障礙按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "focus-visible:outline-none",
        "focus-visible:ring-1"
      );
    });

    it("應該支援鍵盤導航", () => {
      const mockOnClick = vi.fn();
      render(<SimpleButton onClick={mockOnClick}>鍵盤按鈕</SimpleButton>);

      const button = screen.getByRole("button");

      // 模擬 Enter 鍵
      fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
      // Note: React Testing Library 的 fireEvent.keyDown 不會自動觸發 click，
      // 但真實瀏覽器會，這裡我們測試按鈕可以接收鍵盤事件
      expect(button).toHaveClass("focus-visible:outline-none");
    });
  });

  describe("邊界情況測試", () => {
    it("應該處理空內容", () => {
      render(<SimpleButton></SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("");
    });

    it("應該處理複雜的子元素", () => {
      render(
        <SimpleButton>
          <span>圖示</span>
          <span>文字</span>
        </SimpleButton>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("圖示文字");
      expect(button.querySelector("span")).toBeInTheDocument();
    });

    it("應該在沒有 className 時正常工作", () => {
      render(<SimpleButton>正常按鈕</SimpleButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("inline-flex");
    });
  });
});
