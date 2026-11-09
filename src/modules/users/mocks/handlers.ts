import { http } from "msw";

import {
  mockUserIdOf,
  setMockRoleResolver,
} from "@/shared/api/mock/session-store";
import {
  bodyOf,
  createCollection,
  errorResponse,
  now,
  ok,
} from "@/shared/api/mock-db";

import { users } from "./seed";
import {
  getGetMyProfileMockHandler,
  getListUsersMockHandler,
  getUpdateMyProfileMockHandler,
  getUpdateUserRoleMockHandler,
} from "./users.msw";

import type { User } from "../api/model";
import type { HttpHandler } from "msw";

const collection = createCollection(users, "user_id");
const byId = (userId: string) =>
  collection.all().find((user) => user.user_id === userId);

// users module 擁有帳號資料：guard 與 login 經 session store 查角色，讀到的是目前（可能被改過）的角色
setMockRoleResolver((userId) => byId(userId)?.role as string | undefined);

// auth module 的 login 用（經本 module 的 index.ts 公開），回傳記憶體中的那筆帳號
export const findMockUserByEmail = (email: unknown) =>
  collection.all().find((user) => user.email === email);

/** 綁 request token 的本人；無效 token → undefined */
const me = (authorization?: string | null) => {
  const userId = mockUserIdOf(authorization);
  return userId ? byId(userId) : undefined;
};

/** profile 自助可改的欄位（= UserForm 欄位扣掉 user_id / email） */
const PROFILE_FIELDS = [
  "first_name",
  "last_name",
  "phone_number",
  "address",
  "remark",
] as const;

/** 本人不存在（無效 token）→ 403；guard 已擋未登入，這裡是防線第二層（K1：非 200 由手寫 handler 回） */
const forbiddenUnlessMe = ({ request }: { request: Request }) =>
  me(request.headers.get("Authorization"))
    ? undefined
    : errorResponse(403, "forbidden");

export const usersMockHandlers: HttpHandler[] = [
  http.get("*/user/me/profile", forbiddenUnlessMe),
  http.put("*/user/me/profile", forbiddenUnlessMe),
  http.post("*/admin/user/role", async ({ request }) =>
    byId(String((await bodyOf(request)).target_user_id))
      ? undefined
      : errorResponse(404, "Not found")
  ),
  getListUsersMockHandler(collection.list),
  getGetMyProfileMockHandler(
    ({ request }) => me(request.headers.get("Authorization")) as unknown as User
  ),
  // 只套用白名單欄位；role / user_id / email 等身分與權限欄位忽略（呼叫端會送整個 TUser）
  getUpdateMyProfileMockHandler(async ({ request }) => {
    const user = me(request.headers.get("Authorization"))!;
    const body = await bodyOf(request);
    for (const key of PROFILE_FIELDS) if (key in body) user[key] = body[key];
    user.updated_at = now();
    return ok(user);
  }),
  getUpdateUserRoleMockHandler(async ({ request }) => {
    const body = await bodyOf(request);
    byId(String(body.target_user_id))!.role = body.role;
    return ok({ role: body.role });
  }),
];
