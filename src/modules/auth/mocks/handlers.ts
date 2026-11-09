import { http } from "msw";

import { findMockUserByEmail } from "@/modules/users";
import {
  issueMockToken,
  mockGrantsOfRole,
} from "@/shared/api/mock/session-store";
import { bodyOf, errorResponse } from "@/shared/api/mock-db";

import { getLoginMockHandler } from "./auth.msw";
import { DEMO_ACCOUNT } from "./seed";

import type { LoginResponse } from "../api/model";
import type { HttpHandler } from "msw";

/** 帳密不符 → undefined */
const userOf = async (request: Request) => {
  const { email, password } = await bodyOf(request);
  const user = findMockUserByEmail(email);
  return user && password === DEMO_ACCOUNT.password ? user : undefined;
};

/**
 * 帳號資料屬 users module（requires: ["users"]，經其 index.ts 查詢，不讀它的 seed / collection）。
 * 登入成功時把角色展開成 grants 放進 session（前端只認 grants，不知道 role→grant 對照，§6.1）；矩陣由 kernel 提供。
 */
export const authMockHandlers: HttpHandler[] = [
  // K1：帳密錯誤 → 401（orval handler 只回 200）
  http.post("*/api/auth/login", async ({ request }) =>
    (await userOf(request))
      ? undefined
      : errorResponse(401, "Invalid email or password")
  ),
  getLoginMockHandler(async ({ request }) => {
    const user = (await userOf(request))!;
    return {
      token: issueMockToken(String(user.user_id)),
      user: {
        user_id: user.user_id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
      },
      grants: mockGrantsOfRole(String(user.role)),
    } as LoginResponse;
  }),
];
