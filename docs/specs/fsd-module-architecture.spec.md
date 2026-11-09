# FSD + Module Plugin 目標架構 Spec

> 狀態：Draft（待 owner review）・日期：2026-11-09・分支：`docs/fsd-architecture`
> 範圍：只定義目標架構與重構切棒；**不改 `src/`、不改 `CLAUDE.md`**。CLAUDE.md / project skills / `docs/TRAPS.md` 由下一棒依本 spec 產出。

## 0. 目標與鎖定決策

把專案重整為 [Feature-Sliced Design](https://feature-sliced.design/docs/reference/layers)（FSD），並以類似 `Vue.use` 的 module 註冊系統串接，達成：

1. 共用基本架構（core = `app/` + `shared/`）
2. 能整套換掉 UI shell / 頁面組裝
3. 能把整個電商 domain 換成別的 domain

Owner 已鎖定（本 spec 不得改，下文以 D-編號引用）：

| ID | 決策 |
|----|------|
| D1 | 「換 UI」= 換 UI shell / 頁面組裝（layout、pages、widgets）；entities / features 資料邏輯共用。不做 UI 元件庫 adapter。 |
| D2 | Plugin = feature module 註冊：`createApp().use(module)`，`defineModule({ id, routes, nav, i18n, mockHandlers, permissions })`。UI slot 延後：未來以新增 `slots` 欄位 + `<Slot>` 擴充，不需重構；本 spec 不設計 slot 契約。 |
| D3 | 單 repo；FSD 依賴方向以 lint 強制（本 spec §7 給建議）；不做 pnpm monorepo。 |
| D4 | core domain-agnostic。通用 module：auth/login、users、team-members；domain module：orders、product、suppliers、consumers、banners、articles、tags。驗收：刪掉所有 domain module 的 `.use()` + 目錄，app 仍能 build 並跑起來。 |
| D5 | 權限矩陣 role × resource × action（`orders:read` / `orders:update` / `orders:export`）。module 宣告自己的 resource/action；矩陣資料由 mock 提供。架構層強制四點：route guard、nav 過濾、操作層宣告式 permission、mock API 403。取代 `useUserPermissions()` 寫死語意方法。ABAC 列 open question。 |

---

## 1. 現況 anchor（2026-11-09，master `6029bf0`）

| 主題 | Anchor | 觀察 |
|------|--------|------|
| 路由樹 | `src/router/routes.tsx:1-21` | 靜態 import 全部 page，core 直接依賴 domain |
| | `src/router/routes.tsx:25-32` / `:52-59` | login / protected 守衛以 `getAuth()` 寫在 `beforeLoad` |
| | `src/router/routes.tsx:91-100` | orders 用 `loader` 做 `/orders` → `/orders/order-list` redirect |
| | `src/router/routes.tsx:186-212` | `routeTree` 手工組裝 |
| | `src/router/index.ts:10-14` | `Register` 宣告 → 全專案 typed `navigate({ to })` 依賴此靜態樹 |
| | `src/router/__root.tsx:10-24` | QueryClient / devtools / Toaster provider 住在 root route |
| 啟動 | `src/main.tsx:5-12` | side-effect import i18n、`RouterProvider` |
| Layout | `src/components/layouts/ProtectedAppLayout.tsx:6-13` | layout（core）import `@/pages/users/hooks/use-user`（通用 module）的 `canAccessAdminPanel` |
| | `src/components/layouts/AuthLayout.tsx:17-32` | 登入頁（含 mutation）以 layout 身分存在 |
| Nav | `src/constants/sidebar.tsx:14-66` | 靜態 domain 選單（customers / products / orders…），TransKey label |
| | `src/components/shared/AppSidebar.tsx:40,79-127` | 直接讀 `sidebarMenu`；`:48-52` logout；`:58-61` 語系清單寫死 |
| Breadcrumb | `src/hooks/use-breadcrumb.ts:36-58` | `switch(segment)` 寫死 domain segment → label |
| API | `src/services/api-client.ts:7-31` | session 型別 + `getAuth/setAuth/clearAuth`；`TAuthUser.role: TUserRole` 來自 users schema（`:3`） |
| | `src/services/api-client.ts:50-78` | `apiFetch` → `mockFetch` |
| Mock | `src/services/mock/handlers.ts:9-19` | 單一 `db` 含全部 domain collection |
| | `src/services/mock/handlers.ts:73-105` | 通用 CRUD `resource()` helper（可抽為 core） |
| | `src/services/mock/handlers.ts:123-199` | 單一 `handlers` 表；`:174-176` consumers 的 transaction_history 讀 orders 資料 |
| | `src/services/mock/handlers.ts:202-221` | `mockFetch`：`METHOD path` 查表、404 fallback |
| | `src/services/mock/data.ts:25-50,177,217` | DEMO 帳號；customers / staff seed 由 users 衍生 |
| Schema | `src/services/schemas/*.ts`、`src/services/types/schema.ts:3-55` | domain zod 與通用 primitive（pagination / lang / image）混放 |
| | `src/services/schemas/user.ts:3-12` | role enum（7 個 role）寫死在 users schema |
| 權限 | `src/pages/users/hooks/use-user.ts:146-174` | `useUserPermissions()` 寫死 `canManageUsers` 等；消費點 `ProtectedAppLayout.tsx:9`、`src/pages/users/UserList.tsx:28,167` |
| i18n | `src/locales/types.ts:1-16`、`src/locales/i18n.ts:10-44` | 單一 `translation` namespace，自寫 backend 讀 `en/zh.json` |
| | `src/constants/locales.ts:14-20`、`src/types/i18next.d.ts:4-16` | `TransKey` 由 `zh.json` 遞迴推導，`t()` 參數被收窄成此型別 |
| | `src/locales/en.json`（740 行） | domain key 散在 `order` / `dashboard.menu.*` / `toast.*` / `table.headers.*` / `validation.image.banner` |
| image-validation | `src/plugins/image-validation/{base-rules,manager.ts,types.ts}` | 通用；`presets/banner/*` 為 banner domain 規則 |
| | 消費點 | `components/shared/dialog/ImageUploadDialog.tsx:25`、articles / product / banners 表單 |
| core→domain 汙染 | `src/components/shared/Tags.tsx:4,16-30` | 共用 Tag 依 `EOrderStatus` 決定顏色 |
| 跨 page import | `pages/consumers/components/OrderCard.tsx:6`、`pages/product/Product{Create,Draft,Edit}Form.tsx` | consumers→orders util；product→suppliers / tags hooks |
| ESLint | `.eslintrc`（legacy config，ESLint 8.57.1） | 已有 `import/no-cycle`、`import/resolver typescript`；無邊界規則 |
| 測試 | `vite.config.ts:14-18` | vitest 設定在 vite config；14 個測試檔分散於 `services/ plugins/ components/shared/table/ pages/{product,banners}` |

---

## 2. FSD 規則對齊（Named Concept Anchor）

以官方文件為準（URL 皆於 2026-11-09 自驗 HTTP 200）：

- **Layer 由上而下**：`app` → `pages` → `widgets` → `features` → `entities` → `shared`。`processes` 已 deprecated，不使用。— https://feature-sliced.design/docs/reference/layers
- **Import 規則**：slice 內的檔案只能 import **嚴格下層**的 slice；同層 slice 互相 import 禁止。— 同上
- **`app` / `shared` 無 slice**，只有 segment，segment 間可互相 import；但仍需 public API。— https://feature-sliced.design/docs/reference/slices-segments
- **Segment**：`ui` / `api` / `model` / `lib` / `config`；`components` / `hooks` / `types` 被官方列為不良命名（以用途命名）。— 同上
- **Slice group**：相關 slice 可放同一資料夾（如 `entities/order/`），隔離規則不變，group 資料夾不得放共用碼。— 同上
- **Public API**：每個 slice 以 `index.ts` 明確 re-export，官方建議避免 `export *`。— https://feature-sliced.design/docs/reference/public-api
- **`@x` cross-import**：僅限 entities 層，`entities/A/@x/B.ts` 供 B 使用，需最小化。— 同上
- **Router 設定住 `app`**；`shared` 只可放 route 常數。— layers 頁

---

## 3. 目標目錄樹

```
src/
├── app/                        # 組裝根（無 slice）
│   ├── entry/main.tsx          # createApp(...).use(...).mount()
│   ├── modules.ts              # ★ 唯一列出所有 .use() 的檔案
│   ├── create-app/             # createApp / registry / 組裝流程（§4）
│   ├── providers/              # QueryClient、i18n、Toaster、RegistryProvider
│   ├── router/                 # root route、protected route、組裝後 routeTree
│   └── styles/global.css
├── modules/                    # ★ module manifest（非 FSD layer，見 §3.1）
│   ├── auth/  users/  team-members/                       # 通用
│   └── orders/ product/ suppliers/ consumers/ banners/ articles/ tags/   # domain
│       └── <id>/{index.ts, routes.tsx, nav.ts, permissions.ts, mock/, locales/{en,zh}.json}
├── pages/                      # 一頁一 slice
│   ├── login/  user-list/  user-edit/  team-member-list/
│   └── order-list/ order-details/ product-list/ product-form/ … (見 §5)
├── widgets/
│   ├── app-shell/              # Sidebar、Navbar、Breadcrumb、ProtectedLayout、AuthLayout（D1 換 shell 的單位）
│   └── <domain-widget>/        # 例：order-card（consumers 頁用）
├── features/
│   ├── auth-login/ auth-logout/ locale-switch/
│   ├── user-edit-role/ order-update/ product-edit/ banner-sort/ image-upload/ …
├── entities/
│   ├── session/  user/  staff/                            # 通用
│   └── order/ product/ supplier/ customer/ banner/ article/ tag/   # domain
│       └── <x>/{model/(zod schema、type), api/(query hooks), ui/(展示元件), index.ts}
└── shared/
    ├── api/                    # apiFetch、mock 執行器（mockFetch + 可註冊 handler 表 + CRUD helper）
    ├── auth/                   # session store（get/set/clear）
    ├── permission/             # 權限引擎 can()、型別、<Guarded>（§6）
    ├── module/                 # defineModule 型別與 helper（無 runtime 狀態）
    ├── i18n/                   # i18next 實例、core 字典、合併 API
    ├── ui/                     # shadcn 元件（原 components/ui）+ DataTable、EditActions、FormSubmit…
    ├── lib/                    # cn、array-helpers、image-validation（base rules + manager）、toast…
    └── config/                 # locales 常數、env
```

### 3.1 Module manifest 放哪一層（理由）

**決定：`src/modules/<id>/`，概念上屬 `app` 層的延伸（composition root），不是 FSD layer。**

- manifest 的內容是 routes / nav / i18n / mock / permissions 的**組裝宣告**，官方把 router 設定與 provider 放 `app`（§2），所以它的依賴方向等同 `app`：可 import `pages/widgets/features/entities/shared`，**不可被任何 FSD layer import**，只有 `app/modules.ts` 能 import。
- 不直接放 `app/modules/<id>/`：`app` 官方定義無 slice，硬塞 per-module 子目錄會讓 steiger 類工具誤判；獨立頂層目錄讓「刪 module = 刪 `modules/<id>/`」最直觀。
- 不放 `features/`：feature 是使用者操作單位（官方語意），manifest 會 import pages（上層），放 features 直接違反 import 規則。
- manifest 之間**禁止互相 import**（同 slice 規則）；跨 module 共用只能透過 entities（§5.3）。

**代價**：一個 domain module 的實作橫跨 `modules/<id>` + `pages/*` + `features/*` + `entities/*` 多個目錄（FSD 水平分層的本質）。D4「刪掉目錄」因此是「刪掉該 module 擁有的一組 slice」，由 manifest 的 `owns` 註解清單 + §8 M6 的自動化驗收腳本保證。→ 見 Open Question OQ-1。

---

## 4. Module 契約與組裝

### 4.1 型別草案（`shared/module`）

```ts
// shared/module/types.ts
import type { AnyRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";
import type { TPermission, TModulePermissions } from "@/shared/permission";
import type { TMockHandlerTable } from "@/shared/api";

export type TLocale = "en" | "zh";

export type TNavItem = {
  id: string;
  label: string;              // i18n key，必須以 `${moduleId}.` 開頭
  to: string;                 // 絕對路徑
  icon?: ComponentType<{ className?: string }>;
  permission: TPermission;    // 必填，nav 過濾依據（§6.3）
  order?: number;             // 排序，預設 100
  children?: Omit<TNavItem, "icon" | "children">[];
};

export type TRouteContext = {
  parent: AnyRoute;                                   // protected layout route（或 public root）
  guarded: typeof import("@/shared/permission").guardedRoute;  // §6.2
};

export type TModule = {
  id: string;                                         // kebab-case，唯一
  kind: "generic" | "domain";                         // 文件用途；D4 驗收腳本依此挑出 domain
  routes?: (ctx: TRouteContext) => AnyRoute[];        // 回傳掛在 parent 下的子樹
  publicRoutes?: (ctx: { parent: AnyRoute }) => AnyRoute[]; // 例：/login，掛 root 不經 protected
  nav?: TNavItem[];
  i18n?: Record<TLocale, Record<string, unknown>>;    // 頂層 key 必須 === id
  mockHandlers?: TMockHandlerTable;                   // §4.4
  permissions?: TModulePermissions;                   // §6.1
  // future: slots?: ...（D2：以新增欄位 + <Slot> 擴充，不改既有欄位）
};

export const defineModule = <const M extends TModule>(m: M): M => m; // 純型別輔助
```

### 4.2 `createApp` / registry（`app/create-app`）

```ts
// app/create-app/index.ts
export type TShell = {
  ProtectedLayout: ComponentType;  // 內含 <Outlet />
  AuthLayout?: ComponentType;
};

export type TRegistry = {
  modules: readonly TModule[];
  nav: TNavItem[];                          // 依 order 排序後、未過濾
  permissions: TPermissionCatalog;          // resource → actions（union of modules + core）
  mockHandlers: TMockHandlerTable;          // core + modules
  i18n: Record<TLocale, Record<string, unknown>>;
};

export const createApp = ({ shell }: { shell: TShell }) => {
  const modules: TModule[] = [];
  const app = {
    use(m: TModule) { modules.push(m); return app; },
    build(): { router: TRouter; registry: TRegistry } { /* §4.3 */ },
    mount(selector: string) { /* build → registerMockHandlers → i18n.addResourceBundle → render */ },
  };
  return app;
};
```

```ts
// app/modules.ts —— 唯一的 .use() 清單（D4 驗收刪的就是這裡的行）
export const installModules = (app: TApp) =>
  app
    .use(authModule).use(usersModule).use(teamMembersModule)           // generic
    .use(ordersModule).use(productModule).use(suppliersModule)         // domain
    .use(consumersModule).use(bannersModule).use(articlesModule).use(tagsModule);
```

### 4.3 組裝流程（`build()`，純函式，可單元測試）

1. **驗證**：module `id` 不重複；`i18n` 每個 locale 的頂層 key 只能是 `id`；`mockHandlers` 的 `METHOD path` 不重複（含與 core 衝突）；nav `permission` 的 resource 必須在某 module 的 `permissions` 宣告過。任一失敗 → throw（開發期立即爆，測試可斷言）。
2. **Router tree**：
   ```ts
   const protectedRoute = createProtectedRoute(rootRoute, shell.ProtectedLayout); // beforeLoad: 未登入 → /login；缺 app:access → /403
   const tree = rootRoute.addChildren([
     ...modules.flatMap(m => m.publicRoutes?.({ parent: rootRoute }) ?? []),
     protectedRoute.addChildren([
       createIndexRoute(protectedRoute),                       // "/" → 第一個可見 nav 的 redirect
       ...modules.flatMap(m => m.routes?.({ parent: protectedRoute, guarded: guardedRoute }) ?? []),
     ]),
     createForbiddenRoute(rootRoute),                          // /403
   ]);
   ```
3. **Nav**：`modules.flatMap(m => m.nav ?? []).sort(byOrder)`，透過 `RegistryProvider`（context 型別在 `shared/module`，值由 `app` 提供）給 shell。
4. **i18n**：core 字典（`shared/i18n/locales`）為 base，各 module 以 `i18n.addResourceBundle(lng, "translation", { [id]: dict }, true, false)` 深合併進同一 namespace（[i18next API](https://www.i18next.com/overview/api)）。
5. **Mock handler 表**：`registerMockHandlers(coreHandlers)` 後依序註冊 module handlers；`mockFetch` 只查註冊表（取代 `handlers.ts:123` 的單一常數表）。module 的 seed 資料住各自 `modules/<id>/mock/`，透過 `shared/api` 的 `createMockCollection(name, seed)` 註冊，CRUD helper 沿用現行 `resource()`（`handlers.ts:73`）搬到 `shared/api/mock`。
6. **Permissions**：彙整 `TPermissionCatalog`；`mockGrants` 併入 mock 端矩陣（§6.1）。

### 4.4 Mock handler 型別

```ts
// shared/api/mock/types.ts
export type TMockHandler = {
  permission?: TPermission | "public";   // 省略 = 只需登入；"public" = 不需登入（login）
  handle: (ctx: { query: Record<string, string>; body: Record<string, unknown>; session: TSession | null })
    => { status?: number; body?: unknown };
};
export type TMockHandlerTable = Record<`${"GET" | "POST" | "PUT" | "DELETE"} /${string}`, TMockHandler>;
```

### 4.5 型別安全的取捨（TanStack Router `Register`）

現行 `router/index.ts:10-14` 用靜態樹宣告 `Register`，`navigate({ to: "/users/edit/$id" })` 有完整型別。module 以 factory 回傳 `AnyRoute[]` 後，組裝出的樹型別寬化，**跨 module 與 module 內的 typed `to` / `params` 會退化成寬鬆型別**。

- 本 spec 採：接受寬化；module 內導航改用各 module 匯出的 route 物件（`router.navigate({ to: orderDetailsRoute.fullPath, params })`）或 `route.useParams()`，跨 module 導航只經 nav 字串。
- 替代方案（未採用）：`app/router` 靜態列舉所有 module route 以保留 `Register` 精確型別 —— 代價是 `app` 必須逐一 import 每個 module 的 route 型別，刪 module 需改兩處，違背 D4 的「刪 `.use()` 一行」形狀。
- → OQ-2，請 owner 確認可接受型別退化。

---

## 5. 現有檔案 → 新位置對照

### 5.1 Core（`app/` + `shared/`）

| 現有 | 新位置 | 備註 |
|------|--------|------|
| `main.tsx` | `app/entry/main.tsx` | 改為 `createApp({ shell })` + `installModules` + `mount` |
| `router/__root.tsx` | `app/router/root.tsx` + `app/providers/` | provider 移出 root route |
| `router/routes.tsx` | 拆入各 `modules/<id>/routes.tsx` + `app/router/protected.tsx` | login/protected 守衛 → `app/router` |
| `router/index.ts` | `app/create-app/build.ts` | 見 §4.5 |
| `components/ui/*` | `shared/ui/*` | shadcn，`components.json` alias 同步 |
| `components/shared/{Card,Paper,TextInputs,LoadingPage,EditActions}.tsx` | `shared/ui/` | `EditActions` 加 permission 宣告（§6.4） |
| `components/shared/DataTable.tsx`、`table/**` | `shared/ui/data-table/` | 加 `rowActions` / `toolbarActions`（§6.4） |
| `components/shared/dialog/ImageUploadDialog.tsx` | `features/image-upload/ui/` | 依賴 image-validation 與 upload API |
| `components/shared/Tags.tsx` | `shared/ui/tag.tsx`（改 `tone` prop）+ `entities/order/ui/order-status-tag.tsx` | 移除 `EOrderStatus` 依賴（`Tags.tsx:4`） |
| `components/shared/UnauthorizedPage.tsx` | `pages/forbidden/` | 由 `/403` route 使用 |
| `components/shared/{AppSidebar,Navbar,Breadcrumb}.tsx` | `widgets/app-shell/ui/` | Sidebar 讀 registry nav；語系清單讀 `shared/config/locales` |
| `components/layouts/ProtectedAppLayout.tsx` | `widgets/app-shell/ui/protected-layout.tsx` | 移除 `useUserPermissions`（權限改由 route guard） |
| `components/layouts/AuthLayout.tsx` | `widgets/app-shell/ui/auth-layout.tsx`（外框）+ `pages/login/` + `features/auth-login/` | 拆 layout 與登入邏輯 |
| `constants/sidebar.tsx` | 刪除 → 各 `modules/<id>/nav.ts` | |
| `constants/locales.ts` | `shared/config/locales.ts` + `shared/i18n/types.ts` | `TransKey` 改為宣告合併（§5.4） |
| `hooks/use-breadcrumb.ts` | `widgets/app-shell/model/use-breadcrumb.ts` | `switch` 改為讀 route `staticData.breadcrumb`（i18n key） |
| `hooks/use-toast.ts`、`use-mobile.tsx` | `shared/lib/` | |
| `hooks/use-multi-select.ts` | `shared/lib/` | 通用 |
| `hooks/use-img-upload.ts` | `features/image-upload/model/` | 打 `/admin/images` |
| `lib/utils.ts`、`lib/gen-validate-message.ts`、`utils/array-helpers.ts` | `shared/lib/` | |
| `locales/{en,zh}.json` | `shared/i18n/locales/` 只留 core key（common / login / logout / validation 通用 / breadcrumb / table 通用）；domain key 搬到 `modules/<id>/locales/` | |
| `locales/i18n.ts`、`types.ts`、`types/i18next.d.ts` | `shared/i18n/` | |
| `services/api-client.ts` | `shared/api/api-client.ts` + `shared/auth/session.ts` | `TAuthUser.role` 改 `string`，session 增 `grants: TPermission[]` |
| `services/mock/handlers.ts` | `shared/api/mock/{fetch,registry,crud}.ts` + 各 module `mock/handlers.ts` | |
| `services/mock/data.ts` | 各 module `mock/seed.ts`；`placeholderImage`、`DEMO_ACCOUNT` → `shared/api/mock/` / `modules/auth/mock/` | |
| `services/types/schema.ts` | `shared/api/schema.ts`（pagination / response envelope / lang / image） | |
| `services/schemas/user.ts` | `entities/user/model/` | role enum 改為 mock 資料（§6.1） |
| `plugins/image-validation/{base-rules,manager.ts,types.ts,schemas.ts,utils,constants,presets/general.preset.ts}` | `shared/lib/image-validation/` | i18n key `validation.image.*`（通用部分）留 core |
| `plugins/image-validation/presets/banner/**` | `entities/banner/lib/image-validation/` | `validation.image.banner.*` / `resolution` → `banners.*` |
| `types/{index.d.ts,table.d.ts}`、`vite-env.d.ts` | `shared/types/`（d.ts 例外） | |
| `styles/global.css` | `app/styles/` | |
| `test/setup*.ts` | 保留 `src/test/`（測試基建，lint ignore） | |

### 5.2 Modules（逐目錄）

| 現有 | module | pages | features | entities | 其他 |
|------|--------|-------|----------|----------|------|
| `components/layouts/AuthLayout.tsx`、mock `POST /api/auth/login` | `auth` (generic) | `login` | `auth-login`、`auth-logout` | `session` | publicRoutes `/login` |
| `pages/users/{UserList,UserForm}.tsx`、`components/EditUserRoleDialogContent.tsx`、`hooks/use-user.ts` | `users` (generic) | `user-list`、`user-edit` | `user-edit-role`（dialog + `useUpdateUserRole`） | `user`（schema、`useGetUserList`、`useGetUserProfile`、`useUpdateUserProfile`） | `useUserPermissions` 刪除 |
| `pages/team-members/**` | `team-members` (generic) | `team-member-list` | `staff-upsert`（`StaffFormDialog`） | `staff` | |
| `pages/orders/{OrderList.tsx,order-details/**}`、`components/{EditDialogContent,StatusColumnFilter}.tsx`、`hooks/use-order.ts`、`utils/{order-status,copy-order}.ts` | `orders` | `order-list`、`order-details` | `order-update`、`order-copy` | `order`（schema、status 文字/tag、`useGetOrders`） | `/orders` redirect |
| `pages/product/**`（Create / Draft / Edit / List、`components/*`、`utils/*`） | `product` | `product-list`、`product-form`（create/draft/edit 共用 slice） | `product-edit`（confirm dialog、field-comparison、form-transformers） | `product` | 依賴 `entities/supplier`、`entities/tag` |
| `pages/suppliers/**` | `suppliers` | `supplier-list` | `supplier-upsert` | `supplier`（`useGetSupplierAll`） | |
| `pages/tags/**` | `tags` | `tag-list` | `tag-upsert` | `tag`（`useGetAllTags`） | |
| `pages/consumers/**` | `consumers` | `customer-list` | — | `customer` | `OrderCard` → `widgets/customer-transactions`（用 `entities/order`）；transaction_history handler 需讀 orders seed（OQ-3） |
| `pages/banners/**`（含 `docs/*.md`） | `banners` | `banner-list`、`banner-form` | `banner-sort`、`banner-upsert` | `banner`（含 image-validation preset） | docs 隨 slice 搬 |
| `pages/articles/**`（含 tiptap） | `articles` | `article-list`、`article-form` | `article-editor`（Tiptap + dialogs） | `article` | |

### 5.3 跨 module 依賴規則

- 允許：`pages/product-form` → `entities/supplier`、`entities/tag`（下層，FSD 合法）。
- 禁止：任何 `modules/*` 互 import；任何 `pages/*` 互 import；任何 `features/*` 互 import。
- 因此「刪單一 module」只在其 entities 未被其他 module 使用時成立；**刪整個 domain pack 一定成立**（D4 驗收形狀）。

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
export type TPermission = `${string}:${string}`;           // "orders:read"
export type TGrant = TPermission | `${string}:*` | "*";     // wildcard 只出現在矩陣資料
export type TModulePermissions = {
  resources: Record<string, readonly string[]>;             // { orders: ["read","update","export"] }
  mockGrants?: Record<string /* roleId */, TGrant[]>;       // 只給 mock 矩陣用，前端 runtime 不讀
};
export type TPermissionCatalog = Record<string, readonly string[]>;

// shared/permission/can.ts —— 唯一判斷函式
export const can = (grants: readonly TGrant[], p: TPermission): boolean;  // 支援 "*" 與 "orders:*"
export const useCan = () => (p: TPermission) => can(useSession()?.grants ?? [], p);
```

**矩陣（mock 端）**：

```ts
// shared/api/mock/permission-matrix.ts（core，只含 core resource）
export const coreRoles = ["superadmin", "admin", "support", "partner", "premium", "user", "guest"]; // 由 users enum 移出，成為資料
export const coreGrants: Record<string, TGrant[]> = {
  superadmin: ["*"],
  admin: ["app:access"],
  support: ["app:access"],
  partner: ["app:access"],
};
// 組裝時：matrix[role] = coreGrants[role] ∪ ⋃modules.permissions.mockGrants[role]
```

- 登入 handler（`auth` module）回傳 `session.user.role` + `session.grants`（由矩陣展開，wildcard 保留）；前端只認 `grants`，**前端不知道 role→grant 的對照**（接真後端時由後端給 grants，前端不改）。
- core resource：`app:access`（取代 `canAccessAdminPanel`，`ProtectedAppLayout.tsx:9`）。
- 現行語意方法對照（供遷移）：`canViewUserList` → `users:read`、`canEditUserRole` → `users:update-role`、`canManageUsers` → `users:update`、`canManageProducts` → `product:*`、`canManageOrders` → `orders:*`、`canViewReports` → 無消費點，刪除。

### 6.2 強制點 1：Route guard

```ts
// shared/permission/guarded-route.ts
export const guardedRoute = <TOpts>(opts: TOpts & { permission: TPermission | "authenticated" }) =>
  createRoute({
    ...opts,
    staticData: { ...opts.staticData, permission: opts.permission },
    beforeLoad: (ctx) => {
      if (opts.permission !== "authenticated" && !can(getSession()?.grants ?? [], opts.permission))
        throw redirect({ to: "/403" });
      return opts.beforeLoad?.(ctx);
    },
  });
```

- module `routes()` 只能用 ctx 傳入的 `guarded` 建 route；lint 禁止 `modules/**` 直接呼叫 `createRoute`（§7）。
- **結構性測試**：`build()` 後走訪 protected 子樹，斷言每個 route 的 `staticData.permission` 存在（`"authenticated"` 需顯式寫出）。缺宣告 = 測試紅。
- `StaticDataRouteOption` 以 module augmentation 擴充 `permission` / `breadcrumb` 欄位（[RouteOptions](https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType)）。

### 6.3 強制點 2：Nav 自動過濾

- `TNavItem.permission` 必填（型別強制）；`widgets/app-shell` 只透過 `useVisibleNav()`（`shared/module`）取 nav，該 hook 內部 `filter(can)`，children 全被濾掉時父項一併隱藏。
- shell 不得自行讀 registry 原始 nav（lint 禁 import `useRegistry` 於 `widgets/**`，只允許 `useVisibleNav`）。

### 6.4 強制點 3：操作層（宣告式）

shared 元件以資料宣告 permission，元件內統一處理，頁面不寫 `{can && ...}`：

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

- lint：禁止在 `pages/** features/** widgets/**` import `getSession`/`useSession` 讀 `role`（`no-restricted-syntax` 偵測 `.role` 比對），`useCan` 只允許出現在 `shared/**`（迫使走宣告式元件或 `<Guarded>`）。
- `UserList.tsx:167` 的 `canEditUserRole &&` → `rowActions` 一項 `{ permission: "users:update-role" }`。

### 6.5 強制點 4：Mock API 403

```ts
// shared/api/mock/fetch.ts（mockFetch 內）
const session = resolveSession(request.headers.get("Authorization")); // token → user → role → matrix grants
if (handler.permission !== "public" && !session) return 401;
if (handler.permission && handler.permission !== "public" && !can(session.grants, handler.permission)) return 403;
```

- `TMockHandler.permission` 由 module 宣告；組裝驗證：非 `public` 且未宣告 permission 的寫入型 handler（POST/PUT/DELETE）→ throw，強迫宣告。
- 前端 `apiFetch` 收到 403 時統一 toast（`shared/api`），各 hook 不重複處理。

### 6.6 不做

- ABAC（擁有者條件，如「只能改自己建立的文章」）→ OQ-4。
- 動態 role 管理 UI（矩陣編輯頁）→ 不在本次範圍。

---

## 7. Lint 邊界規則（D3）

### 7.1 工具評估

| | eslint-plugin-boundaries | steiger |
|---|---|---|
| 版本 / 狀態 | v7.4.2，peer `eslint >=6`（[npm registry](https://registry.npmjs.org/eslint-plugin-boundaries/latest)） | 0.9.0，README 自述 beta、API 可能變動（[GitHub](https://github.com/feature-sliced/steiger)） |
| 執行方式 | ESLint 規則，吃現有 `pnpm lint` / lint-staged / IDE | 獨立 CLI，需另接 pre-commit / CI |
| 自訂頂層（`modules/`） | 可：`boundaries/elements` 自訂 element type（[docs](https://www.jsboundaries.dev/docs/quick-start/)） | 文件未描述自訂 layer，`typo-in-layer-name` 可能誤報；自訂規則尚未支援 |
| 同層 slice 互 import | 可：`boundaries/dependencies` + capture template（[docs](https://www.jsboundaries.dev/docs/rules/dependencies/)） | 內建 `fsd/forbidden-imports`（預設開） |
| FSD 語意檢查（public API sidestep、segment 命名、insignificant slice） | 需自寫 policy；`entry-point` / `no-private` 在 v7 已 deprecated | 內建，品質高 |
| 環境 | Node ≥18.18 | Node ≥22.18（本機 v24 可，`package.json` engines 為 ≥20，需同步） |
| 風險 | **v7 文件只示範 flat config，legacy `.eslintrc` 支援未證實** | beta、與 `modules/` 不相容未證實 |

**建議：以 eslint-plugin-boundaries 為唯一強制閘門**（進 `pnpm lint` 與 lint-staged，error 級）；steiger 不進閘門，可在 M6 以 `pnpm dlx steiger ./src` 作一次性 advisory 掃描。理由：專案有自訂頂層 `modules/`，只有 boundaries 能表達；且單一 lint 管道不增加 pre-commit 工具鏈。

**前置 spike（M4 AC）**：在 `.eslintrc` 下安裝 boundaries v7 驗證可載入；若不行 → 二選一（OQ-5）：(a) 降版至仍支援 legacy config 的大版號，(b) 先把 ESLint 遷到 flat config（獨立 milestone）。

### 7.2 規則草案（`.eslintrc` 片段，v7 `dependencies` 語法）

```jsonc
{
  "plugins": ["boundaries"],
  "settings": {
    "boundaries/elements": [
      { "type": "app",      "pattern": "src/app" },
      { "type": "modules",  "pattern": "src/modules/*", "capture": ["slice"] },
      { "type": "pages",    "pattern": "src/pages/*",   "capture": ["slice"] },
      { "type": "widgets",  "pattern": "src/widgets/*", "capture": ["slice"] },
      { "type": "features", "pattern": "src/features/*","capture": ["slice"] },
      { "type": "entities", "pattern": "src/entities/*","capture": ["slice"] },
      { "type": "shared",   "pattern": "src/shared" }
    ],
    "boundaries/ignore": ["src/test/**", "**/__tests__/**"]
  },
  "rules": {
    "boundaries/no-unknown-files": "error",
    "boundaries/dependencies": ["error", {
      "default": "disallow",
      "rules": [
        { "from": { "element": { "type": "app" } },      "allow": { "to": { "element": { "type": ["modules","pages","widgets","features","entities","shared"] } } } },
        { "from": { "element": { "type": "modules" } },  "allow": { "to": { "element": { "type": ["pages","widgets","features","entities","shared"] } } } },
        { "from": { "element": { "type": "pages" } },    "allow": { "to": { "element": { "type": ["widgets","features","entities","shared"] } } } },
        { "from": { "element": { "type": "widgets" } },  "allow": { "to": { "element": { "type": ["features","entities","shared"] } } } },
        { "from": { "element": { "type": "features" } }, "allow": { "to": { "element": { "type": ["entities","shared"] } } } },
        { "from": { "element": { "type": "entities" } }, "allow": { "to": { "element": { "type": ["shared"] } } } },
        { "from": { "element": { "type": "shared" } },   "allow": { "to": { "element": { "type": ["shared"] } } } }
      ]
    }]
  }
}
```

- 同層 slice 互 import：以上規則未列「同 type」→ default disallow 已擋（同 slice 內部 import 為 internal，不受規則）。entities `@x` 例外以額外 `allow` policy 開，需逐條 review。
- Public API：`no-restricted-imports` pattern 禁 `@/{pages,widgets,features,entities}/*/*`（只准 import slice 根 `index.ts`），`@/shared/*/*` 深層同理只准到 segment 根。
- 權限紀律（§6.4）：`no-restricted-imports` / `no-restricted-syntax` 禁 `useUserPermissions`、禁非 `shared/**` 使用 `useCan`、禁 `modules/**` 直接 `createRoute`。
- 精確語法需於 M4 spike 驗證（v7 selector 語法未在本 repo 實測）。

---

## 8. 「換 UI shell」與「換 domain」操作步驟

### 8.1 換 UI shell（驗證 D1）

1. 新建 `widgets/<new-shell>/`，實作 `TShell`（`ProtectedLayout`、`AuthLayout`），導覽只用 `useVisibleNav()`，session 用 `useSession()`、登出用 `features/auth-logout`。
2. `app/entry/main.tsx`：`createApp({ shell: newShell })`。
3. 換頁面組裝（可選）：新建 `pages/<x>-v2` slice，重用同一組 `features/*` / `entities/*`；改對應 `modules/<id>/routes.tsx` 的 component 指向。
4. 不需改：`entities/**`、`features/**`、`shared/**`、`modules/*/{permissions,mock,i18n,nav}`。
→ 成立條件：widgets/pages 不得持有資料邏輯（lint 保證 pages 只能往下依賴；資料 hook 住 entities/features）。

### 8.2 換 domain（驗證 D4）

1. `app/modules.ts` 刪掉 7 個 domain `.use()` 行與 import。
2. 刪除各 domain module 擁有的目錄（`modules/<id>/`、其 manifest `owns` 列出的 `pages/*`、`widgets/*`、`features/*`、`entities/*`）。
3. `pnpm build && pnpm exec vitest run` 綠；`pnpm dev` 登入後看到只含 users / team-members 的 sidebar，`/` redirect 到第一個可見 nav。
4. 新 domain：新增 `modules/<new>/` + 對應 slices，於 `app/modules.ts` 加 `.use()`。
→ 自動化：M6 的 `scripts/verify-core-only.sh` 在暫存副本執行 1–3 的 1、2 與 build/test。

---

## 9. 重構 Milestones

> 每棒可獨立 merge；共同 done 基線：`pnpm build && pnpm exec vitest run` exit 0（`pnpm test` 是 watch 模式，禁用）。lint 只檢查用 `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`（`pnpm lint` 帶 `--fix`）。

### Milestones
- **M1 Core 契約與權限引擎（純新增）**：`shared/module` 型別、`shared/permission`（`can`、型別）、`app/create-app` 的 `build()` 組裝與驗證（routes / nav / i18n / mock / permissions），全為未接線的純函式 + 單元測試
- **M2 Module 接線（行為不變）**：`main.tsx` 改走 `createApp().use()`；路由、sidebar、mock handler 表、i18n 改由 registry 組裝；10 個 module manifest 指向現有 `pages/` 檔；刪 `router/routes.tsx`、`constants/sidebar.tsx`
- **M3 權限四強制點**：登入回 grants、mock 矩陣、`guardedRoute`、`useVisibleNav`、DataTable/EditActions/FormSubmit 宣告式 permission、mock 403；刪除 `useUserPermissions`
- **M4 Core FSD 搬遷 + 邊界 lint**：`components/ui`/`lib`/`hooks`/`services` 共用部分/`plugins/image-validation` 通用部分 → `shared/`；layout/sidebar → `widgets/app-shell`；去除 core→domain 汙染（Tag、breadcrumb、role enum）；boundaries spike + 規則上線（legacy 路徑暫列 ignore）
- **M5 Domain FSD 搬遷**：逐 module 拆 `pages/features/entities`；`services/schemas` → `entities/*/model`；mock seed / handlers / i18n key 搬入 `modules/<id>/`；移除 lint ignore
- **M6 D4 驗收自動化與收尾**：`scripts/verify-core-only.sh`、manifest `owns` 清單、steiger advisory 掃描報告、舊目錄清空確認

---

#### M1 Core 契約與權限引擎

**User Story**：As a maintainer, I want module contract types and a pure registry builder with tests, so that later milestones wire modules against a verified contract instead of ad-hoc glue.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: `can()` 正確處理精確 grant、`resource:*`、`*`、無 grant 四種情況
  - 驗證：`pnpm exec vitest run src/shared/permission`
- [ ] AC-2 `[cmd]`: `build()` 對重複 module id、i18n 頂層 key ≠ id、mock route 衝突、nav 引用未宣告 resource 各 throw
  - 驗證：`pnpm exec vitest run src/app/create-app`
- [ ] AC-3 `[cmd]`: `build()` 以兩個 fixture module 產出的 route tree 含兩者子路由、nav 依 order 排序、i18n 深合併後 core key 不被覆蓋
  - 驗證：同上
- [ ] AC-4 `[cmd]`: 既有行為不變（無 import 到新碼）
  - 驗證：`pnpm build && pnpm exec vitest run`

**Pseudo code**
```ts
build(modules, core) {
  assertUniqueIds(modules); assertI18nScoped(modules); assertMockUnique(core, modules); assertNavResources(modules);
  return { routeTree: assemble(root, protected, modules), nav: sortBy(order, flatMap(nav)),
           i18n: mergeDeep(core.i18n, ...modules.map(m => ({ [m.id]: m.i18n }))),
           mockHandlers: {...core.mock, ...modules.mock}, permissions: catalog(modules) };
}
```

**Test stub**
```ts
describe("build()", () => {
  it("throws on duplicate module id", () => { expect(() => build([a, a], core)).toThrow(/duplicate module id/); });
  it("throws when i18n top-level key !== id", ...);
  it("merges routes of two modules under protected", ...);
});
describe("can()", () => { it.each([[["*"], "orders:read", true], [["orders:*"], "orders:export", true], [["orders:read"], "orders:update", false], [[], "app:access", false]])(...); });
```

**Touches**：`src/shared/module/**`、`src/shared/permission/**`、`src/app/create-app/**`（全新）
**Must-Not-Touch**：既有 `src/` 檔案全部；行為紅線：不改任何現有 import 路徑

**Done Command**
```bash
pnpm build && pnpm exec vitest run
```
expected: exit 0；新測試檔出現在 vitest 輸出且全 pass

---

#### M2 Module 接線（行為不變）

**User Story**：As a maintainer, I want every page group registered via `createApp().use(module)`, so that adding/removing a feature is one `.use()` line instead of editing router, sidebar and mock tables.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: `router/routes.tsx`、`constants/sidebar.tsx` 不存在；`app/modules.ts` 恰有 10 個 `.use(`
  - 驗證：`test ! -e src/router/routes.tsx && test ! -e src/constants/sidebar.tsx && test "$(grep -c '\.use(' src/app/modules.ts)" -eq 10`
- [ ] AC-2 `[cmd]`: registry 產出的路徑集合與重構前一致（快照測試列出全部 fullPath）
  - 驗證：`pnpm exec vitest run src/app`
- [ ] AC-3 `[cmd]`: 既有 `api-client.test.ts` 6 條全綠（mock handler 表改由註冊後仍同行為）
  - 驗證：`pnpm exec vitest run src/services`
- [ ] AC-4 `[manual]`: `pnpm dev` 登入後 sidebar 項目、順序、各頁 CRUD 與重構前相同；語系切換正常

**Touches**：`src/main.tsx`、`src/router/**`、`src/constants/sidebar.tsx`、`src/components/shared/AppSidebar.tsx`、`src/services/mock/handlers.ts`、`src/locales/i18n.ts`、`src/modules/**`（新）、`src/app/**`
**Must-Not-Touch**：`src/pages/**` 內部實作（只被 import）；`src/components/ui/**`；行為紅線：URL、i18n key、mock API 路徑不變

**Done Command**
```bash
pnpm build && pnpm exec vitest run
```
expected: exit 0

---

#### M3 權限四強制點

**User Story**：As an admin of a specific role, I want routes, menu, actions and API to consistently reflect my grants, so that permission behavior is declared once per module instead of scattered conditionals.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: 以 `support` role 登入的 session 無 `users:read` → 進 `/users` 被導至 `/403`；sidebar 無 users 項
  - 驗證：`pnpm exec vitest run src/shared/permission src/app`（router + useVisibleNav 測試）
- [ ] AC-2 `[cmd]`: mock `POST /admin/user/role` 以缺 `users:update-role` 的 token 呼叫回 403；未帶 token 回 401
  - 驗證：`pnpm exec vitest run src/shared/api`
- [ ] AC-3 `[cmd]`: DataTable `rowActions` 無權限項預設不渲染、`denied:"disable"` 渲染為 disabled；`FormSubmit` 無權限 disabled
  - 驗證：`pnpm exec vitest run src/components/shared src/shared/ui`
- [ ] AC-4 `[cmd]`: 結構性測試：protected 子樹每個 route 都有 `staticData.permission`
  - 驗證：`pnpm exec vitest run src/app`
- [ ] AC-5 `[cmd]`: `useUserPermissions` 已無任何引用
  - 驗證：`! grep -rn "useUserPermissions" src`
- [ ] AC-6 `[manual]`: superadmin demo 帳號所有頁面與操作仍可見可用

**Touches**：`src/shared/permission/**`、`src/services/api-client.ts`、`src/services/mock/**`、`src/components/shared/{DataTable,EditActions}.tsx`、`src/components/layouts/ProtectedAppLayout.tsx`、`src/pages/users/**`、`src/modules/**`、`src/app/**`
**Must-Not-Touch**：其他 `src/pages/**` 的業務邏輯（只改 action 宣告處）；行為紅線：superadmin 可見範圍不縮減

**Done Command**
```bash
pnpm build && pnpm exec vitest run && ! grep -rn "useUserPermissions" src
```
expected: exit 0

---

#### M4 Core FSD 搬遷 + 邊界 lint

**User Story**：As a maintainer, I want core code living in `app/` + `shared/` + `widgets/app-shell` with lint-enforced boundaries, so that core stays domain-agnostic by construction rather than by review.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: boundaries 外掛在現行 `.eslintrc` 下可載入並報出違規（spike：故意寫一個 `shared → entities` import 的 fixture 被擋）
  - 驗證：`pnpm exec eslint src/shared --rule ...`（fixture 測後刪除，結果記錄於 PR）
- [ ] AC-2 `[cmd]`: `src/shared/**` 無任何 domain 字串依賴（`EOrderStatus`、`order`、`product` 等 import）
  - 驗證：`! grep -rnE "@/(entities|features|pages|widgets|modules)/" src/shared`
- [ ] AC-3 `[cmd]`: `components/ui`、`lib`、`hooks`、`utils`、`constants`、`plugins` 目錄已清空移除（domain 殘留除外並列於 PR）
  - 驗證：`test ! -d src/components/ui && test ! -d src/lib && test ! -d src/plugins`
- [ ] AC-4 `[cmd]`: lint 無 error
  - 驗證：`pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`

**Touches**：`src/components/**`、`src/lib/**`、`src/hooks/**`、`src/utils/**`、`src/constants/**`、`src/plugins/**`、`src/services/{api-client.ts,types/**,mock/handlers.ts}`、`src/locales/**`、`src/shared/**`、`src/widgets/**`、`src/app/**`、`.eslintrc`、`package.json`、`components.json`
**Must-Not-Touch**：`src/pages/**` 業務邏輯（只改 import 路徑）；行為紅線：UI 外觀與路由不變

**Done Command**
```bash
pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run
```
expected: exit 0

---

#### M5 Domain FSD 搬遷

**User Story**：As a maintainer, I want each module's code split into pages/features/entities with its own mock and i18n, so that a module is self-contained and swappable.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: `src/pages/<old>/`、`src/services/` 不存在；所有 page 均為一頁一 slice 且有 `index.ts`
  - 驗證：`test ! -d src/services && for d in src/pages/*/; do test -f "$d/index.ts" || exit 1; done`
- [ ] AC-2 `[cmd]`: core 字典（`shared/i18n/locales/*.json`）頂層 key 不含任何 module id
  - 驗證：`pnpm exec vitest run src/shared/i18n`（斷言測試）
- [ ] AC-3 `[cmd]`: boundaries ignore 清單已移除，lint 全綠
  - 驗證：`pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`
- [ ] AC-4 `[cmd]`: 既有 14 個測試檔（搬遷後路徑）全綠
  - 驗證：`pnpm exec vitest run`
- [ ] AC-5 `[manual]`: 兩種語系下各頁文字與重構前一致

**Touches**：`src/pages/**`、`src/services/**`、`src/entities/**`、`src/features/**`、`src/widgets/**`、`src/modules/**`、`src/shared/i18n/locales/**`、`.eslintrc`
**Must-Not-Touch**：`src/app/create-app/**` 契約（如需改 → 回報）；行為紅線：URL、mock API 路徑、使用者可見文字不變

**Done Command**
```bash
pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run
```
expected: exit 0

---

#### M6 D4 驗收自動化與收尾

**User Story**：As the owner, I want a repeatable check that the app builds and runs with only generic modules, so that the domain-swappable promise (D4) is verified, not assumed.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: `scripts/verify-core-only.sh` 在暫存副本刪除 7 個 domain module（`.use()` 行 + manifest `owns` 目錄）後 `pnpm build && pnpm exec vitest run` exit 0
  - 驗證：`bash scripts/verify-core-only.sh`
- [ ] AC-2 `[cmd]`: 每個 domain manifest 有 `owns` 清單且所列目錄皆存在
  - 驗證：腳本內建檢查（同上）
- [ ] AC-3 `[manual]`: core-only 副本 `pnpm dev`，登入後 sidebar 只有 users / team-members，`/` redirect 正常
- [ ] AC-4 `[manual]`: steiger advisory 掃描結果附於 PR（不作為閘門）

**Touches**：`scripts/verify-core-only.sh`（新）、`src/modules/*/index.ts`（`owns`）
**Must-Not-Touch**：`src/**` 其餘；行為紅線：腳本不得修改工作目錄（只在暫存副本操作）

**Done Command**
```bash
bash scripts/verify-core-only.sh && pnpm build && pnpm exec vitest run
```
expected: exit 0；腳本輸出 `core-only build: OK`

---

## 10. Open Questions

| ID | 問題 | 本 spec 暫定 | 影響 |
|----|------|-------------|------|
| OQ-1 | D4「刪掉目錄」在 FSD 水平分層下是「一組 slice」而非單一目錄，可接受嗎？或要改為 module 內嵌 FSD（`modules/orders/{pages,features,entities}`，非官方形狀）？ | 接受多目錄 + `owns` 清單 + M6 腳本驗證 | 決定目錄樹與 lint 規則形狀，M4 前需定 |
| OQ-2 | 接受 TanStack Router typed `to`/`params` 因動態組裝而寬化？（§4.5） | 接受；module 內用 route 物件導航 | M2 起所有 `navigate` 呼叫寫法 |
| OQ-3 | 跨 domain mock 資料依賴（consumers 的 transaction_history 讀 orders、customers/staff seed 由 users 衍生）：允許 module mock 讀其他 module 的 collection，還是 consumers 自帶 seed？ | consumers 自帶 transaction seed，customers seed 自帶；staff 讀 users collection 經 `shared/api/mock` 公開查詢 | M5 mock 切分 |
| OQ-4 | 是否需要 ABAC（擁有者 / 欄位條件）？ | 不設計；`TPermission` 字串格式保留未來加 `condition` 的空間 | 若需要會影響 `can()` 簽名 |
| OQ-5 | boundaries v7 若不支援 legacy `.eslintrc`：降版或先遷 flat config？ | M4 spike 結果決定；建議先遷 flat config 為獨立小棒 | M4 範圍 |
| OQ-6 | 是否需要 module 依賴宣告（例 `product` requires `suppliers`、`tags` 的 entities）？D2 欄位清單未含 | 不加欄位；依賴只存在 entities 層，由 lint + M6 腳本兜底 | 單一 domain module 可刪性 |
| OQ-7 | `/` 首頁目前無 index route（`routes.tsx:186-212`），重構後改為 redirect 到第一個可見 nav，是否另需 dashboard 頁？ | redirect | M2 |
| OQ-8 | 403 時 UI 行為：獨立 `/403` 頁（暫定）vs. 留在 layout 內顯示 `UnauthorizedPage` | `/403` route | M3 |

---

## 11. 與 D1–D5 的張力（surface，未自行擇一）

- **D4 × FSD**：見 OQ-1。D4 字面「刪目錄」與 FSD 水平分層存在形狀張力；本 spec 以 `owns` 清單 + 自動化腳本滿足驗收語意，不改變 D4。
- **D2 × D5**：D2 欄位清單沒有「role→grant 預設矩陣」的位置；本 spec 放在 `permissions.mockGrants`（仍在 D2 的 `permissions` 欄位內，未新增頂層欄位）。
- **D2 × 路由型別**：`routes` 以 factory 回傳寬型別，與現行 typed router 的開發體驗衝突（OQ-2）；不影響 D2 形狀。
