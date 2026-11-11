## 2026-11-09 owner 裁決（main 轉達）— spec 修訂棒放行
**架構定名改變（load-bearing）**：最上層不再是 FSD，改為 **Microkernel（Plugin）Architecture + Modular Monolith（vertical slice）**；FSD 只作為命名參考，不套 FSD 官方規則（不用 steiger）。目標樹：
```
src/app/            # kernel：createApp().use()、registry、router 組裝、MSW guard、shell 掛載
src/shared/         # domain-free：ui(shadcn)、lib、api fetcher、permission/ABAC 引擎
src/shells/default/ # 可替換 UI shell（layout、nav 呈現、頁面覆寫）
src/modules/<id>/{api,model,ui,mocks,index.ts}   # index.ts = defineModule，唯一公開 API；module 內 api→model→ui 單向
```
- 換 UI 機制：module 拆 headless（model：hooks/schema/permissions/columns）與預設 ui；shell/theme 依 route id 覆寫頁面（如 `override('orders.list', Page)`），可逐頁替換。
- OQ-1 module 內嵌（如上）｜OQ-2 接受 typed route 寬化，module 內用 route 物件導航｜OQ-3 各 module 自帶 seed｜**OQ-4 ABAC 現在一起設計**：請在 spec 提出條件模型（擁有者 / 欄位層級 / 其他）、與 role×resource×action 矩陣的組合方式、demo 情境，列成選項給 owner 裁，不要自行定案｜OQ-5 ESLint 9 flat config 先於重構（deps chain 負責），邊界用 eslint-plugin-boundaries 寫在 flat config｜**OQ-6 加 `requires` 欄位**，createApp 啟動檢查｜OQ-7 `/` redirect 第一個可見 nav｜**OQ-8 403 在 layout 內容區渲染 UnauthorizedPage**（保留 URL 與 shell），不做獨立 /403。
- API 層（api chain 定案）：orval；手寫 openapi.yaml 為契約真相；mockHandlers 改 MSW `HttpHandler[]`，kernel 最前掛 `http.all('*')` 權限 guard；權限表由 module 宣告，經 operationId→permission 中間格式（保留日後轉 YAML x-permission 的路徑）。orval 產物與 MSW handler 落在 `modules/<id>/api` 與 `mocks`，shared 只留 fetcher mutator 與 guard。具體 orval 輸出切法以 api chain PoC 結論為準（spec 先寫契約，標註待 PoC 確認）。
- 重排 milestone：deps chain 的 P0（Node 22）+ P1（ESLint 9）為重構前置；spec milestone 依新樹重切。
- 派一棒 spec 修訂（同 branch docs/fsd-architecture，用 worktree；同檔可改標題，路徑不變）。修訂後需 codex review：**review 子 session 必須在 admin-template worktree 內進行（base=master、head=docs/fsd-architecture）**，上次在 ~/.claude cwd 審是空 diff；若 wrapper 做不到，report [BLOCKED] 說明，不要繞過。
- 修訂完成 report [DECISION]（附 ABAC 選項），然後 hold；AI 文件棒等 owner 確認修訂版後才派。
## 2026-11-09 追加（api chain 定案，spec 修訂需納入）
- MSW 權限 guard **fail-closed**：每個 operation 必宣告 permission，公開者明確標 `public`；中間格式 `OperationPermissions = Record<operationId, permission | "public">` + `OperationRoute[]`（routes 由 YAML 產生）。
- PoC 已知限制寫進 spec 風險：orval handler status 寫死 200（錯誤情境需 module 手寫 handler）；msw 3 `onUnhandledFrame`；fetch client 回傳需 mutator unwrap。PoC 報告：/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/poc-orval-report.md
## 2026-11-09 owner 裁決 4（main 轉達）— 修訂版 OQ
- OQ-10 ABAC = C 命名條件（`orders:update?status-editable`，module 註冊判斷函式，內建 own）；B 欄位層級日後獨立；不採 CASL。ABAC 實作另開一棒，不進 M1–M8。
- OQ-9 = 每 module 一份 openapi yaml + common.yaml（仍是手寫契約；a2 PoC 實測確認）。
- OQ-11 = 冒號分隔 `orders:read`（api chain 已同步）。
- OQ-12 照暫定：ui 不直接 import api 型別，經 model 轉出。
- OQ-13 = **直接用 route id** 作為可覆寫 page id，不新增 `pages` 欄位（改 spec 暫定案）。
- OQ-14 = 已裁 fail-closed + 明確 public（見追加），build() 時檢出未宣告。
- 下一步：把 OQ-13 與上述裁決併入 spec（若 codex review FAIL 需修正棒，一併處理；若 PASS 則派一小棒更新 OQ 段落並再審）。codex PASS + 裁決落定後 report [DECISION] 請 owner 確認修訂版，確認後才派 AI 文件棒。api PoC 報告已存在：/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/poc-orval-report.md
## 2026-11-09 owner 裁決 5（main 轉達，覆蓋裁決 4 的 OQ-9）
- **OQ-9 改為 B：單一手寫 openapi.yaml**，依 tag 分 output 到各 module（a2 實測兩方案產物 byte 相同，B 無 $ref/撞名/bundle 機制、可直接換後端文件）。刪 module = 刪 yaml 對應 tag paths + 目錄。
- 目錄修正（採 a2 建議）：`modules/<id>/api/` 整個是 orval 產物（含 `api/model/`，受 clean:true 管理）；`modules/<id>/model/` 為手寫 domain model；`modules/<id>/mocks/` 下手寫 override 不得命名 `*.msw.ts`；routes+permissions → `src/app/operations.gen.ts`（kernel）；共用信封 `ApiEnvelope<T>`/`ErrorBody` 手寫在 `shared/api/`，各 module 產物重複型別接受不 dedupe。
- 建議 extract 腳本斷言每個 operation 恰一個 tag、operationId 唯一。a2 報告：/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/poc-module-split-report.md
## 2026-11-09 owner 裁決 6（main 轉達，spec 需納入）
- 權限來源分工（owner 裁決 6）：operation→permission **只在 YAML `x-permission`**（public 用字面值 `public` + `security: []`）；權限目錄（resource/action，含非 API 操作如 `orders:export`）、角色預設 grant、ABAC 條件判斷函式由 **module `permissions`** 宣告；gen/build 期檢查：每個 x-permission 值必須存在於某 module 的權限目錄，否則失敗（抓 typo 與刪 module 殘留）。
- a3 guard 判定規則與介面：/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/poc-guard-fail-closed-report.md（不在 apiBaseUrl 下放行、無 route 404、未宣告 403、public 放行、無權限 403）。
## 2026-11-09 owner 裁決：修訂版 spec 定案 + 7 項待裁（main 轉達）
- 修訂版 spec（docs/fsd-architecture @ 07dcae4，Codex PASS）owner 確認定案。
- 7 項全部照 arch lead 建議：
  1. OQ-16 route id = A `${moduleId}.${name}`（如 `orders.list`），typed key。
  2. apiBaseUrl：mock 模式用專用絕對 origin（未設定 / 同源根目錄 → 報錯），不動既有 API 路徑（/admin、/user、/api 前綴維持）。main 已同步通知 api chain。
  3. 未帶 token 的 API 回 403（照 a3）。
  4. guard 用 `getGrants + can()`（支援 D5 wildcard）。
  5. R21 分兩期檢查（gen 期查格式與 `security: []`；目錄比對放在 build / vitest），並擋「非 public 卻寫 `security: []`」。
  6. M3 過渡期 operation 全設 public，M4 起 fail-closed。
  7. OQ-15 `/admin/images` 歸保留 tag `core`（client 與 mock 手寫）。
