import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeApp } from "@/app/__tests__/fixture";
import coreEn from "@/shared/i18n/locales/en.json";
import coreZh from "@/shared/i18n/locales/zh.json";
import { Dialog } from "@/shared/ui/dialog";
import { createTestI18n } from "@/test/i18n";

import EditUserRoleDialogContent from "../EditUserRoleDialogContent";

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

const renderDialog = (lng: "zh" | "en") => {
  const { I18nWrapper } = createTestI18n(dicts, lng);
  render(
    <I18nWrapper>
      <Dialog open>
        <EditUserRoleDialogContent defaultRole="user" />
      </Dialog>
    </I18nWrapper>
  );
  return screen.getByRole("dialog");
};

const ROLES = [
  "new",
  "user",
  "vip",
  "agent",
  "cservice",
  "admin",
  "superadmin",
];

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
      "新使用者",
      "一般使用者",
      "VIP會員",
      "代理商",
      "客服",
      "管理員",
      "超級管理員",
    ])
      expect(screen.getByText(text)).toBeInTheDocument();
  });
});
