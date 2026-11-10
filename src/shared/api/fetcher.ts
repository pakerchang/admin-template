import { getAuth } from "@/shared/api/session";

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || window.location.origin;

/** 非 2xx 回應：保留 status 與錯誤 body（`{ error }`） */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown
  ) {
    super((body as { error?: string } | undefined)?.error ?? `HTTP ${status}`);
    this.name = "ApiError";
  }
}

/** `.catch(nullOnApiError)`：非 2xx → null（呼叫端照舊 toast / 回 null），其他錯誤（網路等）照常拋出 */
export const nullOnApiError = (error: unknown): null => {
  if (error instanceof ApiError) return null;
  throw error;
};

/**
 * 全專案唯一的資料存取入口，也是 orval mutator（spec §4.5 fetcher 列、M7 AC-4）。
 * 產物傳入相對 path（與 queryKey 同一字串，不含 origin），這裡才以 `new URL(path, apiBaseUrl)` 接上 base、帶 Bearer token；
 * 回傳 HTTP body（orval `includeHttpResponseReturnType: false`），非 2xx throw `ApiError`。
 * mock 由 MSW 在 network 層攔截（預設開，`VITE_API_MOCK=false` 才關）；接真後端時 client 不改。
 */
export const fetcher = async <T>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const token = getAuth()?.token;
  const response = await fetch(
    new Request(new URL(path, apiBaseUrl), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(init.headers as Record<string, string> | undefined),
      },
    })
  );
  const text = await response.text();
  const body = text ? JSON.parse(text) : undefined;
  if (!response.ok) throw new ApiError(response.status, body);
  return body as T;
};
