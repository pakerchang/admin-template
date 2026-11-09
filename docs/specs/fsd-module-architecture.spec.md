# Microkernel + Modular Monolith 目標架構 Spec

> 狀態：Draft r2（依 owner 2026-11-09 裁決修訂，待 review）・日期：2026-11-09・分支：`docs/fsd-architecture`
> 範圍：只定義目標架構與重構切棒；**不改 `src/`、不改 `CLAUDE.md`**。CLAUDE.md / project skills / `docs/TRAPS.md` 由後續棒依本 spec 產出。
> 檔名沿用 `fsd-module-architecture.spec.md`（路徑不變）；架構定名已改，FSD 只作命名參考（§2）。

## 0. 目標、定名與鎖定決策

### 0.1 定名（load-bearing）

最上層架構 = **Microkernel（Plugin）Architecture + Modular Monolith（vertical slice）**：

- **Microkernel**：`src/app/` 是 kernel（`createApp().use()`、registry、router 組裝、MSW guard、shell 掛載），本身不含任何 domain；功能全部以 plug-in module 掛上。
- **Modular Monolith（vertical slice）**：每個 module 是一條垂直切片 `src/modules/<id>/{api,model,ui,mocks,index.ts}`，單 repo、單 build、單部署；module 之間只經 `index.ts` 往來。
- **FSD 降為命名參考**：沿用 `shared` / `api` / `model` / `ui` 等 segment 名稱，**不套 FSD 官方 layer / slice 規則，不用 steiger**。

達成三個目標（同 r1）：

1. 共用基本架構（kernel `app/` + domain-free `shared/` + 可替換 `shells/`）
2. 能整套或逐頁換掉 UI（shell 替換 + 依 page id 覆寫頁面）
3. 能把整個電商 domain 換成別的 domain（刪 `.use()` 一行 + 刪 `modules/<id>/`）

### 0.2 Owner 鎖定決策（不得改，下文以 D-編號引用）

| ID | 決策 |
|----|------|
| D1 | 「換 UI」= 換 UI shell / 頁面組裝（layout、pages、widgets）；資料邏輯共用。不做 UI 元件庫 adapter。 |
| D2 | Plugin = feature module 註冊：`createApp().use(module)`，`defineModule({ id, routes, nav, i18n, mockHandlers, permissions })`。UI slot 延後：未來以新增 `slots` 欄位 + `<Slot>` 擴充，不需重構；本 spec 不設計 slot 契約。 |
| D3 | 單 repo；依賴方向以 lint 強制（§7）；不做 pnpm monorepo。 |
| D4 | core domain-agnostic。通用 module：auth/login、users、team-members；domain module：orders、product、suppliers、consumers、banners、articles、tags。驗收：刪掉所有 domain module 的 `.use()` + 目錄，app 仍能 build 並跑起來。 |
| D5 | 權限矩陣 role × resource × action（`orders:read` / `orders:update` / `orders:export`）。module 宣告自己的 resource/action；矩陣資料由 mock 提供。架構層強制四點：route guard、nav 過濾、操作層宣告式 permission、mock API 403（**mock 層改由 MSW guard 執行**）。取代 `useUserPermissions()` 寫死語意方法。 |

### 0.3 Owner 2026-11-09 裁決（本版新增，不得改）

| ID | 裁決 | 落點 |
|----|------|------|
| R1 | 架構改定名為 Microkernel + Modular Monolith；FSD 只當命名參考、不用 steiger | §0.1、§2、§7 |
| R2 | 換 UI：module 拆 headless（`model`：hooks / schema / permissions / columns）+ 預設 `ui`；shell / theme 依 page id 覆寫頁面（`override('orders.list', Page)`），可逐頁替換 | §4.4 |
| R3 = OQ-1 | module 內嵌（`modules/<id>/{api,model,ui,mocks}`）；D4 驗收形狀 = 刪 `.use()` 一行 + 刪 `modules/<id>/` | §3、§8.2 |
| R4 = OQ-2 | 接受 typed route 寬化；module 內用 route 物件導航 | §4.6 |
| R5 = OQ-3 | 各 module 自帶 seed | §4.5 |
| R6 = OQ-4 | ABAC 現在一起設計、不定案 | §6A |
| R7 = OQ-5 | ESLint 9 flat config 是重構前置（deps chain 負責）；邊界規則用 eslint-plugin-boundaries 寫在 flat config | §7、§9 M0 |
| R8 = OQ-6 | `defineModule` 加 `requires`；createApp 啟動時缺依賴 fail fast | §4.1、§4.3 |
| R9 = OQ-7 | `/` redirect 到第一個可見 nav | §4.3 |
| R10 = OQ-8 | 403 在 layout 內容區渲染 `UnauthorizedPage`（保留 URL 與 shell），不做 `/403` route | §6.2 |
| R11 | API 層：orval；手寫 openapi.yaml 為契約真相；`mockHandlers` 改 MSW `HttpHandler[]`；kernel 最前面掛 `http.all('*')` 權限 guard；權限表由 module 宣告，經 operationId → permission 中間格式（保留日後轉 YAML `x-permission` 的路徑）；orval 產物與 MSW handler 落 `modules/<id>/{api,mocks}`，shared 只留 fetcher mutator 與 guard | §4.5、§6.5 |
| R12 | deps P0（Node 22）、P1（ESLint 9）為 M0 前置；milestone 依新樹重切，每棒獨立 merge 且 `pnpm build && pnpm exec vitest run` 綠 | §9 |

---

## 1. 現況 anchor（2026-11-09，master `6029bf0`）

| 主題 | Anchor | 觀察 |
|------|--------|------|
| 路由樹 | `src/router/routes.tsx:1-21` | 靜態 import 全部 page，core 直接依賴 domain |
| | `src/router/routes.tsx:25-32` / `:52-59` | login / protected 守衛以 `getAuth()` 寫在 `beforeLoad` |
| | `src/router/routes.tsx:91-100` | orders 用 `loader` 做 `/orders` → `/orders/order-list` redirect |
| | `src/router/routes.tsx:186-212` | `routeTree` 手工組裝；無 `/` index route |
| | `src/router/index.ts:10-14` | `Register` 宣告 → 全專案 typed `navigate({ to })` 依賴此靜態樹 |
| | `src/router/__root.tsx:10-24` | QueryClient / devtools / Toaster provider 住在 root route |
| 啟動 | `src/main.tsx:5-12` | side-effect import i18n、`RouterProvider` |
| Layout | `src/components/layouts/ProtectedAppLayout.tsx:6-13` | layout（core）import `@/pages/users/hooks/use-user`（通用 module）的 `canAccessAdminPanel`；無權限時 `:11-13` 以 `UnauthorizedPage` **取代整個 layout**（無 sidebar） |
| | `src/components/shared/UnauthorizedPage.tsx:15` | `h-screen` 全螢幕置中，放進內容區需改高度 |
| | `src/components/layouts/AuthLayout.tsx:17-32` | 登入頁（含 mutation）以 layout 身分存在 |
| Nav | `src/constants/sidebar.tsx:14-66` | 靜態 domain 選單（customers / products / orders…），TransKey label |
| | `src/components/shared/AppSidebar.tsx:40,79-127` | 直接讀 `sidebarMenu`；`:48-52` logout；`:58-61` 語系清單寫死 |
| Breadcrumb | `src/hooks/use-breadcrumb.ts:36-58` | `switch(segment)` 寫死 domain segment → label |
| API | `src/services/api-client.ts:7-31` | session 型別 + `getAuth/setAuth/clearAuth`；`TAuthUser.role: TUserRole` 來自 users schema（`:3`） |
| | `src/services/api-client.ts:50-78` | `apiFetch` → `mockFetch`（`:71`），非 `fetch` |
| Mock | `src/services/mock/handlers.ts:9-19` | 單一 `db` 含全部 domain collection |
| | `src/services/mock/handlers.ts:73-105` | 通用 CRUD `resource()` helper |
| | `src/services/mock/handlers.ts:123-199` | 單一 `handlers` 表；`:174-176` consumers 的 transaction_history 讀 orders 資料 |
| | `src/services/mock/handlers.ts:202-221` | `mockFetch`：`METHOD path` 查表、404 fallback |
| | `src/services/mock/data.ts:25-50,177,217` | DEMO 帳號；customers / staff seed 由 users 衍生 |
| | `src/services/__tests__/api-client.test.ts:5,109` | 測試直接 import / 呼叫 `mockFetch`（MSW 替換時需改寫） |
| Schema | `src/services/schemas/*.ts`、`src/services/types/schema.ts:3-55` | domain zod 與通用 primitive（pagination / lang / image）混放 |
| | `src/services/schemas/user.ts:3-12` | role enum（7 個 role）寫死在 users schema |
| ABAC 素材 | `src/services/schemas/article.ts:7`、`src/services/schemas/orders.ts:45,52`、`src/services/schemas/user.ts:19-23` | article `user_id`（作者）、order `order_status` / `user_id`、user `phone_number` / `address`（PII） |
| 權限 | `src/pages/users/hooks/use-user.ts:146-174` | `useUserPermissions()` 寫死 `canManageUsers` 等；消費點 `ProtectedAppLayout.tsx:9`、`src/pages/users/UserList.tsx:28,167` |
| i18n | `src/locales/types.ts:1-16`、`src/locales/i18n.ts:10-44` | 單一 `translation` namespace，自寫 backend 讀 `en/zh.json` |
| | `src/constants/locales.ts:14-20`、`src/types/i18next.d.ts:4-16` | `TransKey` 由 `zh.json` 遞迴推導，`t()` 參數被收窄成此型別 |
| | `src/locales/en.json`（740 行） | domain key 散在 `order` / `dashboard.menu.*` / `toast.*` / `table.headers.*` / `validation.image.banner` |
| image-validation | `src/plugins/image-validation/{base-rules,manager.ts,types.ts}` | 通用；`presets/banner/*` 為 banner domain 規則 |
| | 消費點 | `components/shared/dialog/ImageUploadDialog.tsx:25`、articles / product / banners 表單 |
| core→domain 汙染 | `src/components/shared/Tags.tsx:4,16-30` | 共用 Tag 依 `EOrderStatus` 決定顏色 |
| 跨 page import | `pages/consumers/components/OrderCard.tsx:6`、`pages/product/Product{Create,Draft,Edit}Form.tsx` | consumers→orders util；product→suppliers / tags hooks（→ `requires`） |
| ESLint | `.eslintrc.json`（legacy config，ESLint 8.57.1，`package.json:81`） | 已有 `import/no-cycle`、`import/resolver typescript`；無邊界規則 |
| 環境 | `package.json:8` | `engines.node >=20`（M0 前置升到 22） |
| 測試 | `vite.config.ts:14-18`、`src/test/setup.ts` | vitest 設定在 vite config；14 個測試檔；setup 只有 jest-dom + cleanup |
| 靜態資源 | repo 無 `public/` | MSW browser worker 需 `public/mockServiceWorker.js`（`msw init` 產生） |

---

## 2. 命名 anchor（Named Concept Anchor）

URL 皆於 2026-11-09 以 `curl -L` 自驗 HTTP 200。

### 2.1 主架構

