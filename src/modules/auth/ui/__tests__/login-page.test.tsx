import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEMO_ACCOUNTS } from "../../mocks/demo-accounts";
import LoginPage from "../LoginPage";

const mutate = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../../model/use-login", () => ({
  useLogin: () => ({ mutate, isPending: false, error: null }),
}));

describe("LoginPage demo account picker", () => {
  it("AC-a：五個快選，點擊帶入帳密但不送出", () => {
    render(<LoginPage demoAccounts={DEMO_ACCOUNTS} />);
    const buttons = screen.getAllByRole("button", {
      name: /login\.demo\.roles/,
    });
    expect(buttons).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: /bob@example\.com/ }));
    expect(screen.getByLabelText("login.email")).toHaveValue("bob@example.com");
    expect(screen.getByLabelText("login.password")).toHaveValue("admin123");
    expect(mutate).not.toHaveBeenCalled();
  });

  it.each([undefined, []])("AC-b：無清單（%s）不渲染快選", (demoAccounts) => {
    render(<LoginPage demoAccounts={demoAccounts} />);
    expect(screen.queryByText("login.demo.title")).toBeNull();
  });
});
