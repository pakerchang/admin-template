# CLAUDE.md

React admin dashboard（純 UI showcase，無真後端）。回覆一律繁體中文；流程規範沿用使用者全域設定，本檔只記專案事實。

## 指令

- `pnpm dev` / `pnpm build`（`tsc -b tsconfig.app.json tsconfig.node.json && vite build`）
- `pnpm lint` —— **帶 `--fix`，會改檔**；只檢查用 `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`
- `pnpm test` —— **watch 模式**，非互動環境會掛住；一次性執行用 `pnpm exec vitest run`
- `pnpm test:coverage`、`pnpm prettier`（`--write src/**`）
- pre-commit：husky → lint-staged（`eslint --fix` + `prettier --write`）
- 環境變數：`.env.example` → `.env`

## 架構

- React 19 + TypeScript + Vite，path alias `@` → `src/`
- 路由：TanStack Router **code-based**（非檔案式路由）；M3 起各 module 在 `src/modules/<id>/model/routes.ts` 以 `ctx.page` / `ctx.layout` 定義，`src/app/kernel/build.ts` 組裝，`.use()` 清單在 `src/app/modules.ts`
- Server state：TanStack Query；表單：React Hook Form + Zod
- API：原生 fetch 包裝 `apiFetch`（`src/services/api-client.ts`）→ 交給 `mockFetch`（`src/services/mock/handlers.ts`，以 `METHOD path` 查 handler），資料在 `src/services/mock/data.ts`，寫入只改記憶體、重新整理即重置；接真後端時把 `mockFetch` 換回 `fetch`
- Domain 型別：Zod schema 在 `src/services/schemas/`，共用 primitive 在 `src/services/types/schema.ts`
- 認證：`/login`（`AuthLayout`）打 mock `POST /api/auth/login`，session 存 localStorage（`getAuth` / `setAuth` / `clearAuth` 在 `api-client.ts`）；路由以 `beforeLoad` 守衛。Demo 帳號 `admin@example.com / admin123`（superadmin）
- 權限（M4 起）：登入回傳 `session.grants`（mock 由 `app/mock/permission-matrix.ts` + module `permissions.mockGrants` 展開），前端只認 grants、不讀 role。四強制點：route `staticData.permission`（無權限 → 內容區 `shell.Forbidden`，URL 不變）、nav `useVisibleNav()`、操作 `DataTable rowActions` / `EditActions {handler, permission}` / `FormSubmit`、mock API guard（`src/shared/api/mock/permission-guard.ts`，依 `src/app/operations.gen.ts`，M7 前手寫）。新增 API 必須同步在 `operations.gen.ts` 宣告 operationId + permission，否則 `build()` throw
- UI：Tailwind + Radix，shadcn 元件在 `src/components/ui/`
- i18n：react-i18next，`src/locales/` 的語系字典為 `en.json`、`zh.json`，另有 `i18n.ts`（i18next 初始化）、`types.ts`
- 測試：Vitest + Testing Library，jsdom，setup 在 `src/test/setup.ts`

```
src/
├── components/{layouts,shared,ui}/
├── pages/<feature>/{components,hooks}/   # 部分 feature 另有 utils/ docs/ 等；測試在各層的 __tests__/
│   # articles banners consumers orders product suppliers tags team-members users
├── services/{api-client.ts,mock/,schemas/,types/}
├── router/  hooks/  utils/  lib/  constants/  types/  locales/
└── plugins/image-validation/  test/  styles/
```

> 上面描述的是 **現況**（master `1614c24`）。目標架構見下一段，尚未落地。

## 架構遷移（進行中）

目標：**Microkernel + Modular Monolith**——kernel `src/app/` + domain-free `src/shared/` + 可替換 `src/shells/default/`，功能以 `src/modules/<id>/{api,model,ui,mocks,index.ts}` 經 `createApp().use()` 掛上。唯一依據：`docs/specs/fsd-module-architecture.spec.md`（§0 鎖定決策、§3 目錄與依賴方向、§4 契約、§6 權限、§9 milestones）。陷阱見 `docs/TRAPS.md`；新增 module / 宣告權限走 `.claude/skills/{add-module,declare-permission}`。

| Milestone | 內容 | 狀態 |
|---|---|---|
| M0 | deps 前置：Node 22 + ESLint 9 flat config（deps chain 負責，§9） | 完成（#4 `engines.node >=22`、#5 `eslint.config.js`） |
| M1 | kernel 契約 + 權限引擎（純新增、未接線） | 完成（#8） |
| M2 | MSW 取代 `mockFetch`（行為不變） | 完成（本 PR） |
| M3 | module 接線 + default shell（行為不變） | 完成（待 PR） |
| M4 | 權限四強制點 + 內容區 403 | 完成（待併入） |
| M5 | kernel / shared 搬遷 + boundaries lint | 未開始 |
| M6 | module 內嵌搬遷（pages / schemas / seed / i18n） | 未開始 |
| M7 | orval 契約層（單一 `openapi.yaml`） | 未開始 |
| M8 | D1 / D4 驗收自動化與收尾 | 未開始 |

過渡期規則：

- 某 milestone 落地前，新程式碼**照上面的現況結構寫**；落地後，該 milestone 涵蓋的部分依 spec 放置（各 milestone 範圍見 §9）。milestone 完成時更新上表狀態。
- 依賴方向（§3.1，M5 起 lint 強制）：`shared` 不 import `app` / `shells` / `modules`；跨 module 只 import `@/modules/<id>`（`index.ts`），且對方須列在 `requires`（§5.3）；module 內 `ui → model → api`，`ui` 不直接 import `api`。lint 設定以 §7.2 草案為起點，但設定 key 用 `rules` 還是 `policies`、element 比對順序，待 M5 AC-1 實測（spec L811），不要照草案定案。
- 權限：禁止在元件內散寫權限條件渲染（`canX && <Button/>`、比對 role）。M4 起統一用宣告式 `rowActions` / `EditActions` / `FormSubmit`（§6.4）；`useUserPermissions()` 已刪除。
- M8 驗收完成前凍結新增 module：不新增第 11 個 module（owner 2026-11-09 裁決；M3 AC-1、M6 AC-3、M7 AC-3 的「恰好 10 個」不改，見 `docs/TRAPS.md`）。
- 每棒 done 基線：`pnpm build && pnpm exec vitest run` exit 0（§9）。

## 慣例

- 元件 PascalCase（`BannerForm.tsx`）；hooks / utils / constants / 測試 kebab-case（`use-banner.ts`、`banner-form.test.tsx`）
- 已知例外（不改名）：`src/components/shared/table/hooks/useApiSorting.ts`、`useColumnVisibility.ts`
- 測試放同層 `__tests__/`
- 頁面專屬元件 / hooks 放 `src/pages/<feature>/`，跨頁共用放 `src/components/shared/`
- Commit：Conventional Commits `type(scope): description`（feat / fix / refactor / docs / test / chore），不帶 issue 號或 Phase

## Git

- 主幹 `master`；工作走 feature branch → PR 到 master
- `docs/task/` 為歷史任務文件，新任務走全域 task-format
