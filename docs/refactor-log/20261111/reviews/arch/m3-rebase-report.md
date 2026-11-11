# M3 rebase 到 refactor/integration 報告

- spec：`/Users/pakerchang/.claude/docs/specs/m3-rebase.spec.md`（保留，未進 admin-template commit）
- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3`，branch `feat/m3-module-wiring`
- **新 head**：`edfd74d2c423e438416383741fdbb273cc0f6ff5`
- **新 base**：`refactor/integration` = `f864fc608dd98a422f88ad15ff8d9b004531731d`（fetch 後確認未前進；refactor/integration 只是本地 branch，origin 沒有同名 ref）
- 舊 head `03acca9`，舊 base `9597b18`；rebase 前的 tree `03acca9^{tree}` = `edc6b39a41e013b153feefdfcdf0d0a74bb07ce1`

## Commit 對照（`refactor/integration..HEAD`）

| 舊 sha | 新 sha | 作者（新） | subject |
|---|---|---|---|
| 0e61705 | 915325638c58af9d4cd38de1d09873ea60311454 | pakerchang <pakerchang@gmail.com> | feat(mock): mount fail-closed guard over legacy all-public operations with dedicated mock origin |
| 259e4c3 | 509dc96249d6638d3b747bc87d79bc9ba7342cc1 | pakerchang <pakerchang@gmail.com> | feat(app): wire ten modules through createApp and move layouts into default shell |
| 08f3a53 | 5c1bf1e5ccdbb418cc8294f3da85a0d9a3d456e2 | pakerchang <pakerchang@gmail.com> | fix(mock): normalize mock origin across start-up check and guard |
| d685823 | 2b5b85d5a1654dd8c7fb417f346bc5615f348904 | pakerchang <pakerchang@gmail.com> | docs(spec): sync M3 route ids, AC-4 path and touches exceptions |
| 03acca9 | 2aae3e6694b7e5b753d4332dfad361b84d158bf9 | pakerchang <pakerchang@gmail.com> | fix(mock): accept only http(s) mock origins |
| （新增） | edfd74d2c423e438416383741fdbb273cc0f6ff5 | pakerchang <pakerchang@gmail.com> | test(app): port router pathless regression to module router |

舊作者全部是 `pzdesu <paker.dev@pgpg.la>`，用 `--exec 'git commit --amend --no-edit --reset-author'` 改成 repo-local 的 pakerchang。只重放了 5 個 M3 commit；M2 的 commit 已經在上游。commit 都沒有 AI 署名。

## 衝突與處理

- `src/router/routes.tsx` 是 modify/delete 衝突（發生在 259e4c3）。依 main 的裁決保留刪除（`git rm`）。
- `vite.config.ts` 自動合併，沒有衝突。結果第 1 行是 P3 的 `/// <reference types="vitest/config" />`，第 19 行是 M3 的 `env: { VITE_API_BASE_URL: "http://mock-api.test" }`，兩邊都在。
- 沒有其他衝突。
- 補充：hotfix 在舊 routes.tsx 用的 pathless 做法（`id: "/"` 加 `_index` 包裝），M3 在 `src/app/kernel/build.ts:285-288` 與 `src/app/router/index-redirect.ts` 已經有等價實作，所以刪掉 routes.tsx 不會讓 hotfix 失效。

## Hotfix 回歸測試的斷言對照

舊檔 `src/router/__tests__/routes.test.ts` 已刪。新檔是 `src/app/__tests__/router-matching.test.ts`，透過 `makeApp()`/`routerAt()` 用 createApp 建出的 router 跑 `matchRoutes`。

| 舊斷言 | 新位置 | 方式 |
|---|---|---|
| `/` 的 leaf 是 `/_index/`，ids[0] 是 `__root__`、ids[1] 是 `/` | router-matching.test.ts `it.each` | 移植 |
| `/users` 的 leaf 是 `/users/` | 同上 | 移植 |
| `/orders/9` 的 leaf 是 `/orders/$id` | 同上 | 移植 |
| `/tags` 的 leaf 是 `/tags` | 同上 | 移植 |
| `/products` 的 leaf 是 `/products/` | 同上 | 移植 |
| `/orders/9` 的 `params` 是 `{ id: "9" }` | router-matching.test.ts「/orders/9 resolves params.id」 | 移植 |
| 未登入開 `/users` 會導回 `/login` | app-wiring.test.tsx「redirects to /login when not authenticated」 | 既有測試已涵蓋（路徑用 `/tags`，同一個 protected beforeLoad）；破壞性驗證下這條會失敗 |
| 已登入開 `/users` 會留在 `/users` | app-wiring.test.tsx「AC-4: .override('users.list', Stub) renders Stub at the users list URL」 | 既有測試已涵蓋（已登入時在 `/users` 實際 render 出頁面）；破壞性驗證下這條會失敗 |

