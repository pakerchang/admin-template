審查結論：有兩項 critical 權限漏洞，應修正後重審。以下為 `arch-m4-codex-verdict.md` 的審查內容；依只讀要求，未建立檔案、未 commit。

所有行號均指送審 HEAD。`git rev-parse HEAD` 確認為指定 SHA，`git status --short` 無輸出。下列行為判讀以原始碼與測試內容為據；本次沒有成功執行整合測試。

**Findings**

1. **critical — 可直接偽造 superadmin token，無須登入。**

   `src/services/mock/handlers.ts:123–128` 以 `mock-token-${userId}` 產生 token，驗證時只搜尋相同 user id，沒有檢查該 token 是否經登入簽發。`src/services/mock/data.ts:30–42` 明確給出 superadmin 為 `user-1`。

   因此直接送出 `Authorization: Bearer mock-token-user-1`，就會被辨識為 superadmin，再由 `src/app/mock/index.ts:31–33` 展開為 `["*"]`。把 support token 的 `user-3` 改成 `user-1` 也有相同結果。甚至省略 `Bearer ` 仍會保留完整 token 並通過反查。

   現有「偽造 token」測試只測 `"forged"`：`src/app/mock/__tests__/mock-handlers.test.ts:94–100`，不能證明偽造或竄改有效格式 token 會被拒絕。

   應改為查核實際簽發的 session/token，並增加「未登入但猜中既有 user id」及「竄改 token 指向其他使用者」的拒絕測試。

2. **critical — `app:access` profile API 可修改 superadmin，並繞過角色更新權限。**

   新 operation 表將 `GET/PUT /user/me/profile` 配給 `app:access`：`src/app/operations.gen.ts:20–22`。但既有 handler 的 `currentUser()` 固定選 demo 帳號，沒有根據 request token 選登入者：`src/services/mock/handlers.ts:120–121`。

   因此 support／partner：
   
   - GET profile 讀到的是 demo superadmin。
   - PUT profile 會執行 `Object.assign(currentUser(), body, ...)`，接受任意欄位，包括 `role`、`user_id`：`src/services/mock/handlers.ts:150–153`。
   - 例如 support PUT `{ "user_id": "user-3", "role": "superadmin" }`，會把前面的 demo 使用者改為同一 user id；之後 token 反查的 `find()` 會先找到此 superadmin，取得全部 grants。

   這條路徑不需要 `users:update-role`，繞過了 `src/app/operations.gen.ts:23` 的角色更新保護。雖然 profile handler 本身既有，本次將它開放給新角色並接上動態 token→role，形成新的可達提權鏈。

   應依 token 綁定本人、限制 profile 可寫欄位，並禁止透過 profile 修改角色及身分識別欄位。

3. **warning — AC-6 手動驗收尚未完成，現有自動測試不足以替代。**

   Spec `docs/specs/fsd-module-architecture.spec.md:1160` 要求 superadmin 所有頁面與操作仍可見可用。自動補強只驗：
   
   - route load 沒有 `ForbiddenError`，未證明頁面正常渲染或 CRUD 成功：`src/app/__tests__/permission-structure.test.ts:45–68`。
   - API 迴圈明確跳過所有非 GET operation：`src/app/mock/__tests__/mock-handlers.test.ts:78–84`。
   - rowActions 使用人工 fixture，未涵蓋實際各頁操作：`src/components/shared/__tests__/data-table-row-actions.test.tsx:66–69`。

   應補做 spec 指定的手動驗收，特別是實際修改、刪除、上傳及表單送出。

**AC 逐條核對**

「滿足」在此表示原始碼及測試斷言對應要求，不代表本次重跑成功。

| AC | 判定 | 依據 |
|---|---|---|
| AC-1 | 滿足 | 真實 shell 測試斷言 `/users` URL、sidebar、`main` 內 Forbidden；亦涵蓋巢狀頁面：`src/app/router/__tests__/forbidden-boundary.test.tsx:53–78`。users 本來沒有 nav，見 `src/modules/users/index.ts:7`，所以「無 users 項」單獨不足以證明過濾，但測試另有 orders 可見、products 不可見。 |
| AC-2 | 滿足列出的七項；安全要求部分滿足 | 七個 setupServer 情境均有具體 response／handler 斷言：`src/shared/api/mock/__tests__/permission-guard.test.ts:59–138`；但實際 token 驗證存在 finding 1。 |
| AC-3 | 滿足 | 真實表與 handler 集合精確比較，逐一刪除每個 permission key 並斷言 throw：`src/app/kernel/__tests__/operations-gen.test.ts:24–41`。 |
| AC-4 | 滿足 | hide、disable、callback row 有斷言：`src/components/shared/__tests__/data-table-row-actions.test.tsx:51–63`；FormSubmit 強制 `disabled={!allowed || disabled}`：`src/shared/ui/form-submit.tsx:20–26`。 |
| AC-5 | 滿足 | 子樹逐 route 檢查 permission：`src/app/__tests__/permission-structure.test.ts:24–41`。diff 已移除 `useUserPermissions` 定義及消費點。 |
| AC-6 | 部分 | 有自動補強，manual 未完成，見 finding 3。 |
| AC-7 | 滿足 | boundary 位於 `src/app/router/forbidden-boundary.tsx:13–18`；`shared/permission` 搜尋未發現 app／shells import。 |

