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
- 路由：TanStack Router **code-based**（`src/router/routes.tsx` 用 `createRoute`，非檔案式路由）
- Server state：TanStack Query；表單：React Hook Form + Zod
- API：原生 fetch 包裝 `apiFetch`（`src/services/api-client.ts`）→ 交給 `mockFetch`（`src/services/mock/handlers.ts`，以 `METHOD path` 查 handler），資料在 `src/services/mock/data.ts`，寫入只改記憶體、重新整理即重置；接真後端時把 `mockFetch` 換回 `fetch`
- Domain 型別：Zod schema 在 `src/services/schemas/`，共用 primitive 在 `src/services/types/schema.ts`
- 認證：`/login`（`AuthLayout`）打 mock `POST /api/auth/login`，session 存 localStorage（`getAuth` / `setAuth` / `clearAuth` 在 `api-client.ts`）；路由以 `beforeLoad` 守衛。Demo 帳號 `admin@example.com / admin123`（superadmin）
- 權限：`useUserPermissions()`（`src/pages/users/hooks/use-user.ts`，role 讀自 `getAuth()`）的語意方法（如 `canManageUsers`），不直接比 role
- UI：Tailwind + Radix，shadcn 元件在 `src/components/ui/`
- i18n：react-i18next，`src/locales/` 只有 `en.json`、`zh.json`
- 測試：Vitest + Testing Library，jsdom，setup 在 `src/test/setup.ts`

```
src/
├── components/{layouts,shared,ui}/
├── pages/<feature>/{components,hooks,__tests__}/
│   # articles banners consumers orders product suppliers tags team-members users
├── services/{api-client.ts,mock/,schemas/,types/}
├── router/  hooks/  utils/  lib/  constants/  types/  locales/
└── plugins/image-validation/  test/  styles/
```

## 慣例

- 元件 PascalCase（`BannerForm.tsx`）；hooks / utils / constants / 測試 kebab-case（`use-banner.ts`、`banner-form.test.tsx`）
- 已知例外（不改名）：`src/components/shared/table/hooks/useApiSorting.ts`、`useColumnVisibility.ts`
- 測試放同層 `__tests__/`
- 頁面專屬元件 / hooks 放 `src/pages/<feature>/`，跨頁共用放 `src/components/shared/`
- Commit：Conventional Commits `type(scope): description`（feat / fix / refactor / docs / test / chore），不帶 issue 號或 Phase

## Git

- 主幹 `master`；工作走 feature branch → PR 到 master
- `docs/task/` 為歷史任務文件，新任務走全域 task-format
