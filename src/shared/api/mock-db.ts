/**
 * domain-free mock 後端 helper（spec §4.5 seed 列）：記憶體 collection 的 CRUD、列表過濾／排序／分頁、seed 用的小工具。
 * 每個 module 在自己的 `mocks/` 以 seed 建 collection（R5：不讀其他 module 的 collection）。
 * handler 形狀是舊的 `METHOD path` 表（`THandler`），經 `shared/api/mock/legacy-adapter` 轉成 MSW handler；M7b 換 orval 產物。
 */
import type { THandler } from "@/shared/api/mock/legacy-adapter";
import type { TLang } from "@/shared/api/schema";

export type TRecord = Record<string, unknown>;

const RESERVED_QUERY = ["page", "limit", "sort_by", "order", "search"];

export const ok = (data?: unknown, total?: number) => ({
  body: { code: 200, msg: "success", error: "", data, total },
});
export const message = (msg: string) => ({ body: { message: msg } });
export const now = () => new Date().toISOString();

export const listResponse = (
  list: TRecord[],
  query: Record<string, string>,
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

  return ok(result, total);
};

/**
 * 一個資源的記憶體 collection：`all()` 讀目前資料；GET 列表/查詢、POST 新增、PUT/UPDATE 更新、DELETE 刪除。
 * ponytail: 純記憶體 mock，重新整理頁面即回到 seed；需要持久化再改存 localStorage
 */
export const createCollection = (
  seed: readonly object[],
  idKey: string,
  { searchField }: { searchField?: string } = {}
) => {
  let items = structuredClone(seed) as TRecord[];
  const update: THandler = ({ body }) => {
    const index = items.findIndex((item) => item[idKey] === body[idKey]);
    if (index === -1) return { status: 404, body: { error: "Not found" } };
    items[index] = { ...items[index], ...body, updated_at: now() };
    return message("updated");
  };

  return {
    all: () => items,
    GET: (({ query }) => listResponse(items, query, searchField)) as THandler,
    POST: (({ body }) => {
      const id = `${idKey.replace(/_id$/, "")}-${Date.now()}`;
      items.unshift({
        ...body,
        [idKey]: id,
        created_at: now(),
        updated_at: now(),
      });
      return message("created");
    }) as THandler,
    PUT: update,
    UPDATE: update,
    DELETE: (({ body }) => {
      items = items.filter((item) => item[idKey] !== body[idKey]);
      return message("deleted");
    }) as THandler,
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