差異：舊測試透過真的 `setAuth`/`clearAuth` 驅動 `getAuth`；M3 的測試改用注入的 `isAuthenticated`，`createCore` 的預設值是 `() => !!getAuth()`。原因是 M3 已把守衛的判斷抽成 core 的依賴。

## 破壞性驗證

把 `src/app/kernel/build.ts:288` 的 `id: "/"` 改成 `path: "/"`，跑 router-matching.test.ts 與 app-wiring.test.tsx：

- router-matching.test.ts 6 條全部失敗
- app-wiring.test.tsx 的 AC-4 override 與 redirects to /login 兩條失敗
- 合計 `Tests 8 failed | 6 passed (14)`

還原後執行 `git show HEAD:src/app/kernel/build.ts | cmp - src/app/kernel/build.ts`，輸出 `RESTORED_CMP_OK`。

## range-diff 摘要

`git range-diff 9597b18..03acca9 refactor/integration..HEAD`：

- 5 個 commit 都標 `!`，但除了 259e4c3 以外只有 Metadata Author 一行不同。
- 259e4c3 → 509dc96 另外只有一處差異：被刪掉的 `src/router/routes.tsx` 內容改成上游的 hotfix 版本（`id: "/"`、`protectedIndexWrapper`），也就是 modify/delete 取刪除的結果。

其他佐證：

- `git diff 03acca9 HEAD` 排除新測試檔後，和 `git diff 9597b18 f864fc6 -- . ':!src/router'` 逐行相同（忽略 `index` 行），輸出 `UPSTREAM_DELTA_IDENTICAL`。換句話說，rebase 前後的差異只有：上游新增的內容（hotfix spec + P3 deps）、routes.tsx 與舊測試檔仍為刪除狀態、新增的移植測試。

`git diff 03acca9 HEAD --stat`：

```
 docs/specs/router-pathless-hotfix.spec.md |   33 +
 package.json                              |   10 +-
 pnpm-lock.yaml                            | 1165 +++++++----------------------
 src/app/__tests__/router-matching.test.ts |   27 +
 src/test/jsdom-node-abort.env.ts          |    4 +-
 src/test/setup-test-env.d.ts              |    5 -
 src/test/setup.ts                         |   16 +-
 tsconfig.test.json                        |    1 -
 vite.config.ts                            |    2 +-
 9 files changed, 357 insertions(+), 906 deletions(-)
```

`git diff f864fc6 HEAD --stat`：`66 files changed, 1516 insertions(+), 652 deletions(-)`。這就是 M3 全部內容加上移植測試；其中 `vite.config.ts | 2 +` 是 M3 的 `test.env`。

## Done Command（在最終 HEAD edfd74d 跑）

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3 && pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && test ! -e src/router/routes.tsx && test ! -e src/constants/sidebar.tsx && test "$(grep -o '\.use(' src/app/modules.ts | wc -l | tr -d ' ')" -eq 10 && echo DONE_COMMAND_OK
```

- exit 0，輸出含 `DONE_COMMAND_OK`
- vitest：`Test Files 23 passed (23)`、`Tests 225 passed (225)`
- 驗證層級：行為驗證（build + 測試實際執行 exit 0）。瀏覽器實機沒有跑。

## Lint / Prettier

- `pnpm exec eslint "src/**/*.{ts,tsx}" && echo LINT_OK`：輸出 `LINT_OK`，rc 0
- `pnpm exec prettier --check src/app/__tests__/router-matching.test.ts`：All matched files use Prettier code style。這次唯一新增的檔案就是它，刪除的檔案不需檢查。

## Push

- 推之前 `ls-remote origin feat/m3-module-wiring` 是空的，遠端沒有同名 branch
- `cc-git-write.sh push -u origin feat/m3-module-wiring` → `* [new branch]`，沒有 force
- `origin/feat/m3-module-wiring` = `edfd74d2c423e438416383741fdbb273cc0f6ff5`，與 HEAD 一致
- 沒有 merge 進 refactor/integration、沒有開 PR、沒有動整合 worktree

## 備註

- rebase 中間的 commit（509dc96 到 2aae3e6）還保留著舊的 `src/router/__tests__/routes.test.ts`，它 import 的 routes.tsx 已經被刪，所以這幾個中間 commit 單獨跑測試會失敗。最後一個 commit edfd74d 會修正這點。這是 prompt 要求「移植測試做成獨立 commit、不 squash 進舊 commit」的必然結果。如果下游要求每個 commit 都能 bisect，需要另外決定。
- 沒有 DECISION 項目。

LIFECYCLE_PAUSE: true
