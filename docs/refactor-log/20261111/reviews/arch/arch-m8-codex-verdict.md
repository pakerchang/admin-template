審查結論：未發現會破壞目前 build／test／demo 基本功能或構成安全漏洞的問題；有不擋併入的 warning。**腳本無法滿足「任何路徑都不改變原 repo git 管理狀態」的嚴格紅線。**

已完整讀取實作報告，確認 HEAD 為送審 SHA。全程未修改檔案、commit 或建立 worktree。

1. 逐條判定 a–g

**a. AC-1～AC-4**

- **AC-1：靜態符合驗收流程，行為結果未獨立重驗。** 腳本依序刪 domain、重產 API、執行 build 與剩餘測試，最後才印成功訊息（`scripts/verify-core-only.sh:33`、`:36`、`:37`、`:77`–`:80`）。報告記錄 exit 0、18 檔／134 測試通過；本輪依指示未執行此腳本。
- **AC-2：測試設計成立。** fixture shell 實際設定 `pages["orders.list"]`，比較預設頁與覆寫頁各自的新 QueryClient 中的 query key、資料，並驗證覆寫畫面的非空列表內容（`src/app/__tests__/override.integration.test.tsx:54`、`:59`、`:123`–`:140`）。
- **AC-3：測試設計成立。** 兩條負例分別檢查缺少 suppliers 的 requires 錯誤，以及未更新 operations 時的 1.5.3 錯誤；另有更新 operations 後成功的對照組（`src/app/kernel/__tests__/module-removal.test.ts:64`–`:77`）。
- **AC-4：待驗。** 自動佐證足以支持 generic module 清單、superadmin nav 與記憶體 router redirect（`src/app/__tests__/core-only.test.tsx:55`–`:87`）；不足以取代實際登入、default shell/sidebar、瀏覽器 MSW 與 dev server 驗收。測試使用 fixture shell，並直接注入 authenticated／wildcard grants（同檔 `:45`–`:48`）。

**b. 原工作目錄與 git 狀態紅線**

**嚴格判定：不成立；一般成功路徑的檔案隔離合理。**

- EXIT trap 在 worktree 建立前已註冊，沒有「add 已開始但尚未掛 EXIT trap」的窗口（`scripts/verify-core-only.sh:21`、`:24`）。`mktemp` 至 trap 之間仍有暫存目錄洩漏窗口，但此時尚未操作 git。
- `worktree add --detach` 必然暫時修改原 repo 共用的 worktree 管理資料；乾淨的 `git status`／`git diff` 不能證明這些資料未變（`:24`）。
- cleanup 的 `worktree prune` 作用於整個 repo，可能清除其他原本存在的過期 worktree 記錄，並非只還原本次新增項目（`:18`）。
- `worktree remove` 失敗被忽略；接著先 prune、再刪實體目錄，可能留下登記。若 prune 自身失敗，`set -e` 又可能使最後的 `rm` 未執行（`:11`、`:17`–`:19`）。
- 僅註冊 EXIT，未明確處理 INT／TERM，因此不能保證所有中斷方式均清理成功（`:21`）。SIGKILL 更不可能靠 trap 保證。
- install 前已 `cd "$COPY"`，兩次 install 都帶 `--frozen-lockfile`，且設定 `HUSKY=0`；現有配置未見會導向原 repo 的 workspace 或 node_modules 連結。正常解析下依賴安裝在副本，不會更新原 lockfile（`:25`–`:30`）。pnpm store 可共用，腳本沒有固定 store 路徑；這不等同寫入原 repo 的 node_modules。
- 未見直接修改原 index、branch 或 config 的指令；但這不是對所有外部 pnpm 設定、生命週期腳本或中斷情況的絕對保證。

建議使用不登記原 repo worktree 的暫存副本，才能符合本次要求的嚴格隔離語意。

**c. 假綠風險與全量 build**

