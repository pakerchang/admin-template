import { corePermissions, grantSchema, parseGrants } from "@/shared/permission";

import type { TGrant } from "@/shared/permission";
import type { z } from "zod";

const AUTH_STORAGE_KEY = "auth";

export type TAuthUser = {
  user_id: string;
  email: string;
  name: string;
  /** shared 不認識 domain 的 role enum（spec §5.1）；前端判權只認 grants */
  role: string;
};

export type TAuthSession = {
  token: string;
  user: TAuthUser;
  /** 登入時後端（mock：矩陣展開）給的 grants；前端只認它，不讀 role（§6.1）。M4 前存的舊 session 沒有此欄 */
  grants?: TGrant[];
};

/**
 * grants 邊界 schema（typed-contracts T1 AC-5）：由 kernel build() 依已 .use() 的 module 注入（shared 不 import app）；
 * 注入前只認 core 目錄。
 */
let grantsSchema: z.ZodType<TGrant> = grantSchema([corePermissions.catalog]);
export const setGrantSchema = (schema: z.ZodType<TGrant>) => {
  grantsSchema = schema;
};

/** 不合法 grant 丟棄；沒有 grants 欄（M4 前的舊 session）維持 undefined */
const withValidGrants = (session: TAuthSession): TAuthSession =>
  session.grants === undefined
    ? session
    : { ...session, grants: parseGrants(grantsSchema, session.grants) };

export const getAuth = (): TAuthSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? withValidGrants(JSON.parse(raw) as TAuthSession) : null;
  } catch {
    return null;
  }
};

export const setAuth = (session: TAuthSession) =>
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(withValidGrants(session))
  );

export const clearAuth = () => localStorage.removeItem(AUTH_STORAGE_KEY);
