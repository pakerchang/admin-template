import { delay, http, passthrough } from "msw";

import { coreMockHandlers } from "@/app/mock/core-handlers";
import { coreGrants, mergeGrants } from "@/app/mock/permission-matrix";
import { operations } from "@/app/operations.gen";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { createPermissionGuard } from "@/shared/api/mock/permission-guard";
import {
  mockRoleOf,
  setMockGrantMatrix,
} from "@/shared/api/mock/session-store";

import type { TGrantMatrix, TOperationTable } from "@/shared/permission";

const DELAY_MS = import.meta.env.MODE === "test" ? 0 : 300;

/**
 * kernel 的 MSW handler（TCore.mock）：[guard, ...core handler]，guard 一定在第一位（§4.3 步驟 5）；module 的 handler 由 build() 接在後面。
 * mockGrants = 已安裝 module 的 `permissions.mockGrants`，與 core 矩陣合併：
 * guard 以 Authorization → session 角色（R25：無 token / 查無 session → []）展開；auth module 的 login 也依同一矩陣回傳 grants。
 */
export const createMockHandlers = ({
  mockGrants,
  ...opts
}: TOperationTable & {
  apiBaseUrl: string;
  mockGrants: readonly TGrantMatrix[];
}) => {
  const matrix = mergeGrants(coreGrants, ...mockGrants);
  setMockGrantMatrix(matrix);
  const apiOrigin = new URL(opts.apiBaseUrl).origin;
  return [
    createPermissionGuard({
      ...opts,
      getGrants: (request) => {
        const role = mockRoleOf(request.headers.get("Authorization"));
        return (role && matrix[role]) || [];
      },
    }),
    // origin 圍欄（msw-origin-anchor spec）：module handler 是 "*/path" 萬用 origin，非 apiBaseUrl origin 一律交給網路，
    // 否則重新整理 /users 這類與 API 同名的頁面會拿到 mock JSON 並繞過 guard
    http.all("*", ({ request }) =>
      new URL(request.url).origin === apiOrigin ? undefined : passthrough()
    ),
    // 模擬網路延遲：guard 放行後、任何 handler 之前（module handler 是 orval 產物，不各自 delay）
    http.all(new URL("*", opts.apiBaseUrl).href, () => delay(DELAY_MS)),
    ...coreMockHandlers(opts.apiBaseUrl),
  ];
};

/**
 * 測試 server 的預設 handler：只含 kernel（guard + core handler、core 矩陣）。
 * 不 import app/modules：setup 先載入 module 頁面會讓測試檔的 vi.mock 失效；需要 module handler 的測試用 build() 的 registry.mockHandlers。
 */
export const mockHandlers = createMockHandlers({
  ...operations,
  apiBaseUrl,
  mockGrants: [],
});