- **Microkernel（Plug-in）Architecture**：core system 只提供最小運作機制與 plug-in 契約；功能以獨立 plug-in 掛上，plug-in 之間不直接耦合，由 core 的 registry 連接。— Mark Richards, *Lesson 160 – Microkernel Architecture*：https://www.developertoarchitect.com/lessons/lesson160.html
  - 本 spec 對應：core system = `src/app/`（kernel）+ `src/shared/`（kernel 給 plug-in 用的 domain-free 函式庫）；plug-in = `src/modules/<id>`；registry = `createApp().use()` 收集的 `TRegistry`（§4.2）；plug-in contract = `defineModule`（§4.1）。
- **Modular Monolith**：單一部署單元，內部依業務能力切成高內聚、低耦合的 module，module 只透過公開介面互動。— Mark Richards, *Lesson 159 – Modular Monolith Architecture*：https://www.developertoarchitect.com/lessons/lesson159.html；Kamil Grzybek, *Modular Monolith: A Primer*：https://www.kamilgrzybek.com/blog/posts/modular-monolith-primer
- **Vertical Slice**：依功能而非技術層切分，一個切片內含該功能從資料存取到 UI 的全部程式碼。— Jimmy Bogard, *Vertical Slice Architecture*：https://www.jimmybogard.com/vertical-slice-architecture/
  - 本 spec 對應：`modules/<id>/` 內含 `api`（契約與 client）→ `model`（headless 邏輯）→ `ui`（預設畫面）+ `mocks`（MSW handler 與 seed）。

### 2.2 FSD（僅命名參考）

- 借用：`shared` 頂層名、segment 名 `api` / `model` / `ui` / `lib` / `config`、「以 `index.ts` 為唯一公開 API」的習慣。— https://feature-sliced.design/docs/reference/layers
- **不採用**：FSD 的 `pages / widgets / features / entities` 水平 layer、「只能 import 嚴格下層」規則、`@x` cross-import、steiger 檢查。r1 的 FSD 水平多目錄方案整段作廢。

### 2.3 工具

- MSW（browser `setupWorker` / node `setupServer`、`http.all`）：https://mswjs.io/docs/ 、https://mswjs.io/docs/api/http 、https://mswjs.io/docs/integrations/browser 、https://mswjs.io/docs/integrations/node
- orval（`mode: 'tags-split'`、`override.mutator`、MSW 產出）：https://orval.dev/ 、https://orval.dev/docs/reference/configuration/output 、https://orval.dev/docs/guides/custom-client 、https://orval.dev/docs/guides/msw
- eslint-plugin-boundaries（flat config、element 分類、`dependencies` 規則）：https://www.jsboundaries.dev/docs/quick-start/ 、https://www.jsboundaries.dev/docs/setup/elements/ 、https://www.jsboundaries.dev/docs/rules/dependencies/
- ESLint flat config：https://eslint.org/docs/latest/use/configure/configuration-files
- npm registry 實查版本（2026-11-09）：msw `3.0.4`、orval `8.47.0`、eslint-plugin-boundaries `7.4.2`（peer `eslint >=6.0.0`，engines `node >=18.18`）

---

## 3. 目標目錄樹

```
src/
├── app/                          # ★ kernel（domain-free）
│   ├── main.tsx                  # 入口：createApp({ shell }).use(...).mount("#root")
│   ├── modules.ts                # ★ 唯一列出所有 .use() 的檔案（D4 刪的就是這裡的行）
│   ├── kernel/                   # createApp、registry、build()、驗證、override 解析（§4.2–4.4）
│   ├── router/                   # root / auth / protected route 建構、index redirect、ForbiddenBoundary
│   ├── mock/                     # MSW 啟動（setupWorker）、權限 guard 組裝（§6.5）
│   └── providers/                # QueryClient、i18n、Toaster、RegistryProvider
├── shared/                       # ★ domain-free 函式庫（kernel 與 module 皆可用）
│   ├── ui/                       # shadcn（原 components/ui）+ DataTable、EditActions、FormSubmit、Guarded…
│   ├── lib/                      # cn、array-helpers、toast、image-validation（通用部分）…
│   ├── api/                      # fetcher（orval mutator）、session store、envelope 型別、MSW guard factory、mock-db helper
│   ├── permission/               # can()、型別、useCan、ForbiddenError（ABAC 擴充點，§6A）
│   ├── module/                   # defineModule / defineRoutes 型別與 helper、useVisibleNav、TPageRegistry
│   ├── i18n/                     # i18next 實例、core 字典、TransKey 宣告合併
│   └── config/                   # locales 常數、env
├── shells/
│   └── default/                  # ★ 可替換 UI shell：ProtectedLayout、AuthLayout、Sidebar、Navbar、Breadcrumb、Forbidden、pages 覆寫表
└── modules/
    ├── auth/  users/  team-members/                                  # generic
    └── orders/ product/ suppliers/ consumers/ banners/ articles/ tags/  # domain
        └── <id>/
            ├── index.ts          # defineModule(...) + 具名公開 API（唯一對外入口）
            ├── api/              # openapi.yaml（契約真相）+ orval 產物（client / zod / operations 表）
            ├── model/            # headless：query hooks、form schema、permissions、table columns、routes 定義
            ├── ui/               # 預設頁面與元件（可被 shell 覆寫）
            ├── mocks/            # MSW HttpHandler[]（包 orval 產的 handler）+ seed
            └── locales/{en,zh}.json + augment.d.ts
```

### 3.1 依賴方向（§7 lint 強制）

```
app ──► shells ──► shared
 │        │          ▲
 │        └──► modules/<x>/index.ts（只為 override 取 headless model）
 └──► modules/<x>/index.ts ──► 同 module 的 api / model / ui / mocks ──► shared

module 內：ui ──► model ──► api ──► shared        mocks ──► api、shared
跨 module：modules/<a>/** ──► modules/<b>/index.ts（b ∈ a.requires）
```

- `shared` 不 import 任何 `app` / `shells` / `modules`（domain-free 的機械保證）。
- `app` 只 import module 的 `index.ts`（`app/modules.ts` 一處），不碰 module 內部。
- `shells` 不 import module 內部；要覆寫某頁時只經該 module `index.ts` 公開的 headless API。

### 3.2 `index.ts` 的形狀

`index.ts` 是 module 唯一對外入口：`export default defineModule({...})` 給 kernel，具名 export 只放 **headless 公開 API**（給 `requires` 它的 module 與覆寫它頁面的 shell 用）。

```ts
// modules/suppliers/index.ts
export default defineModule({ id: "suppliers", /* ... */ });
export { useSupplierOptions } from "./model/use-supplier-options";   // product 表單用
export type { TSupplier } from "./api/generated/model";
```

---

## 4. Kernel 與 Module 契約

### 4.1 型別草案（`shared/module`）

```ts
// shared/module/types.ts
import type { AnyRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";
import type { HttpHandler } from "msw";
import type { TPermission, TModulePermissions } from "@/shared/permission";

export type TLocale = "en" | "zh";

/** 可覆寫頁面的 id 清單，module 以 declaration merging 擴充（同 §5.4 i18n 手法）；刪 module 目錄即移除 */
export interface TPageRegistry {}            // 例：{ "orders.list": true; "orders.details": true }
export type TPageId = Extract<keyof TPageRegistry, string>;

export type TNavItem = {
  id: string;
  label: string;              // i18n key，必須以 `${moduleId}.` 開頭
  to: string;                 // 絕對路徑（跨 module 導航只經 nav 字串）
  icon?: ComponentType<{ className?: string }>;
  permission: TPermission;    // 必填，nav 過濾依據（§6.3）
  order?: number;             // 排序，預設 100
  children?: Omit<TNavItem, "icon" | "children">[];
};

export type TRouteContext = {
  parent: AnyRoute;                                  // protected layout route（或 public root）
  guarded: typeof import("@/shared/permission").guardedRoute;   // §6.2
  page: <C extends ComponentType<any>>(id: TPageId, Default: C) => ComponentType<any>; // §4.4 override 解析
};

export type TModule = {
  id: string;                                        // kebab-case，唯一
  kind: "generic" | "domain";                        // D4 驗收腳本依此挑出 domain
  requires?: readonly string[];                      // ★ R8：依賴的 module id；缺 → createApp 啟動 fail fast
  routes?: (ctx: TRouteContext) => AnyRoute[];       // 掛在 protected 下的子樹（建議經 defineRoutes，§4.6）
  publicRoutes?: (ctx: { parent: AnyRoute }) => AnyRoute[];  // 例：/login
  nav?: TNavItem[];
  i18n?: Record<TLocale, Record<string, unknown>>;   // 頂層 key 必須 === id
  mockHandlers?: HttpHandler[];                      // ★ R11：MSW handler（orval 產物 + override 接 seed），§4.5
  permissions?: TModulePermissions;                  // resources + operations + mockGrants，§6.1
  // future: slots?: ...（D2：以新增欄位 + <Slot> 擴充，不改既有欄位）
};

export const defineModule = <const M extends TModule>(m: M): M => m;   // 純型別輔助
```

### 4.2 `createApp` / registry（`app/kernel`）

```ts
// shared/module/shell.ts（型別住 shared，讓 shells 不必 import app）
export type TShell = {
  id: string;
  ProtectedLayout: ComponentType;                    // 內含 <Outlet />，內容區負責顯示 403（§6.2）
  AuthLayout: ComponentType;                         // 內含 <Outlet />
  Forbidden: ComponentType<{ permission?: TPermission }>;   // R10：內容區 403 畫面（預設 = UnauthorizedPage）
  pages?: Partial<Record<TPageId, ComponentType<any>>>;     // 逐頁覆寫（§4.4）
};

// app/kernel/create-app.ts
export type TRegistry = {
  modules: readonly TModule[];
  nav: TNavItem[];                                   // 依 order 排序、未過濾
  permissions: TPermissionCatalog;                   // resource → actions
  operations: TOperationPermissions;                 // operationId → permission（§6.5 中間格式）
  mockHandlers: HttpHandler[];                       // [guard, ...core, ...modules]
  i18n: Record<TLocale, Record<string, unknown>>;
};

export const createApp = ({ shell }: { shell: TShell }) => {
  const modules: TModule[] = [];
  const overrides = new Map<TPageId, ComponentType<any>>();
  const app = {
    use(m: TModule) { modules.push(m); return app; },
    override(id: TPageId, page: ComponentType<any>) { overrides.set(id, page); return app; },
    build() { return build({ modules, shell, overrides }); },   // 純函式，§4.3
    async mount(selector: string) {
      const { router, registry } = app.build();                // 驗證失敗在這裡 throw（fail fast）
      if (import.meta.env.VITE_API_MOCK === "true") await startMockWorker(registry);  // app/mock，§6.5
      registerI18n(registry.i18n);
      render(selector, router, registry);
    },
  };
  return app;
};
```

```ts
// app/modules.ts —— 唯一的 .use() 清單
export const installModules = (app: TApp) =>
  app
    .use(authModule).use(usersModule).use(teamMembersModule)            // generic
    .use(ordersModule).use(productModule).use(suppliersModule)          // domain
    .use(consumersModule).use(bannersModule).use(articlesModule).use(tagsModule);
```

`.use()` 順序不影響 `requires` 檢查（檢查在 `build()` 一次做完）；只影響 nav 同 `order` 時的穩定排序與 MSW handler 先後。

