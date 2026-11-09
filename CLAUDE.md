# CLAUDE.md

React admin dashboard。回覆一律繁體中文；流程規範沿用使用者全域設定，本檔只記專案事實。

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
- API：`@ts-rest/core` 契約在 `src/services/contracts/`，client 在 `src/services/client.ts`
- 認證：Clerk；權限用 `useUserPermissions()` 的語意方法（如 `canManageUsers`），不直接比 role
- UI：Tailwind + Radix，shadcn 元件在 `src/components/ui/`
- i18n：react-i18next，`src/locales/` 只有 `en.json`、`zh.json`
- 測試：Vitest + Testing Library，jsdom，setup 在 `src/test/setup.ts`

```
src/
├── components/{layouts,shared,ui}/
├── pages/<feature>/{components,hooks,__tests__}/
│   # articles banners consumers orders product suppliers tags team-members users
├── services/{client.ts,contracts/,types/}
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
