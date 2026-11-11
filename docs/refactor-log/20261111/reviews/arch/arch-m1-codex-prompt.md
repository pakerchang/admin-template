# Codex review：admin-template M1 kernel 契約（out-of-band）

你是獨立 reviewer。只讀不改：不修改任何檔案、不 commit、不 push。

## 審查對象
- repo / worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m1`（branch `feat/m1-kernel-contracts`，尚未 push）
- 送審 sha：`b445350f4d4f5758e90fe94ac280f4dbc15bfc07`
- base：`fcc673a5c7b39051b156fa6872d05902a3fd26b4`（origin/master，含 Prettier 3）
- 範圍：`git diff fcc673a..b445350`（5 個 commit：d1403e3 feat(kernel)、4492d2f test(kernel)、6831029 docs、595ccf4 fix(kernel) nav 完整比對、b445350 docs(skills)）
- 判決輸出會被存成 `arch-m1-codex-verdict.md`
- 依據：worktree 內 `docs/specs/fsd-module-architecture.spec.md` 的 §9 M1（約第 930、941 行起：AC-1～AC-6、Touches、Must-Not-Touch、Done Command）、§4（§4.1 型別草案、§4.2 createApp / registry、§4.3 build() 組裝與驗證清單）、§6.1/§6.2（權限型別、route guard），以及 §0.x 的 owner 裁決。

## owner 已生效裁決（不得當 finding）
- nav 權限比對完整 `resource:action`（2026-11-09；595ccf4 已同步改 spec）。
- M8 驗收前凍結新增 module。
- M4 前沿用 `useUserPermissions()` 語意方法、禁止新增直接比對 role。

## 要審的項目
1. **AC-1～AC-6 逐條判定**：每條寫出對應的實作位置與測試位置（檔案:行），判斷 (a) 實作是否真的涵蓋該 AC，(b) 測試是否會在邏輯被改壞時失敗（不是只測 happy path、不是 assertion 空洞、不是 mock 掉被測邏輯）。不足者給 finding。
2. **Touches / Must-Not-Touch**：
   - 既有 `src` 檔案零改動（`git diff --stat fcc673a..b445350 -- src` 應只有新增檔）；
   - 新碼沒有被既有碼 import（全未接線）；
   - `msw` 只以 `import type` 參與；
   - `package.json` 只新增 `msw`（核對 diff），lockfile 變動與之相符。
3. **§4 型別契約與 §4.3 驗證清單一致性**：`src/shared/module/types.ts`、`src/shared/permission/*`、`src/app/kernel/{build,create-app}.ts` 與 spec 草案的欄位、簽名、驗證步驟（含 operation 表 fail-closed、權限目錄完整比對、page route 必有 routeId、route id 前綴 = module id、override 解析、nav / i18n scope 合併）是否一一對上；有缺漏、多出或語意偏移就列出。
4. **實作者自行做的 6 項選擇**——逐項判定「合理 / 違反 spec / 合理但需補文件或測試」並說理：
   1. guardedRoute 的 grants 由 `getGrants` 參數注入（spec §6.2 寫 `getSession()`；session store 不在 M1 範圍）；
   2. createApp 新增 `core` 參數（pseudo code 有、§4.2 簽名沒有）；
   3. auth / `/` redirect / ForbiddenBoundary 延後到 M3/M4（以 `ponytail:` 註解標記）；
   4. module id 撞到 core i18n 頂層 key 時沒有驗證（淺層展開會覆蓋）；
   5. staticData routeId 的型別用 `string` 而不是 `TRouteId`；
   6. 多個 module 宣告同一個 resource 時，actions 取聯集。
5. **文件改動與 spec 一致性**：`CLAUDE.md`、`docs/TRAPS.md`、`.claude/skills/add-module/SKILL.md`、`.claude/skills/declare-permission/SKILL.md`、spec 本身的改動（含「M1 done」標記）是否與 spec 和實作一致、沒有互相矛盾。

## 執行測試
能跑的話在 worktree 內實際執行：
```
pnpm exec vitest run src/shared src/app/kernel
```
回報 exit code 與通過/失敗數。若 read-only sandbox 無法執行（例如無法寫 cache、無網路），就註明「未執行 + 原因」，**不要把它當 finding**。

## 輸出格式
- finding 逐條：`[critical|warning|info] 檔案:行 — 問題 — 建議`。
- AC-1～AC-6 逐條判定表。
- 6 項實作選擇逐項判定。
- 判決規則：有任何 critical → FAIL；只有 warning（需修但不阻擋）→ PASS-with-fixes；只有 info 或無 finding → PASS。
- 輸出最後，**各以獨立一行**、無任何前後綴或 markdown 修飾，恰好各寫一次：

```
REVIEW_VERDICT: PASS|PASS-with-fixes|FAIL
REVIEWED_COMMIT: b445350f4d4f5758e90fe94ac280f4dbc15bfc07
REVIEWER: codex-oob
```
（`REVIEW_VERDICT` 只填三者之一。上面範本行本身不要原樣抄進輸出以外的地方；最終輸出裡這三行各只能出現一次。）
