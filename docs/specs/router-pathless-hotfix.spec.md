# Router pathless hotfix Spec

master `0efda06` 把 `@tanstack/react-router` 升到 1.170.46 後，`protectedRoute`（`path: "/"`）不再比對子路徑，登入後 protected 頁全部渲染 `Not Found`。本 hotfix 以最小修法恢復。

### User Story

身為已登入的管理者，我在 master 上開 `/users`、`/orders/9`、`/tags`、`/products` 等頁面時，要看到對應頁面而不是 `Not Found`；未登入時開這些頁面仍要被導回 `/login`。

### Acceptance Criteria

- [ ] AC-1：`protectedRoute` 改為 pathless（`id: "/"`），子 route id 維持 `/orders/$id` 形狀，`useParams({ from: "/orders/$id" })` 不受影響。
- [ ] AC-2：`/` 仍比對到空 main 的 index（以 pathless `id: "_index"` 包一層，避免 Duplicate id）。
- [ ] AC-3：回歸測試 `src/router/__tests__/routes.test.ts` 以 `createRouter` + `createMemoryHistory` + `router.matchRoutes()` 斷言 `/users`、`/orders/9`、`/tags`、`/products` 比對到 leaf route（非只有 `__root__`）、`/orders/9` 的 `params.id === "9"`、`/` 比對到 index。
- [ ] AC-4：破壞性驗證——把 `id: "/"` 改回 `path: "/"` 時 AC-3 測試失敗，還原後檔案與 commit 版本一致。
- [ ] AC-5：未登入開 `/users` 仍導回 `/login`（標驗證層級）。

### Touches

- `src/router/routes.tsx`
- `src/router/__tests__/routes.test.ts`（新增）
- `docs/specs/router-pathless-hotfix.spec.md`（本檔）

### Must-Not-Touch

- 其他 route 的 `path` / URL 形狀、頁面元件、`src/router/__root.tsx`、`src/router/index.ts`
- `package.json` / `pnpm-lock.yaml`（不降版）

### Done Command

```bash
pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && echo DONE_COMMAND_OK
```
expected: exit 0，輸出含 DONE_COMMAND_OK