### 4.3 組裝流程（`build()`，純函式，可單元測試）

1. **驗證（任一失敗 → throw，訊息含 module id；dev 啟動即爆、測試可斷言）**
   1. module `id` 不重複。
   2. **`requires`（R8）**：每個 `m.requires[i]` 都必須是已 `.use()` 的 module id，否則 `throw new Error(\`module "${m.id}" requires "${dep}" but it is not installed\`)`；`requires` 形成環 → throw。
   3. `i18n` 每個 locale 的頂層 key 只能是 `id`。
   4. nav `permission` 的 resource 必須在某 module 的 `permissions.resources` 宣告過。
   5. `permissions.operations` 的 operationId 跨 module 不重複、不衝突（同 PoC `fromModules` 的 conflict 檢查）。
   6. `createApp().override(id)` 的 id 必須存在於已安裝 module 的頁面集合；`shell.pages` 中不存在的 id **忽略**（shell 為 generic，可能涵蓋未安裝的 module，見 §4.4）。
2. **Router tree**：
   ```ts
   const authRoute = createAuthRoute(rootRoute, shell.AuthLayout);            // 已登入 → redirect "/"
   const protectedRoute = createProtectedRoute(rootRoute, shell.ProtectedLayout); // 未登入 → /login；缺 app:access → ForbiddenError（§6.2）
   const page = resolvePage({ modules, shell, overrides });                   // §4.4
   const tree = rootRoute.addChildren([
     authRoute.addChildren(modules.flatMap(m => m.publicRoutes?.({ parent: authRoute }) ?? [])),
     protectedRoute.addChildren([
       createIndexRedirect(protectedRoute, registry.nav),   // R9："/" → 第一個 can() 為真的 nav.to；全無 → 渲染 shell.Forbidden
       ...modules.flatMap(m => m.routes?.({ parent: protectedRoute, guarded: guardedRoute, page }) ?? []),
     ]),
   ]);
   ```
