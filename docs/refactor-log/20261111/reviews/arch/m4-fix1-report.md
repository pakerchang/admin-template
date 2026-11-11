# m4-fix1 報告：修 M4 codex FAIL（C1 可偽造 token、C2 profile 提權）

- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4`，branch `feat/m4-permission-enforcement`
- 起點：`acd05c0ff0745b253aa8516fc2da60f99e6c694f`（REVIEW_FAIL_ACK）
- **HEAD：`83952035927047af8dd532cfaa5a159db1643277`**
- spec：`/Users/pakerchang/.claude/docs/specs/m4-fix1.spec.md`（保留在 ~/.claude，未進 admin-template commit）
- 未 push／merge／rebase；既有 commit 未改寫；作者 `pakerchang <pakerchang@gmail.com>`，無 AI 署名

## Commit 清單

| sha | message | 獨立驗證（commit 前工作樹 = commit 內容） |
|---|---|---|
| `047f401079a187a438a5564a5daf16d34a8b2fcc` | fix(mock): issue unguessable session tokens and verify them strictly | `pnpm build` exit 0；`vitest run` exit 0，31 檔／275 測試 |
| `83952035927047af8dd532cfaa5a159db1643277` | fix(mock): bind /user/me/profile to the caller and whitelist writable fields | `pnpm build` exit 0；`vitest run` exit 0，31 檔／277 測試；eslint／prettier exit 0 |

註：兩次都是在 commit 前驗證工作樹。lint-staged（eslint --fix、prettier）在 commit 時有跑過，但這些檔案已經通過 prettier --check 與 eslint，所以預期沒有額外改動；commit 1 的 stat（5 files，+92/−11）與驗證時的 diff 一致。並沒有另外 checkout 047f401 重跑。

## C1 修法：token 不可偽造

- `src/services/mock/handlers.ts`
  - 新增記憶體 session 表 `sessions: Map<token, user_id>`。
  - `issueToken(userId)`：用 `crypto.getRandomValues` 產生 16 bytes（128 bit），轉成 hex 字串，登記到表內。login 改用它簽發 token。沒有用 `randomUUID`，因為它只能在 secure context 使用，dev server 用 LAN IP 開啟時會是 undefined。
  - **唯一的 token → 使用者入口** `mockUserOfAuthorization(authorization)`：只接受符合 `/^Bearer (\S+)$/` 且已在表內的 token，其餘情況回 `undefined`。它回傳記憶體 db 中的 user，所以角色被改後下一個 request 就生效（行為和原本一致）。
  - 移除 `tokenOf` 與 `mockRoleOfToken`。
- **所有呼叫點**（grep `mockRoleOfToken|tokenOf|Authorization` 確認過，再沒有其他依 token 找使用者的地方）：
  1. `src/app/mock/index.ts` `grantsOf`：guard 的 `getGrants`，改走 `mockUserOfAuthorization(request.headers.get("Authorization"))?.role`。
  2. `src/services/mock/handlers.ts` 的 `GET /user/me/profile` 與 `PUT /user/me/profile`（C2）。
  - 為了讓 handler 拿得到 header：`THandlerContext` 新增選填欄位 `authorization`，由 `src/app/mock/legacy-adapter.ts` 從 `request.headers.get("Authorization")` 帶入。
- Logout：`operations.gen.ts` 和 handler 表都沒有 logout operation（側欄 logout 只呼叫 client 端的 `clearAuth`），所以不新增移除 token 的路徑。

## C2 修法：profile 綁本人＋白名單

- `GET /user/me/profile`：回傳 `mockUserOfAuthorization(authorization)` 對應的本人；查無本人時回 403（guard 已經會擋未登入，這是第二層防線）。
- `PUT /user/me/profile`：只套用 **`first_name`、`last_name`、`phone_number`、`address`、`remark`**，也就是 `UserForm` 的 `TUserForm` 欄位扣掉身分欄位 `user_id`、`email`，再更新 `updated_at`。`role`、`user_id`、`email`、`created_at` 等其他欄位一律**忽略**。
  - 選擇忽略而非回 400 的理由：現有的 `useUpdateUserProfile`（`src/pages/users/hooks/use-user.ts:77`）會送出整個 `TUser`，裡面含 `role`、`user_id`、`email`，回 400 會讓它壞掉。目前沒有 UI 消費這個 hook，`UserForm` 的 submit 也還是空的，但忽略是不破壞介面的最小改動。
- 移除 `currentUser()`（原本固定取 demo 帳號）。
- `operations.gen.ts` 沒有改，`app:access` 保留。

## 新增測試

`src/app/mock/__tests__/mock-handlers.test.ts`（setupServer 實際發 request，使用 registry 的 mockHandlers）：

1. `superadmin: every non-GET operation passes the guard and reaches its handler (AC-6 API side)`：逐一打每個非 GET operation，斷言狀態碼不是 403，body 也不是 guard 的 `No mock handler…`。
2. `session token cannot be forged (C1) > a guessed legacy-format token without login → 403`：對所有種子 user 未登入直接帶 `Bearer mock-token-<id>`，都回 403。
3. `… > an issued token works only verbatim behind \`Bearer \``：原樣使用回 200；竄改一個字元、不帶 `Bearer `、小寫 `bearer ` 都回 403。
4. `… > tokens are not derived from the user id`：兩次登入拿到的 token 不同，且不包含 `user-`。
5. `/user/me/profile is bound to the caller (C2) > GET returns the caller, not the demo account`
6. `… > PUT applies whitelisted fields only; role / user_id / email cannot be changed`：support PUT `{ role: "superadmin", user_id: "user-1", email: <demo>, first_name }` 後，只有 first_name 改變；同一 token 仍可打 `/admin/order`（200），`/users` 仍是 403；superadmin 那筆資料也沒被改。

