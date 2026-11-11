# M4 實作報告：權限四強制點 + 內容區 403

## 基本資訊

| 項目 | 值 |
|---|---|
| worktree | `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4` |
| branch | `feat/m4-permission-enforcement` |
| base | `refactor/integration` @ `8458b19f7dce8be49c92184596d94e5f6014b3cb`（開工時確認 tip 未前進） |
| head | `66e94c0109cba1dcf5bd6b33616597116472851f` |
| 小 spec | `/Users/pakerchang/.claude/docs/specs/m4-impl.spec.md`（保留，不進 admin-template commit） |
| push | `origin/feat/m4-permission-enforcement` 新建成功（無 force） |

### Commit 清單（舊 → 新）

1. `e84ac78` docs(spec): use current /users URL in M4 AC-1 —— 只改 spec L1141 一處（`/users/user-list` → `/users`）
2. `2ee5073` feat(permission): fail-closed mock API with session grants
3. `1205d63` feat(permission): content-area 403 and grant-filtered nav
4. `c7b43cb` feat(permission): declarative row actions and form submit
5. `66e94c0` docs: mark M4 permission enforcement done in CLAUDE.md

commit 2、3、4 在 commit 前各自跑過 `pnpm build` 和全量 `vitest run`，結果都是 exit 0（依序為 238／250／260 tests），lint 也都通過。commit 3 驗證時把 commit 4 的檔案暫時移出工作樹，確保驗的是乾淨狀態。commit 2 和 4 在驗證後各有一次純格式修正（prettier／`eslint --fix` 的 import 順序），沒有再對那兩個中間 commit 重跑 build；最終 HEAD 已完整驗證（見 Done Command）。

## AC 逐條證據

| AC | 證據 | 層級 |
|---|---|---|
| AC-1 | `src/app/router/__tests__/forbidden-boundary.test.tsx`。用真的 default shell 加預設 `createCore()`，session 為 support grants `["app:access","orders:*"]`，進 `/users`。驗證：pathname 仍是 `/users`；`[data-sidebar="sidebar"]` 存在；`shell.Forbidden` 的文字在 `<main>`（protected layout 的 Outlet）裡；sidebar 有 orders，沒有 products，也沒有任何含 users 的項目。另外兩案：巢狀 `/users/edit/1` 一樣保留 shell；session 沒有 `app:access` 時 layout 照常渲染、nav 為空、內容區顯示 403。`src/shared/module/__tests__/use-visible-nav.test.tsx` 驗 nav 過濾：子項依各自權限過濾、子項全被濾掉時父項也隱藏、沒有 provider 時回空（fail-closed） | 行為（vitest） |
| AC-2 | `src/shared/api/mock/__tests__/permission-guard.test.ts`：透過 `setupServer` 實際 `fetch`，逐條驗 spec 列的 7 種情況：(1) cdn 放行；(2) `api.testing` 不算 API，base 帶或不帶結尾 `/` 結果相同；(3) unknown route 回 404，同路徑的手寫 `http.get` spy 沒被呼叫；(4) 未宣告回 403，body 含 operationId 和 `has no permission declaration`；(5) public 的 login 不帶 token 回 200；(6) 缺 `users:update-role` 回 403，不帶 token 也是 403；(7) 有權限時 fall through 到 handler，`/admin/users/:id` 取到 `id=42`。M3 的 origin 正規化回歸測試（`MOCK-API.test:80`）保留。`src/app/mock/__tests__/mock-handlers.test.ts` 用真的 operation 表加 module 矩陣（`registry.mockHandlers`）：login 回傳展開後的 grants；不帶 token 回 403；support 可打 orders、打 users 回 403；superadmin 每個 GET operation 都是 200；偽造的 token 拿不到任何 grant | 行為 |
| AC-3 | `src/app/kernel/__tests__/operations-gen.test.ts`：手寫的 `src/app/operations.gen.ts`（檔頭註明 hand-maintained until M7）涵蓋 `handlers.ts` 的每一個 `METHOD path`，不多不少；用真的 10 個 module 跑 `build()` 不 throw；**逐一**刪掉每個 operationId 的 permission key，`build()` 都 throw 指名的錯誤；只有 `login` 是 public | 行為 |
| AC-4 | `src/components/shared/__tests__/data-table-row-actions.test.tsx`：rowActions 無權限的項目預設不渲染，`denied:"disable"` 的項目渲染為 disabled，`onSelect` 收到該列資料；`EditActions` 只顯示有權限的動作。`src/shared/ui/__tests__/form-submit.test.tsx`：無權限時 disabled 並帶 title 提示，有權限時 enabled，仍尊重表單本身的 disabled，沒有 provider 時 disabled | 行為 |
| AC-5 | `src/app/__tests__/permission-structure.test.ts`：走訪 protected 子樹（含 protected route 本身和 index redirect），每個 route 都有 `staticData.permission`；每個 module route 的 errorComponent 都是 `ForbiddenBoundary`。`! grep -rn "useUserPermissions" src` 通過（包含在 Done Command 內） | 行為 + 靜態 |
| AC-7 | `! grep -rnE "from \"@/(app\|shells)/" src/shared/permission` 通過（包含在 Done Command 內）；`ForbiddenBoundary` 放在 `src/app/router/forbidden-boundary.tsx` | 靜態 |
| AC-6 `[manual]` | **未驗證（沒有開瀏覽器）**。用自動測試補強：superadmin `["*"]` 下每個 protected 葉節點路徑 load 後都沒有 `ForbiddenError`（`permission-structure.test.ts`，對照組是 grants `[]` 時全部被擋）；`useVisibleNav(["*"])` 等於完整的 nav；rowActions 全部 enabled；superadmin 打每個 GET API 都回 200 | 自動補強，manual 未做 |

