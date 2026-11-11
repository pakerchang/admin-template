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

import { userSchema } from "../model/schema";

import { users } from "./seed";
import {
  getCreateUserMockHandler,
  getGetMyProfileMockHandler,
  getGetUserMockHandler,
  getListUsersMockHandler,
  getUpdateMyProfileMockHandler,
  getUpdateUserMockHandler,
  getUpdateUserRoleMockHandler,
} from "./users.msw";

import type { User } from "../api/model";
import type { TRecord } from "@/shared/api/mock-db";
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

/** 管理者編輯他人可改的欄位（role 走 updateUserRole；user_id 取自 path） */
const USER_FIELDS = ["email", ...PROFILE_FIELDS] as const;

/** 新增與表單共用同一份規則（OD-UC-3 = A） */
const createSchema = userSchema.omit({
  user_id: true,
  role: true,
  created_at: true,
  updated_at: true,
});

/** 不合法 body → 400；email 重複（不分大小寫，OD-UC-4 = A）→ 409；否則 fall through（K1：排在 orval handler 前） */
const rejectInvalidCreate = async ({ request }: { request: Request }) => {
  // bodyOf 直接 JSON.parse：非法 JSON 視同不合法 body（undefined → safeParse 失敗 → 400）
  const body = await bodyOf(request).catch(() => undefined);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, "Invalid body");
  const email = parsed.data.email.toLowerCase();
  return collection
    .all()
    .some((user) => String(user.email).toLowerCase() === email)
    ? errorResponse(409, "Email already exists")
    : undefined;
};

// 同毫秒連建也不重複（collection.create 的 Date.now() id 會撞）
let createSeq = 0;

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
  http.post("*/users", rejectInvalidCreate),
  http.get("*/users/:id", notFoundById),
  http.put("*/users/:id", notFoundById),
  getListUsersMockHandler(collection.list),
  // 只取白名單欄位；role 一律 user（OD-UC-2 = A），user_id / 時間戳由 mock 產生
  getCreateUserMockHandler(async ({ request }) => {
    const body = await bodyOf(request);
    const user: TRecord = {
      user_id: `user-${Date.now()}-${++createSeq}`,
      role: "user",
      created_at: now(),
      updated_at: now(),
    };
    for (const key of USER_FIELDS) user[key] = body[key];
    collection.all().unshift(user);
    return ok(user);
  }),
  getGetUserMockHandler(({ params }) => ok(byId(String(params.id))!)),
  getUpdateUserMockHandler(async ({ params, request }) => {
    const user = byId(String(params.id))!;
    const body = await bodyOf(request);
    for (const key of USER_FIELDS) if (key in body) user[key] = body[key];
    user.updated_at = now();
    return ok(user);
  }),
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
