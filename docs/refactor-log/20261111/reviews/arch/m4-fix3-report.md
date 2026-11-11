# m4-fix3 報告：mock session 跨重新整理保留 + 非 GET 成功覆蓋 + 四角色 grants 鎖定

- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4`，branch `feat/m4-permission-enforcement`
- 起點：`2988875014dddb51661d2ace59f458066fb52f02`（REVIEW_FAIL_ACK；Codex PASS-with-fixes）
- **HEAD：`ec5a55fe8707941ae1639662c72c0e00629513da`**
- 本棒 spec：`/Users/pakerchang/.claude/docs/specs/m4-fix3.spec.md`（保留，沒有進 admin-template commit）
- 沒有 push、merge、rebase，既有 commit 沒有改寫；commit 都經 `cc-git-write.sh` 建立，作者 pakerchang，沒有 AI 署名（`git log -3` 中 co-authored 筆數 = 0）

## Commit 清單與逐 commit 驗證

每個 commit 都是在提交前、用跟該 commit 完全相同的工作樹跑 build 和全量 vitest（工作樹裡沒有其他未提交的改動；沒有另外逐一 checkout 重跑）。

| sha | message | 檔案 | build | vitest |
|---|---|---|---|---|
| `231b54c` | fix(mock): persist issued sessions across reloads | `src/services/mock/handlers.ts`、`src/app/mock/__tests__/mock-handlers.test.ts`、`CLAUDE.md` | exit 0 | exit 0（輸出被 `tail -5` 截掉，總數沒有擷取到；`src/app/mock` 子集 5 檔／43 tests 通過） |
| `4ea8e1c` | test(mock): assert successful non-GET operations for superadmin | `mock-handlers.test.ts` | exit 0 | exit 0，32 檔／312 tests |
| `ec5a55f` | test(permission): pin full grant sets per role | `role-visibility.test.tsx` | exit 0 | exit 0，32 檔／316 tests |

## W1 修法（重新整理後 session 失效）

`src/services/mock/handlers.ts`：
- **storage 選擇：`localStorage`**，key `mock-sessions`。client session `auth`（`api-client.ts:20-32`）也存在 localStorage，兩邊放同一種 storage，生命週期就一致：重新整理、開新分頁都還在，清除網站資料時一起消失。
- **寫入**：唯一寫入點仍是成功 login 的 `issueToken()`。token 仍由 `crypto.getRandomValues` 產生 128-bit、32 位小寫 hex。做法是讀出現有的表、加入新條目、整表寫回，`setItem` 包在 try/catch 裡。
- **讀回時驗格式**（`readSessions()`）：只保留 key 符合 `/^[0-9a-f]{32}$/`、值是 string 的條目，其他丟掉。JSON 是 `null`、陣列或字串時整表當成空表。改用 `Map`，避免 `__proto__`／`constructor` 這類原型鏈 key 被當成查詢結果。
- **退回記憶體**：`localStorage` 不存在或 `getItem`／`JSON.parse` 丟錯時，改用模組內的 `memorySessions`，裡面只有本 runtime 自己簽發的 token。`setItem` 失敗時也只留在記憶體。
- **驗證沒有放寬**：`mockUserOfAuthorization` 仍只接受 `^Bearer (\S+)$`，而且 token 必須在驗過格式的表裡。
- 測試（`mock-handlers.test.ts` › `issued sessions survive a page reload (W1)`）：
  1. 重新載入：login → `vi.resetModules()` → 重新 import fixture 並換上新的 `registry.mockHandlers`（等於 handlers 模組重新載入，記憶體表清空）→ 同一 token 打 `/admin/order` 回 200；未簽發的 32 位 hex 回 403。
  2. 竄改：storage 放入非 hex、長度 4、大寫 32 位、33 位、值是 number、值是 object 的條目，全部回 403。整表改成 `not json`／`[]`／`null`／`"x"` 時也回 403，之後 login 仍正常（會把表重寫成合法內容）。
  3. node 退回：`vi.stubGlobal("localStorage", undefined)` 後重新 import handlers，login 簽發的 token 可以查到 superadmin，未簽發的查不到，而且真正的 localStorage 沒有被寫入。
- I1：`CLAUDE.md` L24 新增一行：session 表的位置；mock 的登出只清 client session，不撤銷已簽發 token（同一 mock runtime 內可重播；因為表已經持久化，重新整理後也一樣）；M7 換真 API 前不處理。括號後半是我補的，因為持久化之後「只在同一 runtime 內」已經不準確。

## W2：非 GET operation 的 payload 與預期（全部以 superadmin 登入，預期 status 200）

測試會先確認案例表的 key 集合**等於** `operations.routes` 的非 GET 集合（少寫或多寫都會失敗）。每一筆都斷言 status 200，並以 `toMatchObject` 比對預期 body。handlers 沒有用 201，成功一律回 200。

| operation | payload | 預期 body |
|---|---|---|
| POST /api/auth/login | demo 帳密 | `{ user: { role: "superadmin" }, grants: ["*"] }` |
| PUT /user/me/profile | `{ first_name: "Alicia" }` | `{ code: 200, data: { user_id: "user-1", first_name: "Alicia" } }` |
| POST /admin/user/role | `{ target_user_id: "user-8", role: "user" }` | `{ code: 200, data: { role: "user" } }` |
| POST /admin/products | `{ product_name }` | `{ message: "created" }` |
| POST /admin/products/update | `{ product_id: "product-1", … }` | `{ message: "updated" }` |
| DELETE /admin/products | `{ product_id: "product-2" }` | `{ message: "deleted" }` |
| POST /admin/images | `{ file_name, file_value }` | `{ file_name, file_url: file_value }` |
| DELETE /admin/images | `{ file_name }` | `{ message: "deleted" }` |
| POST /admin/order | `{ order_id: "order-1001", order_status }` | `{ message: "updated" }` |
| POST /admin/order/update | `{ order_id: "order-1002", order_status }` | `{ message: "updated" }` |
| POST／PUT／DELETE /admin/banners | `{title}`／`{banner_id: "banner-1"}`／`{banner_id: "banner-2"}` | created／updated／deleted |
| POST／PUT／DELETE /admin/supplier | `{supplier_name}`／`supplier-1`／`supplier-2` | created／updated／deleted |
| POST／PUT／DELETE /admin/tag | `{tag_name}`／`tag-1`／`tag-2` | created／updated／deleted |
| POST／PUT／DELETE /admin/staff | `{first_name,email,password}`／`staff-1`／`staff-2` | created／updated／deleted |
| POST／PUT／DELETE /admin/articles | `{title}`／`article-1`／`article-2` | created／updated／deleted |

另外用 tags 驗證資料結果：create 後用 `GET ?search=` 查得到 1 筆；update `tag-3` 前名稱不同，update 後變成新值；delete `tag-4` 前 `GET ?tag_id=tag-4` 有 1 筆，delete 後是 `[]`。

限制：create 和 delete 的 handler 對空 body 也會回成功（handler 本身比較寬鬆），所以「成功」與「真的生效」之間的差別，只靠 tags 這組資料結果測試證明，沒有逐個資源驗證。

## W3：四角色 login 後的完整 grants（排序後 `toEqual`，透過 registry.mockHandlers 實際發出 login request）

| role | 期望集合 |
|---|---|
| superadmin | `*` |
| admin | `app:access`、`users:read`、`team-members:*`、`orders:*`、`product:*`、`suppliers:*`、`consumers:*`、`banners:*`、`articles:*`、`tags:*` |
| support | `app:access`、`team-members:read`、`orders:*`、`suppliers:read`、`consumers:read`、`banners:read`、`articles:read`、`tags:read` |
| partner | `app:access`、`team-members:read`、`product:*`、`suppliers:read`、`consumers:read`、`banners:read`、`articles:read`、`tags:read` |

描述已修正：nav describe 改名為「各角色可見 nav 符合依 main 裁決調整後的矩陣」，註解寫明期望值不是逐字重現 6029bf0 的畫面，並分別說明 D1（support／partner 在 6029bf0 被 `ProtectedAppLayout` 擋在後台外）與 D2（`canManageProducts`／`canManageOrders` 沒有消費點）。

## 破壞性驗證（每次改壞後都用 cp 還原，`cmp` 確認一致）

| # | 改壞方式 | 結果 |
|---|---|---|
| M-W1a | `readSessions` 不讀 storage（`JSON.parse(...)` 換成 `throw 0`，等於回到只用記憶體） | 只有重新載入測試失敗（1 failed／16 passed） |
| M-W1a′ | （第一次的版本）storage 只讀不寫 | 8 個測試失敗：這個改法太粗，表示 storage 確實是讀取來源；不列為主要證據 |
| M-W1b | 讀回時不驗格式（filter 條件改成 `true`） | 竄改測試失敗（1 failed／16 passed） |
| M-W2a | 案例 payload 改回舊測試的 `{}` | 12 個失敗：login、profile、role、所有 update、images POST |
| M-W2b | login 案例的密碼錯誤（回 401） | `POST /api/auth/login` 案例失敗（1 failed） |
| M-W3a | `tags` 的 partner `tags:read` 改成 `tags:*` | 只有 W3 的 partner 失敗；nav 測試沒抓到 |
| M-W3b | 刪掉 admin 的 `banners:*` | W3 的 admin 和 nav 的 admin 都失敗 |
| M-W3c | admin 的 `banners:*` 改成 `banners:read`（寫入邊界） | 只有 W3 的 admin 失敗 |

## Done Command（最終 HEAD `ec5a55f`）

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4 && pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && ! grep -rn "useUserPermissions" src && ! grep -rnE "from \"@/(app|shells)/" src/shared/permission && echo DONE_COMMAND_OK
```

