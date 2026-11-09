import { apiBaseUrl } from "@/shared/api/fetcher";
import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";
import {
  mockUserIdOf,
  setMockRoleResolver,
} from "@/shared/api/mock/session-store";
import { createCollection, now, ok } from "@/shared/api/mock-db";

import { users } from "./seed";

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

export const usersMockHandlers = toHttpHandlers(
  {
    "GET /users": collection.GET,
    // 綁 request token 的本人；guard 已擋未登入，這裡的 403 是防線第二層
    "GET /user/me/profile": ({ authorization }) => {
      const user = me(authorization);
      return user
        ? { body: user }
        : { status: 403, body: { error: "forbidden" } };
    },
    // 只套用白名單欄位；role / user_id / email 等身分與權限欄位忽略（呼叫端會送整個 TUser）
    "PUT /user/me/profile": ({ authorization, body }) => {
      const user = me(authorization);
      if (!user) return { status: 403, body: { error: "forbidden" } };
      for (const key of PROFILE_FIELDS) if (key in body) user[key] = body[key];
      user.updated_at = now();
      return ok(user);
    },
    "POST /admin/user/role": ({ body }) => {
      const target = collection
        .all()
        .find((u) => u.user_id === body.target_user_id);
      if (!target) return { status: 404, body: { error: "Not found" } };
      target.role = body.role;
      return ok({ role: body.role });
    },
  },
  { baseUrl: apiBaseUrl }
);
