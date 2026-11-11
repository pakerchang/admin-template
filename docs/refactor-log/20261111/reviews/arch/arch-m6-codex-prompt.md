# admin-template M6（module colocation）out-of-band 審查（一輪）

你是 out-of-band reviewer（codex-oob）。只讀、不改任何檔案、不 commit。審查在目前 cwd（worktree `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m6`）進行。

## 送審對象
- branch：`feat/m6-module-colocation`
- 送審 sha（head）：`60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4`
- base：`refactor/integration` @ `96f156551c3ec36fbf918a65eb1a8f93660154ef`
- 範圍：`git diff 96f156551c3ec36fbf918a65eb1a8f93660154ef..60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4`，共 4 個 commit：
  - `d4245c2` refactor(i18n)：module 自有 key 搬進 module 字典
  - `f65ce7f` refactor(mock)：mock seed 與 handler 拆到各 module
  - `861478c` refactor(modules)：pages／hooks／schemas 搬進 module
  - `60ff9c2` docs：CLAUDE.md 標記 M6 完成
- 實作報告（必讀）：`/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/arch/reviews/m6-impl-report.md`
- spec：worktree 內 `docs/specs/fsd-module-architecture.spec.md` §0、§3、§3.1、§4、§5、§7、§9 M6、R5、R15。
- 你的輸出會被存成 verdict 檔 `arch-m6-codex-verdict.md`。

## owner 現行原則（判定嚴重度時必須遵守）
- 每個 milestone **只審一輪**。
- 只有 **critical**，或**會讓 build／test／demo 基本功能壞掉**的問題，才會開修正棒；其他一律記錄到已知問題後併入。
- 實作與 spec 文字不一致時，以 spec §0 鎖定決策為準；純文字差異不作為嚴重度依據，記為 info。

## 逐條判定（每條附 `file:line` 證據）
a. **AC 與遺留項**：spec §9 M6 的 AC-1～AC-6 與 M5 遺留項是否成立。AC-6（manual）請判斷報告裡的字典比對腳本是否足以佐證。
b. **行為不變（最重要）**：
   - URL、route id、mock API 路徑與回應、使用者可見文字是否與 base 相同。
   - 搬遷與 codemod 有無 import 錯接、`vi.mock` 路徑漏改、export 遺漏。
   - mock 拆分後各 module handler 的回應是否與 base 相同。
   - 登入、角色變更、token 跨重新整理（M4 C1/C2/W1 保證）是否仍成立。
   - i18n：`mount` 先 `loadLanguages` 再 `addResourceBundle` 的順序，在瀏覽器 runtime 是否會造成 core 字典或 module 字典缺失。
c. **kernel 契約**：`src/app/kernel/create-app.tsx` 的 `mount` 改動是否屬 Must-Not-Touch 的契約變更；`setMockRoleResolver`／`setMockGrantMatrix` 模組層級註冊有無正確性風險（註冊時機、測試間殘留、重複註冊）。
d. **R5 與邊界**：跨 module 讀 seed 是否真的被 lint 擋住；`auth.requires = ["users"]`、Navbar 搬到 `shared/ui/navbar`、`module-mocks → module-model` 放行、`no-restricted-imports` 對 `__tests__` 放行是否合理。
e. **報告逐條**：「自行決定」10 項、「spec 差異」、「已知問題」逐條判定。特別判斷：consumers 購買紀錄不再反映訂單狀態變更，是否算 demo 使用者看得到的基本功能壞掉。
f. **逐 commit 可獨立 lint+build+test**：報告有逐 commit 結果；commit 3 之後只改一行註解未重跑，判斷是否可接受。

能跑就執行（read-only sandbox 跑不了就註明「未執行＋原因」，不要當 finding）：
- `pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}"`
- `pnpm exec vitest run`

## 輸出格式
1. 逐條 a～f 的判定與證據。
2. Findings 清單，每條：嚴重度（critical / warning / info）、`file:line`、說明、**是否屬「會讓 build／test／demo 基本功能壞掉」**（是／否）。
3. 結尾**各以獨立一行**、恰好一次、冒號後一個半形空格，寫出：

```
REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: 60ff9c2cf9d4bcbd9c283aa27d96d2d3527fb1f4
REVIEWER: codex-oob
```

`REVIEW_VERDICT` 只能三選一（不要寫成 `PASS|PASS-with-fixes|FAIL` 原樣）。判定基準：有 critical 或基本功能壞掉 → FAIL；只有需記錄的 warning → PASS-with-fixes；無實質問題 → PASS。上面範例區塊以外，不要在其他地方再寫這三個欄位行。
