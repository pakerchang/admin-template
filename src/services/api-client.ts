import { mockFetch } from "@/services/mock/handlers";

import type { TUserRole } from "@/services/schemas/user";

const AUTH_STORAGE_KEY = "auth";

export type TAuthUser = {
  user_id: string;
  email: string;
  name: string;
  role: TUserRole;
};

export type TAuthSession = {
  token: string;
  user: TAuthUser;
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

type TApiFetchInit = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: object;
  body?: unknown;
};

export type TApiResponse<T> = {
  status: number;
  body: T;
};

const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;

/**
 * 全專案唯一的資料存取入口（feature hooks 只透過它取資料）。
 * ponytail: 純 UI 展示，Request 交給 mockFetch；接真後端時把 mockFetch 換回原生 fetch 即可。
 */
export const apiFetch = async <T>(
  path: string,
  { method = "GET", query, body }: TApiFetchInit = {}
): Promise<TApiResponse<T>> => {
  const url = new URL(path, baseUrl);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const token = getAuth()?.token;
  const request = new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  const response = await mockFetch(request);
  const text = await response.text();

  return {
    status: response.status,
    body: (text ? JSON.parse(text) : undefined) as T,
  };
};