- 寫回方式：走你的預設——在同一 worktree 派一小棒把裁決寫回 spec，送 Codex 再審（新的審查循環，不佔舊額度則依 gate 判定）。PASS 後 report，再派 AI 文件棒（專案 CLAUDE.md、.claude/skills 的 add-module / declare-permission、docs/TRAPS.md；不重建專案層 agents/rules）。不 push、不開 PR。
## 2026-11-09 流程規則：Done Command 寫法（main 轉達，立即生效）
- 已查證：Bash 工具裡 `set -e` / `set -euo pipefail` / 子殼 `( set -e; … )` 全部無效，多行或 `;` 串接的 block，exit code 只代表最後一句，ledger 會記成 exit 0 tainted=false（假綠燈）。報告：/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/setE-ledger-probe-report.md
- 從現在起所有子 session 的 Done Command 與驗證指令必須：
  1. 全部用 `&&` 串成單一鏈（可用 ` \` 換行），sentinel 放鏈尾，如 `… && echo DONE_COMMAND_OK`；或
  2. 放進新 process：`bash -euo pipefail -c '…'` / `bash -euo pipefail script.sh`。
- 派新棒時把這條寫進 prompt；已在跑的棒不用中斷，交付時檢查其 Done Command 是否符合，不符就在 report 註明並補跑一次 `&&` 版本。
## 2026-11-09 owner 裁決：重構期間凍結新增 module（main 轉達）
- 凍結到 M8 驗收完成：重構期間不新增第 11 個 module，spec（M3 AC-1、M6 AC-3、M7 AC-3 的「恰好 10 個」）不改。
- add-module skill 與 TRAPS 標註「M8 驗收前不要新增 module」。若 s14 已 commit，下一個合適的棒順手補上即可，不用為此單獨開棒。
## 2026-11-09 owner 裁決：文件確認 + 缺口 2 + merge 策略（main 轉達）
1. AI 文件（docs/fsd-architecture @ baf53f0）owner 確認。
2. 缺口 2：M4 前允許沿用 `useUserPermissions()` 語意方法，禁止新增直接比對 role 的寫法；M4 統一換成宣告式。照你的建議寫進 M1 棒順手補的文件標註即可，不另開棒。
3. merge 策略：授權 push `docs/fsd-architecture` 並開 PR 到 master（PR body 不加 AI 署名）。注意 origin/master 已前進到 1614c24（P0 #4 + P1 #5 已 merge，M0 前置完成）；開 PR 前先確認無衝突（有衝突就 rebase 到 origin/master 並重跑 `pnpm exec vitest run && pnpm build && echo DONE_COMMAND_OK`）。report PR URL 後 hold 等 owner merge。
4. M1：等 docs PR merge 後，從 merge 後的 origin/master 開 M1 branch/worktree 再派。M0 已完成，不用另外等。
## 2026-11-09 owner 通知：docs PR #6 已 merge，放行重構 M1（main 轉達）
- PR #6 已 merge：origin/master = 60509541b8db990619de3754d5459625d3daff95（main 已用 gh 驗證 MERGED）。spec、CLAUDE.md、skills、TRAPS 已在 master。
- 放行 M1（Kernel 契約與權限引擎）：先 fetch，以 origin/master 6050954 為 base 開新 worktree（../admin-template-arch-m1）+ feature branch。照 spec §9 M1 的 AC / done command，prompt 帶 `[gate:M1]` + pseudo code + test stub；Done Command 用 `&&` 單鏈或 `bash -euo pipefail -c`。順手補「M8 驗收前凍結新增 module」與缺口 2 的文件標註。
- 注意與 deps P2（Prettier 3，全專案 reformat，branch chore/deps-p2-prettier3，尚未 merge）的交互：M1 新增檔照目前 master 的格式寫即可；P2 merge 後 M1 若尚未 merge，rebase 到新 master 並跑一次 prettier --write 於 M1 新增檔再重驗。
- M1 完成並 Codex PASS 後：push + 開 PR 到 master（不加 AI 署名），report PR URL 後 hold 等 owner merge，再進 M2。
## 2026-11-09 owner 裁決：milestone 的 spec 綁定（main 轉達）
- owner 選「派工前先給 at-grant」。但 main 查 ~/.claude/docs/HARD_RULES.md:68：at-grant 必須是 owner 在**該子 session**的 AskUserQuestion 點選 `[at-grant:<sha12>]` label 才算數，main session 代給無效。
- 因此實際做法：M2 起每棒派工 prompt 開頭就要求子 session **第一個動作**用 AskUserQuestion 提出 `[at-grant:<sha12>]`（綁定 worktree 內的 spec 路徑）選項，讓 owner 在開棒時一次點掉，不要在寫 src 中途才卡住；派出後立刻 report [BLOCKED] 標明 tab。
- 若你查到更好的機制（例如 dispatch 不用 @ 檔而直接帶 tag），先 report [DECISION]，不要自行改 harness。
- M1 目前在 tab w1:t39，owner 選 1（綁定 worktree spec）。
## 2026-11-09 owner 通知：P2 Prettier 3（PR #7）已 merge（main 轉達）
- origin/master = fcc673a5c7b39051b156fa6872d05902a3fd26b4（main 已用 gh 驗證 MERGED）。
- M1 照先前 inbox 處理：M1 commit 完成後、送 Codex 前，rebase feat/m1-kernel-contracts 到 origin/master fcc673a，對 M1 新增/修改檔跑 prettier --write（有變更就併入對應 commit 或另加 style commit），再用 && 單鏈重跑 Done Command + prettier --check。Codex 審的 commit 以 rebase 後為準。
## 2026-11-09 owner 裁決：nav 權限比對粒度（main 轉達）
- 改為比對完整 `resource:action`（與裁決 6 一致，可抓 action typo）。spec §4.3 1.4 / AC-2 與 M1 實作一起改，declare-permission skill 維持原說法。
- 做法：在 M1 送 Codex 前，與 P2 rebase + prettier 同一個修正棒處理（補對應測試：未宣告的 action → build 失敗）；用 && 單鏈重驗後再送 Codex 審（審查對象是修正後的 HEAD）。
- 子 session 自行做的實作選擇照你的建議交 Codex 判斷。M2 的 msw / @vitest/mocker peer 警告記下，M2 驗證。

## 2026-11-10T00:28 Codex 額度已重置（main 轉達）
- 現在派 M1 #16h review 棒（prompts/m1-review.md，審 b445350）。PASS 後依原計畫 push + 開 PR 到 master（PR body 繁中、不加 AI 署名），report PR URL 後 hold 等 owner merge。
- 注意：Claude 5h 額度約剩 2%（05:00 重置），若子 session 因額度停住，report 標 [BLOCKED] 註明即可，不要重派重試。

## 2026-11-10T00:55 owner：M1 #8 已 merge（main 轉達）
- origin/master = 46d13b6（PR #8 merge）。M1 完成。
- 放行 M2（MSW 取代 mockFetch，行為不變）：從 merge 後的 origin/master 開新 worktree/branch 再派。M2 棒順手把 CLAUDE.md 架構遷移表 M1 狀態改為「完成（#8）」。留意 `@vitest/mocker` 對 msw@^2.4.9 的 peer 警告（M2 驗證）。
- 照舊：Done Command 用 && 單鏈 + sentinel；子 session 第一動作為 at-grant AskUserQuestion，lead 立即 report tab。codex 額度已重置。
- worktree 清理：admin-template-arch-spec-rev 與 admin-template-arch-m1 可在確認無未推送內容後移除（git worktree remove，非 --force；有髒檔就停下回報）。

## 2026-11-10T01:06 owner 裁決：M2 Q1/Q2 + 合併順序（main 轉達）
- Q1：採 **A**（自訂 vitest environment 把 AbortController/AbortSignal 換回 Node 版）。授權 Touches 擴到 `vite.config.ts` + 一個新環境檔。實測無效退回 C（happy-dom），退 C 前先 report。
- Q2：**預設開 mock**，只有 `VITE_API_MOCK === "false"` 才關；`.env.example` 寫明；spec §9 M2 補一句預設值說明（AC-5 不改）。
- 子 session 自行決定的 navigate 放行與 404 fallback 前綴範圍：交 Codex 審。
- 合併順序：**M2 先 merge**；deps P3 之後 rebase 到 M2 上重驗。M2 PR 開出後在 report 寫明，main 會轉告 deps。
- tab 清理：子 session 交付後一律用 wrapper 的 close 關 tab；請補關 M1 期間已結束但未關的子 session tab（m1-kernel、m1-fix1、m1-fix3、m1-fix4、各 review 棒），以及先前失敗留下的空 `arch-m1` tab（如能關）。report 列出已關清單。

## 2026-11-10T01:08 決策權變更（main 轉達）
- owner 暫離，授權 main 依 spec 絕對優先代為裁決，直到重構 goal。[DECISION] 照舊寫 report，main 會在 inbox 回覆裁決（不再等 owner）。請在 [DECISION] 附上 spec 條目出處與你的建議，加快裁決。
- cc-git-write 確認框與 at-grant 仍需 owner 親點；卡在這兩種時標 [BLOCKED] 並註明 tab，繼續做不依賴它的工作。

## 2026-11-10T01:18 決策路由變更：子 session 不得再向 owner 發問（main 代理決策）
owner 已離開第一線，子 session tab 內的 AskUserQuestion 沒有人會回答。即日起：
1. **spec 綁定不再用 AskUserQuestion**：每個子 session prompt 第一行必帶 `[spec:<絕對路徑>]`（#2b 逃生口，prompt 本文即生效；main 的 s16–s19 已實測不會跳綁定問題）。不使用 @ 檔標記（會觸發 at-grant，只有 owner 能點）。
2. **子 session 遇到決策**：不得 AskUserQuestion；寫進交付報告標 `DECISION`（附 spec 條目 + 建議）後 `LIFECYCLE_PAUSE: true` 結束。lead 能依 spec 自裁就自裁；不能就寫 report `[DECISION]`，main 會在 inbox 回覆。
3. **git 寫入**：cc-git-write 確認框目前仍需 owner 親點（放行 hook 尚未 merge）。子 session 盡量把 git 寫入集中到棒尾一次（一次 add + 一個 commit 指令），減少確認次數；卡住時標 [BLOCKED] + tab，lead 繼續做不依賴它的事。
4. **arch 立即處理**：`m2-msw-cont` 若仍卡在 spec 綁定問題，關掉它並以帶 `[spec:<M2 spec 絕對路徑>]` 首行的 prompt 重派（worktree 內未 commit 的改動保留，prompt 交代接手）。

## 2026-11-10T01:22 全域 cc-git-write 確認框已移除（main 轉達）
- owner 已移除全域 permissions.ask 的 cc-git-write：commit / push / rebase / pr-create 不再跳確認框（auto mode 仍可能擋個別指令；被擋標 BLOCKED，不繞道）。受保護 branch guard、raw git / gh pr create|merge 的 deny 不變。
- 先前卡在確認框的子 session 不會自動恢復：請關掉並重派（未 commit 改動保留在 worktree，prompt 交代接手）。
- PR 仍不 merge；merge 由 main 安排。

## 2026-11-10T01:25 main 接手 m2-msw-cont（main 轉達）
- m2-msw-cont 卡在確認框、lead 01:08 後未回應 inbox → main 已關閉它並派 `s21-m2-finish` 收尾（commit 剩餘文件、最終 HEAD 跑 Done Command），報告寫 scratchpad/m2-finish-report.md。不 push、不開 PR、不送 codex。
- arch lead 醒來後：讀 m2-finish-report.md，接手 M2 的 codex review → push → 開 PR 流程（push / pr-create 不再跳確認框）。請先處理 01:18、01:22 兩則 inbox 並在 report 回覆。

## 2026-11-10T01:29 更正：spec 綁定方式（main 轉達）
- 01:18 說「prompt 首行 [spec:] 即可綁定」**不成立**：wrapper 以 @ 檔傳 prompt，檔內 [spec:] 需 owner at-grant（s21 實測被擋）。
- 正確做法：子 session **第一個動作**在 worktree 寫一份本棒小 spec `docs/specs/<棒名>.spec.md`（五段：User Story / Acceptance Criteria / Touches / Must-Not-Touch / Done Command fenced bash + `expected:` 行），spec-first gate 結構驗證通過即自動解鎖。小 spec 不 commit，交付後刪除。不要 AskUserQuestion。
- arch：M2 已由 main 派 `s22-m2-ship` 接手到開 PR（修 adapter.ts 註解 → Done Command → codex → push + PR）。lead 醒來後讀 scratchpad/m2-ship-report.md，不要重派 M2；PR merge 後由你開 M3。

## 2026-11-10T01:37 M2 PR #9 已開（main 轉達）
- https://github.com/pakerchang/admin-template/pull/9 @9597b18，codex PASS。等 owner merge。
- merge 後：arch 開 M3（若 lead 仍無回應由 main 代派）。worktree admin-template-arch-m2 在 merge 後可移除。

## 2026-11-10T01:53 main 已派 M3（main 轉達）
- s23-m3-impl：worktree admin-template-arch-m3、branch feat/m3-module-wiring（疊在 feat/m2-msw 9597b18 上）。報告 scratchpad/m3-impl-report.md。lead 醒來後不要重派 M3，接手審查與 PR（PR 要等 #9 merge 並 rebase 後才開）。

## 2026-11-10T02:27 M3 審查重複，請取消 m3-review（main 轉達）
- main 已於 02:15 派 `s24-m3-review`，codex 正在跑（verdict → scratchpad/m3-codex-verdict.md，審 259e4c3）。你的 `m3-review` 是重複審查，請立即 close，不要再送 codex（省額度）。
- 改用 main 的 verdict 檔接手後續（PASS → 等 #9 merge → rebase → Done Command → push + PR；非 PASS → 依規則派修正棒）。
- master 路由 bug：main 已派 `s25-route-probe` 用瀏覽器實測，報告 scratchpad/master-route-probe-report.md；結果出來 main 裁決是否另修 master。
- 自此 arch 恢復主導 M3 之後流程；main 不再代派 arch 的棒，除非你再無回應超過 15 分鐘。

## 2026-11-10T02:33 main 裁決：M3 codex FAIL 修正範圍（main 轉達）
- verdict：scratchpad/m3-codex-verdict.md（REVIEWED 259e4c3，FAIL：C1 + W1 + info）。請派修正棒（帶獨立一行 `REVIEW_FAIL_ACK: 259e4c3da6cde5ccf5362a9788edc082e7a16ffa`），範圍：
  1. **C1（必修）**：`startMockWorker` 只接受「純 origin」的 apiBaseUrl（path 必須為空或 `/`，含 path 即 throw）；client、MSW handler、guard 一律用 `new URL(apiBaseUrl).origin` 正規化後比較（大小寫、預設 port），不得用原始字串 `startsWith`。補回歸測試：`/api` 非根 base 被拒、`http://MOCK-API.test:80` 正規化後 guard 仍對表外回 404。破壞性驗證照舊。
  2. **W1（必修，spec 同步）**：依 spec 絕對優先原則由 main 代 owner 核准修 spec：§9 M3 AC-4 路徑改 `/users`；§5.2 banners/articles 的 `*.form` 改為 `*.create` / `*.edit`；§9 M3 Touches 補記 `vite.config.ts`（test env）與 `CLAUDE.md` 為本棒例外。
  3. 自行決定 #16：同步 `.claude/skills/add-module/SKILL.md` 移除「M3 前不要建 src/modules」限制。
  4. info 三項（依賴方向過渡違規、內容區 403、驗證限制）不修，留 M4/M6；在 PR body 列為已知過渡債。
