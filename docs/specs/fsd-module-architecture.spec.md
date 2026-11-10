# Microkernel + Modular Monolith 目標架構 Spec

> 狀態：r5（r4 經 Codex PASS、owner 確認定案；本版只寫回 owner 對 7 項待裁的裁決 §0.6，待重審）・日期：2026-11-09・分支：`docs/fsd-architecture`
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
2. 能整套或逐頁換掉 UI（shell 替換 + 依 route id 覆寫頁面）
3. 能把整個電商 domain 換成別的 domain（刪 `.use()` 一行 + 刪 `openapi.yaml` 中該 tag 的 paths + 刪 `modules/<id>/`，R14）

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

### 0.4 Owner 2026-11-09 裁決 4 / 5 與 api chain 追加（r3 新增，不得改）

| ID | 裁決 | 落點 |
|----|------|------|
| R13 | MSW guard **fail-closed**：每個 operation 必宣告 permission，公開者明確標 `"public"`；中間格式 `OperationPermissions = Record<operationId, permission \| "public">` + `OperationRoute[]`；`build()` 檢出未宣告者（OQ-14） | §4.3、§6.5 |
| R14 = OQ-9 | **單一手寫 `openapi.yaml`**，依 tag 分 output 到各 module（裁決 5，覆蓋裁決 4 的 per-module yaml）；刪 module = 刪 yaml 中該 tag 的 paths + 刪目錄 | §4.5、§8.2、M7、M8 |
| R15 | 目錄：`modules/<id>/api/` 整個是 orval 產物（含 `api/model/`，受 `clean: true` 管理）；`modules/<id>/model/` 是手寫 domain model；`modules/<id>/mocks/` 下手寫檔不得命名 `*.msw.ts`；routes + permissions 由 YAML 產生到 `src/app/operations.gen.ts`（kernel）；共用信封 `ApiEnvelope<T>` / `ErrorBody` 手寫在 `shared/api/`，各 module 產物中的重複型別接受、不 dedupe | §3、§4.5、§5、§7 |
| R16 = OQ-10 | ABAC = C 命名條件（內建 `own`）；B 欄位層級日後獨立做；不採 CASL；ABAC 實作另開一棒，不進 M1–M8 | §6A |
| R17 = OQ-11 | 權限字串冒號分隔（`orders:read`） | §6.1 |
| R18 = OQ-12 | 照暫定：`ui` 不直接 import `api` 型別，經 `model` 轉出 | §3.1、§7 |
| R19 = OQ-13 | **直接用 route id 當可覆寫的 page id**，不新增 module `pages` 欄位（route id 的**命名格式**另由 R23 / OQ-16 裁定） | §4.1、§4.4 |
| R20 | PoC 已知限制寫進風險：orval handler status 寫死 200、msw 3 `onUnhandledFrame`、fetch client 需 mutator unwrap | §11.1 |

### 0.5 Owner 2026-11-09 裁決 6（r4 新增，不得改）

| ID | 裁決 | 落點 |
|----|------|------|
| R21 | **權限來源分工**：(1) operation → permission **只**來自 `openapi.yaml` 每個 operation 的 `x-permission`；公開 operation 必須**同時**寫字面值 `x-permission: public` 與 `security: []`。(2) 權限目錄（resource / action，**含非 API 操作**如 `orders:export`）、角色預設 grant（`mockGrants`）、ABAC 條件判斷函式由 module 的 `permissions` 宣告。(3) gen / build 期檢查：每個非 public 的 `x-permission` 值必須是某個已安裝 module 權限目錄中**完整的 `resource:action`**（不是只比對 resource），否則失敗（抓 typo 與刪 module 後的殘留，例：`orders` 已宣告但 `orders:typo` 不在 actions → 失敗）；public operation 缺 `security: []` → 失敗 | §4.3 1.5、§4.5、§6.1、§6.5、M1 AC-5、M7 AC-2/3 |
| R22 | **MSW guard 採 a3 判定規則與介面**（PoC 報告 `poc-guard-fail-closed-report` §2、§5）：必填 `apiBaseUrl`；不在 `apiBaseUrl` 下 → 放行；在其下但比對不到 route → 404；有 route 但未宣告 permission → 403；`public` → 放行；無權限 → 403 | §4.3 步驟 5、§4.5、§6.5、M4 AC-2 |

### 0.6 Owner 2026-11-09 裁決 7：r4 定案 + 7 項待裁（r5 新增，不得改）

r4（`07dcae4`，Codex PASS）由 owner 確認為定案版；下列 7 項全部採 arch lead 建議。

| ID | 裁決 | 落點 |
|----|------|------|
| R23 = OQ-16 | route id 命名格式 = **A `${moduleId}.${name}`**（例 `orders.list`），typed key（`TRouteIdRegistry` declaration merging）；`build()` 檢查前綴必須是建立它的 module `id` | §4.1、§4.3 1.7、§4.4、§5.2、M1 AC-3、M3 AC-4、M8 AC-2 |
| R24 | mock 模式的 `apiBaseUrl` 必須是**專用的絕對 origin**；未設定、不是絕對 URL、或與 app 同源（`new URL(apiBaseUrl).origin === location.origin`，**不論路徑**）→ 啟動時報錯。理由：client 以絕對路徑經 `new URL(path, baseUrl)` 組 URL，同源非根路徑（例 `location.origin + "/api"`）會讓 `/users`、`/user`、`/admin` 的 request 解析到 `location.origin` 根下、落在 guard 範圍外被放行（fail-closed 漏洞）。**不動既有 API 路徑**：維持現有前綴 `/api`、`/user`、`/users`、`/admin`（master 實測清單見 §6.5） | §6.5、§11.2、M3 AC-7 |
| R25 | 未帶 token 打非 public API → **403**（照 a3，不回 401） | §6.5、§11.2、M4 AC-2 |
| R26 | guard 介面用 `getGrants: (request) => TGrant[]` + `can()`（支援 D5 wildcard），不採 a3 的 `getGranted: Set` | §6.5、§11.2 |
| R27 | R21 檢查**分兩期**：gen 期（extract，只讀 YAML）查 `x-permission` 格式與 `security: []`；權限目錄比對放在 build（`build()` 1.5.3）/ vitest（M7 AC-3）。另擋「**非 public 卻寫了 `security: []`**」（gen 期失敗） | §4.5 extract、§6.5、§11.2、M7 AC-2 |
| R28 | M3 過渡期 operation 表**全設 `"public"`**；M4 起 fail-closed | §9 M3 註、M4、§11.2 |
| R29 = OQ-15 | kernel 自有 operation `/admin/images` 歸**保留 tag `core`**；client（`shared/api/upload.ts`）與 mock（`app/mock/core-handlers.ts`）手寫，orval 跳過 `core` | §4.5、§5.1 |

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
- orval（`input.filters.tags`、`mode: 'single'`、`override.mutator`、MSW 產出；api chain PoC a1/a2 實測 orval 8.47.0 + msw 3.0.4）：https://orval.dev/ 、https://orval.dev/docs/reference/configuration/output 、https://orval.dev/docs/guides/custom-client 、https://orval.dev/docs/guides/msw
- eslint-plugin-boundaries（flat config、element 分類、`dependencies` 規則）：https://www.jsboundaries.dev/docs/quick-start/ 、https://www.jsboundaries.dev/docs/setup/elements/ 、https://www.jsboundaries.dev/docs/rules/dependencies/
- ESLint flat config：https://eslint.org/docs/latest/use/configure/configuration-files
- npm registry 實查版本（2026-11-09）：msw `3.0.4`、orval `8.47.0`、eslint-plugin-boundaries `7.4.2`（peer `eslint >=6.0.0`，engines `node >=18.18`）

---

## 3. 目標目錄樹

```
openapi.yaml                      # ★ 單一手寫契約真相（R14）；tags = module id；每個 operation 帶 x-permission
orval.config.ts                   # 從 openapi.yaml 的 tags 推出每個 module 一個 target（§4.5）
scripts/extract-operations.ts     # openapi.yaml → src/app/operations.gen.ts（含斷言，§4.5）
src/
├── app/                          # ★ kernel（domain-free）
│   ├── main.tsx                  # 入口：createApp({ shell, operations, apiBaseUrl }).use(...).mount("#root")
│   ├── modules.ts                # ★ 唯一列出所有 .use() 的檔案（D4 刪的就是這裡的行）
│   ├── operations.gen.ts         # ★ R15：OperationRoute[] + OperationPermissions，由 YAML 產生（M4–M6 手寫同形狀）
│   ├── kernel/                   # createApp、registry、build()、驗證、override 解析（§4.2–4.4）
│   ├── router/                   # root / auth / protected route 建構、index redirect、ForbiddenBoundary
│   ├── mock/                     # MSW 啟動（setupWorker）、權限 guard 組裝（§6.5）
│   └── providers/                # QueryClient、i18n、Toaster、RegistryProvider
├── shared/                       # ★ domain-free 函式庫（kernel 與 module 皆可用）
│   ├── ui/                       # shadcn（原 components/ui）+ DataTable、EditActions、FormSubmit、Guarded…
│   ├── lib/                      # cn、array-helpers、toast、image-validation（通用部分）…
│   ├── api/                      # fetcher（orval mutator）、session store、手寫 ApiEnvelope<T> / ErrorBody（R15）、MSW guard factory、mock-db helper
│   ├── permission/               # can()、型別、useCan、ForbiddenError、guardedRoute（只拋錯，§6.2）；ABAC 擴充點 §6A
│   ├── module/                   # defineModule / defineRoutes 型別與 helper、useVisibleNav、TRouteIdRegistry
│   ├── i18n/                     # i18next 實例、core 字典、TransKey 宣告合併
│   └── config/                   # locales 常數、env
├── shells/
│   └── default/                  # ★ 可替換 UI shell：ProtectedLayout、AuthLayout、Sidebar、Forbidden、pages 覆寫表（Navbar / Breadcrumb 現況在 `shared/ui/navbar/`，§5.1）
└── modules/
    ├── auth/  users/  team-members/                                  # generic
    └── orders/ product/ suppliers/ consumers/ banners/ articles/ tags/  # domain
        └── <id>/
            ├── index.ts          # defineModule(...) + route composition（把 ui 頁面注入 model/routes 的 factory，§4.4）+ 具名公開 API（唯一對外入口）
            ├── api/              # ★ R15：整個目錄是 orval 產物（<id>.ts client + api/model/ 型別），clean: true 管理，禁手寫
            ├── model/            # 手寫 headless domain model：query hooks、form schema、型別轉出、table columns、routes 定義（路徑 / permission / routeId，不 import ui，頁面元件由 index.ts 注入）
            ├── ui/               # 預設頁面與元件（可被 shell 覆寫）
            ├── mocks/            # <id>.msw.ts（orval 產物）+ 手寫 handlers.ts / seed.ts（手寫檔禁命名 *.msw.ts）
            └── locales/{en,zh}.json + augment.d.ts   # 裸字典（不含 module id 頂層，§5.4）
```

- `modules/<id>/api/` 下手寫檔會被 orval `clean: true` 刪除（PoC a2 實測），所以手寫 domain model 一律放 `model/`。
- `mocks/` 不受 `clean` 管理（PoC a2 實測）：tag 改名後舊 `<old>.msw.ts` 會殘留，需手動刪；手寫檔不得用 `*.msw.ts` 命名，避免與產物混淆或被覆蓋。
- 各 module 產物內重複的信封 / `ErrorBody` 型別接受、不 dedupe（結構型別與 `shared/api` 手寫版相容；dedupe 需把共用型別輸出到跨 module 位置，等於產物回到 shared）。

### 3.1 依賴方向（§7 lint 強制）

```
app ──► shells ──► shared
 │        │          ▲
 │        └──► modules/<x>/index.ts（只為 override 取 headless model）
 └──► modules/<x>/index.ts ──► 同 module 的 api / model / ui / mocks ──► shared

module 內：ui ──► model ──► api ──► shared        mocks ──► api、shared（ui 不直接 import api，R18）
          index.ts ──► ui、model、api、mocks（route composition 只在這裡：model/routes 不 import ui，§4.4）
跨 module：modules/<a>/** ──► modules/<b>/index.ts（b ∈ a.requires）
```

- `shared` 不 import 任何 `app` / `shells` / `modules`（domain-free 的機械保證）。
- `app` 只 import module 的 `index.ts`（`app/modules.ts` 一處），不碰 module 內部；operation 路由與權限表來自 kernel 自己的 `app/operations.gen.ts`，不經 module。
- `shells` 不 import module 內部；要覆寫某頁時只經該 module `index.ts` 公開的 headless API。

### 3.2 `index.ts` 的形狀

`index.ts` 是 module 唯一對外入口：`export default defineModule({...})` 給 kernel，具名 export 只放 **headless 公開 API**（給 `requires` 它的 module 與覆寫它頁面的 shell 用）。

