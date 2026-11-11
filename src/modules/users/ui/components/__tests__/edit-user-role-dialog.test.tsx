import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import coreEn from "@/shared/i18n/locales/en.json";
import coreZh from "@/shared/i18n/locales/zh.json";
import { Dialog } from "@/shared/ui/dialog";
import { createTestI18n } from "@/test/i18n";

import { userRoleEnum } from "../../../model/schema";
import EditUserRoleDialogContent from "../EditUserRoleDialogContent";

import type { TUserRole } from "../../../model/schema";

/** 硬寫中文 i18n 化 AC-5：編輯使用者角色對話框依語系顯示 */
// Radix RadioGroup 需要 ResizeObserver，jsdom 沒有
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);
const { registry } = makeApp().build();
const dicts = {
  zh: { ...coreZh, ...registry.i18n.zh },
  en: { ...coreEn, ...registry.i18n.en },
};

const renderDialog = (
  lng: "zh" | "en",
  defaultRole: TUserRole = "user",
  onSubmit?: (role: TUserRole) => void
) => {
  const { I18nWrapper } = createTestI18n(dicts, lng);
  render(
    <I18nWrapper>
      <Dialog open>
        <EditUserRoleDialogContent
          defaultRole={defaultRole}
          onSubmit={onSubmit}
        />
      </Dialog>
    </I18nWrapper>
  );
  return screen.getByRole("dialog");
};

const ROLES = userRoleEnum.options;

describe("EditUserRoleDialogContent（AC-5）", () => {
  it("en：標題與 7 個角色皆為 en 字典值、不含中文", () => {
    const dialog = renderDialog("en");
    const users = registry.i18n.en.users as {
      roles: Record<string, string>;
    };
    expect(screen.getByText("Edit User Role")).toBeInTheDocument();
    for (const id of ROLES)
      expect(screen.getByText(users.roles[id])).toBeInTheDocument();
    expect(dialog.textContent).not.toMatch(/[一-鿿　-〿＀-￯]/);
  });

  it("zh：與原硬寫文字逐字相同", () => {
    renderDialog("zh");
    for (const text of [
      "編輯使用者角色",
      "請選擇新的使用者角色",
      "訪客",
      "一般使用者",
      "進階會員",
      "合作夥伴",
      "客服",
      "管理員",
      "超級管理員",
    ])
      expect(screen.getByText(text)).toBeInTheDocument();
  });
});

/** T3 AC-7（OD-T3-4 A）：選項由 userRoleEnum 推導、預設選取、送出值 */
describe("EditUserRoleDialogContent 角色選項（T3 AC-7）", () => {
  it("(a) radio 值集合等於 userRoleEnum.options", () => {
    renderDialog("zh");
    const values = screen
      .getAllByRole("radio")
      .map((r) => r.getAttribute("value"));
    expect(values).toEqual([...userRoleEnum.options]);
  });

  it("(b) defaultRole=support 時該項為選取狀態", () => {
    renderDialog("zh", "support");
    const checked = screen
      .getAllByRole("radio")
      .filter((r) => r.getAttribute("aria-checked") === "true");
    expect(checked.map((r) => r.getAttribute("value"))).toEqual(["support"]);
  });

  it("(c) 改選 partner 送出，onSubmit 收到 partner", () => {
    const onSubmit = vi.fn();
    renderDialog("zh", "user", onSubmit);
    fireEvent.click(
      screen
        .getAllByRole("radio")
        .find((r) => r.getAttribute("value") === "partner")!
    );
    fireEvent.click(screen.getByRole("button", { name: coreZh.common.submit }));
    expect(onSubmit).toHaveBeenCalledWith("partner");
  });

  it("(d) en 下 7 個標籤等於 en 字典 users.roles.<role>", () => {
    renderDialog("en");
    const users = registry.i18n.en.users as { roles: Record<string, string> };
    const labels = screen
      .getAllByRole("radio")
      .map((r) => document.querySelector(`label[for="${r.id}"]`)?.textContent);
    expect(labels).toEqual(userRoleEnum.options.map((id) => users.roles[id]));
  });
});
