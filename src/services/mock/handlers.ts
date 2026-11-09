import * as seed from "@/services/mock/data";

type TRecord = Record<string, unknown>;
type THandlerContext = { query: Record<string, string>; body: TRecord };
type THandlerResult = { status?: number; body?: unknown };
export type THandler = (ctx: THandlerContext) => THandlerResult;

// ponytail: 純記憶體 mock，重新整理頁面即回到種子資料；需要持久化再改存 localStorage
const db = structuredClone({
  users: seed.users,
  tags: seed.tags,
  suppliers: seed.suppliers,
  products: seed.products,
  orders: seed.orders,
  customers: seed.customers,
  banners: seed.banners,
  staff: seed.staff,
  articles: seed.articles,
}) as unknown as Record<string, TRecord[]>;

export const DELAY_MS = import.meta.env.MODE === "test" ? 0 : 300;
const RESERVED_QUERY = ["page", "limit", "sort_by", "order", "search"];

const ok = (data?: unknown, total?: number) => ({
  body: { code: 200, msg: "success", error: "", data, total },
});
const message = (msg: string) => ({ body: { message: msg } });
const now = () => new Date().toISOString();

const listResponse = (
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

/** 一個資源的 CRUD handler：GET 列表/查詢、POST 新增、PUT 更新、DELETE 刪除 */
const resource = (
  collection: string,
  idKey: string,
  { searchField }: { searchField?: string } = {}
): Record<string, THandler> => {
  const list = () => db[collection];
  const update: THandler = ({ body }) => {
    const index = list().findIndex((item) => item[idKey] === body[idKey]);
    if (index === -1) return { status: 404, body: { error: "Not found" } };
    list()[index] = { ...list()[index], ...body, updated_at: now() };
    return message("updated");
  };

  return {
    GET: ({ query }) => listResponse(list(), query, searchField),
    POST: ({ body }) => {
      const id = `${idKey.replace(/_id$/, "")}-${Date.now()}`;
      list().unshift({
        ...body,
        [idKey]: id,
        created_at: now(),
        updated_at: now(),
      });
      return message("created");
    },
    PUT: update,
    UPDATE: update,
    DELETE: ({ body }) => {
      db[collection] = list().filter((item) => item[idKey] !== body[idKey]);
      return message("deleted");
    },
  };
};

const products = resource("products", "product_id", {
  searchField: "product_name",
});
const orders = resource("orders", "order_id");
const banners = resource("banners", "banner_id", { searchField: "title" });
const suppliers = resource("suppliers", "supplier_id", {
  searchField: "supplier_name",
});
const tags = resource("tags", "tag_id", { searchField: "tag_name" });
const staff = resource("staff", "staff_id");
const articles = resource("articles", "article_id", { searchField: "title" });
const users = resource("users", "user_id");

const currentUser = () =>
  db.users.find((user) => user.email === seed.DEMO_ACCOUNT.email)!;

export const handlers: Record<string, THandler> = {
  "POST /api/auth/login": ({ body }) => {
    const user = db.users.find((u) => u.email === body.email);
    if (!user || body.password !== seed.DEMO_ACCOUNT.password) {
      return { status: 401, body: { error: "Invalid email or password" } };
    }
    return {
      body: {
        token: `mock-token-${user.user_id}`,
        user: {
          user_id: user.user_id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
        },
      },
    };
  },

  "GET /users": users.GET,
  "GET /user/me/profile": () => ({ body: currentUser() }),
  "PUT /user/me/profile": ({ body }) => {
    Object.assign(currentUser(), body, { updated_at: now() });
    return ok(currentUser());
  },
  "POST /admin/user/role": ({ body }) => {
    const target = db.users.find((u) => u.user_id === body.target_user_id);
    if (!target) return { status: 404, body: { error: "Not found" } };
    target.role = body.role;
    return ok({ role: body.role });
  },

  "GET /admin/products": products.GET,
  "POST /admin/products": products.POST,
  "POST /admin/products/update": products.UPDATE,
  "DELETE /admin/products": products.DELETE,
  // ponytail: 上傳的 base64 直接當 file_url 回傳，不存檔
  "POST /admin/images": ({ body }) => ({
    body: { file_name: body.file_name, file_url: body.file_value },
  }),
  "DELETE /admin/images": () => message("deleted"),

  "GET /admin/order": orders.GET,
  "POST /admin/order": orders.UPDATE,
  "POST /admin/order/update": orders.UPDATE,

  "GET /admin/banners": banners.GET,
  "POST /admin/banners": banners.POST,
  "PUT /admin/banners": banners.PUT,
  "DELETE /admin/banners": banners.DELETE,

  "GET /admin/customers": ({ query }) => listResponse(db.customers, query),
  "GET /admin/transaction_history": ({ query }) =>
    listResponse(db.orders, query),

  "GET /admin/supplier": suppliers.GET,
  "POST /admin/supplier": suppliers.POST,
  "PUT /admin/supplier": suppliers.PUT,
  "DELETE /admin/supplier": suppliers.DELETE,

  "GET /admin/tag": tags.GET,
  "POST /admin/tag": tags.POST,
  "PUT /admin/tag": tags.PUT,
  "DELETE /admin/tag": tags.DELETE,

  "GET /admin/staff": staff.GET,
  // 密碼不存進 mock 狀態
  "POST /admin/staff": ({ body, query }) =>
    staff.POST({ body: { ...body, password: undefined }, query }),
  "PUT /admin/staff": staff.PUT,
  "DELETE /admin/staff": staff.DELETE,

  "GET /admin/articles": articles.GET,
  "POST /admin/articles": articles.POST,
  "PUT /admin/articles": articles.PUT,
  "DELETE /admin/articles": articles.DELETE,
};
