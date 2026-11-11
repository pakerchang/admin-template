- **warning — `src/app/mock/adapter.ts:37,54`：base URL 拼接與 client 不一致，會讓登入失敗。**  
  設 `VITE_API_BASE_URL=http://mock-api.test/` 時，adapter 註冊 `http://mock-api.test//api/auth/login`，但 `api-client.ts:53` 的 `new URL()` 送往 `http://mock-api.test/api/auth/login`，因此無法命中 mock，fallback 也同樣失配。base 帶 `/api` 路徑時亦有此問題。已用本機 MSW 做最小行為重現，結果為 unmatched request、`fetch failed`。應讓 adapter 與 client 使用相同的 URL 解析方式。

- **warning — `src/app/mock/adapter.ts:50`：404 fallback 縮小範圍，改變既有行為。**  
  原本 `apiFetch("/nope")` 會得到 404 與 `{ error: "No mock handler for GET /nope" }`；現在不屬於四個前綴，會被 bypass。在 Vite dev server 下可能取得 SPA HTML，接著於 `src/services/api-client.ts:75` 解析 JSON 時拋錯。`src/services/__tests__/api-client.test.ts:113` 將原有 `/nope` 案例改成 `/admin/nope`，掩蓋了這項差異。避免攔截 Vite 資源的動機合理，但目前方案未完整保留原本的 fallback 契約。

逐條判定：

| 項目 | 判定 | 證據 |
|---|---|---|
| AC-1 | PASS | `src` 已無 `mockFetch` 引用；`src/services/api-client.ts:70` 使用 `await fetch(request)`。 |
| AC-2 | PASS（靜態） | `src/app/mock/__tests__/adapter.test.ts:10–17` 比對完整 handler key 集合並保存快照，快照列出全部 36 條。 |
| AC-3 | FAIL（原案例行為未完整保留） | `src/test/setup.ts:10–12` 正確接上 `setupServer` 與 `onUnhandledFrame`；登入、token、CRUD 案例仍在，但原本 `/nope` 的 404 行為遺失，詳見 finding。 |
| AC-4 | PASS | `git ls-files --error-unmatch public/mockServiceWorker.js` 成功；worker 檔已追蹤。 |
| AC-5 | 待 owner 手動驗證 | `src/main.tsx:17–20` 等 worker 啟動後才 render；`src/app/mock/enabled.ts:2` 正確實作只有 `"false"` 關閉。預設設定下未見明顯啟動順序缺陷；自訂 base 的已知問題如上。 |

兩項自行決定的評估：

- **navigate 放行合理**：`src/app/mock/adapter.ts:19` 避免重新整理 `/users` 時收到 API JSON；client 的一般 fetch 不受影響。這適合作為 M2 同源設定的過渡處理，仍需 AC-5 實測確認。
- **四前綴 fallback 有具體相容性風險**：可保護 Vite 資源，但造成上述 `/nope` 行為退化。R22／R24 的專用 origin 與 guard 接線屬 M3，不能視為本棒已解決此問題。

行為紅線：既有 handler 表、業務回應 body 與 `DELAY_MS` 的 test＝0／其他＝300 設定均未改；adapter 仍先延遲再執行 handler（`adapter.ts:22–27`）。但 URL 匹配與表外 404 行為有上述差異。`src/pages`、`src/components` 在指定 commit 範圍內 diff 為空。

驗證限制：本次以靜態審查及 MSW 最小重現為主；`pnpm exec vitest run src/app/mock src/services` 因唯讀沙箱禁止建立暫存檔而以 EPERM 結束，未獨立確認測試全綠。自訂 Abort 環境方案未見額外具體失敗情境。

REVIEW_VERDICT: PASS-with-fixes
REVIEWED_COMMIT: 86043d7784fac301b6ec61ef27c86a9feb72fa88
REVIEWER: codex-oob