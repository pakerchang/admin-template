# m4-fix2 報告：角色 grants 對齊重構前可見範圍 + spec／CLAUDE.md 同步

- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4`，branch `feat/m4-permission-enforcement`
- 起點：`83952035927047af8dd532cfaa5a159db1643277`（m4-fix1 head；REVIEW_FAIL_ACK `acd05c0`）
- **HEAD：`2988875014dddb51661d2ace59f458066fb52f02`**
- 本棒 spec：`/Users/pakerchang/.claude/docs/specs/m4-fix2.spec.md`（保留在 ~/.claude，沒有進 admin-template commit）
- 沒有 push、merge、rebase，既有 commit 未改寫；兩個 commit 都經 `cc-git-write.sh` 建立，沒有 AI 署名

## Commit 清單

| sha | message | 內容 |
|---|---|---|
| `6e30216` | fix(permission): align role grants with pre-refactor visibility | 7 個 module 的 `mockGrants`、新測試 `src/app/mock/__tests__/role-visibility.test.tsx`、`mock-handlers.test.ts` 中 support grants 的期望值 |
| `2988875` | docs(spec): sync M4 spec with implementation and record role matrix | `docs/specs/fsd-module-architecture.spec.md`、`CLAUDE.md` |

逐 commit 驗證：`git diff --quiet 6e30216 HEAD -- src` 回報 `SRC_SAME_AS_COMMIT_A`，代表 docs commit 沒有動到任何 `src`。所以在 HEAD 跑的 build 與 vitest 結果，也就是 commit A 的 `src` 結果。commit A 提交前，同一份工作樹也跑過 `vitest run`（exit 0）。lint-staged 在 commit 時只對新測試檔做了 prettier 換行，沒有改到語意。

## 矩陣最終內容（core `coreGrants` 不變；各 module `mockGrants`）

| role | grants（login 展開順序） |
|---|---|
| superadmin | `*` |
| admin | `app:access`、`users:read`、`team-members:*`、`orders:*`、`product:*`、`suppliers:*`、`consumers:*`、`banners:*`、`articles:*`、`tags:*`（**移除** `users:update`；沒有 `users:update-role`） |
| support | `app:access`、`team-members:read`、`orders:*`、`suppliers:read`、`consumers:read`、`banners:read`、`articles:read`、`tags:read` |
| partner | `app:access`、`team-members:read`、`product:*`、`suppliers:read`、`consumers:read`、`banners:read`、`articles:read`、`tags:read` |

support 的展開結果已寫進 `mock-handlers.test.ts`，由實際 login 回應斷言。

## 角色 × 頁面可見性對照（重構前 vs 現在）

依據（6029bf0）：
- `src/constants/sidebar.tsx:20-65`：sidebar 共 8 項，`src/components/shared/AppSidebar.tsx:79` 直接 `sidebarMenu.map`，沒有任何過濾。
- `src/router/routes.tsx:55-57`：protected route 只檢查是否登入，各子頁都沒有 `beforeLoad` 權限檢查。
- `src/components/layouts/ProtectedAppLayout.tsx:9-13`：`canAccessAdminPanel`（`use-user.ts:162`，限 admin／superadmin）不成立時，整個 layout 換成 `UnauthorizedPage`。
- `src/pages/users/hooks/use-user.ts:164-171`：`canEditUserRole`／`canManageUsers` 限 superadmin；`canManageProducts` 為 admin／superadmin／partner；`canManageOrders` 為 admin／superadmin／support。spec §6.1 L633 把它們對照為 `users:update-role`／`users:update`／`product:*`／`orders:*`。
- `src/pages/users/UserList.tsx:167`：只有角色編輯鈕受 `canEditUserRole` 控制，編輯鈕無條件顯示。

| 頁面（nav id） | superadmin 前→今 | admin 前→今 | support 前(main 前提)→今 | partner 前(main 前提)→今 | 6029bf0 依據 |
|---|---|---|---|---|---|
| customers（consumers） | ✓→✓ | ✓→✓ | ✓→✓ read | ✓→✓ read | 無檢查 |
| team-members | ✓→✓ | ✓→✓ | ✓→✓ read | ✓→✓ read | 無檢查 |
| suppliers | ✓→✓ | ✓→✓ | ✓→✓ read | ✓→✓ read | 無檢查 |
| tags | ✓→✓ | ✓→✓ | ✓→✓ read | ✓→✓ read | 無檢查 |
| products（product） | ✓→✓ | ✓→✓ | ✗→✗ | ✓→✓ | canManageProducts（L166-168） |
| orders + order-list | ✓→✓ | ✓→✓ | ✓→✓ | ✗→✗ | canManageOrders（L169-171） |
| banners | ✓→✓ | ✓→✓ | ✓→✓ read | ✓→✓ read | 無檢查 |
| articles | ✓→✓ | ✓→✓ | ✓→✓ read | ✓→✓ read | 無檢查 |
| users（無 nav） | 可進／可改 | 可進→可進（read），編輯鈕 ✓→✗ | ✗→✗ | ✗→✗ | layout + `UserList.tsx:167`；見 DECISION D3 |

「前(main 前提)」：6029bf0 實際上 support／partner 會被 `ProtectedAppLayout` 整個擋掉；表格依 main 裁決「他們是可進後台的角色」來推導，見 DECISION D1。

新測試（期望值寫死）`role-visibility.test.tsx`：
- `superadmin`、`admin`：顯示全部 8 項，含 `orders.order-list`。
- `support`：全部去掉 `product`。
- `partner`：全部去掉 `orders` 與 `orders.order-list`。
- `every back-office role has app:access`
- `only superadmin may update users or their role (use-user.ts:164-165)`

## spec 改動位置（HEAD 行號，`docs/specs/fsd-module-architecture.spec.md`）

| # | 位置 | 內容 |
|---|---|---|
| B3 §4.2 | L329-333 | TCore 改為 `mock()` factory，取代原本的 `guard` + `mockHandlers` 兩欄；catalog 含 `app: ["access"]`；profile 與 images 屬 core operation（R29），profile 綁定本人 |
| B3 §4.3 | L381-383 | protectedRoute 本身不檢查 `app:access`，改由 `sessionGrants()` 處理（缺 `app:access` 就清空 grants）；layout 照常渲染，子 route 各自顯示 Forbidden（與 §6.2 一致） |
| B5 §6.1 | L637-646 | 角色 grants 矩陣表 + 行為不變原則，註明「main 代 owner 裁決，待 owner 覆核」 |
| B2 §6.5 | L736 | M7 前沿用 legacy 404 body `No mock handler for …`；M7 起改為 `not found: no operation for …` |
| B4 §9 M4 Touches | L1179 | 補上例外（main 06:4x 代 owner 核准）：`src/shared/ui/**`（FormSubmit）、`src/services/__tests__/api-client.test.ts`、`CLAUDE.md` |
| B1 §9 M4 行為紅線 | L1180 | 「login 回應新增 `grants` 為 §6.1 指定例外；既有欄位不變」 |
| C `CLAUDE.md` | L23 | M4 升級後，舊 session（沒有 `grants`）需要登出後重新登入一次；不做遷移 |

## 破壞性驗證（目標檔：`role-visibility.test.tsx`）

| # | 改壞方式 | 結果 | 還原 |
|---|---|---|---|
| M1 | `users` 的 admin 改成 `["users:read", "users:update-role"]` | `only superadmin may update users or their role` 失敗（1 failed／5 passed） | cp 還原後 `cmp` 一致（RESTORED_M1） |
| M2 | 刪掉 `banners` 的 `support: ["banners:read"]` | `support` nav 測試失敗（1 failed／5 passed） | cp 還原後 `cmp` 一致（RESTORED_M2） |

## Done Command（最終 HEAD `2988875`）

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4 && pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && ! grep -rn "useUserPermissions" src && ! grep -rnE "from \"@/(app|shells)/" src/shared/permission && echo DONE_COMMAND_OK
```

- **exit 0**（`DONE_EXIT=0`），輸出含 `DONE_COMMAND_OK`；`✓ built in 4.86s`。
- vitest：**32 個測試檔通過（32）**，**283 個測試通過（283）**。fix1 時是 31／277，本棒多 1 檔、6 個測試。
- 預設 reporter 不會列出新測試名稱，所以另外用 `--reporter=verbose` 跑 `role-visibility.test.tsx`：6 個測試全部 ✓，包括 superadmin、admin、support、partner 的 nav 一致性。
- Lint：`pnpm exec eslint "src/**/*.{ts,tsx}" && echo LINT_OK`，exit 0，輸出 `LINT_OK`。
- Prettier：9 個改動的 `.ts`／`.tsx` 檔通過，exit 0。**兩個 `.md` 檔（`CLAUDE.md`、spec）`--check` 不通過**；base `8395203` 的同兩檔也不通過，是原本就有的狀態，lint-staged 也不處理 md。本棒沒有整檔重排，以免 diff 混入無關改動。
- 驗證層級：行為驗證（vitest 真實 10 module registry + login 實發 request + 破壞性驗證），加上靜態驗證（tsc build、eslint）。**沒有驗證**瀏覽器實機操作（沒有啟動 dev server）。

