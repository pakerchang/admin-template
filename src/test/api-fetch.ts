import { ApiError, fetcher } from "@/shared/api/fetcher";

/**
 * 測試用：經 mutator 打 API，但把非 2xx 攤平成 `{ status, body }` 方便斷言 status。
 * （M7 前的 `apiFetch` 介面；production 程式一律用 orval 產物或 `fetcher`）
 */
export const apiFetch = async <T>(
  path: string,
  {
    method = "GET",
    query,
    body,
  }: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    query?: object;
    body?: unknown;
  } = {}
): Promise<{ status: number; body: T }> => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {}))
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value));
  const search = params.size ? `?${params}` : "";
  try {
    const result = await fetcher<T>(`${path}${search}`, {
      method,
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    return { status: 200, body: result };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { status: error.status, body: error.body as T };
  }
};
