Finding 清單：

1. info — `pnpm-lock.yaml:9206`：既有 `unplugin@3.7.0` 的 optional dependency `esbuild` 從 `0.25.12` 改為 `0.28.2`，也改變既有 router-plugin 的解析鏈。因此「沒有升級任何既有依賴版本」未完全成立，雖然 `package.json` 既有版本未變。建議保留原解析鏈，新增 orval 所需版本另行共存。目前沒有證據顯示造成 build／test／demo 故障，依分級規則記為 info。

其餘審查結果：

- AC-2 九種負例均有 fixture，測試確實以子行程執行 extract，斷言 exit 1、operation 名稱、錯誤原因及不產出檔案。
- extract 未做權限目錄比對，符合 R27；有 `{id}` → `:id` 轉換，輸出符合 `TOperationTable` 結構。
- 一致性測試完整比對 method、path、operationId 與每個 permission 值。M7a 保留現行手寫表、只做資料比對可接受。
- 唯讀比對確認 YAML 與 mock 的 36 條 method/path 完全一致；靜態核對未發現回應形狀差異，包含登入時補入 grants。圖片兩個 operation 均歸 `core`。
- 根目錄 orval config 符合指定設定，包含跳過 `core`、`mode: single`、`clean: true` 與 mutator 路徑。
- `src/**` diff 為空。scripts／config 未納入 build 與 lint 屬驗證限制，未發現因此造成基本功能故障。

測試執行結果：

`pnpm exec vitest run scripts` 未執行成功：pnpm 啟動時建立 repo 根目錄 `_tmp_*` 檔案遭 read-only sandbox 拒絕（EPERM，exit 1），尚未進入 Vitest。不列為 finding；上述測試內容為靜態審查結果。

REVIEW_VERDICT: PASS
REVIEWED_COMMIT: 571d1af20696d32bed1bee10fd6bdd3a4009c747
REVIEWER: codex-oob