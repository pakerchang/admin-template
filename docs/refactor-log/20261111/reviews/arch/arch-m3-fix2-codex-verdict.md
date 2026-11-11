本輪 **PASS**，無新增 finding。已讀前輪 verdict、修正報告，僅審查 `d685823..03acca9` 與必要接縫；未修改檔案、未 commit、未建立 verdict 檔。

1. **前輪 warning：resolved。**  
   `src/app/mock/start-worker.ts:28–31` 明確限制 `http:`／`https:`，ftp／ws／wss 均以 `must use http or https` 拒絕。

2. **新負例有效性：成立。**  
   `src/app/mock/__tests__/start-worker.test.ts:27–35` 同時斷言指定錯誤訊息及未呼叫 `start`。以原始函式本體做記憶體內 mutation，移除 protocol 分支後，三個 URL 均被接受，因此三個 `.rejects.toThrow(...)` 都會失敗，沒有其他檢查造成假通過。

3. **新問題：不成立，未發現回歸。**
   - **HTTP(S) 正例仍通過：成立。** Node probe 確認 http／https、大小寫 scheme／host、預設 `:80`／`:443` 均接受。
   - **既有錯誤訊息順序維持：成立。** `start-worker.ts:11–35` 的空值、無效／相對 URL、同源檢查保留原順序；HTTP(S) 的 path／query／hash／帳密仍命中 bare-origin 訊息。
   - **其他 scheme 行為合理：成立。** file／data／javascript／跨源 blob 均命中 protocol 訊息。同源 `blob:http://localhost:5173/id` 在 `:23` 先命中同源拒絕；其內嵌 origin 確實同源，訊息相關且符合既有優先順序，無非預期例外。

驗證：上述 Node 行為 probe 與記憶體內 mutation 執行成功（exit 0）。指定 Vitest **未執行**：`pnpm exec vitest run src/app/mock` 在啟動 Vitest 前，因唯讀 sandbox 禁止建立 worktree `_tmp_*` 而以 `EPERM` 結束（exit 1）；此限制不列 finding。

REVIEW_VERDICT: PASS
REVIEWED_COMMIT: 03acca96840512a59ab30498db25c757835cb73f
REVIEWER: codex-oob