```ts
// modules/suppliers/index.ts
import { SupplierListPage } from "./ui/supplier-list-page";
import { suppliersRoutes } from "./model/routes";
export default defineModule({
  id: "suppliers",
  routes: (ctx) => suppliersRoutes.build(ctx, { list: SupplierListPage }),   // route composition：ui 頁面在此注入（§4.4）
  /* ... */
});
export { useSupplierOptions } from "./model/use-supplier-options";   // product 表單用
export type { TSupplier } from "./model/types";                      // model 轉出，不直接轉出 api 產物（R18）
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

/** R19：route id = 可覆寫的 page id。module 以 declaration merging 擴充（同 §5.4 i18n 手法）；刪 module 目錄即移除 */
export interface TRouteIdRegistry {}         // 例（R23 格式）：{ "orders.list": true; "orders.details": true }
export type TRouteId = Extract<keyof TRouteIdRegistry, string>;   // 命名格式 `${moduleId}.${name}`（R23 / OQ-16 已裁）

export type TNavItem = {
  id: string;
  label: string;              // i18n key，目標為以 `${moduleId}.` 開頭；現況 nav label 仍是 `dashboard.menu.*`（M6 未搬，已知限制，見 refactor-specs README）
  to: string;                 // 絕對路徑（跨 module 導航只經 nav 字串）
  icon?: ComponentType<{ className?: string }>;
  permission: TPermission;    // 必填，nav 過濾依據（§6.3）
  order?: number;             // 排序，預設 100
  children?: Omit<TNavItem, "icon" | "children">[];
};

/** F5：layout route 與 page route 用兩個 typed helper 區分；module 只能經這兩個 helper 建 route（lint 禁 createRoute，§7.2） */
type TGuard = { permission: TPermission | "authenticated" };
export type TLayoutRouteOpts<TOpts> = TOpts & TGuard & {
  component?: never;                                 // layout route 不得有畫面（只做路徑分組，渲染 <Outlet />）
  routeId?: never;
};
export type TPageRouteOpts<TOpts> = TOpts & TGuard & {
  routeId: TRouteId;                                 // ★ 必填：有畫面就必須可覆寫（D1 逐頁替換）；格式 `${moduleId}.${name}`（R23）
  component: ComponentType<any>;                     // ★ 必填：module 預設頁面（由 index.ts 注入，§4.4）
};

export type TRouteContext = {
  parent: AnyRoute;                                  // protected layout route
  /** kernel 注入（§4.3）：shared guardedRoute + 注入 errorComponent；runtime 帶 component → build() throw */
  layout: <TOpts>(opts: TLayoutRouteOpts<TOpts>) => AnyRoute;
  /** kernel 注入（§4.3）：shared guardedRoute + routeId 寫入 staticData + 依 routeId 解析覆寫 + 注入 errorComponent；runtime 缺 routeId 或 component → build() throw */
  page: <TOpts>(opts: TPageRouteOpts<TOpts>) => AnyRoute;
};

/** publicRoutes（例：/login）也要能覆寫，因此同樣只給 page / layout helper，但不掛 permission guard */
export type TPublicRouteContext = {
  parent: AnyRoute;                                  // auth layout route
  layout: <TOpts>(opts: TOpts & { component?: never; routeId?: never }) => AnyRoute;
  page: <TOpts>(opts: TOpts & { routeId: TRouteId; component: ComponentType<any> }) => AnyRoute;
};

export type TModule = {
  id: string;                                        // kebab-case，唯一
  kind: "generic" | "domain";                        // D4 驗收腳本依此挑出 domain
  requires?: readonly string[];                      // ★ R8：依賴的 module id；缺 → createApp 啟動 fail fast
  routes?: (ctx: TRouteContext) => AnyRoute[];       // 掛在 protected 下的子樹；在 index.ts 組裝（model/routes 的 defineRoutes + ui 頁面，§4.4）
  publicRoutes?: (ctx: TPublicRouteContext) => AnyRoute[];  // 例：/login（page route，routeId 必填）
  nav?: TNavItem[];
  i18n?: Record<TLocale, Record<string, unknown>>;   // ★ 裸字典（不含 module id 頂層）；kernel 以 { [id]: dict } scope（§4.3、§5.4）
  mockHandlers?: HttpHandler[];                      // ★ R11：MSW handler（orval 產物 + override 接 seed），§4.5
  permissions?: TModulePermissions;                  // R21：權限目錄 resources + 角色預設 grant mockGrants（+ ABAC conditions，§6A），§6.1；operation→permission 不在 module，只在 YAML x-permission（§6.5）
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
  pages?: Partial<Record<TRouteId, ComponentType<any>>>;    // shell 逐頁覆寫表，key = route id（§4.4；shell 欄位，非 module 欄位）
};

// app/kernel/create-app.ts（TCore / TRegistry 實際定義在 app/kernel/build.ts，與 build() 同檔）
import type { TOperationTable } from "@/shared/permission";   // ★ R13 中間格式 { routes, permissions }，定義見 §6.1

export type TRegistry = {
  modules: readonly TModule[];
  nav: TNavItem[];                                   // 依 order 排序、未過濾
  permissions: TPermissionCatalog;                   // resource → actions
  operations: TOperationTable;                       // 來自 app/operations.gen.ts，經 build() 驗證（§4.3 1.5）
  routeIds: ReadonlySet<TRouteId>;                   // 已建 route 的 routeId 集合（override 驗證、M8 測試用）
  mockHandlers: HttpHandler[];                       // [guard, ...core, ...modules]
  i18n: Record<TLocale, Record<string, unknown>>;    // 已依 module id scope 後的合併結果
};

// operations 由 app/main.tsx 傳入：import { operations } from "./operations.gen"
// apiBaseUrl（R22，必填）：與 fetcher 組 URL 用的同一個 base（shared/config/env），guard 依它判斷哪些 request 屬於 API（§6.5）
// core（TCore，必填）：kernel 自有、由 app 層提供的零件 —— { root: AnyRootRoute; i18n: core 字典; mock: MSW handler factory; getGrants: () => readonly TGrant[]; isAuthenticated?: () => boolean }
//   M4 實作：mock(opts: TOperationTable & { apiBaseUrl; mockGrants: TGrantMatrix[] }) => HttpHandler[] 回傳 [guard, ...core handler]，
//   取代原 guard + mockHandlers 兩欄（build 時才拿得到已安裝 module 的 mockGrants，login 與 guard 都依合併後矩陣展開）。
//   build() 的權限目錄（catalog）含 kernel 自有 resource `app: ["access"]`；/user/me/profile（GET/PUT）與 /admin/images 屬 core operation（R29），
//   profile 的 permission 為 `app:access`，handler 依 token 綁定呼叫者本人。
export const createApp = ({ shell, operations, apiBaseUrl, core }: { shell: TShell; operations: TOperationTable; apiBaseUrl: string; core: TCore }) => {
  const modules: TModule[] = [];
  const overrides = new Map<TRouteId, ComponentType<any>>();
  const app = {
    use(m: TModule) { modules.push(m); return app; },
    override(id: TRouteId, page: ComponentType<any>) { overrides.set(id, page); return app; },
    build() { return build({ modules, shell, overrides, operations, apiBaseUrl, core }); },   // 純函式，§4.3
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
   3. `i18n` 是**裸字典**：每個 locale 的頂層 key **不得**等於 module `id`（擋下「已自行 scope」的字典，避免合併後出現 `orders.orders.*`）。
   4. nav `permission` 必須是**已安裝** module 權限目錄中完整的 `resource:action`（與 1.5.3 同一比對）：`resource` 是某 module `permissions.resources` 的 key，**且** `action` 在該 key 的 actions 陣列內；只有 resource 存在不夠（`orders` 已宣告但 nav 寫 `orders:typo` → throw，訊息含 module id 與該 permission）。（owner 2026-11-09 nav 粒度裁決）
   5. **Operation 表（R13 / OQ-14，fail-closed）**，輸入為 `createApp({ operations })` 傳入的 `app/operations.gen.ts`：
      1. `operations.routes` 的每個 `operationId` 都必須是 `operations.permissions` 的 key（值為 permission 或 `"public"`），否則 `throw new Error(\`operation "${operationId}" has no permission declared (use "public" explicitly)\`)`。
      2. `operations.permissions` 的每個 key 都必須出現在 `routes`（擋孤兒權限）。
      3. **R21 完整目錄比對**：非 `"public"` 的 permission 必須是**已安裝** module 權限目錄中完整的 `resource:action`——`resource` 是某 module `permissions.resources` 的 key，**且** `action` 在該 key 的 actions 陣列內（只有 resource 存在不夠：`orders` 已宣告但 `orders:typo` → throw `operation "<operationId>" requires "orders:typo" which is not in any installed module's permission catalog`）；值不得含 wildcard。刪了 module 卻沒從 YAML 刪對應 tag paths 並重新 gen 時，這條會 fail fast（§8.2）。
      4. `routes` 內 `method + path` 不重複（extract 腳本已擋，build 再驗一次，因 M4–M6 期間此檔是手寫）。
   6. `createApp().override(id)` 的 id 必須存在於已建 route 的 `routeId` 集合；`shell.pages` 中不存在的 id **忽略**（shell 為 generic，可能涵蓋未安裝的 module，見 §4.4）。
   7. `routeId` 不重複；命名格式（**R23 / OQ-16 已裁**）為 `${moduleId}.${name}` → 必須以建立它的 module `id` + `.` 開頭，否則 throw（kernel 為每個 module 建專屬 `ctx.page`，在建 route 當下檢查）。
   8. **F5 page / layout 區分**：`ctx.page` 收到缺 `routeId` 或缺 `component` 的 opts → throw `module "<id>": page route "<path>" requires routeId and component`；`ctx.layout` 收到帶 `component` 的 opts → throw `module "<id>": layout route "<path>" must not have a component (use ctx.page)`。型別已擋（§4.1），runtime 再擋 `as any` / JS 呼叫，確保**每個有畫面的 route 都有 routeId**（D1 逐頁替換不漏頁）。
2. **Router tree**：
   ```ts
   const authRoute = createAuthRoute(rootRoute, shell.AuthLayout);            // 已登入 → redirect "/"
   const protectedRoute = createProtectedRoute(rootRoute, shell.ProtectedLayout); // 未登入 → /login；protected route 自身不檢查 app:access
   // app:access 由 core.getGrants = sessionGrants() 處理：session 缺 app:access → grants 清空 → layout 照常渲染、nav 全濾掉、
   // 子 route 各自 guardedRoute 拋 ForbiddenError → 各自內容區 shell.Forbidden（與 §6.2 一致）
   const routeIds = new Set<TRouteId>();
   // app/kernel：每個 module 一組 ctx.layout / ctx.page —— shared 的 guardedRoute（只拋 ForbiddenError）+ app 注入的部分
   const layoutFor = (moduleId: string) => (opts) => {
     if (opts.component) throw layoutWithComponent(moduleId, opts);       // 驗證 1.8
     return guardedRoute({ ...opts, errorComponent: ForbiddenBoundary }); // app/router 注入；shared 不 import app（C2，§6.2）
   };
   const pageFor = (moduleId: string) => (opts) => {
     if (!opts.routeId || !opts.component) throw pageWithoutRouteId(moduleId, opts);   // 驗證 1.8
     assertRouteId(moduleId, opts.routeId, routeIds);                     // 不重複 + R23 前綴格式（驗證 1.7）
     return guardedRoute({
       ...opts,
       staticData: { ...opts.staticData, routeId: opts.routeId },
       component: resolvePage(opts.routeId, opts.component),             // §4.4
       errorComponent: ForbiddenBoundary,
     });
   };
   // publicRoutes：同樣的 page / layout 檢查與覆寫解析，但用 createRoute（不掛 permission guard）
   const tree = rootRoute.addChildren([
     authRoute.addChildren(modules.flatMap(m => m.publicRoutes?.({ parent: authRoute, ...publicHelpersFor(m.id) }) ?? [])),
     protectedRoute.addChildren([
       createIndexRedirect(protectedRoute, registry.nav),   // R9："/" → 第一個 can() 為真的 nav.to；全無 → 渲染 shell.Forbidden
       ...modules.flatMap(m => m.routes?.({ parent: protectedRoute, layout: layoutFor(m.id), page: pageFor(m.id) }) ?? []),
     ]),
   ]);
   assertOverrides(overrides, routeIds);                    // 驗證 1.6：在所有 module routes 建完後檢查
   ```
3. **Nav**：`modules.flatMap(m => m.nav ?? []).sort(byOrder)`，經 `RegistryProvider` 給 shell；shell 只經 `useVisibleNav()` 取用（§6.3）。
4. **i18n（W4：module 給裸字典，kernel scope）**：`registry.i18n[lng] = mergeDeep(coreDict[lng], ...modules.map(m => ({ [m.id]: m.i18n?.[lng] ?? {} })))`；`mount` 時以 `i18n.addResourceBundle(lng, "translation", registry.i18n[lng], true, false)` 寫入同一 namespace（[i18next API](https://www.i18next.com/overview/api)）。module 字典 key `list.title` → 全域 key `orders.list.title`；**scope 只在這一處發生**，型別（§5.4）與驗證（1.3）都以「裸字典」為前提。
5. **MSW handlers**：`[createPermissionGuard({ routes: operations.routes, permissions: operations.permissions, getGrants, apiBaseUrl }), ...coreHandlers, ...modules.flatMap(m => m.mockHandlers ?? [])]`；guard 一定在第一位，`apiBaseUrl` 必填（R22，§6.5）。
6. **Permissions**：彙整 `TPermissionCatalog`；`registry.operations` = 驗證過的 `operations`；`mockGrants` 併入 mock 端矩陣（§6.1）。

### 4.4 換 UI：headless model + 頁面覆寫（R2）

**拆分**：module 的 `model/` 是 headless（query hooks、form schema、permissions、table columns 定義、route 定義），`ui/` 是預設畫面。覆寫頁面時只換 `ui`，`model` 共用（D1）。

**route id = page id（R19 / OQ-13）**：可覆寫的 page id **就是 route id**。命名格式**已裁**為 `${moduleId}.${name}`（R23 / OQ-16；例 `orders.list`、`orders.details`、`users.edit`）；下文範例、§5.2 的 id 與 AC 皆依此格式。有畫面的 route 一律以 `ctx.page` 建立（`routeId`、`component` 必填）；只做路徑分組的 route 以 `ctx.layout` 建立（不得帶 `component`）——型別與 `build()` 驗證 1.8 雙重保證「有畫面就有 routeId」。kernel 注入的 `ctx.page` 把 `routeId` 寫進 `staticData.routeId`、依 routeId 解析覆寫後的元件（§4.3 步驟 2）。**不新增 module `pages` 欄位、不 dry-run routes factory**：route id 集合在 `build()` 真正建 route 時收集（`registry.routeIds`）。module 另以 declaration merging 把 id 加進 `TRouteIdRegistry`（只為型別）。

**route composition 位置（守住 `ui → model → api` 單向）**：`model/routes.ts` 只定義路徑、permission、routeId 與 route 物件，**不 import `ui`**；預設頁面元件以參數注入。注入（composition）發生在 module 的 `index.ts`——`index.ts` 屬 lint element `module`，本來就允許 import 同 module 的 `ui` 與 `model`（§7.2），不需放寬任何依賴規則。`ui` 要導航時 import `model/routes` 的 route 物件（`ui → model`，合法），不會形成環：

```ts
// modules/orders/model/routes.ts —— headless：不 import ui
declare module "@/shared/module" {
  interface TRouteIdRegistry { "orders.list": true; "orders.details": true }   // R23 格式
}
export const ordersRoutes = defineRoutes<{ list: ComponentType; details: ComponentType }>((ctx, pages) => {
  const base = ctx.layout({ getParentRoute: () => ctx.parent, path: "orders", permission: "orders:read" });   // 無畫面 → layout，無 routeId
  const list = ctx.page({
    getParentRoute: () => base, path: "order-list", permission: "orders:read",
    routeId: "orders.list", component: pages.list,
  });
  const details = ctx.page({
    getParentRoute: () => base, path: "order-details/$id", permission: "orders:read",
    routeId: "orders.details", component: pages.details,
  });
  return { tree: [base.addChildren([list, details])], list, details };
});

// modules/orders/index.ts —— route composition：唯一同時 import ui 與 model/routes 的地方
import { OrderListPage, OrderDetailsPage } from "./ui";
import { ordersRoutes } from "./model/routes";
export default defineModule({
  id: "orders", kind: "domain",
  routes: (ctx) => ordersRoutes.build(ctx, { list: OrderListPage, details: OrderDetailsPage }),
  /* nav, i18n, mockHandlers, permissions … */
});
```

**覆寫 API（型別草案）**：

```ts
// 方式 A：app 層逐頁覆寫（最高優先）
createApp({ shell: defaultShell, operations, apiBaseUrl }).override("orders.list", CompactOrderListPage);

// 方式 B：shell / theme 自帶覆寫表（key = route id）
export const compactShell: TShell = {
  ...defaultShell,
  id: "compact",
  pages: { "orders.list": CompactOrderListPage },
};

// 覆寫頁只用 module 公開的 headless API
// shells/compact/pages/orders-list.tsx
import { useOrderListModel, orderColumns } from "@/modules/orders";   // index.ts 具名 export
```

> 現況：orders 的 `index.ts` 尚未具名 export headless hook；M8 AC-2 的覆寫測試頁直接 import `@/modules/orders/model/use-order`（測試檔不受 boundaries 檢查）。已知限制，見 refactor-specs README。

**解析順序（`resolvePage(routeId, Default)`，build 期建 route 時解析，非 render 期查表）**：

1. `createApp().override(id, Page)` — app 層，最後呼叫者勝；id 不在 `registry.routeIds` → throw（typo 保護，§4.3 驗證 1.6）
2. `shell.pages[id]` — shell / theme 覆寫；id 不存在（module 未安裝）→ 忽略
3. module 預設 `ui`（`index.ts` 注入、`ctx.page` 收到的 `component`）

**型別保證**：`TRouteId` 由已存在的 module 目錄 augment 而來，刪 module 後 `override("orders.list")` 會 tsc 失敗（編譯期 fail fast）；runtime 另有 1.6 / 1.7 / 1.8 驗證。default shell 屬 core，**不得**在 `pages` 覆寫 domain 頁（否則 D4 core-only 會因 excess property 編譯失敗）——§7 以 boundaries 禁 `shells/default` import `modules/**` 機械保證。

### 4.5 API 層：orval + MSW（R11、R14、R15；依 api chain PoC a1/a2 結論）

> 依據：api chain PoC a1（`poc-orval-report`，orval 8.47.0 + msw 3.0.4，done command `ALL_GREEN` exit 0，vitest 7/7）與 a2（`poc-module-split-report`，單 yaml 依 tag 分 output，vitest 11/11，A/B 兩切法產物逐 byte 相同）。PoC 未驗證的項目在下表與 §11.1 逐條標「待 M7 驗證」，其餘為定案。

**契約**：

| 項目 | 契約 |
|------|------|
| 契約真相 | **repo 根單一手寫 `openapi.yaml`**（R14）；`tags` 清單 = module id 清單 + 保留 tag `core`（R29，kernel 自有 operation）；每個 operation 必有 `operationId`（camelCase，全檔唯一）、**恰好一個** tag（∈ `tags`）、`x-permission`（`resource:action` 或字面值 `public`）；`x-permission: public` 的 operation 必須同時寫 `security: []`（R21）。operation → permission **只**在這裡宣告，module 不另宣告（R21） |
| 共用型別 | 信封 `ApiEnvelope<T>`（`code/msg/error/data/total`）與 `ErrorBody` **手寫**於 `shared/api/types.ts`，hooks 以它描述 body 形狀（fetcher 不剝 `ApiEnvelope.data`，見下方 fetcher 列）；YAML 內同名 schema 在各 module 產物各有一份，接受重複、不 dedupe（R15） |
| orval config | `orval.config.ts` 讀 `openapi.yaml` 的 `tags`，每個 tag 一個 target（跳過保留 tag `core`，R29）：`input.filters.tags: [id]`、`mode: "single"`、`target: src/modules/<id>/api/<id>.ts`、`schemas: src/modules/<id>/api/model`、`client: "react-query"`、`httpClient: "fetch"`、`mock: { path: src/modules/<id>/mocks, generators: [{ type: "msw" }] }`、`clean: true`、`override.mutator → shared/api/fetcher.ts`（骨架取自 PoC a2；新增 module 不改 config） |
| 產物 | `modules/<id>/api/**`（整個目錄，R15）+ `modules/<id>/mocks/<id>.msw.ts`；產物進 git；zod 產物不在 M7 範圍（form schema 維持手寫於 `model/`；PoC a1 已驗 zod target 可行，日後要用再加） |
| extract | `scripts/extract-operations.ts`：讀 `openapi.yaml` → 寫 `src/app/operations.gen.ts`（`export const operations: TOperationTable = { routes, permissions }`，kernel 檔，R15）。**斷言（任一失敗 exit 1，訊息指名 operation）**：每個 operation 恰好一個 tag 且該 tag 在 `tags` 清單；`operationId` 全檔唯一；每個 operation 有 `x-permission`，值為 `public` 或符合 `^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$` 的 `resource:action`（不得 wildcard）；**`x-permission: public` 缺 `security: []` → 失敗**（R21）；**非 public 卻寫了 `security: []` → 失敗**（R27）。path 參數 `{id}` 轉 `:id`。**R27 兩期分工**：gen 期（本腳本，只讀 YAML）只查格式與 `security: []`；「`resource:action` 必須在某 module 權限目錄內」的完整比對需要 module 宣告，放在 build 期，由 `build()` 驗證 1.5.3 執行（kernel 啟動即 throw，且 M7 AC-3 以實際 module 跑 `build()` 的 vitest 在每棒 done 基線內，CI 必紅） |
| gen script | `pnpm gen:api` = `orval && prettier --write <產物> && pnpm gen:api:extract`（`gen:api:extract` = `tsx scripts/extract-operations.ts`）；CI：`pnpm gen:api && git diff --exit-code -- src/modules/*/api src/modules/*/mocks src/app/operations.gen.ts` |
| fetcher | `shared/api/fetcher.ts` 為 orval `override.mutator`（`orval.config.ts` 設 `override.fetch.includeHttpResponseReturnType: false`）：以 `new URL(path, apiBaseUrl)` 組 URL、帶 `Authorization: Bearer <token>`、**回傳 HTTP body**（不是 `{ data, status, headers }`；也**不**再剝 `ApiEnvelope.data`，列表頁需要 `total`）、非 2xx throw `ApiError`（帶 status 與 body）；hooks 以 `.catch(nullOnApiError)` 接錯誤、保留原本各自的 toast / 回 null 路徑。**未實作**「403 統一 toast、401 清 session」（base 無此行為，依行為紅線維持原狀）。queryKey：orval 產物的 `get*QueryKey` 為相對 path（M7 AC-4 已驗），但 `model/use-*.ts` 沿用原本手寫 queryKey（invalidation 與 base 相同），未改用產物 key。測試用 `src/test/api-fetch.ts`（`{ status, body }`） |
| mock | `modules/<id>/mocks/handlers.ts`（手寫，非 `*.msw.ts`）匯出 `HttpHandler[]`：以 orval 產的 `getXMockHandler(overrideFn)` 包住，override 讀寫本 module 的記憶體 seed（R5，PoC a1 實測 create 後 list 讀得到）；**需要非 200 回應（404 / 422 等）的 operation 由 module 手寫 `http.*` handler，排在該 operation 的 orval handler 之前**（orval handler status 寫死 200，§11.1） |
| seed | `modules/<id>/mocks/seed.ts`；collection 由 `shared/api/mock-db` 的 `createCollection(seed, idKey, { searchField? })` 建立（承接 `handlers.ts:73-105` 的 `resource()` CRUD helper）；**module 不讀其他 module 的 collection**（consumers 自帶 transaction seed、team-members 自帶 staff seed、customers 自帶 customer seed） |
| guard | kernel 最前面掛 guard（§6.5，a3 規則，R22）：只讀 `app/operations.gen.ts` 的 `{ routes, permissions }`，**必填 `apiBaseUrl`**；MSW 層仍以 `http.all('*')` 註冊（R11），但判定只在 `apiBaseUrl` 範圍內生效——範圍外放行、範圍內對不到 route 回 404，不 fall through 到任何手寫 handler |
| 執行環境 | dev：`VITE_API_MOCK=true` 時 `setupWorker(...registry.mockHandlers).start()`（`public/mockServiceWorker.js` 由 `msw init` 產生並進 git；browser worker 待 M2 驗證）；test：`src/test/setup.ts` 以 `setupServer` 掛同一組 handler，選項用 msw 3 的 `onUnhandledFrame`（非 `onUnhandledRequest`）；接真後端 = 關 `VITE_API_MOCK`，client 不改 |

```ts
// modules/orders/mocks/handlers.ts（手寫；函式名依 orval 產物命名規則 get<OperationId>MockHandler）
import { http, HttpResponse } from "msw";
import { getListOrdersMockHandler, getUpdateOrderMockHandler } from "./orders.msw";   // orval 產物
import { orders } from "./seed";
export const ordersMockHandlers: HttpHandler[] = [
  http.put("*/admin/orders/:id", ({ params }) =>                                   // 非 200 情境手寫，放在前面
    orders.has(params.id) ? undefined : HttpResponse.json({ error: "not found" }, { status: 404 })),
  getListOrdersMockHandler(({ request }) => orders.list(new URL(request.url).searchParams)),
  getUpdateOrderMockHandler(async ({ request }) => orders.update(await request.json())),
];
```

**kernel 自有 operation（R29 / OQ-15 已裁）**：通用上傳（`/admin/images`，現況 `handlers.ts:160-163`）不屬任何 module。YAML 中以保留 tag `core` 標記；extract 照常寫進 `operations.gen.ts`（guard 一樣 fail-closed），`orval.config.ts` 跳過 `core` tag（不產 `modules/core/`），client 手寫於 `shared/api/upload.ts`、mock handler 手寫於 `app/mock/core-handlers.ts`。

舊設計 `TMockHandlerTable`（`Record<"METHOD path", handler>`）、`mockFetch` 註冊表、`registerMockHandlers` **整段作廢**；過渡期（M2）以 adapter 把現行 `handlers` 表轉成 `HttpHandler[]`，M7 換成 orval 產物後刪除 adapter。`app/operations.gen.ts` 在 M4–M6 為**手寫**同形狀檔（檔頭註明 hand-maintained until M7），M7 起改由 extract 產生、覆蓋。

### 4.6 型別安全的取捨（R4：接受寬化）

- module 以 factory 回傳 `AnyRoute[]`，組裝後的樹型別寬化；`router/index.ts:10-14` 的 `Register` 不再精確。
- module 內導航用 route 物件：`defineRoutes<TPages>((ctx, pages) => ({ tree, ...refs }))` 回傳 `{ build(ctx, pages): AnyRoute[], get() }`；module `index.ts` 在 `routes` 欄位呼叫 `build(ctx, 預設頁面)`（§4.4 route composition），回傳 `tree`；module `ui` 以 `ordersRoutes.get().details` 取 route 物件（`ui → model`）：`navigate({ to: details.fullPath, params: { id } })` 或 `details.useParams()`。`get()` 在 `build` 前呼叫 → throw（只有 render 期才會呼叫，build 一定已完成）。
- 跨 module 導航只經 nav 字串（`TNavItem.to`）。

---

## 5. 現有檔案 → 新位置對照

### 5.1 Kernel / shared / shell

| 現有 | 新位置 | 備註 |
|------|--------|------|
| `main.tsx` | `app/main.tsx` | `createApp({ shell: defaultShell, operations, apiBaseUrl })` + `installModules` + `mount`；`index.html` script 路徑同步 |
| `router/__root.tsx` | `app/router/root.tsx` + `app/providers/` | provider 移出 root route |
| `router/routes.tsx` | 拆入各 `modules/<id>/model/routes.ts`（路徑 / permission / routeId，不 import ui）+ `modules/<id>/index.ts`（route composition：注入 ui 頁面）+ `app/router/{auth,protected,index-redirect}.tsx` | login / protected 守衛 → `app/router`；有畫面的 route 一律 `ctx.page`（routeId 必填） |
| `router/index.ts` | `app/kernel/build.ts` | 見 §4.6 |
| `components/ui/*` | `shared/ui/*` | shadcn，`components.json` alias 同步 |
| `components/shared/{Paper,TextInputs,LoadingPage,EditActions}.tsx` | `shared/ui/{paper,text-inputs,loading-page,edit-actions}.tsx`（kebab-case） | `EditActions` 加 permission 宣告（§6.4） |
| `components/shared/Card.tsx` | `modules/product/ui/components/Card.tsx` | 只有 product 使用，M6 歸入 product（不進 shared） |
| `components/shared/DataTable.tsx`、`table/**` | `shared/ui/data-table/`（主檔 `data-table.tsx`） | 加 `rowActions` / `toolbarActions`（§6.4） |
| `components/shared/dialog/ImageUploadDialog.tsx`、`hooks/use-img-upload.ts` | `shared/ui/image-upload/image-upload-dialog.tsx` + `shared/api/upload.ts` | 上傳 hook 只落 `shared/api/upload.ts`（`image-upload/` 不另拆 hook）；上傳 API 是通用能力（`/admin/images`）；其 MSW handler 屬 core handler |
| `components/shared/Tags.tsx` | `shared/ui/tag.tsx`（改 `tone` prop）+ `modules/orders/ui/order-status-tag.tsx` | 移除 `EOrderStatus` 依賴（`Tags.tsx:4`） |
| `components/shared/UnauthorizedPage.tsx` | `shells/default/forbidden.tsx`（= `TShell.Forbidden`） | R10：內容區渲染，`h-screen` 改 `h-full`（`UnauthorizedPage.tsx:15`） |
| `components/shared/AppSidebar.tsx` | `shells/default/app-sidebar.tsx` | Sidebar 讀 `useVisibleNav()` |
| `components/shared/{Navbar,Breadcrumb}.tsx` | `shared/ui/navbar/{navbar,breadcrumb}.tsx` | M6 由 `shells/default/` 移入 shared；語系清單讀 `shared/config/locales` |
| `components/layouts/ProtectedAppLayout.tsx` | `shells/default/protected-layout.tsx` | 移除 `useUserPermissions`；`app:access` 改由 protected route 判斷（§6.2） |
| `components/layouts/AuthLayout.tsx` | `shells/default/auth-layout.tsx`（外框）+ `modules/auth/{model,ui}`（登入表單與 mutation） | 拆 layout 與登入邏輯 |
| `constants/sidebar.tsx` | 刪除 → 各 module `defineModule({ nav })` | |
| `constants/locales.ts` | `shared/config/locales.ts` + `shared/i18n/types.ts` | `TransKey` 改宣告合併（§5.4） |
| `hooks/use-breadcrumb.ts` | `shared/ui/navbar/use-breadcrumb.ts` | `switch` 改讀 route `staticData.breadcrumb`（i18n key） |
| `hooks/{use-toast.ts,use-mobile.tsx,use-multi-select.ts}` | `shared/lib/` | |
| `lib/utils.ts`、`lib/gen-validate-message.ts`、`utils/array-helpers.ts` | `shared/lib/` | |
| `locales/{en,zh}.json` | `shared/i18n/locales/` + `modules/<id>/locales/` | 現況只搬了全域 key 已在 `<id>.` 之下的部分（`modules/users/locales/en.json` 的 `users.*`）；其餘 domain key 仍在 core 字典（搬要改 key 名，與 M6 AC-6「字典 key→value 不變」衝突）。已知限制，見 refactor-specs README |
| `locales/i18n.ts`、`types.ts`、`types/i18next.d.ts` | `shared/i18n/` | |
| `services/api-client.ts` | `shared/api/fetcher.ts`（orval mutator，回 HTTP body、不剝 `ApiEnvelope.data`，§4.5；M5–M6 為 `apiFetch` 形狀，M7 改 mutator、`apiFetch` 移至 `src/test/api-fetch.ts`）+ `shared/api/session.ts` + `shared/api/types.ts`（手寫 `ApiEnvelope<T>` / `ErrorBody`，R15） | `TAuthUser.role` 改 `string`，session 增 `grants: TGrant[]` |
| `services/mock/handlers.ts` | 過渡：`app/mock/legacy-adapter.ts`（M2–M5）→ `shared/api/mock/legacy-adapter.ts`（M6 拆到各 module 後移入 shared，module 不可 import app；M7 刪除）→ 終態：各 `modules/<id>/mocks/handlers.ts`（手寫，包 `<id>.msw.ts` 產物）+ `shared/api/mock-db` | `mockFetch` 刪除；`METHOD path` → operationId 對照先手寫於 `app/operations.gen.ts`（M4） |
| `services/mock/data.ts` | 各 `modules/<id>/mocks/seed.ts`；`placeholderImage` → `shared/api/mock-db`；`DEMO_ACCOUNT` → `modules/auth/mocks/` | R5 自帶 seed |
| `services/types/schema.ts` | `shared/api/schema.ts`（pagination / lang / image）+ `shared/api/types.ts`（envelope）；契約面併入 repo 根 `openapi.yaml` 的 `components` | |
| `plugins/image-validation/{base-rules,manager.ts,types.ts,schemas.ts,utils,constants,presets/general.preset.ts}` | `shared/lib/image-validation/` | |
| `plugins/image-validation/presets/banner/**` | `modules/banners/model/image-validation/` | `validation.image.banner.*` → `banners.*` |
| `types/{index.d.ts,table.d.ts}`、`vite-env.d.ts` | `shared/types/` | |
| `styles/global.css` | `app/styles/` | |
| `test/setup*.ts` | 保留 `src/test/`（加 MSW `setupServer`；lint ignore） | `jsdom-node-abort.env.ts` 已刪（Vitest 5 不需要） |

### 5.2 Modules（逐目錄）

| 現有 | module | `model/`（手寫 headless） | `ui/`（預設；以 route id 覆寫，id 格式依 R23） | `requires` |
|------|--------|-----------------------|--------------------------------|-----------|
| `components/layouts/AuthLayout.tsx` 內登入表單、mock `POST /api/auth/login` | `auth` (generic) | `use-login`、`use-logout`、session 寫入 | `auth.login` | `users`（mock login 經 `@/modules/users` 查帳號） |
| `pages/users/**`、`services/schemas/user.ts` | `users` (generic) | `use-user-list`、`use-user-profile`、`use-update-user-role`、user columns、form schema | `users.list`、`users.edit`、`EditUserRoleDialog` | — |
| `pages/team-members/**`、`services/schemas/staff.ts` | `team-members` (generic) | staff hooks、form schema | `team-members.list`、`StaffFormDialog` | — |
| `pages/orders/**`、`services/schemas/orders.ts` | `orders` | `use-orders`、order status 文字/tone、copy-order、columns | `orders.list`、`orders.details`、`OrderStatusTag`、`OrderCard` | — |
| `pages/product/**`、`services/schemas/product.ts` | `product` | product hooks、form-transformers、field-comparison | `product.list`、`product.create`、`product.edit`、`product.draft` | `suppliers`、`tags` |
| `pages/suppliers/**` | `suppliers` | `use-supplier-options` 等（公開給 product） | `suppliers.list` | — |
| `pages/tags/**` | `tags` | `use-tag-options` 等（公開給 product） | `tags.list` | — |
| `pages/consumers/**` | `consumers` | customer hooks、transaction 查詢 | `consumers.list`、`TransactionCard` | — （R5：transaction seed 自帶；`OrderCard.tsx:6` 對 orders util 的依賴改為本 module 自有格式化） |
| `pages/banners/**`（含 `docs/*.md`） | `banners` | banner hooks、sort、image-validation preset | `banners.list`、`banners.create`、`banners.edit` | — |
| `pages/articles/**`（含 tiptap） | `articles` | article hooks、form schema | `articles.list`、`articles.create`、`articles.edit`、Tiptap editor | — |

### 5.3 跨 module 依賴規則

- 允許：`modules/a/**` → `modules/b/index.ts`，且 `b ∈ a.requires`（lint 管「只經 index.ts」，`build()` 管「有宣告 requires」；lint 無法讀 `requires` 陣列，二者互補）。
- 禁止：import 他 module 的 `api/` `model/` `ui/` `mocks/` 內部檔；mock seed 跨 module 讀取（R5）。
- 「刪單一 module」成立條件：沒有其他已安裝 module `requires` 它（否則 `build()` fail fast，訊息指出誰依賴它）。刪整個 domain pack（7 個）一定成立——generic module 不 `requires` 任何 domain module。

### 5.4 i18n 型別

`shared/i18n/types.ts` 宣告可擴充介面，module 以 declaration merging 補自己的字典型別；刪 module 目錄即自動移除型別。**資料形狀（W4 定案）**：`modules/<id>/locales/*.json` 是**裸字典**（頂層不含 module id，例 `{ "list": { "title": "訂單" } }`）；`defineModule({ i18n })` 原樣傳入；kernel 在 §4.3 步驟 4 以 `{ [id]: dict }` scope 一次。型別在 augment 時以 module id 為 key 包一層，與 runtime scope 對齊：

```ts
// shared/i18n/types.ts
import type coreZh from "./locales/zh.json";
export interface TranslationResources extends Record<string, unknown> {}   // module 擴充點
export type TransKey = RecursiveKeyOf<typeof coreZh & TranslationResources>;

// modules/orders/locales/augment.d.ts
import type zh from "./zh.json";
declare module "@/shared/i18n/types" {
  interface TranslationResources { orders: typeof zh }   // zh.json 為裸字典 → 全域 key `orders.list.title`
}
```

---

## 6. 權限系統（D5）

### 6.1 型別與資料形狀

```ts
// shared/permission/types.ts
export type TPermission = `${string}:${string}`;            // "orders:read"（冒號分隔，R17）
export type TGrant = TPermission | `${string}:*` | "*";      // wildcard 只出現在矩陣資料
// ★ R13 中間格式（owner 指定形狀）；來源 = app/operations.gen.ts（由 openapi.yaml 的 x-permission 產生，§4.5、§6.5）
export type OperationPermissions = Record<string /* operationId */, TPermission | "public">;
export type OperationRoute = { method: string; path: string /* "/admin/orders/:id" */; operationId: string };
export type TOperationTable = { routes: readonly OperationRoute[]; permissions: OperationPermissions };
// R21：module 宣告「權限目錄 + 角色預設 grant (+ ABAC 條件)」；operation → permission 不在這裡（只在 YAML x-permission）
export type TModulePermissions = {
  resources: Record<string, readonly string[]>;              // 權限目錄：{ orders: ["read","update","export"] }，含非 API 操作（orders:export）；
                                                             // 每個非 public 的 x-permission 必須是此目錄中完整的 resource:action（§4.3 1.5.3）
  mockGrants?: Record<string /* roleId */, TGrant[]>;        // 角色預設 grant，只給 mock 矩陣用，前端 runtime 不讀
  // conditions?: …                                          // ABAC 條件判斷函式（R16，§6A.3），由 ABAC 那一棒加入，不在 M1–M8
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

**角色 grants 矩陣（M4 落地；main 代 owner 裁決，待 owner 覆核）**：

| role | grants（core ∪ module mockGrants） |
|---|---|
| superadmin | `*` |
| admin | `app:access`、`users:read`、`product:*`、`orders:*`；重構前無檢查的頁維持 `consumers:*`、`team-members:*`、`suppliers:*`、`tags:*`、`banners:*`、`articles:*`（**無** `users:update`、`users:update-role`：舊 `canManageUsers` / `canEditUserRole` 只限 superadmin） |
| support | `app:access`、`orders:*`；重構前無檢查的頁補 read：`consumers`、`team-members`、`suppliers`、`tags`、`banners`、`articles` |
| partner | `app:access`、`product:*`、`suppliers:read`、`tags:read`；重構前無檢查的頁補 read：`consumers`、`team-members`、`banners`、`articles` |

行為不變原則：重構前沒有權限檢查的頁（6029bf0 sidebar 與 route 無檢查）對所有可進後台的角色至少可讀；各角色可見 nav 由 `src/app/mock/__tests__/role-visibility.test.tsx` 鎖定。

- `auth` module 的登入 handler 回傳 `session.user.role` + `session.grants`（矩陣展開，wildcard 保留）；前端只認 `grants`，**不知道 role→grant 對照**（接真後端時由後端給 grants，前端不改）。
- core resource：`app:access`（取代 `canAccessAdminPanel`，`ProtectedAppLayout.tsx:9`）。
- 現行語意方法對照（遷移用）：`canViewUserList` → `users:read`、`canEditUserRole` → `users:update-role`、`canManageUsers` → `users:update`、`canManageProducts` → `product:*`、`canManageOrders` → `orders:*`、`canViewReports` → 無消費點，刪除。

### 6.2 強制點 1：Route guard（403 在內容區，R10）

```ts
// shared/permission/forbidden.ts
export class ForbiddenError extends Error {
  constructor(public permission: TPermission) { super(`forbidden: requires ${permission}`); }
}

// shared/permission/guarded-route.ts —— 只負責「判斷 + 拋錯」，不知道誰來畫 403（C2：shared 不 import app）
export const guardedRoute = <TOpts>(opts: TOpts & { permission: TPermission | "authenticated" }) =>
  createRoute({
    ...opts,
    staticData: { ...opts.staticData, permission: opts.permission },
    beforeLoad: (ctx) => {
      if (opts.permission !== "authenticated" && !can(getSession()?.grants ?? [], opts.permission))
        throw new ForbiddenError(opts.permission);            // 不 redirect：URL 不變
      return opts.beforeLoad?.(ctx);
    },
    // errorComponent 不在這裡設定：由 app 注入（§4.3 步驟 2 的 layoutFor / pageFor）
  });

// app/router/forbidden-boundary.tsx —— app 層捕捉 ForbiddenError
export const ForbiddenBoundary = ({ error }: ErrorComponentProps) => {
  const { shell } = useRegistry();                            // app → shells 合法
  if (error instanceof ForbiddenError) return <shell.Forbidden permission={error.permission} />;
  return <DefaultErrorComponent error={error} />;
};
```

- **grants 來源**：M1 的 `guardedRoute(opts, getGrants)` 以第二參數注入 grants（kernel 傳入 `core.getGrants`），取代上面 pseudo code 的 `getSession()`；session store 於 M4 接上後由 app 層提供 `getGrants`。
- **依賴方向（C2）**：`shared/permission` 只 export `guardedRoute` 與 `ForbiddenError`，不 import `app` / `shells`；`app/router` 的 `ForbiddenBoundary` import `ForbiddenError`（app → shared，合法）並經 `useRegistry()` 取 `shell.Forbidden`；kernel 在 `ctx.layout` / `ctx.page` 把 `errorComponent: ForbiddenBoundary` 注入每個 module route。§7.2 的 `shared` 規則只允許 `shared → shared`，任何 `shared → app` import 會被 boundaries 擋下。
- **行為**：無權限時 URL 保留、shell（sidebar / navbar）保留，`shell.Forbidden`（預設 = 現行 `UnauthorizedPage` 改為內容區高度）渲染在 protected layout 的 `<Outlet />` 位置。**不新增 `/403` route**。
- protected route 自身缺 `app:access`：layout 照常渲染（nav 經 `useVisibleNav` 會是空的），內容區顯示 `shell.Forbidden`——取代現行 `ProtectedAppLayout.tsx:11-13` 換掉整個 layout 的行為（**行為變更**，屬 R10 裁決範圍）。
- `/` index redirect（R9）：無任何可見 nav → 內容區顯示 `shell.Forbidden`，不 redirect。
- **待實測（M4 AC）**：TanStack Router 子 route `beforeLoad` throw 時，該 route 的 `errorComponent` 渲染於父 layout 的 `<Outlet />` 內、父 layout 不卸載（[Data Loading guide](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading)、[RouteOptions](https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType)）。若不成立，退路：`beforeLoad` 回傳 `{ forbidden: true }` context，kernel 注入的 component wrapper 在 render 期換成 `shell.Forbidden`（仍在 app 層，shared 不變）。
- module `routes()` / `publicRoutes()` 只能用 `ctx.layout` / `ctx.page` 建 route；lint 禁 `modules/**` 直接呼叫 `createRoute`（§7）。
- **結構性測試**：`build()` 後走訪 protected 子樹，斷言每個 route 的 `staticData.permission` 存在（`"authenticated"` 需顯式寫）。
- `StaticDataRouteOption` 以 module augmentation 擴充 `permission` / `breadcrumb` / `routeId`。

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

**中間格式（R13，owner 指定）**：`OperationPermissions = Record<operationId, permission | "public">` + `OperationRoute[]`，合稱 `TOperationTable`（§6.1）。沒有另外的 public 清單——公開 operation 就是值為 `"public"` 的 key。

**來源與合併（C1）**：

| 階段 | 來源 | 合併方式 |
|------|------|---------|
| M7 起 | repo 根 `openapi.yaml` 每個 operation 的 `x-permission` + method/path → `scripts/extract-operations.ts` → `src/app/operations.gen.ts`（R15，kernel 檔） | 單一 YAML，operationId 唯一由 extract 斷言保證，不需跨 module 合併 |
| M4–M6 | 同路徑 `src/app/operations.gen.ts` **手寫**同形狀（現行 `handlers.ts` 每個 `METHOD path` 給一個 operationId 與 permission） | 同上 |
| 組裝 | `app/main.tsx` `import { operations } from "./operations.gen"` → `createApp({ shell, operations, apiBaseUrl })` → `build()` 驗證（§4.3 1.5：未宣告 throw、孤兒 throw、`resource:action` 不在已安裝 module 權限目錄 throw）→ `registry.operations` → `createPermissionGuard({ ...registry.operations, getGrants, apiBaseUrl })` | **R21 分工**：operation → permission 只來自 YAML `x-permission`，module 不提供 operation 表；module 只透過 `permissions` 宣告權限目錄（含非 API 操作）、角色預設 grant、ABAC 條件，`x-permission` 必須引用目錄中完整的 `resource:action` |

**判定規則（R22，照 a3 PoC 報告 §2；順序即程式順序）**：

| request | 結果 |
|---|---|
| URL 不在 `apiBaseUrl` 底下（vite 資源、HMR、靜態檔、第三方） | **放行**（`return undefined`）。前綴比對一律補 `/`：`http://api.test` 不會誤吃 `http://api.testing/...` |
| 在 `apiBaseUrl` 底下，但 method + path 對不到任何 `OperationRoute` | **404**：M7 前沿用 legacy 404 body `No mock handler for <METHOD> <path>`；M7 起改 `not found: no operation for <METHOD> <path>`（契約外 request 不會落到任何手寫 handler；module 手寫了契約外的 `http.*` handler 也會被擋，逼先改契約） |
| 對到 route，但 `permissions` 沒有該 operationId | **403** `forbidden: <operationId> has no permission declaration` |
| 宣告為 `"public"` | **放行**（不看 token） |
| 有宣告且 `can(grants, required)` 為真 | **放行**（fall through 到 module handler） |
| 有宣告但無權限（含未帶 token：`getGrants` 回空陣列；R25 已裁為 403、不回 401） | **403** `forbidden: <operationId> requires <perm>` |

```ts
// shared/api/mock/permission-guard.ts（介面取自 a3 PoC poc/orval/src/permissions.ts 的 createPermissionGuard）
export const createPermissionGuard = (opts: TOperationTable & {
  getGrants: (request: Request) => readonly TGrant[];          // 未登入 = []（a3：getGranted 回空集合）
  apiBaseUrl: string;                                           // ★ 必填、無預設值（R22）
}): HttpHandler => {
  const base = opts.apiBaseUrl.endsWith("/") ? opts.apiBaseUrl : `${opts.apiBaseUrl}/`;
  return http.all("*", ({ request }) => {                       // MSW 層註冊為 all（R11），判定只在 apiBaseUrl 範圍內生效
    if (!request.url.startsWith(base)) return;                  // 非 API → 放行
    const route = matchOperation(opts.routes, request, base);   // method 相等 + 去掉 base 後的 path 比對 `/x/:id`
    if (!route) return HttpResponse.json({ error: `not found: no operation for ${request.method} ${new URL(request.url).pathname}` }, { status: 404 });
    const required = opts.permissions[route.operationId];
    if (required === undefined) return HttpResponse.json({ error: `forbidden: ${route.operationId} has no permission declaration` }, { status: 403 });
    if (required === "public") return;                          // 明確公開（例：login）
    if (!can(opts.getGrants(request), required))
      return HttpResponse.json({ error: `forbidden: ${route.operationId} requires ${required}` }, { status: 403 });
    // 有權限 → 不回傳，fall through 到 module handler
  });
};
```

- **與 a3 介面的差異（R26 已裁）**：a3 的 `getGranted` 回 `ReadonlySet<string>` 並做集合成員判斷；本 spec 改為 `getGrants` 回 `TGrant[]` 並交給 `can()`，因為 D5 / §6.1 的矩陣含 wildcard（`*`、`orders:*`），集合成員判斷無法處理。判定順序與五種結果不變。
- **`apiBaseUrl` 的值**：與 fetcher 組 URL 用的同一個 base（`shared/config/env` 的 `apiBaseUrl`）。現況 `api-client.ts:44` 為 `VITE_API_BASE_URL || window.location.origin`，同源時 base = 頁面 origin，所有 vite 資源都會落在「API 範圍內」而被回 404；且現行 mock 路徑分屬 4 個頂層前綴，無法用單一 path 前綴劃界。**已裁（R24）**：mock 模式下 `VITE_API_BASE_URL` 必須設為專用的絕對 origin（例 `http://mock-api.local`，與 a3 PoC 的 `http://api.test` 同型）；`startMockWorker` 在 `apiBaseUrl` **未設定**（空字串 / undefined，不得 fallback 到 `window.location.origin`）、不是絕對 URL、或 `new URL(apiBaseUrl).origin === location.origin`（**任何同源**，不論路徑；例 `location.origin + "/api"` 也算）時 throw（fail fast）。同源非根路徑也要擋，因為 client 的 path 是絕對路徑（`/users` 等），`new URL("/users", location.origin + "/api")` 會得到 `location.origin + "/users"`，落在 guard 的 `apiBaseUrl` 範圍外而被放行。**不動既有 API 路徑**，維持現有前綴（master `6029bf0` 實測，`src/services/mock/handlers.ts`）：
  - `/api`：`POST /api/auth/login`（`:124`）
  - `/users`：`GET /users`（`:142`）
  - `/user`：`GET|PUT /user/me/profile`（`:143-144`）
  - `/admin`：`POST /admin/user/role`（`:148`）及其餘 domain CRUD、`/admin/images`（`:155-198`）
  - client 端同樣以這些相對路徑經 `new URL(path, baseUrl)` 組 URL（`api-client.ts:54`），只換 base、不改 path。
- **fail-closed 三層**（R13 / OQ-14 / R21 / R27）：(1) 產生期——extract 斷言每個 operation 有格式正確的 `x-permission`、public 必帶 `security: []`、非 public 不得寫 `security: []`；(2) 啟動期——`build()` 驗證 1.5.1 對未宣告者 throw、1.5.3 對不在權限目錄的 `resource:action` throw（M4–M6 手寫期的主要防線）；(3) runtime——guard 的 404 / 403，正常不會因宣告缺漏觸發。
- guard 在 `registry.mockHandlers` 第一位；`getGrants` 由 `Authorization: Bearer <token>` → mock session → role → 矩陣展開；無 token / 查無 session → `[]`。
- 前端 fetcher 收到非 2xx（含 403）throw `ApiError`，由各 hook 以 `.catch(nullOnApiError)` 沿用原本的 toast / 回 null 路徑；fetcher 不做統一 toast（§4.5 fetcher 列）。

### 6.6 不做

- 動態 role 管理 UI（矩陣編輯頁）。
- ABAC 實作（§6A 已定案方向，實作另開一棒，不進 M1–M8）。

---

## 6A. ABAC（R6 → R16 定案：C 命名條件，內建 `own`）

### 6A.1 定案

- **採 C：命名條件（named condition predicate）**，擁有者條件以內建條件 `own` 提供（原選項 A 併入 C）。
- **B 欄位層級（field-level）日後獨立做**，不阻塞本次重構，也不在 C 那一棒。
- **不採 D（CASL）**。
- **ABAC 實作另開一棒，不進 M1–M8**。M1 的 `can(grants, p)` 簽名不變；C 那一棒只在其後加可選參數。

### 6A.2 共同前提（不變）

- RBAC 矩陣（role × resource × action）是**第一道門**：沒有 `orders:update` 的人，任何條件都不會讓他能改。條件只在 RBAC 放行後**再收窄**（只減不增）；route guard / nav 拿不到資源實例，因此仍只看 RBAC，不會誤開放。
- 條件與資源實例綁定，**四強制點裡只有「操作層」與「MSW handler」評估條件**。
- 前端只拿到 grants 資料；條件的**判斷邏輯**住 `shared/permission`（內建 `own`）與各 module（自訂條件），**條件的指派**是資料（mock 矩陣 / 未來後端）。

### 6A.3 形狀（給 ABAC 那一棒的契約起點）

- grant 掛命名條件：`"orders:update?status-editable"`、`"articles:update?own"`；仍是字串，mock 矩陣與 wildcard 規則不變。
- module 註冊條件：`conditions: { "status-editable": (order) => ["pending", "processing"].includes(order.order_status) }`（放在 `permissions` 欄位內，不新增 D2 頂層欄位）；`own` 由 `shared/permission` 內建，module 只提供 owner 取值器（例 articles 的 `user_id`，`article.ts:7`）。
- `can(grants, p, ctx?)`：無 `ctx` 時行為同 M1；有 `ctx`（`{ resource, session }`）時，持有不帶條件的 grant → true；只持有帶條件的 grant → 跑對應 predicate。
- `build()` 新增驗證：grant 引用的條件名都有註冊。

| 強制點 | C 的行為 |
|--------|---------|
| route guard / nav | 只看 RBAC（帶條件的 grant 視為有該 action） |
| 操作層 | `rowActions` 把 row 傳進 `can(…, { resource: row })` |
| MSW handler | guard 判 RBAC；handler 查 seed 跑 predicate，不符回 403 |

- Demo 情境：orders 已出貨（`order_status` = shipped / completed）後「編輯」row action 變 disabled（`denied: "disable"` + tooltip）；`support` 角色 `articles:update?own` 只能編輯自己寫的文章；banners 只有 draft 可刪。
- 爆炸半徑（給排程參考）：`shared/permission`、`shared/ui/data-table` rowActions、各 module MSW handler、`build()` 驗證；可插在 M4 之後任一點。

### 6A.4 未採選項（紀錄）

- **A 擁有者 scope（`@own`）**：功能被 C 的內建 `own` 完全涵蓋，不另設格式。
- **B 欄位層級**：價值高（PII 遮罩：`user.ts:19-23` 的 `phone_number` / `address`），但改動集中在 `shared/ui` columns / form、grant 需從字串變物件，與 C 正交 → 日後獨立一棒。
- **D CASL**：表達力超出 showcase 需求、新增 runtime 依賴、需把 D5 字串格式整個轉譯 → 不採。

---

## 7. Lint 邊界規則（D3、R7）

### 7.1 工具決定

- **eslint-plugin-boundaries v7（7.4.2）為唯一強制閘門**，寫在 ESLint 9 flat config（`eslint.config.js`）；進 `pnpm lint`、lint-staged、IDE。
- 不用 steiger（R1）。
- **前置**：ESLint 9 flat config 遷移由 deps chain P1 完成（M0），本 spec 不實作遷移；本 spec 的規則以「在既有 flat config 陣列追加一個 config 物件」的形式落地。

### 7.2 規則草案（flat config）

> **M5 AC-1 實測結論（7.4.2）**：key 用 `policies`（`rules` 為 deprecated alias）；`boundaries/elements` 取第一個符合者（具體者在前）、`policies` 由最後一個符合者決定。下列節錄依實作現況（`eslint.config.js`）；`MODULE_TYPES` = `["module-api","module-model","module-ui","module-mocks","module"]`。M5–M6 過渡期 `boundaries/ignore` 另有 `LEGACY_PATHS`，M6 移除。

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
        { type: "module-api",   pattern: "src/modules/*/api",    capture: ["module"] },   // R15：整個目錄為 orval 產物（含 api/model/）
        { type: "module-model", pattern: "src/modules/*/model",  capture: ["module"] },   // R15：手寫 domain model
        { type: "module-ui",    pattern: "src/modules/*/ui",     capture: ["module"] },
        { type: "module-mocks", pattern: "src/modules/*/mocks",  capture: ["module"] },   // <id>.msw.ts 產物 + 手寫 handlers / seed
        { type: "module",       pattern: "src/modules/*",        capture: ["module"] },   // index.ts（含 route composition，§4.4）、locales/
        { type: "shell",        pattern: "src/shells/*",         capture: ["shell"] },
        { type: "app",          pattern: "src/app" },                                     // 含 operations.gen.ts（kernel 產物，R15）
        { type: "shared",       pattern: "src/shared" },
      ],
      "boundaries/ignore": ["src/test/**", "**/__tests__/**"],
    },
    rules: {
      "boundaries/no-unknown-files": "error",
      "boundaries/dependencies": ["error", {
        default: "disallow",
        policies: [
          // kernel：shared、shells、各 module 的 index.ts
          { from: { element: { type: "app" } },
            allow: { to: [{ element: { type: ["app", "shared", "shell"] } }, MODULE_ENTRY] } },
          // shared：只能 shared（domain-free 的機械保證；擋 shared → app，如 §6.2 的 ForbiddenBoundary 必須住 app）
          { from: { element: { type: "shared" } }, allow: { to: { element: { type: "shared" } } } },
          // shell：shared + 他 module 的 index.ts（覆寫頁取 headless API）
          { from: { element: { type: "shell" } }, allow: { to: [{ element: { type: "shared" } }, MODULE_ENTRY] } },
          // default shell 屬 core：禁 import 任何 module element（不只 index.ts；§4.4 D4 保證）
          { from: { element: { type: "shell", captured: { shell: "default" } } }, disallow: { to: { element: { type: MODULE_TYPES } } } },
          // module 根（index.ts / locales）→ 本 module 各 segment；route composition（ui 頁面注入 model/routes）只能發生在這裡
          { from: { element: { type: "module" } },
            allow: { to: ["module-api", "module-model", "module-ui", "module-mocks"].map(SAME_MODULE) } },
          // module 內單向：ui → model → api；mocks → api（ui 不可直接 import api 型別，R18；model 不可 import ui，故 model/routes 不得引用頁面元件）
          { from: { element: { type: "module-ui" } },    allow: { to: [SAME_MODULE("module-model")] } },
          { from: { element: { type: "module-model" } }, allow: { to: [SAME_MODULE("module-api")] } },
          // 過渡：mocks 另可讀同 module 的 model（seed 型別取自 model/；原註記 M7 收回，現況未收回）
          { from: { element: { type: "module-mocks" } }, allow: { to: [SAME_MODULE("module-api"), SAME_MODULE("module-model")] } },
          // 所有 module 內部 → shared、他 module 的 index.ts（requires 由 build() 檢查）
          { from: { element: { type: ["module", "module-api", "module-model", "module-ui", "module-mocks"] } },
            allow: { to: [{ element: { type: "shared" } }, MODULE_ENTRY] } },
        ],
      }],
    },
  },
  {
    files: ["src/{app,shared,shells,modules}/**/*.{ts,tsx}"],
    ignores: ["**/__tests__/**"],                         // 測試是白箱，與 boundaries/ignore 一致
    rules: {
      "no-restricted-imports": ["error", { patterns: [
        { group: ["@/modules/*/*"], message: "跨 module 只能 import `@/modules/<id>`（index.ts）" },
        { group: ["**/use-user-permissions*"], message: "改用宣告式 permission（spec §6.4）" },
      ] }],
    },
  },
  // orval 產物：只關 import 排序（gen:api 已跑 prettier），其餘規則含 boundaries 照常
  { files: ["src/modules/*/api/**/*.ts", "src/modules/*/mocks/*.msw.ts"], rules: { "import/order": "off" } },
  {
    files: ["src/modules/**/*.{ts,tsx}", "src/shells/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error",
        { selector: "CallExpression[callee.name='createRoute']", message: "module 只能用 ctx.layout / ctx.page 建 route（§4.1、§6.2）" },
        { selector: "CallExpression[callee.name='useCan']",      message: "改用 DataTable rowActions / FormSubmit / <Guarded>（§6.4）" },
      ],
    },
  },
];
```

- 同 module 內同一 segment 的互 import 屬 internal，不受 `dependencies` 限制（`checkInternals: false` 預設）。
- module 內對自己 `index.ts` 的 import 會形成環，由既有 `import/no-cycle` 擋。
- `no-restricted-imports` 的 `@/modules/*/*` 只擋**跨 module** 的深 import；同 module 內請用相對路徑（lint 規則訊息寫明）。
- `module-api` 允許 `shared`（產物 import `shared/api/fetcher.ts` mutator）；PoC a2 實測產物只 import 同目錄 `model`、`@tanstack`、`msw`、`faker`，無跨 module import，規則不需例外。
- orval 產物（`src/modules/*/api/**`、`src/modules/*/mocks/*.msw.ts`）仍受 boundaries 與其他規則檢查，只關 `import/order`（`gen:api` 先跑 prettier；產物不手改，正確性由 CI 的 `gen:api && git diff --exit-code` 保證）。
- `src/modules/*/mocks/` 手寫檔不得命名 `*.msw.ts`（R15）：M7 AC-5 以腳本機械檢查——每個 `src/modules/<id>/mocks/*.msw.ts` 的檔名必須恰為 `<id>.msw.ts`（mode `single` 每 module 只產這一支）。

---

## 8. 「換 UI」與「換 domain」操作步驟

### 8.1 換 UI（驗證 D1、R2）

**整套換 shell**：
1. 新建 `shells/<new>/`，實作 `TShell`（`ProtectedLayout`、`AuthLayout`、`Forbidden`），導覽只用 `useVisibleNav()`、session 用 `useSession()`、登出用 `@/modules/auth` 公開的 `useLogout`。
2. `app/main.tsx`：`createApp({ shell: newShell, operations, apiBaseUrl })`。

**逐頁換**：
3. 在 `shells/<new>/pages/` 寫新頁，只 import 目標 module `index.ts` 公開的 headless API，放進 `TShell.pages["orders.list"]`；或在 `app/main.tsx` 以 `.override("orders.list", Page)` 單點覆寫。

**不需改**：`modules/*/{api,model,mocks,locales}`、`shared/**`、`app/kernel/**`。
→ 成立條件：module 的資料邏輯全在 `model/`（lint：`ui` 只能 import 同 module 的 `model`，§7.2）。

### 8.2 換 domain（驗證 D4、R3、R14）

1. `app/modules.ts` 刪掉 7 個 domain `.use()` 行與對應 import。
2. `openapi.yaml`：從 `tags` 刪掉 7 個 domain tag，並刪掉這些 tag 底下的全部 paths（只被它們引用的 `components.schemas` 可留可刪：orval tag filter 會剪掉未被引用的 schema，不會產出殘留）。
3. `rm -rf src/modules/{orders,product,suppliers,consumers,banners,articles,tags}`。
4. `pnpm gen:api`（重產 `app/operations.gen.ts`；tag 已刪，orval 不會把已刪的 `modules/<id>/api` 生回來）。
5. `pnpm build && pnpm exec vitest run` 綠；`pnpm dev` 登入後 sidebar 只含 team-members（users module 本來就沒有宣告 nav），`/` redirect 到第一個可見 nav（`/team-members`）。

- **漏做的 fail fast**：漏了步驟 2 與 4 → `operations.gen.ts` 仍含 `orders:read` 等 permission，但已無已安裝 module 的權限目錄含該 `resource:action` → `build()` 驗證 1.5.3 throw；漏了步驟 2 但跑了步驟 4 → orval 重產 `modules/orders/api`，`operations.gen.ts` 仍含 domain operation。M8 實測 **tsc 不報錯**（重產的 `api/` 沒人 import，可獨立編譯）；fail fast 發生在 vitest：`build()` 驗證 1.5.3 throw，operations-gen 等測試失敗。
- 新 domain：在 `openapi.yaml` 加 tag + paths（含 `x-permission`）→ 新增 `modules/<new>/{index.ts,model,ui,mocks,locales}` → `app/modules.ts` 加 `.use()` → `pnpm gen:api` 產出 `modules/<new>/api` 與 `mocks/<new>.msw.ts`。
→ 自動化：M8 的 `scripts/verify-core-only.sh`（`pnpm verify:core-only`）在暫存 worktree 副本（`git worktree add --detach HEAD`，只含已 commit 內容）執行 1–4 與 build/test。vitest 只跑 core-safe 測試：排除 = grep 命中 domain 引用（`@/modules/<id>` 或 `"<id>.`）的測試檔 ∪ 腳本內明列的 `FULL_INSTALL_TESTS`（斷言完整安裝、無 domain 字面的測試；清單內檔案不存在即 fail）；排除總數須 > 0 且 ≤ 一半。排除的測試檔先從副本刪除再 build（`tsconfig.app.json` 含測試檔）。

---

## 9. 重構 Milestones

> **M0 前置條件（不屬本 spec 的 milestone，deps chain 負責）**：deps P0 `engines.node >=22` 與 P1 ESLint 9 flat config 已合進 master。M5（boundaries lint）硬依賴 P1；M1–M4 不依賴 lint 設定，但以 P0/P1 合併後的 master 為 base 可避免 rebase。
>
> 每棒可獨立 merge；共同 done 基線：`pnpm build && pnpm exec vitest run` exit 0（`pnpm test` 是 watch 模式，禁用）。lint 只檢查用 `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`（`pnpm lint` 帶 `--fix`）。
> ABAC 不在 M1–M8（R16：方向已定為 C，實作另開一棒，§6A）。

### Milestones
- **M1 Kernel 契約與權限引擎（純新增）**：`shared/module` 型別（含 `requires`、`TRouteIdRegistry`、`TShell`、`ctx.layout` / `ctx.page`）、`shared/permission` 的 `can()` / `guardedRoute` / `ForbiddenError` / `TOperationTable`、`app/kernel` 的 `createApp({ shell, operations, apiBaseUrl }).use().override()` 與純函式 `build()`（驗證含 operation 表 fail-closed + 權限目錄完整比對 + page route 必有 routeId + route id 收集與 override 解析 + nav / i18n scope 合併），全未接線 + 單元測試
- **M2 MSW 取代 mockFetch（行為不變）**：安裝 msw、`msw init public/`；`apiFetch` 改打真 `fetch`；現行 `handlers` 表經 adapter 轉 `HttpHandler[]`；dev 用 `setupWorker`、測試用 `setupServer`；`mockFetch` 刪除
- **M3 Module 接線 + default shell（行為不變）**：`app/main.tsx` 走 `createApp().use()`；10 個 module `index.ts` 指向現有 pages；layout / sidebar 搬進 `shells/default`；route 定義在 `model/routes.ts`、ui 頁面在 `index.ts` 注入（route composition）；有畫面的 route 一律 `ctx.page({ routeId })` 支援覆寫；guard 以 legacy 全 public 的 operation 表 + 專用 `apiBaseUrl` 掛上（行為不變）；`/` redirect 到第一個可見 nav；刪 `router/routes.tsx`、`constants/sidebar.tsx`
- **M4 權限四強制點 + 內容區 403**：登入回 grants、mock 矩陣、`guardedRoute`（shared，只拋錯）+ `ForbiddenBoundary`（app 注入，內容區 403）、`useVisibleNav`、DataTable/EditActions/FormSubmit 宣告式 permission、手寫 `app/operations.gen.ts` + fail-closed MSW guard；刪 `useUserPermissions`
- **M5 Kernel / shared 搬遷 + 邊界 lint**：`components/ui`、`lib`、`hooks`、`utils`、`constants`、`plugins/image-validation` 通用部分、`services` 共用部分 → `shared/`；去除 core→domain 汙染；boundaries 規則上線（未搬的 legacy 路徑暫列 ignore）
- **M6 Module 內嵌搬遷**：逐 module 把 `pages/<x>`、`services/schemas`、mock seed / handler、i18n key 搬進 `modules/<id>/{model,ui,mocks,locales}`（`api/` 留給 M7 的 orval 產物，R15）；i18n 改裸字典；各 module 自帶 seed；移除 lint ignore
- **M7 orval 契約層（依 PoC a1/a2 結論）**：repo 根單一 `openapi.yaml`（R14）、從 tags 推 target 的 `orval.config.ts`、`scripts/extract-operations.ts`（含斷言）產 `app/operations.gen.ts`、產物落 `modules/<id>/api/**` 與 `mocks/<id>.msw.ts`、`mocks/handlers.ts` 包 orval handler（非 200 情境手寫）、`shared/api/fetcher.ts` 為 mutator（unwrap）；刪 M2 adapter 與手寫 api hooks
- **M8 D1 / D4 驗收自動化與收尾**：`scripts/verify-core-only.sh`、逐頁覆寫的整合測試（fixture shell 覆寫 `orders.list`）、舊目錄清空確認

---

#### M1 Kernel 契約與權限引擎

**User Story**：As a maintainer, I want the module contract (`defineModule` with `requires`, page overrides) and a pure `build()` with tests, so that later milestones wire modules against a verified kernel instead of ad-hoc glue.

**Acceptance Criteria**
- [ ] AC-1 `[cmd]`: `can()` 正確處理精確 grant、`resource:*`、`*`、無 grant 四種情況
  - 驗證：`pnpm exec vitest run src/shared/permission`
- [ ] AC-2 `[cmd]`: `build()` 對重複 module id、缺 `requires` 依賴、`requires` 成環、i18n 裸字典頂層含 module id（已自行 scope）、nav 引用未宣告 resource、nav 引用的 resource 存在但 action 不在目錄（完整 `resource:action` 比對，例 `orders:typo`；owner 2026-11-09 nav 粒度裁決）各 throw，訊息含 module id
  - 驗證：`pnpm exec vitest run src/app/kernel`
- [ ] AC-3 `[cmd]`: override 解析順序為 app `.override()` > `shell.pages` > module 預設；`.override()` 未知 route id throw；`shell.pages` 未知 id 忽略；routeId 重複時 throw；routeId 不符 R23 格式（前綴不是所屬 module id）時 throw；`registry.routeIds` 等於 fixture 宣告的 routeId 集合
  - 驗證：同上
- [ ] AC-3b `[cmd]`（F5 負例）: fixture module 以 `ctx.page` 建一個有 `component` 但缺 `routeId` 的 route（以 `as any` 繞過型別）→ `build()` throw，訊息含 module id 與 `requires routeId`；`ctx.layout` 帶 `component` → `build()` throw，訊息含 `must not have a component`（型別層的必填由 §4.1 `TPageRouteOpts` 保證，本 AC 驗 runtime 防線）
  - 驗證：`pnpm exec vitest run src/app/kernel`
- [ ] AC-4 `[cmd]`: 兩個 fixture module 組出的 route tree 含兩者子路由、nav 依 order 穩定排序、i18n 合併後 module key 為 `<id>.<key>`（無 `<id>.<id>.*`）且 core key 不被覆蓋、`registry.mockHandlers[0]` 為 guard
  - 驗證：同上
- [ ] AC-5 `[cmd]`: operation 表 fail-closed（R13 / OQ-14 / R21）：`routes` 有 operationId 但 `permissions` 無對應 key → throw 且訊息含 operationId 與 `"public"` 提示；`permissions` 有孤兒 key → throw；非 public permission 的 resource 未被已安裝 module 宣告 → throw；**負例 `orders:typo`：已安裝 module 宣告 `resources: { orders: ["read","update","export"] }`，operation 宣告 `orders:typo` → throw，訊息含 operationId 與 `orders:typo`**（resource 存在但 action 不在目錄也必須失敗）；值為 `"public"` 者通過；`orders:read` 通過
  - 驗證：`pnpm exec vitest run src/app/kernel`
- [ ] AC-6 `[cmd]`: 既有行為不變（既有檔案無任何改動，新碼未被 import）
  - 驗證：`pnpm build && pnpm exec vitest run && git diff --quiet fcc673a -- src ':!src/shared' ':!src/app'`

**Pseudo code**
```ts
// app/kernel/build.ts
export function build({ modules, shell, overrides, operations, apiBaseUrl, core }) {
  assertUniqueIds(modules);
  assertRequires(modules);            // 每個 dep ∈ ids；DFS 偵測環
  assertI18nBare(modules);            // 裸字典頂層 key 不得 === module id
  const catalogue = catalog(modules);
  assertNavPermissions(modules, catalogue);  // §4.3 1.4：nav permission 必須是目錄中完整的 resource:action
  assertOperations(operations, catalogue);   // §4.3 1.5：未宣告 / 孤兒 / resource:action 不在目錄（R21，完整比對）/ method+path 重複 → throw
  const nav = stableSortBy(m => m.order ?? 100, modules.flatMap(m => m.nav ?? []));
  const routeIds = new Set();
  const resolvePage = (id, Default) => overrides.get(id) ?? shell.pages?.[id] ?? Default;
  const routeTree = assembleRoutes({ root: core.root, shell, modules, nav, routeIds, resolvePage }); // 建 route 時收集 routeId（R19）；ctx.page 缺 routeId / ctx.layout 帶 component → throw（1.8）
  for (const id of overrides.keys()) if (!routeIds.has(id)) throw new Error(`override: unknown route id "${id}"`);
  return {
    routeTree,
    registry: {
      modules, nav, operations, routeIds,
      permissions: catalogue,
      i18n: scopeAndMerge(core.i18n, modules),          // §4.3 步驟 4 mergeDeep(core[lng], { [m.id]: m.i18n[lng] ?? {} })：同名 key 深層合併、core 既有 key 不被覆蓋（AC-4），scope 只在這裡
      mockHandlers: [core.guard({ ...operations, apiBaseUrl }), ...core.mockHandlers, ...modules.flatMap(m => m.mockHandlers ?? [])],
    },
  };
}
```

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
  it("throws when a module i18n dict is pre-scoped (top-level key === id)", () => {
    const pre = mod("orders", { i18n: { en: { orders: {} }, zh: { orders: {} } } });
    expect(() => build(ctx([pre]))).toThrow(/"orders".*bare dictionary/);
  });
});

describe("operation table (fail-closed)", () => {
  const ops = (permissions: OperationPermissions) => ({
    routes: [{ method: "GET", path: "/a", operationId: "listA" }, { method: "POST", path: "/login", operationId: "login" }],
    permissions,
  });
  const a = mod("a", { permissions: { resources: { a: ["read"] } } });
  it("throws on an operation without declared permission", () => {
    expect(() => build(ctx([a], ops({ listA: "a:read" })))).toThrow(/operation "login" has no permission declared.*"public"/);
  });
  it("accepts explicit public", () => {
    expect(() => build(ctx([a], ops({ listA: "a:read", login: "public" })))).not.toThrow();
  });
  it("throws on orphan permission key", () => { /* permissions 多一個 routes 沒有的 operationId */ });
  it("throws when a permission resource is not declared by an installed module", () => {
    expect(() => build(ctx([], ops({ listA: "a:read", login: "public" })))).toThrow(/"a:read".*not in any installed module's permission catalog/);
  });
  it("throws on a typo action even when the resource exists (R21 full resource:action match)", () => {
    expect(() => build(ctx([a], ops({ listA: "a:typo", login: "public" })))).toThrow(/"listA".*"a:typo"/);
  });
});

