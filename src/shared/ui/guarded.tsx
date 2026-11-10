import { useCan } from "@/shared/permission";

import type { TPermission } from "@/shared/permission";
import type { ReactNode } from "react";

/**
 * §6.4 逃生口：非表格 / 表單的低頻寫入入口。無權限 → 改渲染 `fallback`（預設不渲染）。
 * ponytail: 只做 "hide"；需要 disabled 的按鈕用 FormSubmit / rowActions 的 denied="disable"
 */
export const Guarded = ({
  permission,
  fallback = null,
  children,
}: {
  permission: TPermission;
  denied?: "hide";
  fallback?: ReactNode;
  children: ReactNode;
}) => (useCan()(permission) ? children : fallback);
