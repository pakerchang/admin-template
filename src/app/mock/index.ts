import { toHttpHandlers } from "@/app/mock/legacy-adapter";
import { coreGrants, mergeGrants } from "@/app/mock/permission-matrix";
import { operations } from "@/app/operations.gen";
import { handlers, mockUserOfAuthorization } from "@/services/mock/handlers";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { createPermissionGuard } from "@/shared/api/mock/permission-guard";

import type { THandler } from "@/services/mock/handlers";
import type {
  TGrant,
  TGrantMatrix,
  TOperationTable,
} from "@/shared/permission";

const LOGIN = "POST /api/auth/login";

/** 登入成功時把角色展開成 grants 放進 session（前端只認 grants，不知道 role→grant 對照，§6.1） */
const withGrants =
  (login: THandler, matrix: TGrantMatrix): THandler =>
  (ctx) => {
    const res = login(ctx);
    const body = res.body as { user?: { role: string } } | undefined;
    if ((res.status ?? 200) !== 200 || !body?.user) return res;
    return { ...res, body: { ...body, grants: matrix[body.user.role] ?? [] } };
  };

/** Authorization: Bearer <已簽發 token> → mock session 使用者角色 → 矩陣展開；無 token / 查無 session → []（R25） */
const grantsOf =
  (matrix: TGrantMatrix) =>
  (request: Request): readonly TGrant[] => {
    const role = mockUserOfAuthorization(request.headers.get("Authorization"))
      ?.role as string | undefined;
    return (role && matrix[role]) || [];
  };

/**
 * kernel 的 MSW handler（TCore.mock）：[guard, ...legacy core handler]，guard 一定在第一位（§4.3 步驟 5）。
 * mockGrants = 已安裝 module 的 `permissions.mockGrants`，與 core 矩陣合併。
 */
export const createMockHandlers = ({
  mockGrants,
  ...opts
}: TOperationTable & {
  apiBaseUrl: string;
  mockGrants: readonly TGrantMatrix[];
}) => {
  const matrix = mergeGrants(coreGrants, ...mockGrants);
  return [
    createPermissionGuard({ ...opts, getGrants: grantsOf(matrix) }),
    ...toHttpHandlers(
      { ...handlers, [LOGIN]: withGrants(handlers[LOGIN], matrix) },
      { baseUrl: opts.apiBaseUrl }
    ),
  ];
};

/**
 * 測試 server 的預設 handler：只含 core 矩陣（superadmin = "*"）。
 * 不 import app/modules：setup 先載入 pages 會讓測試檔的 vi.mock 失效；需要 module 矩陣的測試用 build() 的 registry.mockHandlers。
 */
export const mockHandlers = createMockHandlers({
  ...operations,
  apiBaseUrl,
  mockGrants: [],
});
