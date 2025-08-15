import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { SimpleButton } from "../SimpleButton";

describe("SimpleButton", () => {
  it("renders correctly", () => {
    render(<SimpleButton>Test Button</SimpleButton>);
    expect(screen.getByRole("button")).toHaveTextContent("Test Button");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<SimpleButton onClick={handleClick}>Click Me</SimpleButton>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders primary variant by default", () => {
    render(<SimpleButton>Primary Button</SimpleButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary");
  });

  it("renders secondary variant correctly", () => {
    render(<SimpleButton variant="secondary">Secondary Button</SimpleButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-secondary");
  });

  it("renders medium size by default", () => {
    render(<SimpleButton>Medium Button</SimpleButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-9");
  });

  it("renders small size correctly", () => {
    render(<SimpleButton size="sm">Small Button</SimpleButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-8");
    expect(button).toHaveClass("text-xs");
  });

  it("renders large size correctly", () => {
    render(<SimpleButton size="lg">Large Button</SimpleButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-10");
    expect(button).toHaveClass("text-base");
  });

  it("can be disabled", () => {
    render(<SimpleButton disabled>Disabled Button</SimpleButton>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");
  });

  it("accepts custom className", () => {
    render(<SimpleButton className="custom-class">Custom Button</SimpleButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("forwards ref correctly", () => {
    const ref = vi.fn();
    render(<SimpleButton ref={ref}>Ref Button</SimpleButton>);
    expect(ref).toHaveBeenCalled();
  });
});