## DECISION（照 main 矩陣實作，差異如下，請 owner 覆核）

- **D1（最重要）**：6029bf0 的 `ProtectedAppLayout.tsx:9-13` 用 `canAccessAdminPanel`（`use-user.ts:162`，限 admin／superadmin）擋整個後台，所以 **support／partner 在重構前根本進不了後台**，沒有看得到的 nav。main 裁決與 spec §6.1 的 coreGrants 給他們 `app:access`，這是相對 6029bf0 的行為變更；本棒的「重構前可見 nav」對這兩個角色是用 main 的前提推導出來的。建議：owner 明確確認接受這個變更（R10／§6.1）。
- **D2**：`canManageProducts`／`canManageOrders` 在 6029bf0 只有定義，沒有任何消費點（`git grep` 只命中 use-user.ts），products／orders 頁實際上沒有檢查。本棒依 main 矩陣與 §6.1 對照，視為「有檢查」：support 看不到 products，partner 看不到 orders。如果嚴格以實際程式為準，應該互相補上 read。建議：維持 main 矩陣。
- **D3**：6029bf0 中 admin 看得到 UserList 的編輯鈕（`EditActions onEdit` 無條件），也能進 `users/edit/$id`。新矩陣拿掉 admin 的 `users:update` 後，admin **看不到編輯鈕**（rowAction 要求 `users:update`），表單送出鈕 disabled；直接進 `/users/edit/$id` 仍可以（route 只要求 `users:read`）。這是 main 依 `canManageUsers`（限 superadmin，但沒有消費點）做的裁定。建議：維持 main 的裁定。
- **D4**：沒有檢查的頁面，admin 保留原本的 `<id>:*`（重構前 admin 可以 CRUD；main 的要求是「至少能讀」，縮成 read 等於縮小範圍）；support／partner 只補 read（重構前沒有存取權，寫入權也沒有裁決）。建議：維持現狀。

LIFECYCLE_PAUSE: true
