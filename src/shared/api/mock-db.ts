/**
 * domain-free mock 後端 helper（spec §4.5 seed / mock 列）：記憶體 collection 的 CRUD、列表過濾／排序／分頁、seed 用的小工具。
 * 每個 module 在自己的 `mocks/handlers.ts` 以 seed 建 collection（R5：不讀其他 module 的 collection），
 * 把 `list` / `create` / `update` / `remove` 當 orval `get<Op>MockHandler` 的 override；
 * 非 200（更新不存在的 id → 404）由 `notFound` 以手寫 handler 排在 orval handler 之前（K1）。
 */
import { HttpResponse } from "msw";

import type { TLang } from "@/shared/api/schema";

export type TRecord = Record<string, unknown>;
type TQuery = Record<string, string>;

const RESERVED_QUERY = ["page", "limit", "sort_by", "order", "search"];

/** 回應 body 由 YAML 定型（orval override 的回傳型別）；這裡以 return-type 推論交給呼叫端的型別 */
export const ok = <T>(data?: unknown, total?: number) =>
  ({ code: 200, msg: "success", error: "", data, total }) as T;
export const message = <T>(msg: string) => ({ message: msg }) as T;
export const now = () => new Date().toISOString();

/** request 的 query string → 物件 */
export const queryOf = (request: Request): TQuery =>
  Object.fromEntries(new URL(request.url).searchParams);

/**
 * request 的 JSON body（clone，不消耗原 request，後面的 handler 仍可讀）。
 * `T` 只是宣告形狀（通常是 orval 產物的 body 型別），不做執行期驗證（T3 OD-T3-5 A：mock 不驗 body）
 */
export const bodyOf = async <T = TRecord>(request: Request): Promise<T> => {
  const text = await request.clone().text();
  return text ? JSON.parse(text) : ({} as T);
};

export const errorResponse = (status: number, error: string) =>
  HttpResponse.json({ error }, { status });

export const listResponse = <T>(
  list: TRecord[],
  query: TQuery,
  searchField?: string
) => {
  let result = list.filter((item) =>
    Object.entries(query).every(
      ([key, value]) =>
        RESERVED_QUERY.includes(key) || String(item[key]) === value
    )
  );

  if (query.search && searchField) {
    const keyword = query.search.toLowerCase();
    result = result.filter((item) =>
      String(item[searchField]).toLowerCase().includes(keyword)
    );
  }

  if (query.sort_by) {
    const { sort_by: key } = query;
    const direction = query.order === "DESC" ? -1 : 1;
    result = [...result].sort((a, b) => {
      const [x, y] = [a[key], b[key]];
      const diff =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), undefined, { numeric: true });
      return diff * direction;
    });
  }

  const total = result.length;
  if (query.page && query.limit) {
    const limit = Number(query.limit);
    const start = (Number(query.page) - 1) * limit;
    result = result.slice(start, start + limit);
  }

  return ok<T>(result, total);
};

type TInfo = { request: Request };

/**
 * 一個資源的記憶體 collection：`all()` 讀目前資料；其餘方法直接當 orval mock handler 的 override（收 `{ request }`）。
 * ponytail: 純記憶體 mock，重新整理頁面即回到 seed；需要持久化再改存 localStorage
 */
export const createCollection = <T extends object>(
  seed: readonly T[],
  idKey: keyof T & string,
  { searchField }: { searchField?: keyof T & string } = {}
) => {
  let items = structuredClone(seed) as T[];
  const idOf = (item: T | TRecord) => (item as TRecord)[idKey];

  return {
    all: (): T[] => items,
    list: <R>({ request }: TInfo) =>
      listResponse<R>(items as TRecord[], queryOf(request), searchField),
    /** `patch` 覆寫寫入的欄位（例：密碼不存進 mock 狀態）；body 不驗證形狀（OD-T3-5 A） */
    create: async <R>({ request }: TInfo, patch: TRecord = {}) => {
      const body = { ...(await bodyOf(request)), ...patch };
      const id = `${idKey.replace(/_id$/, "")}-${Date.now()}`;
      items.unshift({
        ...body,
        [idKey]: id,
        created_at: now(),
        updated_at: now(),
      } as T);
      return message<R>("created");
    },
    /** 呼叫前由 `notFound` 擋掉不存在的 id */
    update: async <R>({ request }: TInfo) => {
      const body = await bodyOf(request);
      const index = items.findIndex((item) => idOf(item) === body[idKey]);
      items[index] = { ...items[index], ...body, updated_at: now() };
      return message<R>("updated");
    },
    remove: async <R>({ request }: TInfo) => {
      const body = await bodyOf(request);
      items = items.filter((item) => idOf(item) !== body[idKey]);
      return message<R>("deleted");
    },
    /** 手寫 resolver（排在 orval update handler 前）：body 的 id 不存在 → 404，存在 → fall through */
    notFound: async ({ request }: TInfo) => {
      const body = await bodyOf(request);
      return items.some((item) => idOf(item) === body[idKey])
        ? undefined
        : errorResponse(404, "Not found");
    },
  };
};

// ponytail: 以 inline SVG 當圖片，離線可用、不會有外部請求錯誤
export const placeholderImage = (label: string, color = "#6366f1") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" fill="#fff" font-family="sans-serif" font-size="36" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  )}`;

/** seed 用多語字串（th 沿用 en） */
export const lang = (en: string, zh: string): TLang => ({ en, zh, th: en });

/** seed 用時間：2025-06-30 往前 daysAgo 天 */
export const iso = (daysAgo: number) =>
  new Date(Date.UTC(2025, 5, 30) - daysAgo * 86_400_000).toISOString();
