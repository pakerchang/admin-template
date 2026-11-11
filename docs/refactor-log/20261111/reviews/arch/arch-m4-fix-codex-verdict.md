複審結論：C1、C2 原漏洞已解決，角色配置符合 main 裁決；仍有 session 生命週期與測試覆蓋需修正，建議 PASS-with-fixes。

HEAD、branch 均符合送審資料，工作樹乾淨。全程未修改檔案、未 commit；以下為 `arch-m4-fix-codex-verdict.md` 的審查內容。

**1. 前輪項目解決狀態**

行號均指送審 HEAD；「已解決」為原始碼查核結論，不代表本次整合測試已通過。

| 前輪項目 | 狀態 | 證據與判定 |
|---|---|---|
| C1：可偽造 token | 已解決 | `src/services/mock/handlers.ts:129–145`：128-bit 隨機 token、私有 session 表、嚴格 Bearer 格式及已簽發查核。生命週期限制另見 W1、I1。 |
| C2：profile 提權 | 已解決 | `src/services/mock/handlers.ts:149–188`：GET/PUT 均綁定 token 本人，只寫五個 profile 欄位。 |
| W3：AC-6／非 GET 覆蓋 | 部分解決 | `src/app/mock/__tests__/mock-handlers.test.ts:104–115` 已送出真實非 GET request，但沒有驗證成功 CRUD；spec `:1176` 手動驗收仍未勾選。 |
| Spec #1：TCore factory | 已解決 | Spec `:329–332` 對應 `src/app/kernel/build.ts:32–47,364–372`。 |
| Spec #2：core catalog／profile | 已解決 | Spec `:332–333` 對應 `src/app/kernel/build.ts:115–117`、`src/app/operations.gen.ts:20–23` 及本人 profile handler。 |
| Spec #3：protected route／layout | 已解決 | Spec `:381–383` 對應 `src/app/core.ts:13–15`、`src/app/kernel/build.ts:305–324`。 |
| Spec #4：404 body／login grants | 已解決 | Spec `:736,1180` 對應 `src/shared/api/mock/permission-guard.ts:49–54`、`src/app/mock/index.ts:18–24`。 |
| Spec #5：舊 session | 部分解決 | `CLAUDE.md:23` 已記錄核准的一次重新登入；新 token 每次重新整理失效的行為未記錄，見 W1。 |
| 自行決定 #2：角色政策 | 已解決 | 各 module grants 符合本輪指定矩陣；D1–D4 的實作均遵循 main 裁決。 |
| 自行決定 #4：profile 用 app:access | 已解決 | `src/services/mock/handlers.ts:178–188` 已滿足「只能讀寫本人」前提。 |
| 自行決定 #9：token 動態反查角色 | 已解決 | `src/app/mock/index.ts:31–33` 統一走已簽發 session 查核，原 profile 提權鏈已截斷。 |

**2. 本輪 findings**

Critical：無。

Warning：

- **W1 — 新登入 session 每次重新整理即失效，文件只交代升級後重新登入一次。**  
  `src/services/mock/handlers.ts:125–126` 的 session 表不持久化；`src/services/api-client.ts:20–32` 卻保留 localStorage session，`src/app/core.ts:13–25` 仍據此認定登入及提供 grants。因此重新整理後 UI 顯示已登入，但受保護 API 全回 403。這是 fix1 新增的重複性行為變更，超出 `CLAUDE.md:23` 描述的一次升級恢復流程。  
  建議：明確處理失效 session 的清除與重新登入，或補齊這項 mock 限制的文件及驗收。

- **W2 — 非 GET 測試證明通過 guard，尚未證明操作可用。**  
  `src/app/mock/__tests__/mock-handlers.test.ts:104–115` 確實使用 registry 的真實 handlers，沒有替換為 stub；目前 guard 的拒絕回應也能被斷言區分。但全部傳 `{}`，例如更新會進入 `src/services/mock/handlers.ts:85–86` 的「找不到資料」分支；login 回 401 也會通過目前斷言。其他非 403、非指定 404 body 的錯誤同樣可能通過。  
  建議：提供各 operation 的有效 payload，斷言預期 status/body，並對新增、修改、刪除驗證資料結果；完成 spec `:1176` 的瀏覽器 AC-6 驗收。