## M3 過渡項怎麼收掉

- **#5**：`src/app/core.ts` 的 `sessionGrants()` 改讀 `getAuth()?.grants`（登入時由 mock 矩陣展開後存進 session）；寫死的 `["*"]` 已移除。
- **#6**：刪掉 `shells/default/use-nav.ts`，`AppSidebar` 改用 `useVisibleNav()`（`src/shared/module/use-visible-nav.ts`）。nav 與 grants 由 `build()` 在 `shell.ProtectedLayout` 外層以 `NavContext` 和 `GrantsContext` 提供；`createAppRouter` 不再帶 router context。
- **#8**：`protected-layout.tsx` 移除 `useUserPermissions` 和整頁取代的分支。403 由 kernel 注入的 `ForbiddenBoundary` 渲染在 Outlet 內。`UnauthorizedPage` 從 `h-screen` 改為 `size-full`，`className` 也改成可以覆寫（`cn(base, className)`）。
- **#10**：guard 用 `git mv` 搬到 `src/shared/api/mock/permission-guard.ts`，不再 import `services`；舊測試同步搬移並改寫成 AC-2 的 setupServer 版本。

AC-2 第 2 點「前綴補 `/`」的對應：guard 比對的是 `new URL(request.url).origin === new URL(apiBaseUrl).origin`。M3 已把 base 限制為只接受 http(s) 的純 origin，所以 `api.test` 不可能吃到 `api.testing`，base 帶或不帶結尾 `/` 正規化後也相同，效果等同 spec 的「前綴補 `/`」，測試第 2 案實測兩種寫法。

## 破壞性驗證（腳本 `/private/tmp/claude-501/-Users-pakerchang--claude/f6a86878-95b7-4aa7-ada5-fa2ebcec70fa/scratchpad/mutate.py`）

做法：每項改壞實作，跑對應的 vitest 路徑，再從 `.orig` 還原，最後用 `git diff --quiet HEAD -- <file>` 確認檔案與 HEAD 完全相同（作用等同 `cmp`）。

