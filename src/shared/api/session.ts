import type { TGrant } from "@/shared/permission";

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

export const getAuth = (): TAuthSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TAuthSession) : null;
  } catch {
    return null;
  }
};

export const setAuth = (session: TAuthSession) =>
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

export const clearAuth = () => localStorage.removeItem(AUTH_STORAGE_KEY);