- **W3 — 角色測試未完整鎖定 admin／partner 的 grants。**  
  `src/app/mock/__tests__/role-visibility.test.tsx:56–80` 主要比較 nav 與 users 寫入權。admin 多給 `users:update` 會失敗、partner 少 `tags:read` 會失敗；support 多給額外 grant 也會被 `mock-handlers.test.ts:56–65` 的完整陣列比較抓到。  
  但 partner 的 `tags:read` 改成 `tags:*`，或 admin 少掉其他 module 的寫入權，nav 與 users 斷言仍可全部通過。  
  建議：對四角色的完整 grants 做固定期望集合比較，補上讀取與寫入邊界。

Info：

- **I1 — 登出不撤銷已簽發 token。**  
  `src/shells/default/app-sidebar.tsx:51–54` 只清 client session；`src/services/mock/handlers.ts:125–145` 沒有撤銷或到期機制。因此已保存的 token 在同一 mock runtime 內仍有效。這不是任意 token 偽造漏洞，也延續既有 client-only logout 限制，但 session 表並未提供完整登出語意。建議明載限制，若要求登出後不可重播，再增加撤銷路徑。

**其餘逐項查核**

- **a．Token：已解決，生命週期另列上述項目。** 全 repo 搜尋未發現 production token→user 旁路；只有 guard 與 profile 經 `mockUserOfAuthorization` 查詢。測試中的自行解析 header 是隔離 fixture。session 表唯一寫入點是成功 login 的 `issueToken()`，請求不能指定 token 或覆寫映射。
- **Header 邊界：** Node `Headers` 實測確認 header 名稱大小寫不影響讀取；重複 Authorization 合併後無法通過 regex；空值、只有 `Bearer` 均拒絕。前後 HTTP 空白會由 `Headers` 修剪，最後仍須匹配已簽發 token，沒有形成授權繞過。
- **b．Profile：已解決。** 白名單排除 `id`、`user_id`、`role`、`grants`、`status`、email 等所有非列舉欄位。`legacy-adapter.ts:17–20` 對每個 handler 從 request header 注入 authorization；body/query 無法覆蓋，未發現 profile 另讀其他來源。
- **c．W3：部分解決。** 真實 request 會進 handler，但成功操作與完整 AC-6 尚未驗證，見 W2。
- **d．角色矩陣：實作已解決，測試部分解決。** D1 開放 support／partner、D2 product/orders 分界、D3 admin 無 users 寫入權、D4 其他頁至少可讀，均符合 main 裁決。核對 `6029bf0` 確認 products/orders 條件原本只有定義、沒有消費點，support／partner 原本也被 layout 擋住；所以測試期望是「依 main 裁決調整後的矩陣」，不是歷史畫面的逐字重現。測試 `:36–41,56` 的描述宜同步釐清。
- **e．Spec／CLAUDE.md：已解決，W1 除外。** `2988875` 僅修改這兩份文件；差異限於核准的五點、Touches 例外及角色矩陣。factory、catalog、profile、layout、404、login grants 均與實作對應，未發現額外政策修改。
- **f．新問題／逐 commit 可建置性：部分解決。** 未見新增型別編譯阻礙；profile 延續既有 `unknown` mock 資料模型，沒有重新開放身分欄位。逐 commit 實際 build/test 尚未獨立重現。

**3. 測試與證據限制**

執行指定指令：

```text
pnpm exec vitest run src/app/mock src/shared/permission
```

exit 1，pnpm 建立 repo 內 `_tmp_35204_…` 時遭 `EPERM` 拒絕，Vitest 尚未啟動。這是 read-only sandbox 限制，不列 finding。

另已完成：

- Node `Headers` 與實際 Bearer regex 邊界檢查，exit 0；未視為整合測試。
- `git diff --check acd05c0..2988875`，exit 0。
- 核對四個 commit 順序，以及 `6e30216`、`2988875` 的 `src` 完全相同。

修正報告的逐 commit 結果具有合理一致性，但仍屬實作方證據：

| Commit | 報告宣稱 | 本次核對 |
|---|---|---|
| `047f401` | build、275 tests 通過 | 變更與新增測試數相符；未獨立重跑 |
| `8395203` | build、277 tests 通過 | 增加兩個 profile 測試，數量相符；未獨立重跑 |
| `6e30216` | build、283 tests 通過 | 新增六個角色測試，數量相符；未獨立重跑 |
| `2988875` | build、283 tests 通過 | 確認僅文件變更、src 與前 commit 相同；未獨立重跑 |

報告已坦承以 commit 前工作樹驗證、未逐一 checkout 重跑；不能將其提升為本次獨立驗證結果。

REVIEW_VERDICT: PASS-with-fixes
REVIEWED_COMMIT: 2988875014dddb51661d2ace59f458066fb52f02
REVIEWER: codex-oob