3. **Nav**：`modules.flatMap(m => m.nav ?? []).sort(byOrder)`，經 `RegistryProvider` 給 shell；shell 只經 `useVisibleNav()` 取用（§6.3）。
4. **i18n**：core 字典（`shared/i18n/locales`）為 base，各 module 以 `i18n.addResourceBundle(lng, "translation", { [id]: dict }, true, false)` 深合併進同一 namespace（[i18next API](https://www.i18next.com/overview/api)）。
5. **MSW handlers**：`[createPermissionGuard({ routes, permissions: operations, getGranted }), ...coreHandlers, ...modules.flatMap(m => m.mockHandlers ?? [])]`；guard 一定在第一位（§6.5）。
6. **Permissions**：彙整 `TPermissionCatalog`、`TOperationPermissions`；`mockGrants` 併入 mock 端矩陣（§6.1）。

### 4.4 換 UI：headless model + 頁面覆寫（R2）

**拆分**：module 的 `model/` 是 headless（query hooks、form schema、permissions、table columns 定義、route 定義），`ui/` 是預設畫面。覆寫頁面時只換 `ui`，`model` 共用（D1）。

**page id**：`${moduleId}.${pageName}`（例 `orders.list`、`orders.details`、`users.edit`）。module 於 `model/routes.ts` 建 route 時用 `ctx.page(id, DefaultPage)` 取得最終元件，並以 declaration merging 把 id 加進 `TPageRegistry`：

```ts
// modules/orders/model/routes.ts
declare module "@/shared/module" {
  interface TPageRegistry { "orders.list": true; "orders.details": true }
}
export const ordersRoutes = defineRoutes((ctx) => {
  const base = ctx.guarded({ getParentRoute: () => ctx.parent, path: "orders", permission: "orders:read" });
  const list = ctx.guarded({
    getParentRoute: () => base, path: "order-list", permission: "orders:read",
    component: ctx.page("orders.list", OrderListPage),
  });
  const details = ctx.guarded({
    getParentRoute: () => base, path: "order-details/$id", permission: "orders:read",
    component: ctx.page("orders.details", OrderDetailsPage),
  });
  return { base: base.addChildren([list, details]), list, details };
});
```

**覆寫 API（型別草案）**：

```ts
// 方式 A：app 層逐頁覆寫（最高優先）
createApp({ shell: defaultShell }).override("orders.list", CompactOrderListPage);

// 方式 B：shell / theme 自帶覆寫表
export const compactShell: TShell = {
  ...defaultShell,
  id: "compact",
  pages: { "orders.list": CompactOrderListPage },
};

// 覆寫頁只用 module 公開的 headless API
// shells/compact/pages/orders-list.tsx
import { useOrderListModel, orderColumns } from "@/modules/orders";   // index.ts 具名 export
```

**解析順序（`resolvePage`，build 期一次解析，非 render 期查表）**：

1. `createApp().override(id, Page)` — app 層，最後呼叫者勝；id 不存在 → throw（typo 保護）
2. `shell.pages[id]` — shell / theme 覆寫；id 不存在（module 未安裝）→ 忽略
3. module 預設 `ui`（`ctx.page` 的 `Default` 參數）

**型別保證**：`TPageId` 由已存在的 module 目錄 augment 而來，刪 module 後 `override("orders.list")` 會 tsc 失敗（編譯期 fail fast）。default shell 屬 core，**不得**在 `pages` 覆寫 domain 頁（否則 D4 core-only 會因 excess property 編譯失敗）——§7 以 boundaries 禁 `shells/default` import `modules/**` 機械保證。

### 4.5 API 層：orval + MSW（R11；輸出切法待 api chain PoC 確認）

> **待 api chain PoC 確認**：orval 的實際輸出目錄、per-module 設定方式、mutator 簽名、msw 3.x 相容性以 PoC（`admin-template-api-orval-poc` worktree `poc/orval/`，2026-11-09 尚未產出報告）結論為準。下列是**契約**，不是產物結構的定案。

**契約**：

| 項目 | 契約 |
|------|------|
| 契約真相 | 手寫 OpenAPI YAML；每個 operation 必有 `operationId`（camelCase，跨 module 唯一）與 `tags: [<moduleId>]` |
| YAML 放哪 | 建議 per-module `modules/<id>/api/openapi.yaml`，共用 component（envelope `code/msg/error/data/total`、pagination、error、bearerAuth）放 `shared/api/openapi/common.yaml` 以 `$ref` 引用（理由：D4 刪目錄即刪契約；見 §10 OQ-9） |
| 產物 | client（react-query + fetch）、zod、MSW handler、`operations.gen.ts`（operationId ↔ method/path 路由表）落 `modules/<id>/api/generated/`，產物進 git；CI 於 gen 後 `git diff --exit-code` |
| fetcher | `shared/api/fetcher.ts` 為 orval `override.mutator`：組 baseUrl、帶 `Authorization: Bearer <token>`、解 envelope、403 統一 toast、401 清 session |
| mock | `modules/<id>/mocks/handlers.ts` 匯出 `HttpHandler[]`：以 orval 產的 `getXMockHandler(override)` 包住，override 讀寫本 module 的記憶體 seed（R5），未給 override 的 operation 回 faker |
| seed | `modules/<id>/mocks/seed.ts`；collection 由 `shared/api/mock-db` 的 `createCollection(name, seed)` 建立（承接 `handlers.ts:73-105` 的 `resource()` CRUD helper）；**module 不讀其他 module 的 collection**（consumers 自帶 transaction seed、team-members 自帶 staff seed、customers 自帶 customer seed） |
| guard | kernel 最前面掛 `http.all('*')` guard（§6.5），只讀 operationId → permission 中間格式 |
| 執行環境 | dev：`VITE_API_MOCK=true` 時 `setupWorker(...registry.mockHandlers).start()`（`public/mockServiceWorker.js` 由 `msw init` 產生並進 git）；test：`src/test/setup.ts` 以 `setupServer` 掛同一組 handler；接真後端 = 關 `VITE_API_MOCK`，client 不改 |

```ts
// modules/orders/mocks/handlers.ts（形狀示意，函式名以 orval 實際產物為準）
import { getListOrdersMockHandler, getUpdateOrderMockHandler } from "../api/generated/orders.msw";
import { orders } from "./seed";
export const ordersMockHandlers: HttpHandler[] = [
  getListOrdersMockHandler(({ request }) => orders.list(new URL(request.url).searchParams)),
  getUpdateOrderMockHandler(async ({ request }) => orders.update(await request.json())),
];
```

舊設計 `TMockHandlerTable`（`Record<"METHOD path", handler>`）、`mockFetch` 註冊表、`registerMockHandlers` **整段作廢**；過渡期（M2）以 adapter 把現行 `handlers` 表轉成 `HttpHandler[]`，M7 換成 orval 產物後刪除 adapter。

### 4.6 型別安全的取捨（R4：接受寬化）

- module 以 factory 回傳 `AnyRoute[]`，組裝後的樹型別寬化；`router/index.ts:10-14` 的 `Register` 不再精確。
- module 內導航用 route 物件：`defineRoutes(factory)` 回傳 `{ build(ctx), get() }`，kernel 呼叫 `build`，module `ui` 以 `ordersRoutes.get().details` 取 route 物件：`navigate({ to: details.fullPath, params: { id } })` 或 `details.useParams()`。`get()` 在 `build` 前呼叫 → throw（只有 render 期才會呼叫，build 一定已完成）。
- 跨 module 導航只經 nav 字串（`TNavItem.to`）。

---

## 5. 現有檔案 → 新位置對照

### 5.1 Kernel / shared / shell

| 現有 | 新位置 | 備註 |
|------|--------|------|
| `main.tsx` | `app/main.tsx` | `createApp({ shell: defaultShell })` + `installModules` + `mount`；`index.html` script 路徑同步 |
| `router/__root.tsx` | `app/router/root.tsx` + `app/providers/` | provider 移出 root route |
| `router/routes.tsx` | 拆入各 `modules/<id>/model/routes.ts` + `app/router/{auth,protected,index-redirect}.tsx` | login / protected 守衛 → `app/router` |
| `router/index.ts` | `app/kernel/build.ts` | 見 §4.6 |
| `components/ui/*` | `shared/ui/*` | shadcn，`components.json` alias 同步 |
| `components/shared/{Card,Paper,TextInputs,LoadingPage,EditActions}.tsx` | `shared/ui/` | `EditActions` 加 permission 宣告（§6.4） |
| `components/shared/DataTable.tsx`、`table/**` | `shared/ui/data-table/` | 加 `rowActions` / `toolbarActions`（§6.4） |
| `components/shared/dialog/ImageUploadDialog.tsx`、`hooks/use-img-upload.ts` | `shared/ui/image-upload/` + `shared/api/upload.ts` | 上傳 API 是通用能力（`/admin/images`）；其 MSW handler 屬 core handler |
| `components/shared/Tags.tsx` | `shared/ui/tag.tsx`（改 `tone` prop）+ `modules/orders/ui/order-status-tag.tsx` | 移除 `EOrderStatus` 依賴（`Tags.tsx:4`） |
| `components/shared/UnauthorizedPage.tsx` | `shells/default/forbidden.tsx`（= `TShell.Forbidden`） | R10：內容區渲染，`h-screen` 改 `h-full`（`UnauthorizedPage.tsx:15`） |
| `components/shared/{AppSidebar,Navbar,Breadcrumb}.tsx` | `shells/default/` | Sidebar 讀 `useVisibleNav()`；語系清單讀 `shared/config/locales` |
| `components/layouts/ProtectedAppLayout.tsx` | `shells/default/protected-layout.tsx` | 移除 `useUserPermissions`；`app:access` 改由 protected route 判斷（§6.2） |
| `components/layouts/AuthLayout.tsx` | `shells/default/auth-layout.tsx`（外框）+ `modules/auth/{model,ui}`（登入表單與 mutation） | 拆 layout 與登入邏輯 |
| `constants/sidebar.tsx` | 刪除 → 各 module `defineModule({ nav })` | |
| `constants/locales.ts` | `shared/config/locales.ts` + `shared/i18n/types.ts` | `TransKey` 改宣告合併（§5.4） |
| `hooks/use-breadcrumb.ts` | `shells/default/use-breadcrumb.ts` | `switch` 改讀 route `staticData.breadcrumb`（i18n key） |
| `hooks/{use-toast.ts,use-mobile.tsx,use-multi-select.ts}` | `shared/lib/` | |
| `lib/utils.ts`、`lib/gen-validate-message.ts`、`utils/array-helpers.ts` | `shared/lib/` | |
| `locales/{en,zh}.json` | `shared/i18n/locales/` 只留 core key；domain key 搬到 `modules/<id>/locales/` | |
| `locales/i18n.ts`、`types.ts`、`types/i18next.d.ts` | `shared/i18n/` | |
| `services/api-client.ts` | `shared/api/fetcher.ts`（orval mutator）+ `shared/api/session.ts` | `TAuthUser.role` 改 `string`，session 增 `grants: TGrant[]` |
| `services/mock/handlers.ts` | 過渡：`app/mock/legacy-adapter.ts`（M2–M6）→ 終態：各 `modules/<id>/mocks/handlers.ts` + `shared/api/mock-db` | `mockFetch` 刪除 |
| `services/mock/data.ts` | 各 `modules/<id>/mocks/seed.ts`；`placeholderImage` → `shared/api/mock-db`；`DEMO_ACCOUNT` → `modules/auth/mocks/` | R5 自帶 seed |
| `services/types/schema.ts` | `shared/api/schema.ts`（envelope / pagination / lang / image）+ `shared/api/openapi/common.yaml` | |
| `plugins/image-validation/{base-rules,manager.ts,types.ts,schemas.ts,utils,constants,presets/general.preset.ts}` | `shared/lib/image-validation/` | |
| `plugins/image-validation/presets/banner/**` | `modules/banners/model/image-validation/` | `validation.image.banner.*` → `banners.*` |
| `types/{index.d.ts,table.d.ts}`、`vite-env.d.ts` | `shared/types/` | |
| `styles/global.css` | `app/styles/` | |
| `test/setup*.ts` | 保留 `src/test/`（加 MSW `setupServer`；lint ignore） | |

### 5.2 Modules（逐目錄）

| 現有 | module | `model/`（headless） | `ui/`（預設，可覆寫 page id） | `requires` |
|------|--------|-----------------------|--------------------------------|-----------|
| `components/layouts/AuthLayout.tsx` 內登入表單、mock `POST /api/auth/login` | `auth` (generic) | `use-login`、`use-logout`、session 寫入 | `auth.login` | — |
| `pages/users/**`、`services/schemas/user.ts` | `users` (generic) | `use-user-list`、`use-user-profile`、`use-update-user-role`、user columns、form schema | `users.list`、`users.edit`、`EditUserRoleDialog` | — |
| `pages/team-members/**`、`services/schemas/staff.ts` | `team-members` (generic) | staff hooks、form schema | `team-members.list`、`StaffFormDialog` | — |
| `pages/orders/**`、`services/schemas/orders.ts` | `orders` | `use-orders`、order status 文字/tone、copy-order、columns | `orders.list`、`orders.details`、`OrderStatusTag`、`OrderCard` | — |
| `pages/product/**`、`services/schemas/product.ts` | `product` | product hooks、form-transformers、field-comparison | `product.list`、`product.create`、`product.edit`、`product.draft` | `suppliers`、`tags` |
| `pages/suppliers/**` | `suppliers` | `use-supplier-options` 等（公開給 product） | `suppliers.list` | — |
| `pages/tags/**` | `tags` | `use-tag-options` 等（公開給 product） | `tags.list` | — |
| `pages/consumers/**` | `consumers` | customer hooks、transaction 查詢 | `consumers.list`、`TransactionCard` | — （R5：transaction seed 自帶；`OrderCard.tsx:6` 對 orders util 的依賴改為本 module 自有格式化） |
| `pages/banners/**`（含 `docs/*.md`） | `banners` | banner hooks、sort、image-validation preset | `banners.list`、`banners.form` | — |
| `pages/articles/**`（含 tiptap） | `articles` | article hooks、form schema | `articles.list`、`articles.form`、Tiptap editor | — |

### 5.3 跨 module 依賴規則

- 允許：`modules/a/**` → `modules/b/index.ts`，且 `b ∈ a.requires`（lint 管「只經 index.ts」，`build()` 管「有宣告 requires」；lint 無法讀 `requires` 陣列，二者互補）。
- 禁止：import 他 module 的 `api/` `model/` `ui/` `mocks/` 內部檔；mock seed 跨 module 讀取（R5）。
- 「刪單一 module」成立條件：沒有其他已安裝 module `requires` 它（否則 `build()` fail fast，訊息指出誰依賴它）。刪整個 domain pack（7 個）一定成立——generic module 不 `requires` 任何 domain module。

### 5.4 i18n 型別

`shared/i18n/types.ts` 宣告可擴充介面，module 以 declaration merging 補自己的字典型別；刪 module 目錄即自動移除型別：

```ts
// shared/i18n/types.ts
import type coreZh from "./locales/zh.json";
export interface TranslationResources extends Record<string, unknown> {}   // module 擴充點
export type TransKey = RecursiveKeyOf<typeof coreZh & TranslationResources>;

// modules/orders/locales/augment.d.ts
import type zh from "./zh.json";
declare module "@/shared/i18n/types" {
  interface TranslationResources { orders: typeof zh }
}
```

---

## 6. 權限系統（D5）

### 6.1 型別與資料形狀

```ts
// shared/permission/types.ts
export type TPermission = `${string}:${string}`;            // "orders:read"
export type TGrant = TPermission | `${string}:*` | "*";      // wildcard 只出現在矩陣資料
export type TOperationPermissions = Record<string /* operationId */, TPermission>;  // §6.5 中間格式
export type TModulePermissions = {
  resources: Record<string, readonly string[]>;              // { orders: ["read","update","export"] }
  operations?: TOperationPermissions;                        // ★ R11：{ listOrders: "orders:read", updateOrder: "orders:update" }
  mockGrants?: Record<string /* roleId */, TGrant[]>;        // 只給 mock 矩陣用，前端 runtime 不讀
};
export type TPermissionCatalog = Record<string, readonly string[]>;

// shared/permission/can.ts —— 唯一判斷函式（ABAC 擴充點見 §6A）
export const can = (grants: readonly TGrant[], p: TPermission): boolean;   // 支援 "*" 與 "orders:*"
export const useCan = () => (p: TPermission) => can(useSession()?.grants ?? [], p);
```

**矩陣（mock 端，`app/mock/permission-matrix.ts`）**：

```ts
export const coreRoles = ["superadmin", "admin", "support", "partner", "premium", "user", "guest"]; // 由 users enum 移出，成為資料
export const coreGrants: Record<string, TGrant[]> = {
  superadmin: ["*"],
  admin: ["app:access"],
  support: ["app:access"],
  partner: ["app:access"],
};
// 組裝：matrix[role] = coreGrants[role] ∪ ⋃modules.permissions.mockGrants[role]
```

- `auth` module 的登入 handler 回傳 `session.user.role` + `session.grants`（矩陣展開，wildcard 保留）；前端只認 `grants`，**不知道 role→grant 對照**（接真後端時由後端給 grants，前端不改）。
- core resource：`app:access`（取代 `canAccessAdminPanel`，`ProtectedAppLayout.tsx:9`）。
- 現行語意方法對照（遷移用）：`canViewUserList` → `users:read`、`canEditUserRole` → `users:update-role`、`canManageUsers` → `users:update`、`canManageProducts` → `product:*`、`canManageOrders` → `orders:*`、`canViewReports` → 無消費點，刪除。

### 6.2 強制點 1：Route guard（403 在內容區，R10）

```ts
// shared/permission/forbidden.ts
export class ForbiddenError extends Error {
  constructor(public permission: TPermission) { super(`forbidden: requires ${permission}`); }
}

// shared/permission/guarded-route.ts
export const guardedRoute = <TOpts>(opts: TOpts & { permission: TPermission | "authenticated" }) =>
  createRoute({
    ...opts,
    staticData: { ...opts.staticData, permission: opts.permission },
    beforeLoad: (ctx) => {
      if (opts.permission !== "authenticated" && !can(getSession()?.grants ?? [], opts.permission))
        throw new ForbiddenError(opts.permission);            // 不 redirect：URL 不變
      return opts.beforeLoad?.(ctx);
    },
    errorComponent: ForbiddenBoundary,                        // ForbiddenError → <shell.Forbidden/>；其他錯誤 → 預設錯誤元件
  });
```

- **行為**：無權限時 URL 保留、shell（sidebar / navbar）保留，`shell.Forbidden`（預設 = 現行 `UnauthorizedPage` 改為內容區高度）渲染在 protected layout 的 `<Outlet />` 位置。**不新增 `/403` route**。
- `ForbiddenBoundary` 住 `app/router`，透過 `RegistryProvider` 取 `shell.Forbidden`（shared 不 import shell）。
- protected route 自身缺 `app:access`：layout 照常渲染（nav 經 `useVisibleNav` 會是空的），內容區顯示 `shell.Forbidden`——取代現行 `ProtectedAppLayout.tsx:11-13` 換掉整個 layout 的行為（**行為變更**，屬 R10 裁決範圍）。
- `/` index redirect（R9）：無任何可見 nav → 內容區顯示 `shell.Forbidden`，不 redirect。
- **待實測（M4 AC）**：TanStack Router 子 route `beforeLoad` throw 時，`errorComponent` 渲染於父 layout 的 `<Outlet />` 內、父 layout 不卸載（[Data Loading guide](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading)、[RouteOptions](https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType)）。若不成立，退路：`beforeLoad` 回傳 `{ forbidden: true }` context，`ctx.page` 包一層在 render 期換成 `shell.Forbidden`。
- module `routes()` 只能用 `ctx.guarded` 建 route；lint 禁 `modules/**` 直接呼叫 `createRoute`（§7）。
- **結構性測試**：`build()` 後走訪 protected 子樹，斷言每個 route 的 `staticData.permission` 存在（`"authenticated"` 需顯式寫）。
- `StaticDataRouteOption` 以 module augmentation 擴充 `permission` / `breadcrumb` / `pageId`。

### 6.3 強制點 2：Nav 自動過濾

- `TNavItem.permission` 必填（型別強制）；shell 只透過 `useVisibleNav()`（`shared/module`）取 nav，hook 內部 `filter(can)`，children 全被濾掉時父項一併隱藏。
- shell 不得讀 registry 原始 nav（lint 禁 `shells/**` import `useRegistry`）。

### 6.4 強制點 3：操作層（宣告式）

```ts
// shared/ui/data-table
type TRowAction<T> = {
  id: string; label: string; icon?: ComponentType;
  permission: TPermission;
  denied?: "hide" | "disable";          // 預設 "hide"
  onSelect: (row: T) => void;
};
<DataTable rowActions={[...]} toolbarActions={[...]} />

// shared/ui/edit-actions：onEdit/onView/onDelete 改為 { handler, permission } 物件
// shared/ui/form-submit
<FormSubmit permission="orders:update" />   // 無權限 → disabled + tooltip（預設 "disable"）

// 逃生口（低頻、非表格/表單場景）
<Guarded permission="orders:export" denied="hide">…</Guarded>
```

- lint：`useCan` 只允許出現在 `shared/**`；禁 `modules/** shells/**` 讀 session `.role`。
- `UserList.tsx:167` 的 `canEditUserRole &&` → `rowActions` 一項 `{ permission: "users:update-role" }`。

### 6.5 強制點 4：MSW 權限 guard（取代 mockFetch 403）

**中間格式**：`TOperationPermissions = Record<operationId, TPermission>`，由 module 的 `permissions.operations` 宣告，`build()` 合併（衝突 throw）。路由表 `OperationRoute = { method, path, operationId }` 由 orval 產物旁的 `operations.gen.ts` 提供（M7 前由 module 手寫同形狀常數）。日後若要改成 YAML `x-permission` 為來源，只需新增一支 adapter 把 YAML 轉成同一中間格式，guard 不改（PoC 已示範兩來源產出相同中間格式）。

```ts
// shared/api/mock/permission-guard.ts（形狀取自 PoC poc/orval/src/permissions.ts）
export const createPermissionGuard = (opts: {
  routes: OperationRoute[];
  permissions: TOperationPermissions;
  getGrants: (request: Request) => readonly TGrant[] | null;   // null = 未登入
  publicOperations: ReadonlySet<string>;                       // 例：login
}): HttpHandler =>
  http.all("*", ({ request }) => {
    const route = matchOperation(opts.routes, request);
    if (!route) return;                                        // 非 API（靜態資源等）→ fall through
    if (opts.publicOperations.has(route.operationId)) return;
    const grants = opts.getGrants(request);
    if (!grants) return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
    const required = opts.permissions[route.operationId];
    if (!required) return HttpResponse.json({ error: `no permission declared for ${route.operationId}` }, { status: 403 }); // fail-closed
    if (!can(grants, required)) return HttpResponse.json({ error: `forbidden: ${route.operationId} requires ${required}` }, { status: 403 });
    // 有權限 → 不回傳，fall through 到 module handler
  });
```

- **fail-closed**：已對到 operation 但未宣告 permission → 403（PoC 為 fall-through，本 spec 改 fail-closed，並由 `build()` 驗證「每個 operationId 都有 permission 或在 public 清單」，dev 啟動即爆而非執行期才 403）。
- guard 在 `registry.mockHandlers` 第一位；`getGrants` 由 `Authorization: Bearer <token>` → mock session → role → 矩陣展開。
- 前端 fetcher 收到 403 統一 toast（`shared/api/fetcher.ts`），各 hook 不重複處理。

### 6.6 不做

- 動態 role 管理 UI（矩陣編輯頁）。
- ABAC 定案（§6A 只提選項）。

---

## 6A. ABAC 選項（R6：一起設計、**待 owner 裁**）

### 6A.1 共同前提

- RBAC 矩陣（role × resource × action）保持為**第一道門**：沒有 `orders:update` 的人，任何條件都不會讓他能改。ABAC 只在 RBAC 放行後**再收窄**（只減不增），這樣 route guard / nav（拿不到資源實例）仍可只看 RBAC，不會誤開放。
- 條件與資源實例綁定，因此 **四強制點裡只有「操作層」與「MSW guard / handler」能評估條件**；route guard 與 nav 維持 RBAC。這是所有選項共通的結構限制。
- 前端只拿到 grants 資料；條件的**判斷邏輯**住前端 `shared/permission` 與各 module（命名 predicate），**條件的指派**是資料（mock 矩陣 / 未來後端）。

### 6A.2 選項

**選項 A：擁有者條件（ownership scope）**

- 形狀：grant 加 scope，`"articles:update@own"`；module 宣告 owner 取值器 `ownerOf: { articles: (a) => a.user_id }`。`can(grants, "articles:update", { resource: article, session })`：有 `articles:update` → true；只有 `@own` → `ownerOf(article) === session.user.id`。
- 組合：RBAC 決定「能不能做這個動作」，`@own` 只把範圍從「全部」縮到「自己的」。
- Demo：`support` 角色有 `articles:read` + `articles:update@own` → 文章列表的「編輯」row action 只出現在自己寫的文章（`article.ts:7` 的 `user_id`）；MSW `updateArticle` handler 對非本人回 403。users：`user` 角色 `users:update@own` 只能改自己的 profile。
- Trade-off：✅ 最常見需求、字串格式向下相容（舊 grant 不變）、mock 易做；❌ 只能表達「擁有者」一種條件，下一個需求（狀態、部門）就要再擴格式；guard 需讀資源才能判斷（PUT 帶 body 可判，DELETE 只有 id 要查 seed）。

**選項 B：欄位層級（field-level）**

- 形狀：grant 帶欄位白名單，`{ p: "users:update", fields: ["nick_name", "phone_number"] }`；讀取側 `{ p: "users:read", fields: { deny: ["phone_number", "address"] } }`。`allowedFields(grants, "users:update")` 回傳可寫欄位。
- 組合：RBAC 決定能否進入動作，fields 決定表單哪些欄位可編、表格哪些欄位可見；與 A 正交，可並存。
- Demo：`support` 讀 users 時 `phone_number` / `address`（`user.ts:19-23`）遮罩為 `***`；orders 編輯表單 `support` 只能改 `order_status`、不能改 `total_order_fee`（`orders.ts:45,51`）。MSW handler 剔除不允許欄位或回 403。
- Trade-off：✅ PII 遮罩是 admin demo 很有說服力的情境；與 DataTable columns / RHF 欄位宣告天然契合；❌ 要動 `shared/ui` 的 columns 與 form 元件（每個欄位多一層判斷）、grant 從字串變物件（序列化與 wildcard 規則要重定）、測試面最大。

**選項 C：資源狀態條件（state / attribute predicate）**

- 形狀：grant 掛命名條件，`"orders:update?status-editable"`；module 註冊 predicate：`conditions: { "status-editable": (order) => ["pending", "processing"].includes(order.order_status) }`。A 其實是 C 的特例（`own` = 內建 predicate）。
- 組合：同 A——RBAC 放行後以 predicate 收窄；條件名是資料、predicate 是程式碼（module 自帶），kernel 只負責查表。
- Demo：orders 已出貨（`order_status` = shipped/completed）後「編輯」row action 變 disabled（`denied: "disable"` + tooltip「已出貨不可修改」）；banners 只有 draft 可刪。
- Trade-off：✅ 一套機制涵蓋 owner / 狀態 / 任意屬性，module 自帶 predicate 符合 vertical slice；條件名可序列化，未來後端只需回傳同名條件；❌ predicate 散在各 module，需 `build()` 驗證「grant 引用的條件名都有註冊」；後端若用不同語言要重寫同名 predicate（前後端雙實作）。

**選項 D：採用現成 policy 引擎（CASL `@casl/ability`）**

- 形狀：`{ action, subject, conditions: { user_id: "${user.id}" }, fields: [...] }`，條件為 MongoDB query 子集；同時涵蓋 A/B/C。— https://casl.js.org/v6/en/guide/intro 、https://casl.js.org/v6/en/guide/restricting-fields
- 組合：取代自寫 `can()`；RBAC 矩陣改寫成 CASL rules。
- Demo：A/B/C 的情境皆可。
- Trade-off：✅ 成熟、表達力最強、欄位與條件一體；❌ 新增 runtime 依賴與學習曲線；條件 DSL 是 Mongo 語法，對純 UI showcase 偏重；D5 的 `resource:action` 字串格式要轉譯；guard / DataTable 都要改為 CASL API，改動面最廣。

### 6A.3 與四強制點的組合

| 強制點 | A 擁有者 | B 欄位 | C 狀態條件 | D CASL |
|--------|---------|--------|-----------|--------|
| route guard | 只看 RBAC（`@own` 視為有 action） | 只看 RBAC | 只看 RBAC | `can(action, subjectType)` |
| nav | 同上 | 同上 | 同上 | 同上 |
| 操作層 | `rowActions` 傳 row 進 `can` | columns / form 欄位級 | `rowActions` 傳 row | `can(action, row)` |
| MSW guard / handler | guard 判 RBAC；handler 查 seed 判 owner | handler 過濾欄位 | handler 查 seed 跑 predicate | handler 內 `ForbiddenError.from(ability)` |
| `can()` 簽名 | 加可選 `ctx` | 另加 `allowedFields()` | 加可選 `ctx` | 換成 CASL ability |

### 6A.4 建議（待 owner 裁）

**建議 C（命名條件 predicate，A 作為內建 `own` 條件），B 延後為獨立 milestone，不採 D。**

理由：
1. C 用一套機制涵蓋 A，且條件名是可序列化資料、predicate 住各 module——最符合 Microkernel（kernel 只查表）與 vertical slice（module 自帶規則）。
2. `can(grants, p, ctx?)` 只加可選參數，M1 寫出的 `can(grants, p)` 呼叫點不需改；grant 仍是字串（`"orders:update?status-editable"`），mock 矩陣與 wildcard 規則不變。
3. B 的價值高（PII 遮罩 demo）但改動面集中在 `shared/ui` 的 columns / form，與 C 正交，可在 C 落地後獨立加，不阻塞本次重構。
4. D 的表達力超出 showcase 需求，且要把 D5 字串格式整個轉譯，與「矩陣資料由 mock 提供」的既有形狀衝突最多。

**對 milestone 的影響**：M1–M8 不含 ABAC；`can()` 在 M1 先維持 `(grants, p)`。owner 裁定後另開 milestone（可插在 M4 之後任一點），爆炸半徑：`shared/permission`、`shared/ui/data-table` rowActions、MSW handler、`build()` 驗證。

---

## 7. Lint 邊界規則（D3、R7）

### 7.1 工具決定

- **eslint-plugin-boundaries v7（7.4.2）為唯一強制閘門**，寫在 ESLint 9 flat config（`eslint.config.js`）；進 `pnpm lint`、lint-staged、IDE。
- 不用 steiger（R1）。
- **前置**：ESLint 9 flat config 遷移由 deps chain P1 完成（M0），本 spec 不實作遷移；本 spec 的規則以「在既有 flat config 陣列追加一個 config 物件」的形式落地。

### 7.2 規則草案（flat config）

> 下列語法依 jsboundaries.dev v7.4.1 文件撰寫；文件內 options 段寫 `rules`、範例段寫 `policies`，**精確 key 名與 element 比對順序於 M5 第一個 AC 實測**。

```js
// eslint.config.js（節錄；追加在 deps chain P1 產出的 flat config 陣列中）
import boundaries from "eslint-plugin-boundaries";

const MODULE_ENTRY = { element: { type: "module", fileInternalPath: "index.ts" } };
const SAME_MODULE = (type) => ({
  element: { type, captured: { module: "{{ from.element.captured.module }}" } },
});

export default [
  // ...deps chain P1 的既有設定
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        // 具體者在前（module 內 segment 先於 module 根）
        { type: "module-api",   pattern: "src/modules/*/api",    capture: ["module"] },
        { type: "module-model", pattern: "src/modules/*/model",  capture: ["module"] },
        { type: "module-ui",    pattern: "src/modules/*/ui",     capture: ["module"] },
        { type: "module-mocks", pattern: "src/modules/*/mocks",  capture: ["module"] },
        { type: "module",       pattern: "src/modules/*",        capture: ["module"] },   // index.ts、locales/
        { type: "shell",        pattern: "src/shells/*",         capture: ["shell"] },
        { type: "app",          pattern: "src/app" },
        { type: "shared",       pattern: "src/shared" },
      ],
      "boundaries/ignore": ["src/test/**", "**/__tests__/**"],
    },
    rules: {
      "boundaries/no-unknown-files": "error",
      "boundaries/dependencies": ["error", {
        default: "disallow",
        rules: [
          // kernel：shared、shells、各 module 的 index.ts
          { from: { element: { type: "app" } },
            allow: { to: [{ element: { type: ["app", "shared", "shell"] } }, MODULE_ENTRY] } },
          // shared：只能 shared（domain-free 的機械保證）
          { from: { element: { type: "shared" } }, allow: { to: { element: { type: "shared" } } } },
          // shell：shared + 他 module 的 index.ts（覆寫頁取 headless API）
          { from: { element: { type: "shell" } }, allow: { to: [{ element: { type: "shared" } }, MODULE_ENTRY] } },
          // default shell 屬 core：禁 import 任何 module（§4.4 D4 保證）
          { from: { element: { type: "shell", captured: { shell: "default" } } }, disallow: { to: MODULE_ENTRY } },
          // module 根（index.ts / locales）→ 本 module 各 segment
          { from: { element: { type: "module" } },
            allow: { to: ["module-api", "module-model", "module-ui", "module-mocks"].map(SAME_MODULE) } },
          // module 內單向：ui → model → api；mocks → api
          { from: { element: { type: "module-ui" } },    allow: { to: [SAME_MODULE("module-model")] } },
          { from: { element: { type: "module-model" } }, allow: { to: [SAME_MODULE("module-api")] } },
          { from: { element: { type: "module-mocks" } }, allow: { to: [SAME_MODULE("module-api")] } },
          // 所有 module 內部 → shared、他 module 的 index.ts（requires 由 build() 檢查）
          { from: { element: { type: ["module", "module-api", "module-model", "module-ui", "module-mocks"] } },
            allow: { to: [{ element: { type: "shared" } }, MODULE_ENTRY] } },
        ],
      }],
      "no-restricted-imports": ["error", { patterns: [
        { group: ["@/modules/*/*"], message: "跨 module 只能 import `@/modules/<id>`（index.ts）" },
        { group: ["**/use-user-permissions*"], message: "改用宣告式 permission（spec §6.4）" },
      ] }],
    },
  },
  {
    files: ["src/modules/**/*.{ts,tsx}", "src/shells/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error",
        { selector: "CallExpression[callee.name='createRoute']", message: "module 只能用 ctx.guarded 建 route（§6.2）" },
        { selector: "CallExpression[callee.name='useCan']",      message: "改用 DataTable rowActions / FormSubmit / <Guarded>（§6.4）" },
      ],
    },
  },
];
```

- 同 module 內同一 segment 的互 import 屬 internal，不受 `dependencies` 限制（`checkInternals: false` 預設）。
- module 內對自己 `index.ts` 的 import 會形成環，由既有 `import/no-cycle` 擋。
- `no-restricted-imports` 的 `@/modules/*/*` 只擋**跨 module** 的深 import；同 module 內請用相對路徑（lint 規則訊息寫明）。
- `module-api` 允許 `shared`（fetcher mutator、envelope 型別）；orval 產物若 import 不到 `shared` 以外的東西，規則不需例外。

---

## 8. 「換 UI」與「換 domain」操作步驟

### 8.1 換 UI（驗證 D1、R2）

**整套換 shell**：
1. 新建 `shells/<new>/`，實作 `TShell`（`ProtectedLayout`、`AuthLayout`、`Forbidden`），導覽只用 `useVisibleNav()`、session 用 `useSession()`、登出用 `@/modules/auth` 公開的 `useLogout`。
2. `app/main.tsx`：`createApp({ shell: newShell })`。

**逐頁換**：
3. 在 `shells/<new>/pages/` 寫新頁，只 import 目標 module `index.ts` 公開的 headless API，放進 `TShell.pages["orders.list"]`；或在 `app/main.tsx` 以 `.override("orders.list", Page)` 單點覆寫。

**不需改**：`modules/*/{api,model,mocks,locales}`、`shared/**`、`app/kernel/**`。
→ 成立條件：module 的資料邏輯全在 `model/`（lint：`ui` 只能 import 同 module 的 `model`，§7.2）。

### 8.2 換 domain（驗證 D4、R3）

1. `app/modules.ts` 刪掉 7 個 domain `.use()` 行與對應 import。
2. `rm -rf src/modules/{orders,product,suppliers,consumers,banners,articles,tags}`。
3. `pnpm build && pnpm exec vitest run` 綠；`pnpm dev` 登入後 sidebar 只含 users / team-members，`/` redirect 到第一個可見 nav。
4. 新 domain：新增 `modules/<new>/{index.ts,api,model,ui,mocks,locales}`，於 `app/modules.ts` 加 `.use()`。
→ 自動化：M8 的 `scripts/verify-core-only.sh` 在暫存副本執行 1–2 與 build/test。

---

## 9. 重構 Milestones

> **M0 前置條件（不屬本 spec 的 milestone，deps chain 負責）**：deps P0 `engines.node >=22` 與 P1 ESLint 9 flat config 已合進 master。M5（boundaries lint）硬依賴 P1；M1–M4 不依賴 lint 設定，但以 P0/P1 合併後的 master 為 base 可避免 rebase。
>
> 每棒可獨立 merge；共同 done 基線：`pnpm build && pnpm exec vitest run` exit 0（`pnpm test` 是 watch 模式，禁用）。lint 只檢查用 `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`（`pnpm lint` 帶 `--fix`）。
> ABAC 不在 M1–M8（§6A 待裁）。

### Milestones
- **M1 Kernel 契約與權限引擎（純新增）**：`shared/module` 型別（含 `requires`、`TPageRegistry`、`TShell`）、`shared/permission` 的 `can()`、`app/kernel` 的 `createApp().use().override()` 與純函式 `build()`（驗證 + override 解析 + nav/i18n/operations 合併），全未接線 + 單元測試
- **M2 MSW 取代 mockFetch（行為不變）**：安裝 msw、`msw init public/`；`apiFetch` 改打真 `fetch`；現行 `handlers` 表經 adapter 轉 `HttpHandler[]`；dev 用 `setupWorker`、測試用 `setupServer`；`mockFetch` 刪除
- **M3 Module 接線 + default shell（行為不變）**：`app/main.tsx` 走 `createApp().use()`；10 個 module `index.ts` 指向現有 pages；layout / sidebar 搬進 `shells/default`；route 經 `ctx.page` 支援覆寫；`/` redirect 到第一個可見 nav；刪 `router/routes.tsx`、`constants/sidebar.tsx`
- **M4 權限四強制點 + 內容區 403**：登入回 grants、mock 矩陣、`guardedRoute` + `ForbiddenBoundary`（內容區 403）、`useVisibleNav`、DataTable/EditActions/FormSubmit 宣告式 permission、MSW guard 讀 operationId→permission；刪 `useUserPermissions`
- **M5 Kernel / shared 搬遷 + 邊界 lint**：`components/ui`、`lib`、`hooks`、`utils`、`constants`、`plugins/image-validation` 通用部分、`services` 共用部分 → `shared/`；去除 core→domain 汙染；boundaries 規則上線（未搬的 legacy 路徑暫列 ignore）
- **M6 Module 內嵌搬遷**：逐 module 把 `pages/<x>`、`services/schemas`、mock seed / handler、i18n key 搬進 `modules/<id>/{api,model,ui,mocks,locales}`；各 module 自帶 seed；移除 lint ignore
- **M7 orval 契約層（待 api chain PoC 確認）**：per-module `openapi.yaml`、orval 設定、產物落 `modules/<id>/api/generated`、`mocks` 改包 orval MSW handler、`shared/api/fetcher.ts` 為 mutator；刪 M2 adapter 與手寫 api hooks
- **M8 D1 / D4 驗收自動化與收尾**：`scripts/verify-core-only.sh`、逐頁覆寫的整合測試（fixture shell 覆寫 `orders.list`）、舊目錄清空確認

---

#### M1 Kernel 契約與權限引擎

**User Story**：As a maintainer, I want the module contract (`defineModule` with `requires`, page overrides) and a pure `build()` with tests, so that later milestones wire modules against a verified kernel instead of ad-hoc glue.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: `can()` 正確處理精確 grant、`resource:*`、`*`、無 grant 四種情況
  - 驗證：`pnpm exec vitest run src/shared/permission`
- [ ] AC-2 `[cmd]`: `build()` 對重複 module id、缺 `requires` 依賴、`requires` 成環、i18n 頂層 key ≠ id、nav 引用未宣告 resource、operationId permission 衝突各 throw，訊息含 module id
  - 驗證：`pnpm exec vitest run src/app/kernel`
- [ ] AC-3 `[cmd]`: override 解析順序為 app `.override()` > `shell.pages` > module 預設；`.override()` 未知 id throw；`shell.pages` 未知 id 忽略
  - 驗證：同上
- [ ] AC-4 `[cmd]`: 兩個 fixture module 組出的 route tree 含兩者子路由、nav 依 order 穩定排序、i18n 深合併後 core key 不被覆蓋、`registry.mockHandlers[0]` 為 guard
  - 驗證：同上
- [ ] AC-5 `[cmd]`: 既有行為不變（既有檔案無任何改動，新碼未被 import）
  - 驗證：`pnpm build && pnpm exec vitest run && git diff --quiet master -- src ':!src/shared' ':!src/app'`

**Pseudo code**
```ts
// app/kernel/build.ts
export function build({ modules, shell, overrides, core }) {
  assertUniqueIds(modules);
  assertRequires(modules);            // 每個 dep ∈ ids；DFS 偵測環
  assertI18nScoped(modules);
  assertNavResources(modules);
  const operations = mergeOperations(modules);          // 衝突 throw
  const page = resolvePage({ modules, shell, overrides }); // overrides 未知 id throw；shell.pages 未知 id 忽略
  const nav = stableSortBy(m => m.order ?? 100, modules.flatMap(m => m.nav ?? []));
  return {
    routeTree: assembleRoutes({ root: core.root, shell, modules, page, nav }),
    registry: {
      modules, nav, operations,
      permissions: catalog(modules),
      i18n: mergeDeep(core.i18n, ...modules.map(m => scope(m.id, m.i18n))),
      mockHandlers: [core.guard(operations), ...core.mockHandlers, ...modules.flatMap(m => m.mockHandlers ?? [])],
    },
  };
}

function resolvePage({ modules, shell, overrides }) {
  const known = collectPageIds(modules);                // 由 routes factory 試建或 module 宣告的 pageIds
  for (const id of overrides.keys()) if (!known.has(id)) throw new Error(`override: unknown page id "${id}"`);
  return (id, Default) => overrides.get(id) ?? shell.pages?.[id] ?? Default;
}
```

> `collectPageIds` 的資料來源（module 顯式宣告 `pages: TPageId[]` vs 以 dry-run 跑 `routes` factory 收集 `ctx.page` 呼叫）由 M1 實作者擇一，於 PR 說明；不影響對外契約。

**Test stub**
```ts
// src/app/kernel/__tests__/build.test.ts
import { build } from "../build";
const mod = (id: string, extra: Partial<TModule> = {}) => defineModule({ id, kind: "domain", ...extra });

describe("build() validation", () => {
  it("throws on duplicate module id", () => {
    expect(() => build(ctx([mod("a"), mod("a")]))).toThrow(/duplicate module id "a"/);
  });
  it("fails fast when a required module is not installed", () => {
    expect(() => build(ctx([mod("product", { requires: ["suppliers"] })]))).toThrow(/"product" requires "suppliers"/);
  });
  it("throws on requires cycle", () => {
    expect(() => build(ctx([mod("a", { requires: ["b"] }), mod("b", { requires: ["a"] })]))).toThrow(/cycle/);
  });
  it("throws when i18n top-level key !== id", () => { /* ... */ });
  it("throws on conflicting operationId permission", () => { /* ... */ });
});

describe("page override resolution", () => {
  it("app override > shell.pages > module default", () => { /* render resolved component, assert testid */ });
  it("throws on unknown app override id", () => { /* ... */ });
  it("ignores unknown shell.pages id", () => { /* ... */ });
});

// src/shared/permission/__tests__/can.test.ts
describe("can()", () => {
  it.each([
    [["*"], "orders:read", true],
    [["orders:*"], "orders:export", true],
    [["orders:read"], "orders:update", false],
    [[], "app:access", false],
  ])("can(%j, %s) === %s", (grants, p, expected) => expect(can(grants, p)).toBe(expected));
});
```

**Touches**：`src/shared/module/**`、`src/shared/permission/**`、`src/app/kernel/**`（全新）；`package.json` / `pnpm-lock.yaml` 僅新增 `msw`（`TModule.mockHandlers: HttpHandler[]` 需要其型別；版本以 api chain PoC 結論為準）
**Must-Not-Touch**：既有 `src/` 檔案全部；行為紅線：不改任何現有 import 路徑，msw 只以 `import type` 參與、不啟動

**Done Command**
```bash
pnpm build && pnpm exec vitest run src/shared src/app/kernel && pnpm exec vitest run
```
expected: exit 0；`src/shared/permission`、`src/app/kernel` 測試檔出現在 vitest 輸出且全 pass

---

#### M2 MSW 取代 mockFetch（行為不變）

**User Story**：As a maintainer, I want the mock backend served by MSW at the network layer, so that the client code is identical for mock and real backends and module mock handlers can be plain `HttpHandler[]`.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: `mockFetch` 無任何引用；`apiFetch` 呼叫的是 `fetch`
  - 驗證：`! grep -rn "mockFetch" src && grep -n "await fetch(" src/services/api-client.ts`
- [ ] AC-2 `[cmd]`: 現行 `handlers` 表的每一個 `METHOD path` 都在 adapter 產出的 `HttpHandler[]` 中（快照測試列出全部）
  - 驗證：`pnpm exec vitest run src/app/mock`
- [ ] AC-3 `[cmd]`: `api-client.test.ts` 改走 `setupServer` 後原有案例全綠（登入、帶 token、404 fallback）
  - 驗證：`pnpm exec vitest run src/services`
- [ ] AC-4 `[cmd]`: `public/mockServiceWorker.js` 存在且進 git
  - 驗證：`git ls-files --error-unmatch public/mockServiceWorker.js`
- [ ] AC-5 `[manual]`: `VITE_API_MOCK=true pnpm dev` 登入後各頁 CRUD 與重構前一致；Network 面板顯示請求由 service worker 回應

**Touches**：`package.json`、`pnpm-lock.yaml`、`public/mockServiceWorker.js`（新）、`.env.example`、`src/services/api-client.ts`、`src/services/mock/handlers.ts`、`src/services/__tests__/api-client.test.ts`、`src/test/setup.ts`、`src/main.tsx`、`src/app/mock/**`（新）
**Must-Not-Touch**：`src/pages/**`、`src/components/**`；行為紅線：mock API 路徑、回應 body、延遲行為不變

**Done Command**
```bash
pnpm build && pnpm exec vitest run && ! grep -rn "mockFetch" src
```
expected: exit 0

---

#### M3 Module 接線 + default shell（行為不變）

**User Story**：As a maintainer, I want every page group registered via `createApp().use(module)` and rendered inside a replaceable default shell, so that adding/removing a feature is one `.use()` line and pages can be overridden by id.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: `router/routes.tsx`、`constants/sidebar.tsx` 不存在；`app/modules.ts` 恰有 10 個 `.use(`
  - 驗證：`test ! -e src/router/routes.tsx && test ! -e src/constants/sidebar.tsx && test "$(grep -c '\.use(' src/app/modules.ts)" -eq 10`
- [ ] AC-2 `[cmd]`: registry 產出的路徑集合與重構前一致（快照列出全部 fullPath），另多一條 `/` index redirect
  - 驗證：`pnpm exec vitest run src/app`
- [ ] AC-3 `[cmd]`: `/` 依 grants 導向第一個可見 nav；無可見 nav 時內容區渲染 `shell.Forbidden`
  - 驗證：`pnpm exec vitest run src/app/router`
- [ ] AC-4 `[cmd]`: 以 fixture `.override("users.list", Stub)` 建 app，`/users/user-list` 渲染 Stub 而非預設頁
  - 驗證：`pnpm exec vitest run src/app`
- [ ] AC-5 `[manual]`: `pnpm dev` 登入後 sidebar 項目、順序、各頁 CRUD 與重構前相同；語系切換正常

**Touches**：`src/main.tsx`、`index.html`、`src/router/**`、`src/constants/sidebar.tsx`、`src/components/layouts/**`、`src/components/shared/{AppSidebar,Navbar,Breadcrumb}.tsx`、`src/hooks/use-breadcrumb.ts`、`src/locales/i18n.ts`、`src/app/**`、`src/shells/default/**`（新）、`src/modules/*/index.ts`（新）、`src/modules/*/model/routes.ts`（新）
**Must-Not-Touch**：`src/pages/**` 內部實作（只被 import）；`src/components/ui/**`；行為紅線：URL、i18n key、mock API 路徑不變

**Done Command**
```bash
pnpm build && pnpm exec vitest run && test ! -e src/router/routes.tsx && test ! -e src/constants/sidebar.tsx
```
expected: exit 0

---

#### M4 權限四強制點 + 內容區 403

**User Story**：As an admin of a specific role, I want routes, menu, actions and API to consistently reflect my grants, and to see a 403 inside the app shell without losing my URL, so that permission behavior is declared once per module.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: `support` session 無 `users:read` → 進 `/users/user-list` 時 URL 不變、shell（sidebar）仍渲染、內容區為 `shell.Forbidden`；sidebar 無 users 項
  - 驗證：`pnpm exec vitest run src/app/router src/shared/module`
- [ ] AC-2 `[cmd]`: MSW guard：缺 `users:update-role` 的 token 打 `updateUserRole` 回 403、未帶 token 回 401、有權限 fall through 到 module handler 回 200、已對到 operation 但未宣告 permission 回 403
  - 驗證：`pnpm exec vitest run src/shared/api src/app/mock`
- [ ] AC-3 `[cmd]`: `build()` 對「有 operation 但無 permission 且非 public」throw
  - 驗證：`pnpm exec vitest run src/app/kernel`
- [ ] AC-4 `[cmd]`: DataTable `rowActions` 無權限項預設不渲染、`denied:"disable"` 渲染為 disabled；`FormSubmit` 無權限 disabled
  - 驗證：`pnpm exec vitest run src/components/shared src/shared/ui`
- [ ] AC-5 `[cmd]`: 結構性測試：protected 子樹每個 route 都有 `staticData.permission`；`useUserPermissions` 已無引用
  - 驗證：`pnpm exec vitest run src/app && ! grep -rn "useUserPermissions" src`
- [ ] AC-6 `[manual]`: superadmin demo 帳號所有頁面與操作仍可見可用

**Touches**：`src/shared/permission/**`、`src/shared/api/**`、`src/shared/module/**`、`src/services/api-client.ts`、`src/services/mock/**`、`src/components/shared/{DataTable,EditActions,UnauthorizedPage}.tsx`、`src/components/shared/table/**`、`src/shells/default/**`、`src/pages/users/**`、`src/modules/**`、`src/app/**`
**Must-Not-Touch**：其他 `src/pages/**` 業務邏輯（只改 action 宣告處）；行為紅線：superadmin 可見範圍不縮減；不新增 `/403` route

**Done Command**
```bash
pnpm build && pnpm exec vitest run && ! grep -rn "useUserPermissions" src
```
expected: exit 0

---

#### M5 Kernel / shared 搬遷 + 邊界 lint

**User Story**：As a maintainer, I want kernel and shared code in `app/` + `shared/` + `shells/default` with lint-enforced boundaries, so that core stays domain-free by construction rather than by review.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: boundaries 在 flat config 下載入並報違規（spike：暫時 fixture `src/shared/__boundary_fixture__.ts` import `@/modules/orders` 被擋，確認後刪除；結果與 `rules`/`policies` key 實測結論記於 PR）
  - 驗證：`pnpm exec eslint src/shared/__boundary_fixture__.ts; test $? -eq 1`（fixture 期間）
- [ ] AC-2 `[cmd]`: `src/shared/**` 無任何對 `app` / `shells` / `modules` 的 import，無 domain 型別（`EOrderStatus` 等）
  - 驗證：`! grep -rnE "@/(app|shells|modules)/|EOrderStatus" src/shared`
- [ ] AC-3 `[cmd]`: `components/ui`、`lib`、`hooks`、`utils`、`constants`、`plugins` 目錄已移除（domain 殘留列於 PR）
  - 驗證：`test ! -d src/components/ui && test ! -d src/lib && test ! -d src/plugins && test ! -d src/hooks`
- [ ] AC-4 `[cmd]`: lint 無 error
  - 驗證：`pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`

**Touches**：`src/components/**`、`src/lib/**`、`src/hooks/**`、`src/utils/**`、`src/constants/**`、`src/plugins/**`、`src/types/**`、`src/styles/**`、`src/services/{api-client.ts,types/**}`、`src/locales/**`、`src/shared/**`、`src/shells/**`、`src/app/**`、`eslint.config.js`、`package.json`、`pnpm-lock.yaml`、`components.json`、`tsconfig.app.json`
**Must-Not-Touch**：`src/pages/**` 業務邏輯（只改 import 路徑）；行為紅線：UI 外觀與路由不變

**Done Command**
```bash
pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run
```
expected: exit 0

---

#### M6 Module 內嵌搬遷

**User Story**：As a maintainer, I want each module's pages, hooks, schemas, mock seed and i18n living inside `modules/<id>/`, so that a module is one self-contained directory that can be deleted or replaced.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: `src/pages/`、`src/services/` 不存在；每個 module 有 `index.ts`
  - 驗證：`test ! -d src/pages && test ! -d src/services && for d in src/modules/*/; do test -f "$d/index.ts" || exit 1; done`
- [ ] AC-2 `[cmd]`: 沒有 module 讀其他 module 的 seed（R5）；跨 module import 只到 `index.ts`
  - 驗證：`! grep -rnE "@/modules/[^/\"']+/" src/modules`
- [ ] AC-3 `[cmd]`: core 字典頂層 key 不含任何 module id
  - 驗證：`pnpm exec vitest run src/shared/i18n`
- [ ] AC-4 `[cmd]`: boundaries ignore 清單已移除，lint 全綠
  - 驗證：`pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`
- [ ] AC-5 `[cmd]`: 既有 14 個測試檔（搬遷後路徑）全綠
  - 驗證：`pnpm exec vitest run`
- [ ] AC-6 `[manual]`: 兩種語系下各頁文字與重構前一致

**Touches**：`src/pages/**`、`src/services/**`、`src/modules/**`、`src/shared/i18n/locales/**`、`src/app/mock/**`、`eslint.config.js`
**Must-Not-Touch**：`src/app/kernel/**` 契約（需改 → 回報）；`src/shells/**`；行為紅線：URL、mock API 路徑、使用者可見文字不變

**Done Command**
```bash
pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run && test ! -d src/pages && test ! -d src/services
```
expected: exit 0

---

#### M7 orval 契約層（待 api chain PoC 確認）

**User Story**：As a maintainer, I want each module's API defined by a hand-written OpenAPI contract with orval-generated client, zod and MSW handlers, so that the mock backend, client types and permission table derive from one source of truth.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: 每個有 API 的 module 有 `api/openapi.yaml`；`pnpm api:gen` 後 `git diff --exit-code`（產物已進 git 且與契約一致）
  - 驗證：`pnpm api:gen && git diff --exit-code -- src/modules`
- [ ] AC-2 `[cmd]`: 每個 operationId 都在某 module 的 `permissions.operations` 或 public 清單（`build()` 驗證）
  - 驗證：`pnpm exec vitest run src/app/kernel`
- [ ] AC-3 `[cmd]`: M2 adapter 與手寫 `apiFetch` hooks 已刪；module `mocks` 只包 orval 產的 handler
  - 驗證：`test ! -e src/app/mock/legacy-adapter.ts && ! grep -rn "apiFetch" src/modules`
- [ ] AC-4 `[cmd]`: create 後 list 讀得到（seed 記憶體狀態經 override 生效），代表性 module 各一條
  - 驗證：`pnpm exec vitest run src/modules`
- [ ] AC-5 `[manual]`: `VITE_API_MOCK=true pnpm dev` 各頁 CRUD 與 M6 一致

**Touches**：`package.json`、`pnpm-lock.yaml`、`orval.config.ts`（新）、`src/shared/api/{fetcher.ts,openapi/**,mock-db/**}`、`src/modules/*/{api,model,mocks}/**`、`src/app/mock/**`
**Must-Not-Touch**：`src/modules/*/ui/**`（除 hook 名稱改動外）；`src/shells/**`；行為紅線：mock API 路徑與回應形狀不變

**Done Command**
```bash
pnpm api:gen && git diff --exit-code -- src/modules && pnpm build && pnpm exec vitest run
```
expected: exit 0

---

#### M8 D1 / D4 驗收自動化與收尾

**User Story**：As the owner, I want repeatable checks that the app runs with only generic modules and that a page can be swapped by id, so that the domain-swappable (D4) and UI-swappable (D1) promises are verified, not assumed.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: `scripts/verify-core-only.sh` 在暫存副本刪除 7 個 domain module（`.use()` 行 + `modules/<id>/`）後 `pnpm build && pnpm exec vitest run` exit 0，輸出 `core-only build: OK`
  - 驗證：`bash scripts/verify-core-only.sh`
- [ ] AC-2 `[cmd]`: 整合測試：fixture shell 以 `pages["orders.list"]` 覆寫，渲染覆寫頁且資料來自 orders headless model（與預設頁同一 query key）
  - 驗證：`pnpm exec vitest run src/app/__tests__/override.integration.test.tsx`
- [ ] AC-3 `[cmd]`: 刪 `suppliers` 但保留 `product` 時 `build()` throw 並指名 `product`
  - 驗證：`pnpm exec vitest run src/app/kernel`
- [ ] AC-4 `[manual]`: core-only 副本 `pnpm dev`，登入後 sidebar 只有 users / team-members，`/` redirect 正常

**Touches**：`scripts/verify-core-only.sh`（新）、`src/app/__tests__/**`、`package.json`（scripts）
**Must-Not-Touch**：`src/modules/**`、`src/shells/default/**`；行為紅線：腳本不得修改工作目錄（只在暫存副本操作）

**Done Command**
```bash
bash scripts/verify-core-only.sh && pnpm build && pnpm exec vitest run
```
expected: exit 0；輸出含 `core-only build: OK`

---

## 10. Open Questions

### 10.1 已裁（2026-11-09）

| ID | 問題 | 裁決結果 |
|----|------|---------|
| OQ-1 | D4「刪目錄」在 FSD 水平分層下是多目錄 | **已裁**：module 內嵌 `modules/<id>/{api,model,ui,mocks}`；D4 = 刪 `.use()` 一行 + 刪 `modules/<id>/`（§3、§8.2） |
| OQ-2 | 接受 typed route 寬化？ | **已裁**：接受；module 內用 route 物件導航（§4.6） |
| OQ-3 | 跨 module mock 資料依賴 | **已裁**：各 module 自帶 seed，不跨 module 讀 collection（§4.5） |
| OQ-4 | 是否需要 ABAC | **已裁（部分）**：現在一起設計、不定案 → 選項見 §6A，裁決移至 OQ-10 |
| OQ-5 | boundaries 與 legacy `.eslintrc` | **已裁**：ESLint 9 flat config 為前置（deps chain P1）；規則寫 flat config（§7） |
| OQ-6 | module 依賴宣告 | **已裁**：`defineModule` 加 `requires`；build 時 fail fast（§4.1、§4.3） |
| OQ-7 | `/` 首頁行為 | **已裁**：redirect 到第一個可見 nav（§4.3） |
| OQ-8 | 403 UI 行為 | **已裁**：layout 內容區渲染 `UnauthorizedPage`，保留 URL 與 shell，無 `/403` route（§6.2） |

### 10.2 新的未決項

| ID | 問題 | 本 spec 暫定 | 影響 |
|----|------|-------------|------|
| OQ-9 | openapi.yaml 單檔還是 per-module？裁決寫「手寫 openapi.yaml」（單數）；單檔放 repo 根則 D4 刪 module 需同時刪 YAML 內對應 paths（三處），且 orval 重新 gen 會把已刪的 `modules/<id>/api` 生回來 | per-module `modules/<id>/api/openapi.yaml` + `shared/api/openapi/common.yaml`；orval config 掃 `src/modules/*/api/openapi.yaml` | M7 結構、D4 驗收形狀；需 api chain PoC 驗 per-module 多 input |
| OQ-10 | ABAC 採哪個選項（§6A：A 擁有者 / B 欄位 / C 命名條件 / D CASL） | 建議 C（含 `own`），B 延後，不採 D | `can()` 簽名、rowActions、MSW handler；裁後另開 milestone |
| OQ-11 | 權限字串格式：D5 用 `orders:read`（冒號），api chain PoC 用 `banners.read`（點） | 依 D5 用冒號；PoC 為 throwaway，不影響 | M4 / M7 permission 字面 |
| OQ-12 | module 內 `ui` 能否直接 `import type` `api` 產物型別（略過 model）？ | 不能；需要的型別由 `model` re-export（嚴格單向） | lint 規則是否加 `dependency.kind: "type"` 例外 |
| OQ-13 | M1 的 page id 收集方式：module 顯式宣告 `pages: TPageId[]`（多一個欄位）vs dry-run routes factory | 交 M1 實作者擇一；若選顯式欄位 = 在 D2 清單外再加欄位（同 `requires` 性質），需 owner 確認 | D2 欄位清單 |
| OQ-14 | 未宣告 permission 的 operation：fail-closed 403（本 spec）vs PoC 的 fall-through | fail-closed + `build()` 驗證 | M4 guard 行為 |

---

## 11. 張力與矛盾（surface，未自行擇一）

- **R11「手寫 openapi.yaml」× R3/D4「刪 `modules/<id>/`」**：若契約是 repo 根單一 YAML，D4 刪 module 不再只是刪一個目錄 + 一行 → 本 spec 暫採 per-module YAML（OQ-9），待 owner 與 api chain PoC 確認。
- **D2 欄位清單 × R2 override / R8 requires**：D2 列的欄位是 `{ id, routes, nav, i18n, mockHandlers, permissions }`。`requires` 由 R8 明確加入；override 落在 `createApp().override()` 與 `TShell.pages`（不是 module 欄位），因此不擴 D2。若 OQ-13 選顯式 `pages` 欄位，則是再擴 D2，需 owner 確認。
- **D2「本 spec 不設計 slot」× R2 頁面覆寫**：頁面覆寫是**頁級**替換，不是 slot（頁內插槽）；二者不衝突，但未來 `slots` 加入時 shell 會有兩種擴充點（`pages` 與 slot 實作），需要那時再定優先序。
- **D3「依賴方向以 lint 強制」× R1 去 FSD**：D3 原文出自 FSD 語境；本版保留「lint 強制依賴方向」的意旨，方向改為 §3.1（kernel / shared / shells / modules + module 內單向）。
- **R10 × 現況行為**：現行缺 `app:access` 時以 `UnauthorizedPage` 取代整個 layout（`ProtectedAppLayout.tsx:11-13`，無 sidebar）；R10 後改為保留 shell、內容區 403。屬裁決允許的行為變更，M4 AC-1 明確驗證。
- **R11 guard × api chain PoC**：PoC guard 對「未宣告 permission」fall through，本 spec 改 fail-closed（OQ-14）；PoC 權限字串用點號（OQ-11）。兩者均為 spec 選擇，PoC 結論出來後若有衝突再回報。
- **R11 × TanStack Router 錯誤邊界**：R10 的「內容區 403」依賴子 route `errorComponent` 在父 layout `<Outlet />` 內渲染；未實測，M4 AC-1 驗證，不成立時改用 §6.2 退路（不影響對外契約）。
- **D2 × D5**：role→grant 預設矩陣放在 `permissions.mockGrants`（仍在 D2 的 `permissions` 欄位內）；operationId 表同樣放 `permissions.operations`，未新增頂層欄位。