- **exit 0**，輸出包含 `DONE_COMMAND_OK`；`✓ built in 5.72s`
- vitest：**32 個測試檔通過**、**316 個測試通過**（fix2 是 32／283）
- Lint：`pnpm exec eslint "src/**/*.{ts,tsx}" && echo LINT_OK` → `LINT_OK`
- Prettier：3 個改動的 ts／tsx 檔 `--check` 通過（exit 0）。`CLAUDE.md` 只加了一行，`.md` 原本就沒有通過 prettier（見 fix2 報告），所以沒有整檔重排
- 驗證層級：行為（vitest 用真實 registry、實際發出 MSW request、模組重新載入模擬 worker 重啟、破壞性驗證）加上靜態（tsc build、eslint）。**沒有在瀏覽器實機驗證**：沒有啟動 dev server，也沒有實際按 F5。模組重新載入只是模擬 worker 重啟，並不等於真的重新整理

## DECISION

- **D-W1-1（竄改的定義）**：格式驗證能擋住格式錯誤或型別錯誤的條目，**擋不住格式合法、但人為植入的條目**。例如 `{"<任意 32 位 hex>": "user-1"}` 會被接受。原因：MSW handler 跑在頁面 context 裡，任何能跨重新整理保存的密鑰也都放在頁面可讀的 storage 中，無法做完整性簽章。威脅模型上，能寫 localStorage 的同源 script 本來就讀得到 `auth` 裡的真 token，所以實際上沒有增加攻擊面。程式碼的 ponytail 註解已寫明這是上限。建議：接受這個限制，M7 換真 API 後就不存在。
- **D-W1-2**：session 表只會增加不會清理（沒有 logout operation，也沒有到期機制）。每次 login 約多 50 bytes，demo 用途可以忽略。建議：M7 前不處理。

LIFECYCLE_PAUSE: true
