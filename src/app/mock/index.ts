import { createPermissionGuard } from "@/app/mock/guard";
import { legacyOperations, toHttpHandlers } from "@/app/mock/legacy-adapter";
import { apiBaseUrl } from "@/services/api-client";
import { handlers } from "@/services/mock/handlers";

import type { TOperationTable } from "@/shared/permission";

/** M3 過渡：全 public 的 legacy operation 表（R28） */
export const operations = legacyOperations(handlers);

// ponytail: M3 operation 全 public，guard 不讀 grants；M4 改由 Authorization → mock session → 矩陣展開
export const guard = (opts: TOperationTable & { apiBaseUrl: string }) =>
  createPermissionGuard({ ...opts, getGrants: () => [] });

/** core handler：legacy 表轉出的 MSW handler（M7 換 orval 產物） */
export const coreMockHandlers = toHttpHandlers(handlers, {
  baseUrl: apiBaseUrl,
});

/** 測試 server 用的同一組 handler（= registry.mockHandlers：module 尚未自帶 mockHandlers） */
export const mockHandlers = [
  guard({ ...operations, apiBaseUrl }),
  ...coreMockHandlers,
];