- 防呆確實擋住 **grep 零命中**，也擋住 **排除超過一半**；明列清單不能掩蓋 grep 完全失效（`scripts/verify-core-only.sh:68`）。
- 但 grep 錯誤被 `|| true` 吞掉，且「命中大於零」不能證明全部 pattern 都正常，無法擋住局部漏抓（`:43`）。
- `FULL_INSTALL_TESTS` 的七檔有實際依據，例如固定 route/module 數量，以及完整 domain URL／權限預期（`src/app/__tests__/permission-structure.test.ts:36`、`:56`；`src/shared/i18n/__tests__/module-dictionaries.test.ts:19`；`src/app/router/__tests__/router-matching.test.ts` 並不存在，實際檔案為 `src/app/__tests__/router-matching.test.ts:21`）。
- 排除並非完全沒有損失：`build.test.ts` 只因 fixture 的 `"orders.list"` 被整檔排除，連帶失去 core-only 下的 kernel 單元測試（`src/app/kernel/__tests__/build.test.ts:286`；篩選位置 `scripts/verify-core-only.sh:43`）。但 core-only 測試仍實際呼叫 `build()`，不是空跑（`src/app/__tests__/core-only.test.tsx:64`、`:84`）。
- **build 確實是 tsc + vite 全量 build**，沒有縮成部分 typecheck（`package.json:12`；`scripts/verify-core-only.sh:77`）。精確說法是「刪除 domain 與排除測試後，對副本剩餘專案執行完整 build」。

**d. core-only-strip.ts**

- **目前 modules.ts 格式下正確。** 七個 domain 都是獨立的單行 import／`.use()`；變數數量與刪行數雙重檢查可擋常見格式漂移（`scripts/core-only-strip.ts:39`–`:51`；`src/app/modules.ts:1`–`:28`）。這是格式約束檢查，不是 AST 層級的一對一證明。
- YAML 會刪頂層 domain tag，並逐 operation 刪除含任一 domain tag 的項目；只有全部 path-item key 都被刪時才移除整個 path（`scripts/core-only-strip.ts:63`–`:73`）。保留其他 operation 與共用 schema 合理。
- 多 tag operation 若同時含 generic/domain，會整個被刪；不過現行契約本來就禁止多 tag（`scripts/extract-operations.ts:67`–`:72`）。因此不構成目前合法輸入的基本功能缺陷。
- 最後 `.use()` 的分號被刪，**目前檔案結構安全**：剩餘 expression 後只有註解與 EOF，ASI 能結束陳述式（`src/app/modules.ts:20`–`:28`；`scripts/core-only-strip.ts:52`）。未來接續可串接 expression 時須重評。

**e. Override 與 throw 的證明力**

- Override 測試確實證明相同 query key、相同回傳資料內容與覆寫畫面的列表；兩個獨立 cache 比較的是深度相等，並非同一物件 identity，符合此 AC（`src/app/__tests__/override.integration.test.tsx:127`–`:140`）。
- 預設頁與覆寫頁都呼叫同一 headless hook（`src/modules/orders/ui/OrderList.tsx:81`；`src/app/__tests__/override.integration.test.tsx:28`）。
- requires 負例對應 kernel 的缺依賴檢查；orders 負例對應完整 permission catalog 比對（`src/app/kernel/build.ts:82`–`:89`、`:159`–`:168`）。
- 「刪目錄／刪 YAML／重 gen」在此單元測試內以安裝清單與 operations 過濾模擬，未真的操作檔案；屬測試強度限制，依 owner 原則不擋（`src/app/kernel/__tests__/module-removal.test.ts:37`–`:59`）。

**f. 報告各項判定**

自行決定五項：

1. **明列七檔＋grep：合理，建議 main 追認，不建議機械改回原文。** 單靠既定 grep 無法辨識無 domain 字面的完整安裝斷言；現行 guard 仍要求 grep 命中，沒有被明列清單架空（`scripts/verify-core-only.sh:46`–`:69`）。後續宜拆分混合測試，保留可在 core-only 跑的部分。
2. **build 前刪除排除測試：合理。** tsc 確實包含所有 src 測試；不刪除引用已移除 module 的測試會阻止編譯（`tsconfig.app.json:44`；`scripts/verify-core-only.sh:74`）。
3. **detached HEAD 副本：只驗已提交內容合理；來源混合須記錄。** strip helper 卻從原工作目錄讀取，原 helper 的未提交變更可影響驗證，故不是完全固定於 HEAD 的結果（`scripts/verify-core-only.sh:24`、`:33`）。
4. **測試深 import headless hook：接受為測試例外。** 證明 model 共用，但未證明 §8.1 公開 index API 的完整使用流程（`src/app/__tests__/override.integration.test.tsx:15`–`:16`）。
5. **ASI：目前安全。** 不只是因副本不跑 lint，而是目前 expression 後無其他可串接程式碼（`src/app/modules.ts:20`–`:28`）。

Spec 差異四項：