| 改壞內容 | 測試路徑 | vitest | 結果 | 還原與 HEAD 一致 |
|---|---|---|---|---|
| route 守衛不檢查 permission（guardedRoute 條件改成 `false`） | src/app/router + permission-structure | exit 1（4 failed） | 有抓到 | True |
| nav 不過濾 | src/shared/module + src/app/router | exit 1（6 failed） | 有抓到 | True |
| rowActions 不過濾 | src/components/shared | exit 1（1 failed） | 有抓到 | True |
| guard 對未宣告的 operation 放行 | src/shared/api | exit 1（1 failed） | 有抓到 | True |
| guard 無權限時回 401 而不是 403 | src/shared/api + src/app/mock | exit 1（4 failed） | 有抓到 | True |
| `build()` 不檢查缺 key（operations.gen 少一個 key 時不 throw） | src/app/kernel | exit 1（2 failed） | 有抓到 | True |
| ForbiddenBoundary 改成整頁取代（子 route 拿掉、改掛在 protected route） | src/app/router | exit 1（3 failed） | 有抓到 | True |

腳本最後輸出 `ALL_MUTANTS_DETECTED`；跑完後 `git status` 是乾淨的。

## Done Command（最終 HEAD `66e94c0`）

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4 && pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && ! grep -rn "useUserPermissions" src && ! grep -rnE "from \"@/(app|shells)/" src/shared/permission && echo DONE_COMMAND_OK
```

- exit code **0**，輸出有 `DONE_COMMAND_OK`。vite `✓ built in 4.91s`，vitest **Test Files 30 passed (30)、Tests 260 passed (260)**。
- 要求的測試目錄都有測試檔實際執行（verbose 重跑取得的檔案清單）：`app/router`（forbidden-boundary、index-redirect）、`shared/module`（use-visible-nav）、`shared/api`（permission-guard）、`app/mock`（mock-handlers、legacy-adapter、start-worker、enabled）、`app/kernel`（build、operations-gen）、`components/shared`（data-table-row-actions 和 table/__tests__ 三個檔）、`shared/ui`（form-submit）。
- `pnpm exec eslint "src/**/*.{ts,tsx}"` 輸出 `LINT_OK`；8458b19..HEAD 間改動或新增的 ts/tsx 跑 `prettier --check`，全部通過。

## 檔案清單（`git diff --name-status 8458b19 HEAD`）

- **新增**：`src/app/operations.gen.ts`、`src/app/mock/permission-matrix.ts`、`src/app/router/forbidden-boundary.tsx`、`src/shared/permission/use-can.ts`、`src/shared/module/use-visible-nav.ts`、`src/shared/ui/form-submit.tsx`、`src/components/shared/table/row-actions.tsx`；測試：`src/app/__tests__/permission-structure.test.ts`、`src/app/kernel/__tests__/operations-gen.test.ts`、`src/app/mock/__tests__/mock-handlers.test.ts`、`src/app/router/__tests__/forbidden-boundary.test.tsx`、`src/components/shared/__tests__/data-table-row-actions.test.tsx`、`src/shared/api/mock/__tests__/permission-guard.test.ts`、`src/shared/module/__tests__/use-visible-nav.test.tsx`、`src/shared/ui/__tests__/form-submit.test.tsx`
- **搬移**：`src/app/mock/guard.ts` → `src/shared/api/mock/permission-guard.ts`
- **刪除**：`src/shells/default/use-nav.ts`、`src/app/mock/__tests__/guard.test.ts`（內容已改寫進新的 guard 測試）；`legacyOperations`（含其測試段）從 `legacy-adapter` 移除
- **修改**：`CLAUDE.md`、spec 一處、`src/app/{core.ts,main.tsx,kernel/build.ts,kernel/create-app.tsx,router/index-redirect.ts,mock/index.ts,mock/legacy-adapter.ts}`、`src/app/__tests__/{fixture.tsx,router-matching.test.ts}`、`src/app/kernel/__tests__/build.test.ts`、`src/app/mock/__tests__/legacy-adapter.test.ts`、`src/components/shared/{DataTable,EditActions,UnauthorizedPage}.tsx`、`src/modules/*/index.ts`（9 個）、`src/pages/{articles/ArticleList,orders/OrderList,product/ProductList}.tsx`（只改 EditActions 宣告處）、`src/pages/users/{UserList,UserForm}.tsx`、`src/pages/users/hooks/use-user.ts`、`src/services/{api-client.ts,mock/handlers.ts}`、`src/services/__tests__/api-client.test.ts`、`src/shared/{module,permission}/index.ts`、`src/shared/permission/types.ts`、`src/shells/default/{app-sidebar,forbidden,protected-layout}.tsx`

## Touches 外的例外

1. `src/shared/ui/**`（FormSubmit 和它的測試）：spec 目錄樹與 AC-4 的驗證路徑都在這裡，但 M4 Touches 沒有列這個目錄。
2. `CLAUDE.md`：M4 狀態改為「完成（待併入）」、更新權限描述與過渡期規則（這是 prompt 允許的例外）。
3. `src/services/__tests__/api-client.test.ts`：guard 改成 fail-closed 之後，資料類測試必須先登入，所以加了 `signInAsSuperadmin()`，另外在登入測試補一個 `grants` 斷言。
4. `src/app/__tests__/{fixture.tsx,router-matching.test.ts}`：`src/app/**` 本來在 Touches 內，這裡只是提一下測試有改。

## 自行決定（交給 Codex 判斷）

1. **`TCore.mock` 取代 spec 的 `guard` 加 `mockHandlers`**：login handler 和 guard 都需要「core 矩陣 ∪ module 的 `mockGrants`」，而這份矩陣要到 `build()` 時才湊得齊。所以改成一個 factory `mock({ ...operations, apiBaseUrl, mockGrants })`，回傳 `[guard, ...core]`，guard 一定在第一位（由 `mock-handlers.test.ts` 驗證）。
2. **矩陣內容**（`app/mock/permission-matrix.ts` 和各 module 的 `mockGrants`）：superadmin 為 `*`；admin、support、partner 都有 `app:access`；admin 對所有 domain 是 `<id>:*`，對 users 只有 `read` 和 `update`（沒有 `update-role`，對應舊的 `canEditUserRole` 只給 superadmin）；support 有 `orders:*`；partner 有 `product:*`，另外給 `suppliers:read` 和 `tags:read`，讓產品表單的下拉選單可用。對照舊的 `useUserPermissions`，support 和 partner 原本整個進不了後台，現在依 spec §6.1 的 coreGrants 可以進後台、但只看得到自己有權限的部分（R10 允許的行為變更）。
3. **權限目錄的 action 名稱**：CRUD 類用 `read/create/update/delete`；users 是 `read/update/update-role`；orders 是 `read/update`；consumers 只有 `read`。
4. **core resource `app:access` 直接寫進 `build()` 的 catalog**（spec §6.1 寫「core resource」，但 TCore 沒有對應欄位）。R29 的 `/admin/images` 和 `/user/me/profile` 這兩個 operation 用 `app:access`：理由是 images 的通用上傳不屬於任何 module，profile 則是使用者自己的資料。
5. **缺 `app:access` 一律視為沒有任何 grant**：在 `app/core.ts` 的 `sessionGrants()` 處理，不另外在每個 route 檢查 `app:access`。理由：如果讓 protected route 自己 throw，它的 errorComponent 會蓋掉整個 layout。這樣一來 nav 為空、每頁內容區都是 403，符合 §6.2。代價是顯示的 Forbidden 帶的是該頁的 permission，而不是 `app:access`。
6. **`useCan` 的來源是 `GrantsContext`**（由 app 注入 `getGrants`，render 時才呼叫），不是 spec 寫的 `useSession()`：session store 搬到 `shared/api` 屬於 M5；這樣 shared 也不必 import services。沒有 Provider 時視為沒有任何 grant。
7. **`ForbiddenBoundary` 用 closure 注入 `shell.Forbidden`**（`createForbiddenBoundary(shell.Forbidden)`），不走 `useRegistry()`：build 時已經知道 shell，不需要再建一個 RegistryProvider。
8. **guard 對 unknown route 的 404 body 沿用舊格式**（`No mock handler for METHOD path`），沒有改成 spec 的 `not found: no operation for …`，依的是「mock API 回應 body 不變」紅線；同時拿掉了 404 的 `delay`（shared 不 import `services` 的 `DELAY_MS`）。
9. **mock session 的實作**：`services/mock/handlers.ts` 新增 `mockRoleOfToken(token)`，用 token 反查記憶體 db 裡的使用者角色，所以角色被改後下一個 request 就生效；login 回傳的 body **新增**了 `grants` 欄位（舊有欄位都不變）。
10. **測試 setup 的預設 handler 只用 core 矩陣**（`app/mock` 的 `mockHandlers`，`mockGrants: []`）：如果 setup import `app/modules`，會連帶載入 pages，讓各測試檔的 `vi.mock` 失效。需要 module 矩陣的測試改用 `server.resetHandlers(...registry.mockHandlers)`。
11. **`operations.gen.ts` 用 `crud()` helper 產生 CRUD 四條**，不是逐行平鋪：這是 M7 前手寫的檔案，以可讀性為主，M7 會由 extract 腳本覆蓋。
12. **`EditActions` 只支援 `{ handler, permission }` 物件**（照 §6.4），沒有保留函式寫法；4 個呼叫點都已改寫。
13. **UserList 的 actions 欄位改成 `rowActions`**：edit 對應 `users:update`，edit-role 對應 `users:update-role`；角色按鈕新增 `title` 和 `aria-label`（沿用既有的 `table.headers.user.role` key，沒有新增 i18n key）。UserForm 改用 `FormSubmit permission="users:update"`。
14. **沒有做 `<Guarded>`**（§6.4 列的逃生口），因為目前沒有任何地方用到。

## spec 模糊或矛盾處

- §4.2 的 TCore 形狀（`guard` 加 `mockHandlers`）和 §6.1「login 回傳的 session.grants 由矩陣展開，且矩陣要併入 module 的 mockGrants」放在一起時，靜態的 `mockHandlers` 拿不到矩陣。處理方式見自行決定 #1。
- §4.3 1.5.3 規定非 public 的 permission 必須在「已安裝 module 的權限目錄」內，但 R29 的 core operation（`/admin/images`）不屬於任何 module。這裡以 core resource `app:access` 補上（見自行決定 #4），建議 spec 明定 core catalog 的位置。
- §6.2 寫「protected route 自身缺 `app:access` 時 layout 照常渲染」，但 §4.3 的 pseudo code 把這個檢查放在 protected route 的 `beforeLoad`；照這樣寫，errorComponent 會蓋掉整個 layout，兩者衝突。處理方式見自行決定 #5。
- §6.5 規定 404 body 用 `not found: …`，和 M4 的紅線「mock API 回應 body 不變」衝突，這裡選擇遵守紅線（見自行決定 #8）。
- 舊 session 相容性：M4 之前存在 localStorage 的 session 沒有 `grants`，升級後在重新登入前，每頁都會顯示內容區 403，不會 crash。

## 驗證層級小結

- 行為層（vitest exit 0）：AC-1、AC-2、AC-3、AC-4、AC-5。
- 靜態層（grep、tsc、lint）：AC-5 的 grep、AC-7。
- **未驗證**：AC-6 manual（沒有開瀏覽器），dev server 下的 browser `setupWorker` 也沒有實際跑過。

LIFECYCLE_PAUSE: true