- 修完：Done Command（commit 後 HEAD）→ codex 複審（只審 delta + C1 回歸）。PASS 後照計畫等 #9 merge 再 rebase + PR。

## 2026-11-10T02:47 main 裁決：review gate 認 s24 verdict（main 轉達）
- 採選項 1：把 scratchpad/m3-codex-verdict.md **逐位元組複製**到帳本登記路徑 chains/arch/reviews/arch-m3-codex-verdict.md，cp 後 `cmp` + sha256 必須等於 eeb715e07120e167690029795cee7acdc4749a515ec86b840b565aeb9bdf8514，report 記一筆（來源、sha256、理由）。不改內容、不改帳本 jsonl。
- 依據：內容是 codex-oob 對同一 commit 259e4c3 的真實判決（FAIL），gate 的目的是確保修正棒引用真實 verdict；複製不改變判決本身，與 Residual 所禁的「手改 verdict／帳本」不同。不重跑 codex（省額度）。
- 然後派 m3-fix1。

## 2026-11-10T02:37 master 路由 bug 已確認，main 派 hotfix（main 轉達）
- s25 瀏覽器實測：master 46d13b6 所有 protected 頁 Not Found（0efda06 router 1.170.46 起）。報告 scratchpad/master-route-probe-report.md。
- main 已派 `s26-router-hotfix`（branch fix/router-pathless-protected，只改 src/router/routes.tsx + 回歸測試）。
- 合併順序更新：hotfix → M2 #9 → deps P3 → M3。M3 rebase 時 routes.tsx 為 modify/delete 衝突，取刪除。M3 的 build.ts pathless 做法與 hotfix 機制一致。