1. 漏刪 YAML 後不一定由 tsc 擋下：**接受記錄**。build 命令不執行 kernel runtime；1.5.3 由實際 `build()`／測試觸發（`package.json:12`；`src/app/kernel/build.ts:165`）。
2. sidebar 只有 team-members：**接受**。users 明確未宣告 nav，符合既有行為（`src/modules/users/index.ts:9`–`:21`）。
3. 深 import 與公開 headless API 範例不同：**info**，同自行決定 4。
4. grep 加明列清單：**warning，建議追認**，同自行決定 1。

已知問題逐項：

- **14/32 排除清單：合理但粒度過粗。** 明列檔案存在性有檢查（`scripts/verify-core-only.sh:55`–`:58`）。
- **接近一半門檻：維護限制。** 新增測試後可能預期性地 fail，並非假綠（`:68`）。
- **kernel 單元測試被誤排：成立，warning**（`src/app/kernel/__tests__/build.test.ts:286`）。
- **domain 字串殘留：info，不影響本棒基本功能。** breadcrumb、storage key、註解均可見既有殘留（`src/shared/ui/navbar/use-breadcrumb.ts:37`；`src/shared/ui/data-table/utils/table-visibility.ts:5`；`src/app/mock/core-handlers.ts:5`）。字典殘留屬既有內容，本棒未修改。
- **瀏覽器驗收待驗：成立**，自動測試明確使用 fixture 與注入認證（`src/app/__tests__/core-only.test.tsx:45`–`:48`）。

**g. Commit 獨立性**

- `74e804b` 只新增三個測試；其程式 import 未依賴第二個 commit 新增的腳本。對腳本的提及僅為註解（`src/app/__tests__/core-only.test.tsx:19`–`:20`）。**靜態未見 commit 1 依賴 commit 2 的問題。**
- `2d14695` 新增腳本、package script 與文件；build 定義未改，scripts 也不在兩個 tsconfig 的編譯範圍（`package.json:12`、`:22`；`tsconfig.node.json:24`）。
- **兩個 commit 能獨立通過 lint/build/test：靜態合理，但未獨立執行證實。** 不將報告中含未提交腳本的工作樹驗證，描述為已 checkout commit 1 重跑。

執行結果：

| 指令 | Exit code | 結果 |
|---|---:|---|
| `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"` | 1 | pnpm 建立 `_tmp_*` 遭 EPERM；eslint 本體未執行 |
| `pnpm exec vitest run` | 1 | 同上；vitest 本體未執行 |
| `scripts/verify-core-only.sh` | — | 依指示未執行 |
| `git diff --check ca6b62f..2d14695` | 0 | 靜態檢查通過 |

審查前後 `git status --porcelain` 均為空。

2. Findings

- [warning] scripts/verify-core-only.sh:18 — cleanup 對整個 repo 執行 `worktree prune`，可能移除其他過期登記；加上 add/remove 本身寫入共用管理資料，無法符合嚴格 git 狀態紅線。建議改用不登記原 repo worktree 的副本。**BASIC-BREAK: no**
- [warning] scripts/verify-core-only.sh:17 — remove 失敗被忽略，prune 在刪實體目錄之前執行；僅 EXIT trap 也不足以保證所有中斷路徑清理成功。可能留下暫存 worktree 或管理記錄。**BASIC-BREAK: no**
- [warning] scripts/verify-core-only.sh:43 — 字面 grep 會誤排不依賴 domain 的 kernel fixture 測試；明列清單亦整檔排除混合測試。驗證仍有實質內容，但涵蓋率下降，且 guard 僅能偵測零命中／過度排除。**BASIC-BREAK: no**
- [warning] scripts/verify-core-only.sh:46 — `FULL_INSTALL_TESTS` 偏離 main 裁決，建議明確追認；其必要性有測試內容支持，不建議直接改回 grep-only。**BASIC-BREAK: no**
- [info] scripts/verify-core-only.sh:33 — helper 來自原工作目錄，副本來自 HEAD；未提交 helper 可影響驗證結果。建議統一使用副本版本。**BASIC-BREAK: no**
- [info] src/app/__tests__/core-only.test.tsx:45 — 自動佐證未涵蓋實際登入與 default shell/sidebar；AC-4 瀏覽器驗收仍待驗。**BASIC-BREAK: no**
- [info] src/app/__tests__/override.integration.test.tsx:16 — 深 import 證明 headless model 共用，但公開 module index API 的換頁流程尚未被此測試驗證。**BASIC-BREAK: no**

REVIEW_VERDICT: PASS-with-fixes
REVIEWED_COMMIT: 2d1469543c91762af5106d33e9ef88414ada89ac
REVIEWER: codex-oob