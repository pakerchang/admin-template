import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteTitlesContext, useRouteTitleResolver } from "@/shared/module";
import { createTestI18n } from "@/test/i18n";

import type { ReactNode } from "react";

/** i18n-scope-migration AC-11 (b)：resolver 對 nav、children、routeTitles 的 to 回傳已翻譯 string */
const titles = new Map([
  ["/sales", "sales.nav.title"],
  ["/sales/list", "sales.nav.list"],
  ["/users", "users.nav.title"],
]);
const dict = (s: string) => ({
  sales: { nav: { title: `Sales${s}`, list: `List${s}` } },
  users: { nav: { title: `Users${s}` } },
});

const setup = () => {
  const { i18n, I18nWrapper } = createTestI18n({
    zh: dict("-zh"),
    en: dict("-en"),
  });
  const hook = renderHook(useRouteTitleResolver, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <I18nWrapper>
        <RouteTitlesContext.Provider value={titles}>
          {children}
        </RouteTitlesContext.Provider>
      </I18nWrapper>
    ),
  });
  return { i18n, hook };
};

describe("useRouteTitleResolver", () => {
  it("nav 項目、children 與 routeTitles 的 to → 已翻譯 string；未宣告 → undefined", () => {
    const title = setup().hook.result.current;
    expect(title("/sales")).toBe("Sales-zh");
    expect(title("/sales/list")).toBe("List-zh");
    expect(title("/users")).toBe("Users-zh");
    expect(title("/users/edit")).toBeUndefined();
    expect(title("/")).toBeUndefined();
  });

  it("切語系後 re-render 取得的 resolver 回傳另一語系", async () => {
    const { i18n, hook } = setup();
    await act(() => i18n.changeLanguage("en"));
    expect(hook.result.current("/sales")).toBe("Sales-en");
    expect(hook.result.current("/users")).toBe("Users-en");
  });

  it("沒有 provider → 一律 undefined", () => {
    const { result } = renderHook(useRouteTitleResolver);
    expect(result.current("/sales")).toBeUndefined();
  });
});