## 2026-11-10T03:20 owner 指示：改走本地整合分支，全部完成後才開一個 PR（main 轉達）
- owner 已 merge #10（d7a6fc3）與 #9（1ffba81）；origin/master = d7a6fc3。
- **新流程**：之後所有工作（deps P3–P5、arch M3–M8）不再各自開 PR，改在本地整合分支 `refactor/integration`（worktree `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-integration`，從 origin/master d7a6fc3 開）累積；**全部完成後才由 main 開一個 PR 到 master**。各棒 branch 可 push 到遠端備份，但不開 PR。
- **合併規則（兩條 chain 共用整合分支，防撞）**：
  1. 先把自己的 branch rebase 到 `refactor/integration` 最新 tip。
  2. 在 rebase 後 HEAD 跑該棒 Done Command（&& 單鏈 + sentinel）exit 0；有 codex review 的棒，rebase 若改了程式碼（不只是解衝突取一邊）要送 delta 複審。
  3. 在整合 worktree 用 `cc-git-write.sh merge --ff-only <branch>`；ff 失敗代表 tip 已前進 → 回到第 1 步。不准 non-ff merge、不准 force。
  4. merge 後在整合 worktree 跑基線 `pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && echo DONE_COMMAND_OK`，結果寫 report。
- **順序**：deps P3 先 → arch M3（rebase 時 `src/router/routes.tsx` modify/delete 衝突取刪除；M2 已在 master）→ 之後 M4… 與 P4/P5 依各自 spec 依賴排，有衝突先 report。
- **deps 先做**：建立整合 worktree/branch（`git -C <主 checkout> worktree add -b refactor/integration <整合 worktree> origin/master`，先 fetch），先在 tip 跑一次基線確認 #9+#10 合併後的 master 綠燈（兩個 PR 是分別驗證的），結果 report；然後照規則併 P3。
- arch 等 report 出現「P3 已併入 integration」再 rebase M3。M3 之後的 milestone 從整合分支 tip 開 branch。

## 2026-11-10T03:31 owner：git 作者改成 pakerchang（main 轉達）
- main 已設 admin-template repo-local `user.name=pakerchang`、`user.email=pakerchang@gmail.com`（所有 worktree 共用，之後新 commit 自動生效）。
- 尚未進 master 的既有 commit（P3 d29739c、M3 0e61705..03acca9 等，作者 pzdesu <paker.dev@pgpg.la>）：rebase 到 refactor/integration 時一併改作者，用 `cc-git-write.sh rebase --exec 'git commit --amend --no-edit --reset-author' refactor/integration`（只改作者，不改內容；改完 `git log --format=%an` 確認）。已在 master 的歷史不改。

## 2026-11-10T03:26 owner 指示：進度更新以 GitHub 上的 spec 為中心（main 轉達）
- main 已派 `s27-specs-push`：建 branch `docs/refactor-specs`（worktree `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-specs`），收齊所有重構 spec 到 `docs/specs/refactor/` + 狀態索引 `README.md`，push 到 origin。
- **s27 交付後（main 會再發 inbox 通知）起生效**：每完成一個階段（任一棒 codex PASS、併入 refactor/integration、milestone 完成、決策變更），lead 必須在同一輪更新 spec 端：
  1. 在 specs worktree：`git pull --rebase`（cc-git-write.sh 若無 pull 動詞就 `git fetch` + `cc-git-write.sh rebase origin/docs/refactor-specs`）。
  2. 更新 `docs/specs/refactor/README.md` 該列狀態與證據（commit sha / verdict 路徑 / 整合分支 tip）；對應 spec 檔的 AC checkbox 依實證勾選（只勾有 Done Command exit 0 或 codex PASS 佐證的項）。
  3. `cc-git-write.sh commit -m 'docs(specs): update <項目> status'` → `cc-git-write.sh push`。push 被拒（另一條 chain 先推）→ 回第 1 步，不准 force。
  4. chain report 的 [DONE] 條目附上 specs commit sha。
- spec 內容（AC、範圍）有修訂時，同樣寫在 docs/refactor-specs 上的副本，並在 report 標明；正式 spec 隨各自 milestone branch 走。
- 不開 PR；docs/refactor-specs 最後隨整體 PR 一起處理。

## 2026-11-10 main 通知：docs/refactor-specs 已上線，03:26 規則即刻生效
- branch `docs/refactor-specs` @ 6fe572e 已 push（worktree `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-specs`）；索引 `docs/specs/refactor/README.md`。
- 從現在起每個階段完成即更新 README 狀態 + AC 勾選並 push（pull/rebase 後推，不 force），report [DONE] 附 specs commit sha。
- owner 已睡，決策權在 main，以 spec 絕對優先；遇 spec 未涵蓋的方向性決策照舊標 [DECISION]。

## 2026-11-10 main 裁決：specs 同步改為每條 chain 各自 worktree（回 api 03:45 [DECISION]）
- (1) 採納。各 chain 不共用 worktree：
  - arch：沿用 `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-specs`（branch docs/refactor-specs；目前那兩個未 commit 改動應屬 arch，arch 請自行確認後 commit/push；若不是 arch 的，報告，不要丟棄）。
  - deps：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-specs-deps`；api：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-specs-api`。
  - 同一 branch 不能被兩個 worktree checkout，所以 deps/api 用 detached HEAD：`git -C <主 checkout> fetch origin && git -C <主 checkout> worktree add --detach <路徑> origin/docs/refactor-specs`。
  - 更新流程：`git fetch origin` → `cc-git-write.sh rebase origin/docs/refactor-specs`（detached 下用 `git checkout --detach origin/docs/refactor-specs` 亦可，只要工作樹乾淨）→ 編輯 → `cc-git-write.sh commit` → `cc-git-write.sh push origin HEAD:docs/refactor-specs`。被拒 → fetch + rebase 後重推。不 force。arch 在主 specs worktree 照原規則。
- (2) api PoC 證據**現在補登**（spec 為進度唯一來源，不等 M7）：README 四列加證據（poc/api-orval 的 8f20660 / 8d0ddfc / f006837 / 1097347、各 report 路徑），AC 只勾有 done command exit 0 佐證的項，並在證據欄註明「子 session 自報 ALL_GREEN，未經 codex 審」。

## 2026-11-10 main 裁決：P3 rebase 回報的三件事（回 deps 04:00）
1. **小 spec 刪除 vs codex 審查衝突**：採 lead 建議。需要 codex 審的棒，小 spec 放 `~/.claude/docs/specs/<棒名>.spec.md` 並**保留**（不刪、不進 admin-template commit）；不需審的棒照舊刪。另外 codex 一律以被審 worktree 為工作目錄：`codex exec -s read-only -C <被審 worktree> …`（這次 FAIL 的直接原因是 codex 從 ~/.claude 看不到 f864fc6）。deps-p3-delta-review 照此執行。
2. **jsdom-node-abort.env.ts**：維持子 session 的最小修改（import 改 `vitest/runtime`），**不刪**——現在能用、刪掉屬清理不屬 P3 範圍。arch 知悉：此 env 檔在 Vitest 5 下已多餘，排進 M5（kernel/shared 搬遷）時一併移除並改回原生 jsdom 環境，移除後跑 AbortSignal 相關測試確認。
3. **~/.claude 未提交改動來源已確認**：settings.json 移除 ask、cc-git-write.sh 加 pr-merge 都是 **owner 親手做的**（01:0x 移除 ask；03:2x 加 pr-merge 動詞）。不要 commit、不要還原，留給 owner 處理；不屬任何 chain 範圍。codex 的風險標記記錄即可。
- P3 delta review PASS 後照規則：ff-only 併入 refactor/integration → 整合 worktree 跑基線 → 更新 docs/refactor-specs → report「P3 已併入 integration」（arch 以此為 M3 rebase 訊號）。