describe("page / layout routes (F5)", () => {
  it("throws when a page route has a component but no routeId", () => { /* ctx.page({ path, component } as any) → /requires routeId/ */ });
  it("throws when a layout route has a component", () => { /* ctx.layout({ path, component } as any) → /must not have a component/ */ });
});

describe("route id override resolution", () => {
  it("app override > shell.pages > module default", () => { /* render resolved component, assert testid */ });
  it("throws on unknown app override route id", () => { /* ... */ });
  it("ignores unknown shell.pages id", () => { /* ... */ });
  it("throws on duplicate routeId", () => { /* ... */ });
  it("throws on routeId without own module prefix (R23)", () => { /* ... */ });
});

describe("i18n scope", () => {
  it("scopes bare module dict under module id exactly once", () => {
    const o = mod("orders", { i18n: { en: { list: { title: "Orders" } }, zh: { list: { title: "訂單" } } } });
    const { registry } = build(ctx([o]));
    expect(registry.i18n.en.orders.list.title).toBe("Orders");
    expect(registry.i18n.en.orders.orders).toBeUndefined();
  });
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

**Touches**：`src/shared/module/**`、`src/shared/permission/**`、`src/app/kernel/**`（全新）；`package.json` / `pnpm-lock.yaml` 僅新增 `msw@3.0.4`（`TModule.mockHandlers: HttpHandler[]` 需要其型別；版本取 PoC a1 實測相容版本）
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
- [ ] AC-3 `[cmd]`: `api-client.test.ts` 改走 `setupServer` 後原有案例全綠（登入、帶 token、404 fallback）；`server.listen` 用 msw 3 的 `onUnhandledFrame`（`onUnhandledRequest` 在 msw 3 已改名，PoC a1 實測 TS2353）
  - 驗證：`pnpm exec vitest run src/services`
- [ ] AC-4 `[cmd]`: `public/mockServiceWorker.js` 存在且進 git
  - 驗證：`git ls-files --error-unmatch public/mockServiceWorker.js`
- [ ] AC-5 `[manual]`: `VITE_API_MOCK=true pnpm dev` 登入後各頁 CRUD 與重構前一致；Network 面板顯示請求由 service worker 回應（PoC 只驗過 node `setupServer`，browser `setupWorker` + vite dev 由本 AC 首次驗證，§11.1）

**預設值**：mock 預設開——只有 `VITE_API_MOCK === "false"` 才關閉（未設、`"true"` 或其他值都開；owner 2026-11-10 裁決），判斷集中在 `src/app/mock/enabled.ts` 的 `isMockEnabled`。

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
  - 驗證：`test ! -e src/router/routes.tsx && test ! -e src/constants/sidebar.tsx && test "$(grep -o '\.use(' src/app/modules.ts | wc -l | tr -d ' ')" -eq 10`（`grep -o … | wc -l` 逐 occurrence 計數；`.use()` 鏈式排版一行多個，只計行數會少算）
- [ ] AC-2 `[cmd]`: registry 產出的路徑集合與重構前一致（快照列出全部 fullPath），另多一條 `/` index redirect
  - 驗證：`pnpm exec vitest run src/app`
- [ ] AC-3 `[cmd]`: `/` 依 grants 導向第一個可見 nav；無可見 nav 時內容區渲染 `shell.Forbidden`
  - 驗證：`pnpm exec vitest run src/app/router`
- [ ] AC-4 `[cmd]`: 以 fixture `.override("users.list", Stub)` 建 app，`/users` 渲染 Stub 而非預設頁（`users.list` 為該 route 的 routeId，R19；格式依 R23）
  - 驗證：`pnpm exec vitest run src/app`
- 註：M3 尚無正式 operation 表。依 R22，guard 在 `apiBaseUrl` 內對不到 route 一律 404，傳空表會讓所有 API 變 404，因此 M3 由 `app/mock/legacy-adapter.ts` 從現行 `handlers` 表導出 `legacyOperations()`：每個 `METHOD path` 一條 route、permission 一律 `"public"`（**R28 已裁**：M3 過渡期全 public，明確 public，非 fall-through），`build()` 1.5 通過；guard 行為 = 表內放行、表外 404，與現行 `mockFetch` 的 404 fallback（`handlers.ts:209-214`）一致。mock 模式的 `VITE_API_BASE_URL` 同時改為專用絕對 origin（R24，§6.5），API 路徑不變。M4 換成手寫 `app/operations.gen.ts`，自 M4 起 fail-closed（R28）。
- [ ] AC-6 `[cmd]`: M3 的 guard 掛載行為不變：`apiBaseUrl` 外的 request 放行、表內 operation 放行、表外 path 回 404
  - 驗證：`pnpm exec vitest run src/app/mock`
- [ ] AC-7 `[cmd]`（R24 負例）: mock 模式下 `apiBaseUrl` 未設定、為相對路徑、或與 app 同源（`new URL(apiBaseUrl).origin === location.origin`，含同源根目錄 `location.origin + "/"` 與同源非根路徑 `location.origin + "/api"` 兩個負例）時 `startMockWorker` throw；設為專用絕對 origin 時正常啟動，且 legacy 表的 route 涵蓋 `/api`、`/user`、`/users`、`/admin` 四個前綴（路徑未改）
  - 驗證：`pnpm exec vitest run src/app/mock`
- [ ] AC-5 `[manual]`: `pnpm dev` 登入後 sidebar 項目、順序、各頁 CRUD 與重構前相同；語系切換正常

**Touches**：`src/main.tsx`、`index.html`、`src/router/**`、`src/constants/sidebar.tsx`、`src/components/layouts/**`、`src/components/shared/{AppSidebar,Navbar,Breadcrumb}.tsx`、`src/hooks/use-breadcrumb.ts`、`src/locales/i18n.ts`、`src/app/**`、`src/shells/default/**`（新）、`src/modules/*/index.ts`（新，含 route composition）、`src/modules/*/model/routes.ts`（新，不 import ui/pages）、`.env.example`（mock 模式 `VITE_API_BASE_URL`）；例外（main 02:33 代 owner 核准）：`vite.config.ts`（test env 的 `VITE_API_BASE_URL`）、`CLAUDE.md`（M3 狀態與路由描述）
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
- [x] AC-1 `[cmd]`: `support` session 無 `users:read` → 進 `/users` 時 URL 不變、shell（sidebar）仍渲染、內容區為 `shell.Forbidden`；sidebar 無 users 項
  - 驗證：`pnpm exec vitest run src/app/router src/shared/module`
- [x] AC-2 `[cmd]`: MSW guard 依 R22（a3）判定，`setupServer` 實發 request 驗證下列情況：
  1. **非 API 放行**：`apiBaseUrl` 外的 request（例 `http://cdn.test/x`）guard 回 `undefined`（不攔截）
  2. **base URL 邊界**：`apiBaseUrl = http://api.test` 時 `http://api.testing/admin/users` 視為非 API 放行（前綴補 `/`）；`apiBaseUrl` 帶不帶結尾 `/` 結果相同
  3. **unknown route 404**：`apiBaseUrl` 內對不到 operation 的 `GET /admin/nope` 回 404，且即使存在同路徑的手寫 `http.get` handler 也不會被執行
  4. **未宣告 403**：對到 operation 但 permissions 無 key → 403，body 含 operationId 與 `has no permission declaration`
  5. **public 放行**：`"public"` 的 `login` 未帶 token → 放行到 module handler（200）
  6. **無權限 403**：缺 `users:update-role` 的 token 打 `updateUserRole` → 403；未帶 token 打非 public operation → 403（R25，不是 401）
  7. **有權限放行**：fall through 到 module handler 回 200；含 path 參數的 operation（`/admin/users/:id`）能被對到（a3 未驗證 3，§11.1）
  - 驗證：`pnpm exec vitest run src/shared/api src/app/mock`
- [x] AC-3 `[cmd]`: 以實際的手寫 `src/app/operations.gen.ts` 建 app 時 `build()` 不 throw（現行 `handlers.ts` 每個 `METHOD path` 都有 operationId 與 permission 或 `"public"`）；刪掉其中一個 key 後 `build()` throw
  - 驗證：`pnpm exec vitest run src/app/kernel`
- [x] AC-7 `[cmd]`: `shared/permission` 不 import `app` / `shells`（`ForbiddenBoundary` 住 `app/router`，C2）
  - 驗證：`! grep -rnE "from \"@/(app|shells)/" src/shared/permission`
- [x] AC-4 `[cmd]`: DataTable `rowActions` 無權限項預設不渲染、`denied:"disable"` 渲染為 disabled；`FormSubmit` 無權限 disabled
  - 驗證：`pnpm exec vitest run src/components/shared src/shared/ui`
- [x] AC-5 `[cmd]`: 結構性測試：protected 子樹每個 route 都有 `staticData.permission`；`useUserPermissions` 已無引用
  - 驗證：`pnpm exec vitest run src/app && ! grep -rn "useUserPermissions" src`
- [x] AC-6 `[manual]`: superadmin demo 帳號所有頁面與操作仍可見可用（s29 行為層，owner 未親驗）

**Touches**：`src/shared/permission/**`、`src/shared/api/**`、`src/shared/module/**`、`src/services/api-client.ts`、`src/services/mock/**`、`src/components/shared/{DataTable,EditActions,UnauthorizedPage}.tsx`、`src/components/shared/table/**`、`src/shells/default/**`、`src/pages/users/**`、`src/modules/**`、`src/app/**`（含新增手寫 `src/app/operations.gen.ts`，檔頭註明 hand-maintained until M7）；例外（main 06:4x 代 owner 核准）：`src/shared/ui/**`（`FormSubmit`）、`src/services/__tests__/api-client.test.ts`、`CLAUDE.md`（M4 狀態、權限描述與舊 session 重新登入說明）
**Must-Not-Touch**：其他 `src/pages/**` 業務邏輯（只改 action 宣告處）；行為紅線：superadmin 可見範圍不縮減；不新增 `/403` route；login 回應新增 `grants` 為 §6.1 指定例外；既有欄位不變

**Done Command**
```bash
pnpm build && pnpm exec vitest run && ! grep -rn "useUserPermissions" src
```
expected: exit 0

---

#### M5 Kernel / shared 搬遷 + 邊界 lint

**User Story**：As a maintainer, I want kernel and shared code in `app/` + `shared/` + `shells/default` with lint-enforced boundaries, so that core stays domain-free by construction rather than by review.

**Acceptance Criteria**
- [x] AC-1 `[cmd]`: boundaries 在 flat config 下載入並報違規（spike：暫時 fixture `src/shared/__boundary_fixture__.ts` import `@/modules/orders` 被擋，確認後刪除；結果與 `rules`/`policies` key 實測結論記於 PR）
  - 驗證：`pnpm exec eslint src/shared/__boundary_fixture__.ts; test $? -eq 1`（fixture 期間）
- [x] AC-2 `[cmd]`: `src/shared/**` 無任何對 `app` / `shells` / `modules` 的 import，無 domain 型別（`EOrderStatus` 等）
  - 驗證：`! grep -rnE "@/(app|shells|modules)/|EOrderStatus" src/shared`
- [x] AC-3 `[cmd]`: `components/ui`、`lib`、`hooks`、`utils`、`constants`、`plugins` 目錄已移除（domain 殘留列於 PR）
  - 驗證：`test ! -d src/components/ui && test ! -d src/lib && test ! -d src/plugins && test ! -d src/hooks`
- [x] AC-4 `[cmd]`: lint 無 error
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
- [x] AC-1 `[cmd]`: `src/pages/`、`src/services/` 不存在；每個 module 有 `index.ts`
  - 驗證：`test ! -d src/pages && test ! -d src/services && for d in src/modules/*/; do test -f "$d/index.ts" || exit 1; done`
- [x] AC-2 `[cmd]`: 沒有 module 讀其他 module 的 seed（R5）；跨 module import 只到 `index.ts`
  - 驗證：`! grep -rnE "@/modules/[^/\"']+/" src/modules`
- [x] AC-3 `[cmd]`: core 字典頂層 key 不含任何 module id；各 `modules/<id>/locales/*.json` 為裸字典（頂層不含 `<id>`，§5.4），以實際 10 個 module 跑 `build()` 不 throw
  - 驗證：`pnpm exec vitest run src/shared/i18n src/app/kernel`
- [x] AC-4 `[cmd]`: boundaries ignore 清單已移除，lint 全綠
  - 驗證：`pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`
- [x] AC-5 `[cmd]`: 既有測試檔（搬遷後路徑）全綠（base 實際 33 檔，原文「14 個」過時）
  - 驗證：`pnpm exec vitest run`
- [x] AC-6 `[manual]`: 兩種語系下各頁文字與重構前一致（s29 行為層，owner 未親驗）

**Touches**：`src/pages/**`、`src/services/**`、`src/modules/**`、`src/shared/i18n/locales/**`、`src/app/mock/**`、`eslint.config.js`；實際另動（見 M6 報告例外）：`src/shared/api/**`（`mock-db.ts`、`mock/session-store.ts`、legacy adapter 由 app 移入）、`src/shells/**`（Navbar / Breadcrumb 移至 `src/shared/ui/navbar/`）、`src/app/kernel/create-app.tsx`（只補 `mount` 的字典寫入）、`CLAUDE.md`
**Must-Not-Touch**：`src/app/kernel/**` 契約（需改 → 回報）；`src/shells/**`；行為紅線：URL、mock API 路徑、使用者可見文字不變

**Done Command**
```bash
pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run && test ! -d src/pages && test ! -d src/services
```
expected: exit 0

---

#### M7 orval 契約層（依 PoC a1/a2 結論）

**User Story**：As a maintainer, I want the whole API defined by one hand-written `openapi.yaml` with orval generating each module's client and MSW handlers and an extract script generating the kernel's operation table, so that the mock backend, client types and permission table derive from one source of truth.

**Acceptance Criteria**
- [x] AC-1 `[cmd]`: repo 根有單一 `openapi.yaml`（R14）；`pnpm gen:api` 後產物無 diff（產物已進 git 且與契約一致）
  - 驗證：`pnpm gen:api && git diff --exit-code -- src/modules src/app/operations.gen.ts`
- [x] AC-2 `[cmd]`: extract 斷言：fixture YAML 中某 operation 有 0 個或 2 個 tag、tag 不在 `tags` 清單、`operationId` 重複、缺 `x-permission`、`x-permission` 格式不是 `resource:action` / `public`（例 `orders`、`orders:*`）、**`x-permission: public` 但缺 `security: []`**（R21）、**`x-permission` 非 public 卻寫了 `security: []`**（R27 負例，例 `x-permission: orders:read` + `security: []`）時 `extract-operations.ts` 皆 exit 1 並指名 operation；extract 不做權限目錄比對（R27：目錄比對屬 build 期，見 AC-3）
  - 驗證：`pnpm exec vitest run scripts`
- [x] AC-3 `[cmd]`: 以產生的 `operations.gen.ts` + 實際 10 個 module 建 app，`build()` 不 throw（每個 operation 都有 permission 或 `"public"`，每個非 public 值都是某 module 權限目錄中完整的 `resource:action`，R21）；把 fixture YAML 的一個 `x-permission` 改成 `orders:typo` 重新 extract 後 `build()` throw 並指名該 operation
  - 驗證：`pnpm exec vitest run src/app/kernel`
- [x] AC-4 `[cmd]`: fetcher mutator：orval client 經 mutator 回傳 body（非 `{ data, status, headers }`），非 2xx throw；queryKey 為相對 path（不含 baseUrl）——PoC 未驗 mutator，本 AC 首次驗證
  - 驗證：`pnpm exec vitest run src/shared/api`
- [x] AC-5 `[cmd]`: `api/` 只含產物、`mocks/` 的 `*.msw.ts` 只有 `<id>.msw.ts`（R15）；M2 adapter 與手寫 `apiFetch` hooks 已刪
  - 驗證：`for f in src/modules/*/mocks/*.msw.ts; do id=$(basename "$(dirname "$(dirname "$f")")"); test "$(basename "$f")" = "$id.msw.ts" || exit 1; done && test ! -e src/app/mock/legacy-adapter.ts && ! grep -rn "apiFetch" src/modules`
- [x] AC-6 `[cmd]`: create 後 list 讀得到（seed 記憶體狀態經 orval handler override 生效）；手寫的非 200 handler（例：PUT 不存在的 id → 404）排在 orval handler 前且生效；代表性 module 各一條
  - 驗證：`pnpm exec vitest run src/modules`
- [ ] AC-7 `[manual]`: `VITE_API_MOCK=true pnpm dev` 各頁 CRUD 與 M6 一致（待驗；node `setupServer` 已驗）

**Touches**：`package.json`（`gen:api` script、orval / yaml devDeps）、`pnpm-lock.yaml`、`openapi.yaml`（新）、`orval.config.ts`（新）、`scripts/extract-operations.ts`（新）、`scripts/__tests__/**`（新）、`src/app/operations.gen.ts`（改為產物）、`src/shared/api/{fetcher.ts,types.ts,mock-db/**}`、`src/modules/*/{api,model,mocks}/**`、`src/app/mock/**`
**Must-Not-Touch**：`src/modules/*/ui/**`（除 hook 名稱改動外）；`src/shells/**`；行為紅線：mock API 路徑與回應形狀不變

**Done Command**
```bash
pnpm gen:api && git diff --exit-code -- src/modules src/app/operations.gen.ts && pnpm build && pnpm exec vitest run
```
expected: exit 0

---

#### M8 D1 / D4 驗收自動化與收尾

**User Story**：As the owner, I want repeatable checks that the app runs with only generic modules and that a page can be swapped by id, so that the domain-swappable (D4) and UI-swappable (D1) promises are verified, not assumed.

**Acceptance Criteria**
- [x] AC-1 `[cmd]`: `scripts/verify-core-only.sh` 在暫存副本依 §8.2 刪除 7 個 domain module（`.use()` 行 + `openapi.yaml` 中 7 個 tag 與其 paths + `modules/<id>/`）並 `pnpm gen:api` 後，`pnpm build && pnpm exec vitest run` exit 0，輸出 `core-only build: OK`
  - 驗證：`bash scripts/verify-core-only.sh`
- [x] AC-2 `[cmd]`: 整合測試：fixture shell 以 `pages["orders.list"]`（R23 格式）覆寫，渲染覆寫頁且資料來自 orders headless model（與預設頁同一 query key）；現況覆寫頁直接 import `@/modules/orders/model/use-order`（§4.4）
  - 驗證：`pnpm exec vitest run src/app/__tests__/override.integration.test.tsx`
- [x] AC-3 `[cmd]`: 刪 `suppliers` 但保留 `product` 時 `build()` throw 並指名 `product`；只刪 module 目錄與 `.use()`、未刪 YAML tag 也未重 gen 時 `build()` 以驗證 1.5.3 throw（§8.2 漏做的 fail fast）
  - 驗證：`pnpm exec vitest run src/app/kernel`
- [ ] AC-4 `[manual]`: core-only 副本 `pnpm dev`，登入後 sidebar 只有 team-members（users 本無 nav），`/` redirect 到 `/team-members`（待驗；`src/app/__tests__/core-only.test.tsx` 為自動佐證）

**Touches**：`scripts/verify-core-only.sh`（新）、`src/app/__tests__/**`、`package.json`（scripts）
**Must-Not-Touch**：`src/modules/**`、`src/shells/default/**`、`openapi.yaml`；行為紅線：腳本不得修改工作目錄（只在暫存副本操作）

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
| OQ-1 | D4「刪目錄」在 FSD 水平分層下是多目錄 | **已裁**：module 內嵌 `modules/<id>/{api,model,ui,mocks}`；D4 = 刪 `.use()` 一行 + 刪 `modules/<id>/`（§3、§8.2）；R14 起另需刪 YAML 中該 tag 的 paths |
| OQ-2 | 接受 typed route 寬化？ | **已裁**：接受；module 內用 route 物件導航（§4.6） |
| OQ-3 | 跨 module mock 資料依賴 | **已裁**：各 module 自帶 seed，不跨 module 讀 collection（§4.5） |
| OQ-4 | 是否需要 ABAC | **已裁**：現在一起設計 → 方向於 OQ-10 定案 |
| OQ-5 | boundaries 與 legacy `.eslintrc` | **已裁**：ESLint 9 flat config 為前置（deps chain P1）；規則寫 flat config（§7） |
| OQ-6 | module 依賴宣告 | **已裁**：`defineModule` 加 `requires`；build 時 fail fast（§4.1、§4.3） |
| OQ-7 | `/` 首頁行為 | **已裁**：redirect 到第一個可見 nav（§4.3） |
| OQ-8 | 403 UI 行為 | **已裁**：layout 內容區渲染 `UnauthorizedPage`，保留 URL 與 shell，無 `/403` route（§6.2） |
| OQ-9 | openapi.yaml 單檔還是 per-module？ | **已裁（裁決 5，覆蓋裁決 4）**：repo 根**單一手寫 `openapi.yaml`**，依 tag 分 output 到各 module；刪 module = 刪 yaml 中該 tag 的 paths + 刪目錄；extract 斷言每個 operation 恰好一個 tag、operationId 唯一（§4.5、§8.2、M7、M8） |
| OQ-10 | ABAC 採哪個選項 | **已裁**：C 命名條件（內建 `own`）；B 欄位層級日後獨立做；不採 CASL；實作另開一棒，不進 M1–M8（§6A） |
| OQ-11 | 權限字串格式 | **已裁**：冒號分隔 `orders:read`（api chain 已同步）（§6.1） |
| OQ-12 | module 內 `ui` 能否直接 `import type` `api` 產物型別？ | **已裁（照暫定）**：不能；需要的型別由 `model` 轉出（§3.1、§3.2、§7.2） |
| OQ-13 | 可覆寫 page id 的收集方式 | **已裁**：直接用 route id 當 page id，不新增 module `pages` 欄位；route id 在 `build()` 建 route 時收集（§4.1、§4.3、§4.4）。**命名格式不在本裁決範圍**，另列 OQ-16 |
| OQ-14 | 未宣告 permission 的 operation | **已裁**：fail-closed + 明確 `"public"`；`build()` 檢出未宣告者（§4.3 1.5、§6.5） |
| — | operation → permission 的來源（module 宣告 vs YAML） | **已裁（裁決 6，R21）**：只來自 YAML `x-permission`（public = `x-permission: public` + `security: []`）；module `permissions` 宣告權限目錄、角色預設 grant、ABAC 條件；gen / build 期以完整 `resource:action` 比對權限目錄（§4.3 1.5.3、§4.5、§6.5） |
| — | MSW guard 判定規則 | **已裁（裁決 6，R22）**：照 a3——必填 `apiBaseUrl`、範圍外放行、無 route 404、未宣告 403、public 放行、無權限 403（§6.5） |
| OQ-15 | kernel 自有 operation（通用圖片上傳 `/admin/images`）在單一 YAML 中如何標記？ | **已裁（裁決 7，R29）**：保留 tag `core`（列入 `tags` 清單）；extract 照常寫入 `operations.gen.ts`（guard fail-closed 一樣適用），`orval.config.ts` 跳過 `core`；client 手寫 `shared/api/upload.ts`、mock 手寫 `app/mock/core-handlers.ts`（§4.5） |
| OQ-16 | route id 命名格式（OQ-13 只裁「用 route id、不加 pages 欄位」） | **已裁（裁決 7，R23）**：A `${moduleId}.${name}`（`orders.list`），typed key（`TRouteIdRegistry` augment）；`build()` 驗證 1.7 檢查前綴 = 所屬 module id（§4.1、§4.3、§4.4、M1 AC-3）。未採 B（TanStack 路徑型 `route.id`）：覆寫 key 綁 URL 結構、洩漏 kernel layout id、R4 寬化後 key 退化為 `string` |
| — | mock 模式 `apiBaseUrl` 與既有 API 路徑 | **已裁（裁決 7，R24）**：專用絕對 origin（與 app 不同 origin）；未設定 / 非絕對 URL / 任何同源（含同源非根路徑）→ 啟動報錯；不動既有路徑，維持 `/api`、`/user`、`/users`、`/admin` 前綴（§6.5、M3 AC-7） |
| — | 未帶 token 打非 public API | **已裁（裁決 7，R25）**：403（照 a3）（§6.5、M4 AC-2） |
| — | guard 的授權介面 | **已裁（裁決 7，R26）**：`getGrants` + `can()`，支援 D5 wildcard（§6.5） |
| — | R21 檢查分期與反向檢查 | **已裁（裁決 7，R27）**：gen 期查格式與 `security: []`（含擋非 public 寫 `security: []`）；目錄比對在 build / vitest（§4.5、M7 AC-2 / AC-3） |
| — | M3 過渡期 operation 權限 | **已裁（裁決 7，R28）**：M3 全 `"public"`，M4 起 fail-closed（§9 M3 註） |

### 10.2 未決項

無。OQ-1–OQ-16 與裁決 6 / 7 涵蓋的問題皆已有 owner 裁決（§10.1）。仍延後、非本 spec 範圍的事項：ABAC 實作（R16，另開一棒）、`slots` 擴充點與頁面覆寫的優先序（§11.2，待 slot 加入時定）。

---

## 11. 風險、張力與矛盾（surface，未自行擇一）

### 11.1 已知風險（api chain PoC a1/a2 結論）

| # | 風險 / 限制 | 來源 | 對策與落點 |
|---|------------|------|-----------|
| K1 | **orval MSW handler 的 status 寫死 200**：`overrideResponse` 只決定 body，無法回 404 / 422 | PoC a1 坑 2 | 需要非 200 的情境由 module 手寫 `http.*` handler，排在該 orval handler 前（§4.5 mock 列）；M7 AC-6 驗證 |
| K2 | **msw 3 把 `onUnhandledRequest` 改名為 `onUnhandledFrame`**（tsc TS2353） | PoC a1 坑 1 | 只影響我們自寫的 `setupServer` / `setupWorker` 選項，不影響 orval 產物；M2 AC-3 |
| K3 | **`httpClient: "fetch"` 回傳 `{ data, status, headers }` 的 status union**，不是 body | PoC a1 §2 坑 1 | `shared/api/fetcher.ts` mutator 統一 unwrap 成 body、非 2xx throw，hook 形狀維持接近現況（§4.5 fetcher 列）；**mutator 本身 PoC 未驗**（a1 用 `output.baseUrl` 繞過），M7 AC-4 首次驗證 queryKey 為相對 path 與 unwrap 形狀 |
| K4 | `clean: true` 只清 `api/` 與 schemas 目錄，不清 `mocks/` | PoC a2 坑 1 | 手寫 domain model 放 `model/`、手寫 mock 檔禁 `*.msw.ts`（R15）；tag 改名時手動刪舊 `<old>.msw.ts`；M7 AC-5 檔名檢查 |
| K5 | 一個 operation 掛多個 tag 時可能在多個 module 重複產出；YAML 內 operationId 重複時 orval 是否報錯未測 | PoC a2 未驗證 1、2 | extract 斷言恰好一個 tag、operationId 唯一（§4.5）；M7 AC-2 |
| K6 | browser `setupWorker` + vite dev、react hook 在元件中實際執行、path 參數 `{id}` → `:id` 比對，PoC 皆未驗 | PoC a1 未驗證 2、4、6 | M2 AC-5（browser worker）、M4 AC-2（path 參數）、M7 AC-7（hooks 實跑） |
| K7 | orval config 用 jiti 載入，從 config 所在目錄解析依賴 | PoC a2 坑 6 | `orval.config.ts` 放 repo 根（有 `node_modules`） |
| K8 | guard 只在 node `getResponse` 驗過「非 API 放行」；browser `setupWorker` 下 vite 資源 / HMR 是否真的不受影響未驗；`apiBaseUrl` 為相對路徑 / 同源時未驗 | a3 未驗證 1、2 | mock 模式強制專用絕對 origin（R24，§6.5；M3 AC-7 驗未設定 / 同源根目錄 / 同源非根路徑報錯）；M2 AC-5 / M3 AC-5 手動驗 dev server 正常 |
| K9 | 同 path 只有部分 method 存在（例 `PUT /users` 不在契約）時 guard 回 404，語意上應為 405 | a3 未驗證 4（刻意簡化） | 照 a3 回 404，不實作 405 |

### 11.2 張力與矛盾

- **R11「權限表由 module 宣告」× R15 / R21（已裁，無殘留衝突）**：裁決 6（R21）明定 operation → permission 只來自 YAML `x-permission`，module `permissions` 只宣告權限目錄、角色預設 grant、ABAC 條件；R11 的「權限表由 module 宣告」在 R21 後解讀為「權限**目錄**由 module 宣告」。`build()` 1.5.3 以完整 `resource:action` 比對目錄（§4.3、§6.5）。
- **R21「gen / build 期檢查」的分工（R27 已裁）**：extract（gen 期）只讀 YAML，看不到 module 宣告，因此 gen 期負責格式與 `security: []`（public ⇒ 必有 `security: []`；非 public ⇒ 不得有 `security: []`）；「`resource:action` 在某 module 權限目錄內」由 kernel `build()`（dev 啟動即 throw）與 M7 AC-3 的 vitest（每棒 done 基線）負責。gen 期不做目錄比對（extract 不 import module 程式碼）。
- **R22 guard × 現況 401（R25 已裁）**：現行 mock 對未帶 token 不做任何檢查（`handlers.ts:127` 的 401 只用於登入帳密錯誤）；r3 spec 曾規劃「未帶 token 回 401」。依 R22（a3）與 R25 改為「無權限 → 403」，未帶 token 打非 public operation 一律 403。fetcher 的「401 清 session」仍保留給真後端與登入失敗。
- **R22 `apiBaseUrl` × 現況同源 baseUrl（R24 已裁）**：`api-client.ts:44` 預設 `window.location.origin`，且 mock 路徑分屬 `/api`、`/user`、`/users`、`/admin` 四個頂層前綴（`handlers.ts:124,142-144,148-198`）；照 a3 規則同源時所有 vite 資源都會被回 404。R24：mock 模式改用專用絕對 origin（未設定 / 任何同源含非根路徑 → 啟動報錯，§6.5、M3 AC-7），不改 mock 路徑（M2 / M3 / M7 紅線）；「把 mock 路徑統一收到單一前綴」的替代方案不採。
- **M3 legacy operation 表全 `"public"`（R28 已裁）**：M3 為維持「行為不變」用 legacy 表 + 全 public 掛 guard（§9 M3 註），屬過渡；M4 起 fail-closed，實質權限在 M4 生效。
- **R3 / D4「刪 `.use()` 一行 + 刪 `modules/<id>/`」× R14「刪 yaml 對應 tag paths」**：裁決 5 已明定刪 module 需多刪 YAML 段落並重新 gen；D4 驗收形狀依 R14 擴為 §8.2 的 5 步，漏做由 `build()` 驗證 1.5.3 fail fast。
- **D2 欄位清單 × R2 override / R8 requires / R19 route id**：D2 列的欄位是 `{ id, routes, nav, i18n, mockHandlers, permissions }`。`requires` 由 R8 明確加入；override 落在 `createApp().override()` 與 `TShell.pages`（shell 欄位，不是 module 欄位）；route id 是 `ctx.page` 的必填選項（`routes` / `publicRoutes` 欄位內），依 R19 不新增 module `pages` 欄位，因此不擴 D2。
- **D2「本 spec 不設計 slot」× R2 頁面覆寫**：頁面覆寫是**頁級**替換，不是 slot（頁內插槽）；二者不衝突，但未來 `slots` 加入時 shell 會有兩種擴充點（`pages` 與 slot 實作），需要那時再定優先序。
- **D3「依賴方向以 lint 強制」× R1 去 FSD**：D3 原文出自 FSD 語境；本版保留「lint 強制依賴方向」的意旨，方向改為 §3.1（kernel / shared / shells / modules + module 內單向）。
- **R10 × 現況行為**：現行缺 `app:access` 時以 `UnauthorizedPage` 取代整個 layout（`ProtectedAppLayout.tsx:11-13`，無 sidebar）；R10 後改為保留 shell、內容區 403。屬裁決允許的行為變更，M4 AC-1 明確驗證。
- **R11 guard × api chain PoC**：a1 guard 對「未宣告 permission」fall through；本 spec 依 R13 / R22 改採 a3 fail-closed 規則（含 `apiBaseUrl` 劃界與 unknown route 404）；PoC 權限字串用點號，依 R17 改冒號；a3 的 `getGranted: Set` 改為 `getGrants: TGrant[]` + `can()` 以支援 wildcard（§6.5）。三項皆已由 owner 裁決（最後一項 = R26，為相容 D5 wildcard 的介面調整，判定結果不變）。
- **R10 × TanStack Router 錯誤邊界**：「內容區 403」依賴子 route 的 `errorComponent`（由 app 注入的 `ForbiddenBoundary`）在父 layout `<Outlet />` 內渲染；未實測，M4 AC-1 驗證，不成立時改用 §6.2 退路（仍在 app 層，shared 不變）。
- **D2 × D5**：role→grant 預設矩陣放在 `permissions.mockGrants`（仍在 D2 的 `permissions` 欄位內）；operation 表依 R15 住 kernel 的 `app/operations.gen.ts`，不是 module 欄位，未新增頂層欄位。
