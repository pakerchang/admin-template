import { ErrorComponent } from "@tanstack/react-router";

import { ForbiddenError } from "@/shared/permission";

import type { TShell } from "@/shared/module";
import type { ErrorComponentProps } from "@tanstack/react-router";

/**
 * §6.2 / R10：kernel 注入每個 module route 的 errorComponent。ForbiddenError → shell.Forbidden，
 * 渲染在父 layout 的 <Outlet /> 位置（URL 與 shell 保留）；其他錯誤交回 router 預設畫面。
 * shell 以參數注入（build 期已知），不經 registry context。
 */
export const createForbiddenBoundary = (Forbidden: TShell["Forbidden"]) =>
  function ForbiddenBoundary({ error }: ErrorComponentProps) {
    if (error instanceof ForbiddenError)
      return <Forbidden permission={error.permission} />;
    return <ErrorComponent error={error} />;
  };
