# Admin Dashboard Template

React 19 + TypeScript 的後台管理範本，**純 UI showcase、沒有真後端**：所有 API 由瀏覽器內的 MSW service worker 依 `openapi.yaml` 契約回應。架構採 **Microkernel + Modular Monolith**——功能以 module 掛上 kernel，可整個拔掉而不影響其餘部分。

## 技術棧

| 類別 | 使用 |
|---|---|
| 框架 | React 19、TypeScript 6、Vite 6 |
| 路由 | TanStack Router（code-based，由 module 宣告） |
| Server state / 表單 | TanStack Query、React Hook Form + Zod 4 |
| API 契約 / mock | `openapi.yaml` → orval 產生 client、hooks、MSW handlers；MSW 3 |
| UI | Tailwind CSS 3、Radix UI、shadcn/ui |
| i18n | react-i18next（繁體中文、英文） |
| 測試 / 品質 | Vitest 5 + Testing Library、ESLint 9（含 eslint-plugin-boundaries）、Prettier 3 |

## 快速開始

需求：Node.js 22+、pnpm。

```bash
pnpm install
cp .env.example .env   # 必要：mock 模式需要 VITE_API_BASE_URL
pnpm dev
```

展示帳號：`admin@example.com` / `admin123`（superadmin）

### 環境變數

| 變數 | 預設 | 說明 |
|---|---|---|
| `VITE_API_MOCK` | `true` | 只有設成 `false` 才關掉 mock，改打真後端 |
| `VITE_API_BASE_URL` | `http://mock-api.local` | mock 模式下必須是**與 app 不同源的絕對 origin**（網域不需真的存在），未設定或同源會在啟動時報錯；接真後端時改成後端位址 |

### Mock 怎麼運作

- 沒有獨立的 mock server。頁面載入時在瀏覽器註冊 MSW service worker（`public/mockServiceWorker.js`），攔截打到 `VITE_API_BASE_URL` 的 request；DevTools Network 面板會顯示由 ServiceWorker 回應。
- 資料存在記憶體（`src/shared/api/mock-db.ts`），**重新整理就回到 seed**。
- 已簽發的 session 存 localStorage（`mock-sessions`），重新整理後仍維持登入；要完全重置就清 localStorage。

## 指令

| 指令 | 說明 |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm preview` | 開發 / 建置（`tsc -b` + `vite build`）/ 預覽建置結果 |
| `pnpm test` | Vitest **watch 模式**；一次性執行用 `pnpm exec vitest run` |
| `pnpm test:coverage` | 覆蓋率報告 |
| `pnpm lint` | ESLint **帶 `--fix`，會改檔**；只檢查用 `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` |
| `pnpm prettier` | Prettier `--write src/**` |
| `pnpm gen:api` | 依 `openapi.yaml` 重新產生 API client、hooks、MSW handlers 與 operation 表 |
| `pnpm verify:core-only` | 在暫存副本刪掉所有 domain module 後 build + 測試，驗證 kernel 不依賴 domain |

pre-commit 由 husky + lint-staged 跑 `eslint --fix` 與 `prettier --write`。

## 專案結構

```
src/
├── app/               # kernel：module 組裝（kernel/）、router、mock guard、modules.ts、operations.gen.ts
├── shared/            # domain-free：ui/（shadcn + DataTable 等）、api/（fetcher、session、mock-db）、
│                      #   i18n/、module/（defineModule）、permission/、lib/
├── shells/default/    # 可替換的版面（sidebar、navbar、403 頁）
├── modules/<id>/      # 功能 module
│   ├── index.ts       #   defineModule：routes / nav / permissions / i18n / mockHandlers
│   ├── api/           #   orval 產物（不手改）
│   ├── model/         #   hooks、Zod schema、routes
│   ├── ui/            #   頁面與元件
│   ├── mocks/         #   seed、handlers.ts（手寫）、<id>.msw.ts（orval 產物）
│   └── locales/       #   module 自帶字典（掛載時自動 scope 成 <id>.*）
└── test/              # 測試 setup 與 helper
```

依賴方向由 ESLint 強制：`shared` 不 import `app` / `shells` / `modules`；跨 module 只能 import 對方的 `index.ts`；module 內 `ui → model → api`。

### Module

安裝清單在 `src/app/modules.ts`，共 10 個：

| 類型 | Module |
|---|---|
| generic | `auth`、`users`、`team-members` |
| domain | `orders`、`product`、`suppliers`、`consumers`、`banners`、`articles`、`tags` |

拿掉一個 domain module = 刪掉 `modules.ts` 的那一行 `.use()` 和該目錄（`pnpm verify:core-only` 驗證全部拿掉後仍可 build）。

## 開發指南

### 新增 API

1. 在根目錄 `openapi.yaml` 寫 operation，`x-permission` 填某個 module 宣告過的 `resource:action`（否則 `build()` 會 throw）。
2. `pnpm gen:api`，產物進 git，**不要手改**。
3. 在 module 的 `model/use-*.ts` 呼叫產生的 client 函式；`ui` 不直接 import `api/`。
4. 需要非 200 回應（404、401…）時，在 `mocks/handlers.ts` 用手寫 `http.*` 排在 orval handler 前面。

### 權限

登入回傳 `session.grants`（例如 `tags:read`、`tags:*`、`*`），前端只認 grants、不讀 role。權限一律宣告式，**不要在元件裡寫 `canX && <Button/>`**：

```ts
// route：無權限時內容區顯示 403，URL 不變
ctx.page({ path: "tags", routeId: "tags.list", permission: "tags:read", component: pages.list })

// 表格操作：無權限的項目預設不渲染
const rowActions: TRowAction<TUser>[] = [
  { id: "edit", label: t("common.edit"), icon: Pencil, permission: "users:update", onSelect: ... },
]
```

nav 項目以 `permission` 過濾、表單送出用 `FormSubmit`、編輯頁按鈕用 `EditActions`；mock API 端另有 guard 依 operation 表檢查。各角色的預設 grants 在 `src/app/mock/permission-matrix.ts` 與各 module 的 `permissions.mockGrants`。

### 新增 module

參考任一 module 的 `index.ts`（例如 `src/modules/tags/index.ts`），以 `defineModule` 宣告 `routes`、`nav`、`permissions`，再到 `src/app/modules.ts` 加一行 `.use()`。完整步驟見 `.claude/skills/add-module`。

> 目前架構驗收（M8）尚未全部完成，**暫停新增第 11 個 module**。

### i18n

全域字典在 `src/shared/i18n/locales/{en,zh}.json`；module 可在 `modules/<id>/locales/*.json` 放自己的字典，掛載時 key 自動加上 `<id>.` 前綴。

### 測試

測試放在同層 `__tests__/`。打 API 的測試用 `src/test/api-fetch.ts`；需要 module 的 mock API 時以 `server.resetHandlers(...registry.mockHandlers)` 掛上。

## 慣例

- 元件 PascalCase（`BannerForm.tsx`），hooks / utils / 測試 kebab-case（`use-banner.ts`）
- Commit 用 Conventional Commits：`type(scope): description`
- 主幹 `master`，工作走 feature branch → PR

## 文件

- `docs/specs/fsd-module-architecture.spec.md`：架構規格（契約、權限、milestones）
- `docs/specs/refactor/README.md`：重構各階段的證據與已知問題
- `docs/TRAPS.md`：已知陷阱
- `CLAUDE.md`：給 AI 協作用的專案事實摘要
