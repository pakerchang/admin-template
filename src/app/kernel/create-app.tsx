import { createRouter, RouterProvider } from "@tanstack/react-router";
// 預設 instance：main.tsx 先 import "@/shared/i18n/i18n" 完成 init（這裡不 import 它，避免測試載入 i18n 副作用）
import i18next from "i18next";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { isMockEnabled } from "@/app/mock/enabled";
import { startMockWorker } from "@/app/mock/start-worker";

import { build } from "./build";

import type { TCore } from "./build";
import type { TModule, TRouteId, TShell } from "@/shared/module";
import type { TOperationTable } from "@/shared/permission";
import type { AnyRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";

/** nav / grants 由 build() 在 protected layout 外層以 context 提供（shell 經 useVisibleNav() 取用） */
export const createAppRouter = (routeTree: AnyRoute) =>
  createRouter({ routeTree, defaultPreload: "intent" });

export const createApp = ({
  shell,
  operations,
  apiBaseUrl,
  core,
}: {
  shell: TShell;
  operations: TOperationTable;
  apiBaseUrl: string;
  core: TCore;
}) => {
  const modules: TModule[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overrides = new Map<TRouteId, ComponentType<any>>();
  const app = {
    use(m: TModule) {
      modules.push(m);
      return app;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    override(id: TRouteId, page: ComponentType<any>) {
      overrides.set(id, page);
      return app;
    },
    build: () =>
      build({ modules, shell, overrides, operations, apiBaseUrl, core }),
    /** 驗證失敗在 build() throw（fail fast）→ 啟動 MSW（R24 檢查 base）→ render */
    async mount(selector: string) {
      const { routeTree, registry } = app.build();
      if (isMockEnabled(import.meta.env.VITE_API_MOCK))
        // 檢查原始 env，不經 api-client 的 window.location.origin fallback（R24）
        await startMockWorker(registry.mockHandlers, {
          apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
          appOrigin: window.location.origin,
          start: (handlers) =>
            import("@/app/mock/browser").then((m) =>
              m.startBrowserWorker(handlers)
            ),
        });
      // §4.3 步驟 4：module 字典（已 scope）寫入同一 namespace。core 字典由 shared/i18n/i18n.ts 的 backend 載入，
      // 必須先載完：bundle 已存在時 i18next 會跳過 backend，先寫 module 字典會讓該語系的 core 字典永遠不載
      const lngs = Object.keys(registry.i18n);
      await i18next.loadLanguages(lngs);
      for (const [lng, dict] of Object.entries(registry.i18n))
        i18next.addResourceBundle(lng, "translation", dict, true, false);
      createRoot(document.querySelector(selector)!).render(
        <StrictMode>
          <RouterProvider router={createAppRouter(routeTree)} />
        </StrictMode>
      );
    },
  };
  return app;
};

export type TApp = ReturnType<typeof createApp>;