`src/shared/permission/__tests__/can.test.ts`：新增 9 個負向案例 `Orders:read`、`ORDERS:*`、`orders::read`、`orders:read:`、`orders::*`、` orders:read`、`orders:read `、`orders`、`orders:` 對 `orders:read` 都回 false。`"orders"` 不符合 `TGrant` 型別，用 `as TGrant` 處理，因為 grants 來自 JSON，執行期仍可能出現。

既有測試：沒有任何測試手寫舊格式 token（grep `mock-token` 結果為 0），原本就都走 login → `setAuth`，不需要遷移。

刪掉的案例：原本規劃了「`Bearer <token> `（尾端空白）→ 403」，實測 fetch 依 HTTP 規範會修剪 header 值的前後空白，這種輸入送不到 handler，所以拿掉。

## 破壞性驗證

每項都是：從 `handlers.ts` 備份 → 改壞 → 跑 `mock-handlers.test.ts` → 用 cp 還原 → `cmp` 確認一致。

| # | 改壞方式 | 失敗的測試 | 還原 |
|---|---|---|---|
| M1 | token 驗證改回「`mock-token-${user_id}` 比對 user id」（拿掉 sessions.has 檢查） | `a guessed legacy-format token without login → 403`（1 failed / 11 passed） | cmp 一致 RESTORED_M1 |
| M2 | regex 改成 `/^(?:Bearer )?(\S+)$/`，接受沒有前綴的 token | `an issued token works only verbatim behind \`Bearer \``（1 failed / 11 passed） | cmp 一致 RESTORED_M2 |
| M3 | profile PUT 改回 `Object.assign(me, body)`，套用全部欄位 | `PUT applies whitelisted fields only…`（1 failed / 13 passed） | cmp 一致 RESTORED_M3 |
| M4 | profile 的 `me` 改回固定 demo 帳號 | `GET returns the caller…`、`PUT applies whitelisted fields only…`（2 failed / 12 passed） | cmp 一致 RESTORED_M4 |

M1、M2 在 commit 1 的工作樹上跑，M3、M4 在 commit 2 的工作樹上跑（各自在 commit 前）。

## Done Command（最終 HEAD `8395203`）

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4 && pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && ! grep -rn "useUserPermissions" src && ! grep -rnE "from \"@/(app|shells)/" src/shared/permission && echo DONE_COMMAND_OK
```

- **exit 0**，輸出含 `DONE_COMMAND_OK`；`✓ built in 4.78s`；vitest **31 個測試檔通過（31），277 個測試通過（277）**。
- 新測試名稱：預設 reporter 不會列出，所以另外對兩個檔案跑了 `vitest run --reporter=verbose`（exit 0），上列 6 個 mock 測試和 9 個 can 負向案例都顯示 ✓。
- Lint：`pnpm exec eslint "src/**/*.{ts,tsx}" && echo LINT_OK` → exit 0，`LINT_OK`。
- Prettier：`pnpm exec prettier --check` 檢查全部改動檔，結果 "All matched files use Prettier code style!"，exit 0。
- 驗證層級：行為驗證（setupServer 實際發 request 的測試 + 破壞性驗證）＋靜態（tsc build、eslint）。**沒有驗證**：瀏覽器實機操作（沒有啟動 dev server）。

## 改動檔案

- `src/services/mock/handlers.ts`
- `src/app/mock/legacy-adapter.ts`
- `src/app/mock/index.ts`
- `src/app/mock/__tests__/mock-handlers.test.ts`
- `src/shared/permission/__tests__/can.test.ts`

## DECISION

- **DECISION-1：瀏覽器重新整理後 session 失效（需要重新登入）**。對應 spec 條目 AC-1／AC-2。session 表依 prompt 指示放在 mock 記憶體，重新整理頁面後 MSW 的 handler 模組會重新載入，表就清空了。但 localStorage 裡的 `auth`（含 grants）還在，所以 UI 仍顯示已登入、nav 也看得到，只是所有非 public API 都回 403，要從側欄登出再登入才會恢復。舊版 token 是可預測的，所以重新整理後還能用，這是本棒的行為變更。
  - 建議 A（推薦）：接受現狀，因為 mock 的 db 本來就會在重新整理時重置（TRAPS「mock 寫入後重新整理資料就不見了」）；可以補一條 TRAPS 說明。
  - 建議 B：client 收到 403 且 session token 失效時自動 `clearAuth` 並導向 `/login`。這屬於 client 行為變更，要另開一棒處理。
  - 不建議：把 session 表持久化到 localStorage。這樣任何人都能在 storage 裡植入 `{token: "user-1"}`，等於重新打開 C1。
- verdict 的其他項目（Touches 範圍紀錄、login `grants` 例外、spec pseudo code、舊 session 遷移、TCore 文件、AC-6 手動驗收）本棒沒有處理，已轉給 main 裁決。

LIFECYCLE_PAUSE: true
