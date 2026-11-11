本輪判定 **PASS-with-fixes**。原 C1、W1 與自行決定 11／15／16 已補齊；新增一項 warning。僅審查 `259e4c3..d685823` 及必要接縫，未修改檔案、未 commit。

**Finding**

- **warning — 非 HTTP(S) origin 仍通過啟動驗證。**  
  `src/app/mock/start-worker.ts:28`：`ftp://host`、`ws://host`、`wss://host` 的 `url.href` 都等於 `${url.origin}/`，因此通過驗證並呼叫 worker 啟動，但 `apiFetch("/users")` 產生 Fetch 不支援的 scheme。獨立 Node probe 確認三者皆通過 bare-origin 條件，隨後 Fetch 以 `unknown scheme` 失敗。建議在此明確限制 `url.protocol` 為 `http:`／`https:`，並補負例測試。

逐條判定：

1. **C1：resolved。**  
   `start-worker.ts:28` 拒絕非根 path、query、hash、帳密；`guard.ts:43–47` 使用正規化 origin 與 `pathname`。原本 `/api` base、大寫 host／預設 port 的繞過情境已排除。上述 scheme warning 不構成原 C1 的重現。

2. **W1：resolved。**  
   spec `:564–565` 已同步 `banners.create/edit`、`articles.create/edit`，與兩個 module 的 `model/routes.ts:35、42` 一致；spec `:1116` 的 M3 AC-4 已改為 `/users`。

3. **自行決定 11／15／16：resolved。**  
   - **11**：前輪要求的共同正規化及拒絕非 origin base 已補齊。
   - **15**：spec `:1125` 已記錄 `vite.config.ts`、`CLAUDE.md` 的 Touches 例外。
   - **16**：`.claude/skills/add-module/SKILL.md:26` 已將禁止建立 modules 的指示標為歷史規則。

4. **回歸測試有效性：成立（靜態核對）。**  
   `guard.test.ts:73–87` 使用大寫 host／預設 port base，要求正規化 request 回 404；改回 raw-base `startsWith()` 時會回 `undefined`，斷言將失敗。`start-worker.test.ts:16–31` 要求 sub-path／query 拋錯且不得啟動；移除 bare-origin 拒絕時會失敗。本輪未執行 mutation。

5. **新邊界：HTTP(S) 情境正確；非 HTTP(S) 未完整處理。**  
   獨立 URL probe 確認根 `/`、大小寫 host、`:80`／`:443`、IPv6 可正規化接受；query、hash、帳密會被拒絕。`guard.ts:46` 對不同 port／scheme／host 放行，同 origin 進入 operation 判定，表外回 404。`pathname` 排除 query、保留 trailing slash 與 `%2F` 等編碼，與舊 path 擷取結果一致；既有 matcher 仍採精確分段比對。非 HTTP(S) 問題見 warning。

6. **DECISION：成立。**  
   `src/services/api-client.ts:53` 與 `src/app/mock/legacy-adapter.ts:33` 確實都經 `new URL(path, base)`；guard 現在也以 URL 解析後的 origin 劃界。對通過驗證的 HTTP(S) base，保留原始 `apiBaseUrl` 匯出值不會造成三方邊界差異。

7. **spec 改動範圍：成立。**  
   完整 diff 確認 spec 僅改兩組 route id、M3 AC-4 路徑、M3 Touches 例外；SKILL.md 僅改「M3 落地前」一行，無其他語意變更。

測試：`pnpm exec vitest run src/app/mock` **未執行成功**，exit 1；pnpm 建立 worktree `_tmp_*` 時遭唯讀 sandbox 以 `EPERM` 拒絕，尚未進入 Vitest。此限制不列 finding。URL／origin／Fetch probes 已實際執行；瀏覽器 worker 行為未驗證。工作樹維持乾淨，未寫入 `arch-m3-fix-codex-verdict.md`。

REVIEW_VERDICT: PASS-with-fixes
REVIEWED_COMMIT: d6858236f1c6c602efb53dbdc5a153be95486903
REVIEWER: codex-oob