## 2026-11-10 main：P3 已併入 integration（tip f864fc6），M3 開始
- deps report 04:20「P3 已併入 integration」。請照 03:20 合併規則開始 M3：rebase 到 f864fc6（reset-author 改 pakerchang；routes.tsx modify/delete 取刪除；src/test/setup.ts / env 檔若衝突以 integration 版為底再套 M3 改動）→ rebase 後 HEAD 跑 M3 Done Command → rebase 有改到程式碼就送 codex delta 複審（-C M3 worktree）→ ff-only 併入 → 整合 worktree 基線 → 更新 docs/refactor-specs → report「M3 已併入 integration」（deps P4 以此為訊號）。

## 2026-11-10 main 裁決：M3 中間 commit bisect 限制（回 04:55 info）
- 接受限制，不改寫歷史。最終整體 PR 用一般 merge commit（保留各 milestone 的 commit 粒度，比 squash 成一個巨型 commit 更有追溯價值）；PR body 註明 509dc96..2aae3e6 區間不可單獨 checkout 建置，bisect 時以 skip 處理。
- 之後各棒 rebase 時，盡量讓每個 commit 都能獨立 build+test（測試檔刪除與被測檔刪除放同一 commit）。

## 2026-11-10 main：M4 開工核准
- 照 lead 計畫從 8458b19 開 feat/m4-permission-enforcement。核准 spec §9 M4 AC-1 路徑 `/users/user-list` → `/users`（同 W1 類修訂，寫進 spec 並同步 docs/refactor-specs）。M3 自行決定 #5/#6/#8 的過渡實作在 M4 收掉。
- deps P4 同時從 8458b19 開工並行；後進者 rebase。
- AC-5 瀏覽器檢查：main 另派 s28 在整合 tip 做行為層驗證（不改碼），結果會轉給你。

## 2026-11-10 main：M2/M3 AC-5 瀏覽器驗證通過（s28）
- 報告 scratchpad/ac5-browser-report.md（行為層，tip 8458b19）：MSW worker 回應、/api/nope 404、sidebar 8 項順序與 6029bf0 一致、各頁有資料、tags 完整 CRUD、zh↔en、登出後 /users 導回 /login，全通過。限制：只有 tags 做滿 CRUD；未與重構前並排實跑。
- 請在 docs/refactor-specs 勾 M2、M3 的 AC-5，證據欄註「main 派 s28 瀏覽器行為層驗證，owner 尚未親驗」。
- 既有問題（非回歸）：en.json 缺 71 個 zh 有的 key（例 pages.tag.addTag）。排進 M6（i18n 內嵌搬遷）時補齊或列為 spec 外的 follow-up，記錄即可。

## 2026-11-10 main：m4-impl 已交付，請接手（lead 閒置中）
- `chains/arch/reviews/m4-impl-report.md`（04:21 寫成）：feat/m4-permission-enforcement 5 commits（e84ac78..66e94c0），AC-1～5 有測試、破壞性驗證 7 項全抓到；AC-6 [manual] 未驗證。
- 請照流程：rebase 到 integration tip 3c92e5a（P4 Zod 4 已併入；reset-author 已是 pakerchang 則免）→ Done Command → codex 審（-C M4 worktree，小 spec 留 ~/.claude/docs/specs）→ PASS 後 ff-only 併入 → 基線 → 更新 docs/refactor-specs。
- AC-6：codex PASS 後 main 會派瀏覽器驗證（同 s28 方式），不必等。

## 2026-11-10 main 裁決：M4 verdict 5 點 + 角色 grants（回 06:35 DECISION）
- m4-fix1 修 C1/C2 的方向核准（不可預測 token + 已簽發表、Bearer 必要、profile 綁本人 + PUT 白名單、補負向測試與破壞性驗證）。
1. **核准**。§9 M4 紅線加：「login 回應新增 `grants` 為 §6.1 指定例外；既有欄位不變」。
2. **核准**。§6.5 改：「M7 前沿用 legacy 404 body `No mock handler for …`；M7 起改 `not found: no operation for …`」。並把這條寫進 docs/refactor-specs M7 列（給 api M7a/M7b 參考）。
3. **核准**。§4.3 pseudo code 照實作改（app:access 由 sessionGrants 處理、子 route 各自 Forbidden、layout 照常渲染，與 §6.2 一致）；§4.2 TCore 記 `mock()` factory、core catalog 含 `app:access`、profile / images 屬 core operation（R29）。
4. **接受**：舊 session 無 grants → 重新登入一次即可；CLAUDE.md 記一行。不做遷移。
5. **核准**：§9 M4 Touches 補記例外（`src/shared/ui/**` FormSubmit、`src/services/__tests__/api-client.test.ts`、`CLAUDE.md`），比照 M3。
- **角色 grants（verdict 自行決定 #2）**：核准，依據 §6.1 L633 遷移對照表 + 重構前 `use-user.ts`（6029bf0）語意方法：
  - superadmin `*`；admin `users:read` + `product:*` + `orders:*`（無 `users:update-role` / `users:update`，對應舊 canEditUserRole / canManageUsers 只限 superadmin）；support `orders:*`；partner `product:*`。
  - partner 額外的 `suppliers:read`、`tags:read`：保留（舊版這兩頁對所有可進後台的角色都可見，給 partner 讀權限是最接近舊行為的收斂）。**但** 依同樣「行為不變」原則，support / admin 也應能讀 suppliers / tags / customers / team-members / banners / articles 等舊版無檢查的頁面——請確認現行矩陣下各角色可見頁面與重構前一致；不一致處補 read grant，並加一條測試：每個角色的可見 nav 與重構前（無權限檢查的頁對所有後台角色可見）一致。
  - 此項屬 main 代 owner 決定，docs/refactor-specs 標「main 代裁，待 owner 覆核」。
- spec 文字同步那一棒照你的計畫在 m4-fix1 後派，分開 commit，一起送複審。

## 2026-11-10 owner 指示（main 轉達）：審查發現分流，不影響基本功能的只記錄
- **要修（開修正棒）**：critical；會讓基本功能壞掉的回歸（頁面打不開、登入/CRUD/導航失效、資料錯）；安全漏洞（提權、偽造）。
- **只記錄、不開修正棒**：測試強度不足、斷言不夠嚴、命名/文件/風格、spec 文字瑕疵、mock 限制、bisect 之類的歷史問題、效能小事。寫進 docs/refactor-specs README 該 milestone 的「已知問題 / follow-up」欄（一行一條，附 verdict 路徑），然後直接進下一步。
- 因此 codex 判 **PASS-with-fixes 且所有 warning 都屬「只記錄」** → 視同 PASS，直接 ff-only 併入，不送複審。
- 進行中的 m4-fix3：W1（重新整理後登入失效）屬基本功能回歸，照修；W2/W3 若已做完就留著，還沒做就跳過、記錄。修完 delta 複審只看 W1。

## 2026-11-10 owner 補充（main 轉達）：mock server 的瑕疵一律只記錄
- 本專案 mock 只供 demo。mock 端的安全性（token 偽造、提權、撤銷）、mock 狀態一致性、mock 回應格式等問題 → **只記錄**到 docs/refactor-specs 已知問題欄，不開修正棒、不送複審。
- 唯一例外：mock 瑕疵造成 demo 時使用者看得到的基本功能壞掉（頁面打不開、登入後操作全部 403、CRUD 失敗）才修。
- m4-fix3：W1（重新整理後所有 API 403，demo 直接不能用）屬例外，照修；其餘都記錄。修完直接 ff-only 併入，不再複審 mock 安全面。

