import { build } from "./build";

import type { TCore } from "./build";
import type { TModule, TRouteId, TShell } from "@/shared/module";
import type { TOperationTable } from "@/shared/permission";
import type { ComponentType } from "react";

// ponytail: 只有 use / override / build；mount（MSW 啟動、i18n 註冊、render）在 M3 接線時加
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
  };
  return app;
};

export type TApp = ReturnType<typeof createApp>;
