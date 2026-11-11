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
  getGetUserMockHandler,
  getListUsersMockHandler,
  getUpdateMyProfileMockHandler,
  getUpdateUserMockHandler,
  getUpdateUserRoleMockHandler,
} from "./users.msw";

import type {
  ProfileUpdate,
  UpdateUserRoleBody,
  User,
  UserUpdate,
} from "../api/model";
import type { HttpHandler } from "msw";

const collection = createCollection<User>(users, "user_id");
const byId = (userId: string) =>
  collection.all().find((user) => user.user_id === userId);

// users module 擁有帳號資料：guard 與 login 經 session store 查角色，讀到的是目前（可能被改過）的角色
setMockRoleResolver((userId) => byId(userId)?.role);

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

/** 管理者編輯他人可改的欄位（role 走 updateUserRole；user_id 取自 path） */
const USER_FIELDS = ["email", ...PROFILE_FIELDS] as const;

/** path id 不存在 → 404（K1：排在 orval handler 前） */
const notFoundById = ({ params }: { params: Record<string, unknown> }) =>
  byId(String(params.id)) ? undefined : errorResponse(404, "Not found");

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
  http.get("*/users/:id", notFoundById),
  http.put("*/users/:id", notFoundById),
  getListUsersMockHandler(collection.list),
  getGetUserMockHandler(({ params }) => ok(byId(String(params.id))!)),
  getUpdateUserMockHandler(async ({ params, request }) => {
    const user = byId(String(params.id))!;
    const body = await bodyOf<UserUpdate>(request);
    for (const key of USER_FIELDS) {
      const value = body[key];
      if (value !== undefined) user[key] = value;
    }
    user.updated_at = now();
    return ok(user);
  }),
  getGetMyProfileMockHandler(({ request }) =>
    me(request.headers.get("Authorization"))!
  ),
  // 只套用白名單欄位；role / user_id / email 等身分與權限欄位忽略（呼叫端會送整個 TUser）
  getUpdateMyProfileMockHandler(async ({ request }) => {
    const user = me(request.headers.get("Authorization"))!;
    const body = await bodyOf<ProfileUpdate>(request);
    for (const key of PROFILE_FIELDS) {
      const value = body[key];
      if (value !== undefined) user[key] = value;
    }
    user.updated_at = now();
    return ok(user);
  }),
  getUpdateUserRoleMockHandler(async ({ request }) => {
    // 不驗證 role（T3 OD-T3-5 A）；形狀以產物 body 型別宣告
    const body = await bodyOf<UpdateUserRoleBody>(request);
    byId(body.target_user_id)!.role = body.role;
    return ok({ role: body.role });
  }),
];