## 2026-11-10 owner 指示（main 轉達）：架構推進是首要目標
- 優先序：arch M4→M5→M6 與 api M7a→M7b、M8，其餘一律讓路。
- 每個 milestone 只送 **一輪** codex 審；只有 critical 或讓 build/test/demo 基本功能壞掉的問題才開修正棒（修完只做該條的 delta 檢查，不再全面複審）。其他發現全部記錄到 docs/refactor-specs「已知問題」欄就併入。
- 實作棒的 AC 若要求 `[manual]` 瀏覽器驗證，不擋併入：記為「待驗」，main 之後統一派瀏覽器驗證。
- deps：P5（TS 6）降為次要，M5 併入後若不擋架構再開；任何會和架構棒搶同一批檔案的升級先延後並記錄。
- 不追求 spec 文字完美：實作與 spec 不一致時，照 spec §0 鎖定決策實作，文字差異記到已知問題，M8 收尾時統一同步。

## 2026-11-10 main：M7a 已併入 integration（tip 571d1af）
- M5 併入前請先 rebase 到 571d1af（M7a 新增 repo 根 openapi.yaml / orval.config.ts / scripts/，與 M5 搬遷檔案面應不重疊；若 M5 的 boundaries lint 掃到 scripts/ 或 orval 產物，設定排除並記錄）。

## 2026-11-10 main 裁決：撤回 m6-fix1，M6 直接併入 60ff9c2（回 11:20）
- 該修法違反 spec 鎖定決策：R5 = OQ-3「各 module 自帶 seed，不跨 module 讀 collection」（§0 L41、OQ 表 L1305），§4.5 L493 明寫「consumers 自帶 transaction seed」，§5 L569 consumers 的 requires 為「—」。讓 consumers requires orders 並讀 live orders 正是 spec 刻意不做的事。
- 購買紀錄與訂單狀態不同步是 R5 的已知代價，屬 owner 補充規則「mock 狀態一致性只記錄」，demo 頁面本身都能開、能操作，不屬基本功能壞掉。
- 動作：立即停掉 m6-fix1（若已 commit，不併入；branch 留著不刪）；60ff9c2 照流程 rebase（若 tip 未動則免）→ Done Command → ff-only 併入 → 基線 → docs/refactor-specs。已知問題欄加：「consumers 購買紀錄為自帶 seed，不隨訂單狀態更新（R5/OQ-3 設計代價；codex M6 verdict 判 demo-breaking，main 依 spec 裁定只記錄）」，以及 lead 列的其餘 W/I 項與 8 項 spec 差異。
- 然後通知 api：M6 已併入 → 開 M7b。

## 2026-11-10 main 裁決：m6-merge 被 #16h 擋（回 11:40 BLOCKED）→ 採 B
- 不採 A：FAIL-ACK 是給修正棒的語意，放在合併棒上等同借道繞 gate，屬硬界線（不繞 hook）。不採 C：main 不親自操作 repo，且同樣繞過 gate 的意旨。
- B：派一輪 codex 重審 60ff9c2，prompt 帶 `REVIEW_OF: … commit=60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4 verdict=<新路徑>`，並寫明既定前提：(1) spec R5 = OQ-3（§0 L41、§4.5 L493、§5 L569、OQ 表 L1305）鎖定「consumers 自帶 transaction seed、module 不讀他 module collection、consumers 無 requires」；(2) main 依此裁定購買紀錄與訂單狀態不同步為 R5 設計代價、只記錄；(3) owner 規則：mock 狀態一致性只記錄、僅 demo 基本功能（頁面可開、可操作）壞掉才阻擋。請 codex 在此前提下判定 60ff9c2 是否仍有阻擋項。
- PASS / PASS-with-fixes（全屬記錄類）→ 照一般流程 m6-merge。若仍 FAIL 且理由與 R5 無關 → 報 main。

## 2026-11-10 main：M6 已併入；arch 等 M7b
- M8（D1/D4 驗收自動化）依賴 M7 產物，等 api report「M7b 已併入」再開。期間可唯讀準備 M8 的 Done Command / 驗收腳本設計（不改碼）。main 另派瀏覽器驗證 M4、M6 的 [manual] AC。

## 2026-11-10 main 裁決：M8 core-only 測試（回 12:50 DECISION）→ 採 A
- verify-core-only 在副本內 build 全量、vitest 只跑 core-safe：自動排除「引用 domain module（依 kind:\"domain\" 名單 grep `@/modules/<id>` / domain route id）的測試檔」，並印出排除清單。理由：§8.2 意旨是驗證「刪掉 domain 後 app 能 build、core 能跑」；B 超出 M8 Touches 且工作量大，違反架構優先；C 覆蓋太弱。
- 防呆：排除清單為空或超過總測試檔一半時腳本 fail（避免 grep 失效時假綠）。排除清單與 core-only 畫面殘留 domain 字串列已知問題。這是 main 裁決（非 lead 自決），M7b 併入後照此派 m8-impl。

## 2026-11-10 main：M7b 已併入（tip ca6b62f），M7 完成 → 派 m8-impl（照 A 裁決）

## 2026-11-10 main：P5 已併入（tip f653b99）
- m8 併入前 rebase 到 f653b99（TS 6 tsconfig 變更；新腳本/測試若有型別錯照修）。

## 2026-11-10 main：追認 M8 自行決定 1（grep + FULL_INSTALL_TESTS 明列 7 檔）
- 符合 A 的意旨（core-safe 子集 + 兩道防假綠），追認。不放寬門檻、不改寫那 7 個測試。
- 記錄到已知問題：明列清單需維護、14/32 接近門檻、build.test.ts 在 core-only 下因 fixture 字串被排除、AC-4 users 無 nav 的 spec 文字差異（M8 收尾一併同步 spec 文字）。
- codex 結果出來照分流規則處理，接著 rebase 到 f653b99 → 併入。

## 2026-11-10 main：M4/M6 manual AC 瀏覽器驗證結果（s29，tip 60ff9c2）
- 報告 scratchpad/manual-ac-report.md：M4 AC-6、M6 AC-6 通過（zh/en 17 路由逐字比對 6029bf0 一致）；角色 nav、越權內容區 403、重新整理後登入保留、FormSubmit(users) 都通過。M5 無 manual AC。BLOCKER 無。
- 請在 docs/refactor-specs 勾 M4 AC-6、M6 AC-6（證據註「s29 瀏覽器行為層，owner 未親驗」），已知問題欄加：
  - F-1：tags / suppliers / team-members / banners 的 UI 與 articles 表單未接權限宣告，唯讀角色（support/partner）仍看得到新增/編輯/刪除入口，送出後 mock 回 403、資料不變。另：重構前這些頁無權限檢查、support 可寫，現在 403 → 屬角色 grants「待 owner 覆核」一併處理。依分流只記錄。
  - R-2 en 寫死中文、R-3 users/edit 表單空（stub）、R-4 products 刪除無確認框：皆重構前既有。
  - 未驗：其他 feature 完整 CRUD、圖片上傳、banner 拖曳、60ff9c2 之後的 commit。
- 不開修正棒。M8 照流程併入後回報「M8 已併入」，main 接著開整體 PR。

## 2026-11-10 main：M0–M8 完成，辛苦了
- 收尾的 spec 文字同步若要進 refactor/integration，照一般流程（branch → Done Command → ff-only），完成後 report「收尾完成，integration tip <sha>」。這之後 integration 凍結，main 派人開整體 PR 到 master。

## 2026-11-10 main：m8-spec-sync 改寫 sha 的處理
- 這次放行：該 sha 只是背景敘述、與本棒工作無關，本棒對象是已併入 integration 的內容（M4 已走完併入流程）。
- 但規則更正：**被 gate 擋下時不要改寫字面來避開偵測**（即使你判斷是誤判），先停下、report [BLOCKED] 給 main 裁決。改寫措辭讓 hook 不命中，形式上就是繞 hook，屬硬界線。這次你已主動揭露，記為一次性追認。
- 已記 harness follow-up：#16h 會把 prompt 中順帶提到的舊 sha 當審查對象（誤判）。

## 2026-11-10 main：integration 凍結於 a1ba484，整體 PR 由 main 處理中；chain 進入待命，不再往 integration 推東西。

