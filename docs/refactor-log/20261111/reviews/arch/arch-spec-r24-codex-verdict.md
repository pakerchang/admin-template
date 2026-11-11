## Findings

1. **info** — spec:77, 745–750, 1114–1118：R24 已完整改為拒絕任何同源 `apiBaseUrl`，明列未設定、非絕對 URL、同源根目錄及同源非根路徑負例。`new URL("/users", location.origin + "/api")` 的漏洞原因與 master `src/services/api-client.ts:44,54` 行為一致。

2. **info** — spec:77, 745–750, 1117, 1300, 1325, 1333：所有相關落點一致採用「專用、不同源的絕對 origin」；§10.1、§11 未殘留只拒絕「同源根目錄」的舊規則。

3. **info** — spec:77, 745–750, 1117：修正忠實落實 owner 的「專用絕對 origin」裁決，未擴大到既有 API 路徑。`/api`、`/users`、`/user`、`/admin` 均維持不變，並由 master `src/services/mock/handlers.ts:124,142–198` 支持。

4. **info** — spec:1117–1128：M3 AC-7 包含同源根目錄與 `location.origin + "/api"` 兩個明確負例，驗證指令 `pnpm exec vitest run src/app/mock` 語法成立；該路徑由 M3 建立。M3 done command 使用 master `package.json:12,18` 已具備的 build、vitest 能力，靜態可執行。

5. **info** — spec:1306–1308：在 W1 關閉且 owner 裁決已明確的前提下，§10.2「無未決項」成立；ABAC 實作與 slots 優先序已清楚標為延後且不屬本 spec 範圍。

6. **info** — spec:77, 745, 1117, 1300, 1325, 1333：本輪只修正 R24 及其接縫，未刪除先前必要內容、未破壞跨段引用；`git diff --check 7f3a795 ba1976f` 通過。

## Rubric (a)

- **W1：closed** — spec:77、745–750、1117、1300、1325、1333。R24、§6.5、`startMockWorker` 契約及 M3 AC-7 均拒絕任何同源，且 AC 明列同源非根路徑負例。
- **W2：closed** — spec:1306–1308。W1 所造成的未決邊界已由一致契約與可執行 AC 關閉，因此「無未決項」現在成立。

未發現 critical 或 warning finding。

REVIEW_VERDICT: PASS
REVIEWED_COMMIT: ba1976f3f144721a61e67113a4d132f099b1821b
REVIEWER: codex-oob