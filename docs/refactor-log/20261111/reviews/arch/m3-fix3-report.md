# m3-fix3 report：用真實 session 和預設 createCore 測 protected guard

- 對應：Codex verdict（PASS-with-fixes，edfd74d）的 warning；info（中間 commit 單獨 checkout 會壞）依指示不處理
- spec：`/Users/pakerchang/.claude/docs/specs/m3-fix3.spec.md`
- branch：`feat/m3-module-wiring`
- head：`8458b19f7dce8be49c92184596d94e5f6014b3cb`（parent edfd74d，作者 pakerchang，沒有 AI 署名）
- 改動：只改 `src/app/__tests__/router-matching.test.ts`（+41/−2）；`src/app/core.ts` 與 `fixture.tsx` 都沒改

## 新增的測試
新增 describe `protected guard with real session and default core`。`realSessionApp()` 直接用 `createApp({ shell: fixtureShell, operations, apiBaseUrl, core: createCore() })` 組 app，再 `installModules`。

它不用 `makeApp`，因為 `makeApp` 會覆寫 `isAuthenticated` 和 `getGrants`。測試前後都跑 `clearAuth()`（beforeEach 和 afterEach）。

1. `redirects unauthenticated /users to /login`：先 `clearAuth`，再用 `routerAt(app, "/users")` 開頁，`await router.load()` 之後 pathname 是 `/login`。
2. `keeps authenticated /users`：先 `setAuth(...)`，資料跟原 hotfix 測試一樣。`load()` 之後 pathname 是 `/users`，`router.state.matches.at(-1).routeId` 是 `/users/`。

## 破壞性驗證
| 對 `core.ts` 的暫時改動 | 結果 |
|---|---|
| `isAuthenticated: () => true` | 未登入案例 FAIL（1 failed / 7 passed） |
| `isAuthenticated: () => false` | 已登入案例 FAIL（1 failed / 7 passed） |

兩次改完都用備份還原，`cmp` 一致（RESTORED_true、RESTORED_false）。之後 `git status` 只剩測試檔有改動。

## Done Command（在 commit 之後的 HEAD 8458b19 跑）
```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3 && pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && test ! -e src/router/routes.tsx && test ! -e src/constants/sidebar.tsx && test "$(grep -o '\.use(' src/app/modules.ts | wc -l | tr -d ' ')" -eq 10 && echo DONE_COMMAND_OK
```
- exit code：0，有輸出 `DONE_COMMAND_OK`
- vitest：23 個檔案全部通過，227 條測試全部通過（edfd74d 是 225 條，這次多 2 條）
- 預設 reporter 只列出檔案，所以另外用 `vitest run src/app/__tests__/router-matching.test.ts --reporter=verbose` 確認兩條新測試都有出現且都 ✓（8 passed）

## Lint / Prettier
- `pnpm exec eslint "src/**/*.{ts,tsx}"`：輸出 LINT_OK
- `pnpm exec prettier --check src/app/__tests__/router-matching.test.ts`：All matched files use Prettier code style

## Push
- `cc-git-write.sh push origin feat/m3-module-wiring`：`edfd74d..8458b19`，是 fast-forward，沒有用 force
- `origin/feat/m3-module-wiring` 現在是 `8458b19f7dce8be49c92184596d94e5f6014b3cb`

## 驗證層級
- 有實際跑：vitest 真的執行過，破壞性驗證證明新測試抓得到 `core.ts` 錯接
- 沒做：瀏覽器實機驗證（這次範圍不需要）

DECISION：無
BLOCKED：無

LIFECYCLE_PAUSE: true