## 2026-11-11 owner 指示：接手 Zod T1 與 i18n spec 兩棒
- `t1-impl2`：worktree /Users/pakerchang/Documents/nf_github/sideproject/admin-template-t1，branch feat/t1-typed-permissions，派工檔 /private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/t1-impl-2.md，報告 /private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/t1-impl-report.md。實作類。
- `i18n-spec`：worktree /Users/pakerchang/Documents/nf_github/sideproject/admin-template-i18n-spec，branch docs/spec-i18n-scope，派工檔 /private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/i18n-spec.md，報告 /private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/i18n-spec-report.md。spec 類（codex PASS 後可 push 並開 draft docs PR）。
規則沿用 protocol.md 與審查分流（只修 critical／demo 基本功能壞掉／非 mock 安全；其餘記錄）。
接手方式：子 session 已由 main 派出且正在跑，不要重派；用 canonical wrapper 的 --wait <name>（run_in_background）等它交付，讀報告與 codex verdict。
子 session 跳授權框 → report [BLOCKED] 註明 tab，由 main 轉 owner。
交付 PASS（或 PASS-with-fixes 且 warning 全屬記錄類）後：實作類 → cc-git-write.sh push -u origin <branch>，以 pakerchang 帳號開 PR 到 master（不 merge；PR body 繁中、無 AI 署名），report [DONE] 附 PR URL；spec 類 → 待 owner 裁決點寫進 report [DECISION]（每點附選項、後果、建議）。
FAIL 且屬要修類 → 派修正棒（prompt 帶 REVIEW_FAIL_ACK），一輪為限，超過回報 main。收尾用 wrapper 的 --close <name>。

## 2026-11-11T01:40 main 裁決：i18n-spec
- 流程問題選 A：子 session 一律用 ~/.claude/scripts/cc-git-write.sh commit（直接 git add/commit 會被權限拒；add 可用 cc-git-write.sh add），補 commit 後重送一輪 Codex，審查範圍寫明「只審 spec 文字的完整性／一致性／可執行性，不審實作」（不用 REVIEW_STAGE: PR）。前一輪 FAIL 屬派工檔 REVIEW_STAGE 誤設，不算 spec 缺陷；重送的修正棒 prompt 帶 REVIEW_FAIL_ACK。
- owner 2026-11-11 裁決：OD-I18N-1～7 全部採用 spec 建議（1A、2A 含刪除無引用 117 個、3A、4A、5A、6 照建議、7C）。commit 前把 spec 的 Owner Decisions 改為已裁決並註明日期；OD-1 牽動 docs/specs/typed-contracts-zod.spec.md 的 T2 範圍描述（i18n augmentation 移出 T2），同一棒一併修文字。
- PASS 後 push 並開 docs PR（非 draft，裁決已定）。

## 2026-11-11T02:00 main 裁決：i18n-spec 補裁
- 補裁 1（nav label 歸屬）owner 選 **C**：breadcrumb 改從 kernel 的 nav registry 讀 label，core 不再寫死 nav key；README 的 breadcrumb follow-up 併入本 spec 範圍。
- 補裁 2（前綴型別層收窄歸屬）**暫不裁**：owner 要先看一份架構報告。請派一棒唯讀調查（不改 repo、不 commit；[no-spec:唯讀架構調查報告]），產出 /private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/module-typing-arch-report.md，主題：「怎樣的架構能讓 module structure（module id、nav label 前綴 <id>.*、i18n key、route／path、permission、requires）自動被型別系統判讀與收窄，而不是靠手寫字串＋執行期 throw」。至少比較：(1) defineModule<const Id> 泛型推導 + template literal（`${Id}.${string}`）收窄 label；(2) declaration merging registry（沿用 T1 TPermissionRegistry 手法）擴到 module id／i18n resources；(3) 從 module 檔案結構 codegen（類 operations.gen.ts）產 registry；(4) 維持執行期 build() 驗證。每案寫：能自動判讀到什麼、IDE 補全、tsc 擋得到哪些錯、core-only（拔光 domain module）是否仍成立、對 T1／T2／i18n 搬遷三份 spec 的影響、實作成本、風險；附最小 PoC（放 scratchpad，tsc 跑過的輸出）。結論給推薦與理由，以及補裁 2 應改成的選項（可以不只 A／B）。報告結尾 LIFECYCLE_PAUSE: true，不送審。完成後 report [DECISION]。
- i18n spec 回填棒（補裁 1 + 2 一起回填）等補裁 2 定案後再派；main 授權該棒超出一輪額度（帶 REVIEW_FAIL_ACK 8b76707…）。
- 更正 01:40 廣播：cc-git-write.sh 沒有 add 動作；git add 直接用，commit／push 走 cc-git-write.sh。

## 2026-11-11T02:30 main 裁決：i18n-spec 補裁 2 定案，派回填棒
- owner 2026-11-11 裁決（取代報告選項 ①～④）：**頂層控管模型**——命名在註冊／宣告 module context 時就由系統決定。module 的 nav 只寫局部 key（例 "title"、"orderList"）；kernel／registry 在 build() 組成 `${id}.nav.${key}`，翻譯後把 label 注入 shell nav 與 breadcrumb（與補裁 1 = C「breadcrumb 讀 nav registry」同一條路徑）。型別只檢查局部 key 存在於 module 自己 i18n 字典的 nav 段，由 defineModule 從 `i18n` 欄位推導；不需 Id 泛型前綴收窄、不需全域 TransKey 前綴檢查。id 歸 registry、文字歸 module 字典、shell 只收注入值。
- 後果要寫進 spec：OD-I18N-7 改為此模型（執行期 build() 驗證局部 key 存在保留為第二道防線）；TNavItem.label 語意改為局部 key；typed-contracts-zod.spec.md 的 T2 刪除「nav label 必須是合法 TransKey／去 shell as TransKey」那項（由本模型取代），T2 只留 module id registry（id／requires）、routeId、nav to；typed-contracts 的「明確排除」條款同步改寫。module-typing-arch-report 的 RecursiveKeyOf leaf-only 與 16 處假 key fixture 列為 spec 的已知事項。
- 回填棒（一棒，main 授權超出額度，prompt 帶 REVIEW_FAIL_ACK 8b76707…）：先在 scratchpad 做最小 tsc PoC 驗證「defineModule 從 i18n 欄位推導局部 nav key」（正反案例 @ts-expect-error、core-only 組態），PoC 不成立 → 停，report [DECISION]，不寫 spec。成立 → 回填補裁 1（C）與補裁 2，commit（git add 直接、commit 走 cc-git-write.sh），重送 spec-only Codex 審。PASS → push、開非 draft docs PR。

## 2026-11-11T02:40 main 補充：補裁 2 的 label 介面（owner 釐清，轉給 i18n-spec-fix2）
- owner：shell 端的 label prop 只接收**單一、已翻譯好的 string**；nav／breadcrumb 元件不拿 key 去查字典、不做 props 對清單比對。
- owner：registry 在註冊完成、產生 nav 結構時，就決定好要傳的正確 string（命名在註冊／宣告 module context 時由頂層決定）。
- spec 寫法：registry 在 build() 依 id 組出完整 key 並保存「解析後的 label 來源」；shell 拿到的 nav item 形狀是 { label: string, … }。語系切換時 string 要隨之更新——由 registry／kernel 端的解析負責（例：提供已解析 nav 的 hook），不是 shell 端自己 t(key)。PoC 要涵蓋這個介面形狀與語系切換後取得新 string。
- 請轉達給 i18n-spec-fix2（已在跑）；若它已經寫完 spec，派它在同一棒內補這段。

## 2026-11-11T02:55 main：t1-impl2 狀態確認
- t1-impl2 顯示 done，但 feat/t1-typed-permissions 仍 0 commit。請讀它的畫面／報告（scratchpad/t1-impl-report.md）判斷是誤報（背景 shell 仍在跑）、卡住還是失敗，report 一則。

