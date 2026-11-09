import { findMockUserByEmail } from "@/modules/users";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";
import {
  issueMockToken,
  mockGrantsOfRole,
} from "@/shared/api/mock/session-store";

import { DEMO_ACCOUNT } from "./seed";

/**
 * 帳號資料屬 users module（requires: ["users"]，經其 index.ts 查詢，不讀它的 seed / collection）。
 * 登入成功時把角色展開成 grants 放進 session（前端只認 grants，不知道 role→grant 對照，§6.1）；矩陣由 kernel 提供。
 */
export const authMockHandlers = toHttpHandlers(
  {
    "POST /api/auth/login": ({ body }) => {
      const user = findMockUserByEmail(body.email);
      if (!user || body.password !== DEMO_ACCOUNT.password) {
        return { status: 401, body: { error: "Invalid email or password" } };
      }
      const role = String(user.role);
      return {
        body: {
          token: issueMockToken(String(user.user_id)),
          user: {
            user_id: user.user_id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            role: user.role,
          },
          grants: mockGrantsOfRole(role),
        },
      };
    },
  },
  { baseUrl: apiBaseUrl }
);