**Touches、Must-Not-Touch 與紅線**

對照 spec `docs/specs/fsd-module-architecture.spec.md:1162–1163`：

- **並非完全落在列舉的 Touches**：`src/shared/ui/form-submit.tsx` 與測試、`src/components/shared/__tests__/data-table-row-actions.test.tsx`、`src/services/__tests__/api-client.test.ts`、spec、`CLAUDE.md` 都有變更。FormSubmit 又是 AC-4 明確要求的產物，測試也是直接驗收所需；建議補齊範圍紀錄。報告所稱 CLAUDE.md 額外授權，無法只從 diff 證實。
- **未發現 Must-Not-Touch 違反**：articles、orders、product 的 diff 僅將既有 action callback 包成 permission 宣告，沒有改業務流程。
- **未發現新增 `/403` route**：ForbiddenBoundary 直接渲染 shell component，見 `src/app/router/forbidden-boundary.tsx:13–18`。
- **未發現 URL、route id、i18n key 或 API 路徑變動**：頁面 diff 保留原 navigation 目標；operation 表覆蓋原 handler paths 的測試採集合相等比較。
- **未發現正常新登入 superadmin 可見範圍縮減**：`"*"` 能通過 route、nav、action 判斷；完整「可用」仍待 AC-6。
- **login body 確實新增 `grants`**：`src/app/mock/index.ts:24`。這符合 §6.1 明文要求，但若將「body 不變」解釋成逐欄完全一致，就存在規格衝突；應由 owner 明定這項新增欄位為例外，不能宣稱 body 完全未變。

**Fail-closed 與行為變更**

- API 範圍外放行、未知 operation 404、未宣告 permission 403、public 放行、無 grants 403，實作順序符合 R22：`src/shared/api/mock/permission-guard.ts:44–68`。
- 未帶 token 會得到空 grants；未知 token 也會拒絕。但「可預測的有效格式 token」不會拒絕，見 finding 1。
- `sessionGrants()` 缺 `app:access` 時回空陣列，包含仍有 domain grants 的情況：`src/app/core.ts:13–15`。對應 shell 保留、nav 空、內容 Forbidden 的測試存在：`src/app/router/__tests__/forbidden-boundary.test.tsx:81–85`。
- 沒有 provider 時 `useCan` 預設空 grants，nav 預設空集合；rowActions 經同一 `useCan` 拒絕：`src/shared/permission/use-can.ts:11–16`、`src/shared/module/use-visible-nav.ts:8–18`、`src/components/shared/table/row-actions.tsx:25–38`。
- `can()` 使用嚴格字串相等，只接受 `"*"`、完整 permission 或相同 resource 的 `:*`，未見大小寫、前綴或子字串授權繞過：`src/shared/permission/can.ts:4–6`。operation catalog 比對包含完整 action，且禁止 wildcard：`src/app/kernel/build.ts:126–128,159–168`。
- 未宣告 route permission 會進入 `can(..., undefined)` 而出錯，並非放行；但沒有友善的 build-time 診斷。現有安裝 route 有結構測試兜底。
- support／partner 可進後台符合 §6.1 明列的 `coreGrants`；R10 決定的是 Forbidden 的呈現位置，不能單獨當作角色開放的依據。
- 舊 session 缺 grants 時回空，沒有默默提權。`isAuthenticated()` 仍為真，手動進 `/login` 會被導回 `/`；但 sidebar 的 logout 可清除 session，再登入，見 `src/app/core.ts:25`、`src/app/kernel/build.ts:306–314`、`src/shells/default/app-sidebar.tsx:51–54`。因此不是卡死，但沒有升級提示，恢復流程不直觀。

**「自行決定」1–14**