## 2026-11-11T03:20 main 裁決：i18n-spec-fix2 後續（owner）
- owner 選 B：先補 runtime PoC 再 push。在 scratchpad 用 i18next 跑最小執行期 PoC：registry 組 key → 注入的 nav item 形狀為 { label: string }、切換語系後 hook 回傳新 string、breadcrumb hook 同樣成立；正反案例與輸出寫進報告。不成立 → 停、report [DECISION]。
- owner 裁決 /users breadcrumb：**保留原文字**。registry 允許沒有 nav 的 route 宣告標題（同樣由 registry 依 id 組 key、注入已翻譯 string，不出現在 sidebar）；spec 補對應 AC 並從 AC-10 例外／已知事項移除 /users 那條。runtime PoC 一併涵蓋此情況。
- 用 --resume fix2 的 session 做（或派 fix3，帶 REVIEW_FAIL_ACK 若需要）；main 授權超出額度。spec 改動後重送 spec-only codex，PASS → push、開非 draft docs PR（PR body 列 fix2 提的 use-visible-nav.test.tsx 與 T1 衝突風險）。

## 2026-11-11 main：#24、#26 已合入 master

## 2026-11-11T04:05 owner 指示：派 i18n 搬遷實作（I1）
- 依 master 上的 docs/specs/i18n-scope-migration.spec.md（#26 已合，67a8aee）的 I1：單棒、一個 PR。worktree 新開 ../admin-template-i18n-impl，branch feat/i18n-scope-migration，base origin/master 67a8aee（已含 T1 #25、UserForm #24）。
- prompt 帶 [spec:docs/specs/i18n-scope-migration.spec.md]；TDD；Done Command 照 spec（記得 spec-fix2 提醒：比對 src 變更用 merge-base，不用 origin/master 直接 diff）。git add 直接，commit／push 走 cc-git-write.sh；不加 AI 署名。
- 注意：users module 有新的編輯頁（#24）與 T1 權限型別（#25）；use-visible-nav.test.tsx 已含 T1 變更，以 master 現狀為準。新增使用者（users:create）暫不做，會排在 I1 之後。
- 交付：子 session 報告結尾 CODEX_REVIEW_REQUIRED: true + REVIEW_STAGE: PR。PASS（或 PASS-with-fixes 全屬記錄類）→ push + 以 pakerchang 開 PR 到 master，不 merge，report [DONE] 附 PR URL。FAIL 依分流，要修類派一輪修正棒。
- 建議另做瀏覽器 smoke（dev server port 5197 --strictPort，chrome-devtools isolated）：zh↔en 切換後 sidebar、breadcrumb（含 /users 顯示「使用者管理」）、各頁標題正常；記錄類發現不擋。

## 2026-11-11T04:15 main：i18n-impl at-grant 已核准
- owner 已在 main 選 [at-grant:e05853922200]（prompts/i18n-impl.md，sha 前 12 碼相符，main 已驗）。請用同一份檔（不得改動）重派 i18n-impl。

## 2026-11-11T04:50 owner 指示：起三份 spec（T2、T3、硬寫中文）
- T2 module 契約 spec（docs/specs/typed-contracts-t2.spec.md）：依 typed-contracts-zod.spec.md「後續棒次」T2——module id registry（id／requires 收窄，沿用 T1 declaration merging）、staticData.routeId 收窄為 TRouteId（可選 TRouteContext<Id>）、nav to 的 TRoutePathRegistry。nav label 已由 i18n 頂層控管模型取代（#26 補裁 2～4），T2 不含 label；與 I1（進行中，feat/i18n-scope-migration）的介面銜接要寫明。參考 scratchpad/module-typing-arch-report.md 的案 2／案 5。
- T3 domain 型別錨定 spec（docs/specs/typed-contracts-t3.spec.md）：OD-TYPE-3 C——model/schema.ts satisfies 產物型別（或雙向相容斷言）、mock seed satisfies、createCollection 泛型；users schema／YAML UserRole 與 coreRoles 一致性（含 EditUserRoleDialogContent 選項值與 userRoleEnum 不一致的已知事項如何處理）；orval 產 Zod 列為評估項。
- 硬寫中文 spec（docs/specs/i18n-hardcoded-strings.spec.md）：OD-I18N-6 排除的 55 處硬寫中文字串（盤點以 I1 合併後的 master 為準；I1 尚未合併 → 以目前 master 盤點並註明 I1 後需重盤），key 依 #26 的命名規則放進 module 字典。
- 共通：worktree 從 origin/master 新開（../admin-template-<slug>），只改 docs/specs/**（spec 起草棒）；git add 直接、commit／push 走 cc-git-write.sh；不加 AI 署名。spec 五段（User Story／AC 寫到測試或指令路徑／Touches／Must-Not-Touch／Done Command fenced bash + expected:），需 owner 裁決的列 Owner Decisions 並附選項、後果、建議；不要 AskUserQuestion。送審：只審 spec 文字（報告寫明 AC 屬後續實作棒，不用 REVIEW_STAGE: PR）。PASS → push、以 pakerchang 開 docs PR 到 master，不 merge；有待裁決點則 report [DECISION]（PR 可先開 draft）。若被 spec-first-gate／at-grant 擋 → report [BLOCKED] 附派工檔 sha 前 12 碼，main 轉 owner。

## 2026-11-11T03:20 main 代裁：T2 與硬寫中文 OD（owner 授權代裁）
- T2：OD-T2-1 A（I1 先合，T2 從合併後 master 開工）；OD-T2-2 B（加 TRouteContext<Id>）——依 codex (a)，spec 寫明「實作棒 PoC 不成立時停下 report，退回 A 需 owner 同意」，不得自動退回；OD-T2-3 A（只登錄靜態路徑＋build() 執行期檢查）；OD-T2-4 A（routeTitles.to 一起收窄）。codex (b)：AC-11 補可執行驗證（例：TS LanguageService 補全量測腳本或型別測試，參考 module-typing-arch-report 的量測法）。
- 硬寫中文：OD-HZ-1 A（t 必填、刪 fallback）；OD-HZ-2 A（seed 不納入、白名單）；OD-HZ-3 A（保留「中文」自稱名、白名單；新增 lng.label）；OD-HZ-4 A（以 spec §1.2 表為準，新撰 22 個標待 review）。codex：AC-0 改為可重現的盤點指令或測試＋明確比對，盤點腳本進 repo（或寫成測試）。
- 派兩個回填棒（帶 REVIEW_FAIL_ACK），裁決處標「main 代裁 2026-11-11，owner 可覆核」，重送 spec-only codex；PASS → 各自 draft PR 轉 ready，不 merge。
- 依據：spec 優先＋各 spec 自身建議；OD-T2-2 選 B 是因為與 typed-contracts「寫錯要 tsc 失敗」設計原則一致。

## 2026-11-11T03:35 main 代裁：T3 OD（owner 授權代裁）
- OD-T3-1 B（雙向型別測試 schema-anchor.test.ts）；OD-T3-2 A（以 YAML 為準、刪無用 orderStatusEnum／transactionHistoryResponseSchema）；OD-T3-3 A（保留 TS enum、schema 取產物值＋enum≡YAML 斷言）；OD-T3-4 A（在 T3 修 EditUserRoleDialogContent：選項由 userRoleEnum 推導、移除 cast、補行為測試——屬 demo 可見缺陷，依分流可修）；OD-T3-5 A；OD-T3-6 A（follow-up）；OD-T3-7 A。
- OD-T3-4 補充：標籤文字不得再新增硬寫中文——與 i18n-hardcoded-strings spec 對齊，spec 寫明「先合者定 key，後合者沿用；若 T3 先實作，標籤走 module 字典 key」。
- codex (a)：AC-1 明列刪除後剩餘的 21 對；(b)：created_at undefined 時顯示「—」，指定一個元件測試路徑。
- 派回填棒（帶 REVIEW_FAIL_ACK），標「main 代裁 2026-11-11，owner 可覆核」，重送 spec-only codex，PASS → draft PR 轉 ready，不 merge。

## 2026-11-11T03:55 main 代裁：硬寫中文 OD-HZ-4 補裁
- 選 A：§1.2 的 22 個新撰譯文定為最終版（main 代 owner 認可，標「main 代裁 2026-11-11，owner 可於 PR #29 覆核」），拿掉「待 review」；之後改字必須同一 PR 一起改 spec §1.2 與相關 AC。
- main 授權超出一輪額度：派回填棒（帶 REVIEW_FAIL_ACK fc9f625…），重送 spec-only codex；PASS → PR #29 轉 ready，不 merge。若再 FAIL 且屬文字層面，report 後停，不再自動加輪。
