# Router pathless hotfix Spec

master `0efda06` 把 `@tanstack/react-router` 升到 1.170.46 後，`protectedRoute`（`path: "/"`）不再比對子路徑，登入後 protected 頁全部渲染 `Not Found`。本 hotfix 以最小修法恢復。

### User Story

身為已登入的管理者，我在 master 上開 `/users`、`/orders/9`、`/tags`、`/products` 等頁面時，要看到對應頁面而不是 `Not Found`；未登入時開這些頁面仍要被導回 `/login`。

### Acceptance Criteria

- [x] AC-1：`protectedRoute` 改為 pathless（`id: "/"`），子 route id 維持 `/orders/$id` 形狀，`useParams({ from: "/orders/$id" })` 不受影響。（證據：`src/app/__tests__/router-matching.test.ts`（`/` 為 pathless protected layout、`/orders/9` → `/orders/$id` 且 `params.id === "9"`；hotfix 原測試於 `edfd74d` 移植至此，router 現位於 `src/app/kernel/build.ts`），2026-11-10 exit 0）
- [x] AC-2：`/` 仍比對到空 main 的 index（以 pathless `id: "_index"` 包一層，避免 Duplicate id）。（證據：`src/app/__tests__/router-matching.test.ts`（`/` → `/_index/`），2026-11-10 exit 0）
- [ ] AC-3：回歸測試 `src/router/__tests__/routes.test.ts` 以 `createRouter` + `createMemoryHistory` + `router.matchRoutes()` 斷言 `/users`、`/orders/9`、`/tags`、`/products` 比對到 leaf route（非只有 `__root__`）、`/orders/9` 的 `params.id === "9"`、`/` 比對到 index。（未勾：AC 指名的 `src/router/__tests__/routes.test.ts` 已於 `edfd74d` 移植為 `src/app/__tests__/router-matching.test.ts`，斷言相同路徑集合，2026-11-10 exit 0；AC 指名檔不存在，是否視為等價待 owner 裁決。2026-11-11 於 master `67a8aee` 重跑 `pnpm exec vitest run src/app/__tests__/router-matching.test.ts`：1 file / 8 tests passed，exit 0；仍待 owner 裁決等價性）
- [ ] AC-4：破壞性驗證——把 `id: "/"` 改回 `path: "/"` 時 AC-3 測試失敗，還原後檔案與 commit 版本一致。（未勾：找不到破壞性驗證紀錄；2026-11-11 spec 打勾棒嘗試在 worktree 暫改 `src/app/kernel/build.ts` 的 `id: "/"` 重做，暫改指令被權限拒絕、未執行，故仍無紅燈證據；且依賴 AC-3 等價性裁決）
- [x] AC-5：未登入開 `/users` 仍導回 `/login`（標驗證層級）。（證據：`src/app/__tests__/router-matching.test.ts`「redirects unauthenticated /users to /login」；驗證層級：行為（單元，memory router），非瀏覽器，2026-11-10 exit 0）

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