| # | 判定 | 理由／依據 |
|---|---|---|
| 1 | 合理 | factory 在 build 時收到 module grants，guard 排首位：`src/app/kernel/build.ts:362–370`、`src/app/mock/index.ts:47–52`。應同步 TCore spec。 |
| 2 | 合理 | support／partner 的後台入口符合 §6.1；partner 的 supplier/tag read 支援 product 依賴。權限分配仍應由 owner 確認為產品政策。 |
| 3 | 合理 | action 名稱與 operation 表及完整 catalog 驗證一致：`src/app/operations.gen.ts:19–49`。 |
| 4 | 需修正 | core catalog 加 `app:access` 合理：`src/app/kernel/build.ts:115–122`；profile 配置尚未滿足「本人」前提，見 finding 2。 |
| 5 | 合理 | 先清空 grants 可保留 shell，符合 §6.2；有缺 app access 的測試。 |
| 6 | 合理 | context 注入避免 shared 反向依賴，無 provider 拒絕：`src/shared/permission/use-can.ts:11–16`。 |
| 7 | 合理 | closure 使用 build 已知 shell，保留非 Forbidden 錯誤處理：`src/app/router/forbidden-boundary.tsx:13–18`。 |
| 8 | 合理 | 保留舊 404 body 優先滿足相容性；與 spec 範例文字的衝突應明訂：`src/shared/api/mock/permission-guard.ts:50–55`。 |
| 9 | 需修正 | token 反查不是已驗證的 session，允許猜測及竄改；動態 role 又與任意 profile 更新形成提權鏈。見 findings 1、2。 |
| 10 | 合理 | 真實矩陣整合測試有切換到 registry handlers：`src/app/mock/__tests__/mock-handlers.test.ts:46–49`，避免全部只測 core fixture。 |
| 11 | 合理 | helper 保留同形狀表，且有完整 paths 集合測試：`src/app/operations.gen.ts:8–13`、`src/app/kernel/__tests__/operations-gen.test.ts:24–27`。 |
| 12 | 合理 | 呼叫點同步轉為明確 permission 物件；未見遺留函式型消費點。 |
| 13 | 合理 | UserList 分開宣告 update 與 update-role；FormSubmit 指定 users:update：`src/pages/users/UserList.tsx:154–168`、`src/pages/users/UserForm.tsx:62–70`。 |
| 14 | 合理 | Guarded 是低頻逃生口，非本棒 AC；沒有消費點時可延後。應在 spec 註明未實作。 |

**「spec 模糊或矛盾處」五點**

| # | 處理判定 | 是否升報 owner |
|---|---|---|
| 1：TCore 靜態 handlers 與矩陣組裝 | factory 解法恰當，見自行決定 1。 | 應同步介面文件；無須阻擋技術方案。 |
| 2：core operation 不在 module catalog | 加 core catalog 恰當，但 profile 安全性未解決。 | 是，明訂 core catalog 與 profile 權限；漏洞須先修。 |
| 3：protected beforeLoad 與保留 layout 衝突 | 清空 grants、讓子 route Forbidden 的處理符合 §6.2，且有對應測試。 | 是，更新 pseudo code，避免後續照舊碼回歸。 |
| 4：404 body 範例與 body 不變 | 保留既有 body 恰當。 | 是，同時明訂 login 新增 grants 的例外。 |
| 5：舊 session 沒有 grants | 安全上 fail-closed、可登出恢復；欠缺提示。 | 是，確認接受一次重新登入，或加入明確遷移流程。 |

**測試有效性與驗證限制**

七項破壞性驗證的「應被測試抓到」都有相應斷言：route guard、nav filter、rowActions filter、未宣告 operation、403 status、缺 key build failure、Forbidden 所在 DOM 位置。從測試內容看，這些不是單純存在性測試。

但本次未重跑 mutation script，不能獨立確認報告所載的失敗數與還原結果。尤其整組驗證仍漏掉：

- 猜中／竄改成既有使用者 token。
- profile 根據 token 選本人，以及拒絕 role/user_id 等欄位。
- 真實 superadmin 非 GET CRUD 操作。
- 舊 session 登出再登入的完整恢復流程。
- 權限字串大小寫、額外冒號、空白等負向測試；目前 `can` 測試只有基本 wildcard 與 `order:*` 不匹配 `orders:read`：`src/shared/permission/__tests__/can.test.ts:10–18`。

執行 `pnpm exec vitest run` 得到 exit 1：

```text
EPERM: operation not permitted, open '.../_tmp_60852_...'
```

測試未啟動，原因是 read-only sandbox 禁止 pnpm 建立暫存檔。此限制不列為 finding。

逐 commit 核對方面，實際執行：

```text
git range-diff 8458b19..66e94c0 3c92e5a..acd05c0
```

五筆均為 `=`，與 rebase 報告一致。但沒有重新 checkout／build 各 commit；報告宣稱的逐 commit 229／240／252／262／262 tests 通過，仍屬實作方證據，本次未獨立重現。

REVIEW_VERDICT: FAIL
REVIEWED_COMMIT: acd05c0ff0745b253aa8516fc2da60f99e6c694f
REVIEWER: codex-oob