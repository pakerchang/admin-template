# m3-fix2 交付報告

LIFECYCLE_PAUSE: true

- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3`，branch `feat/m3-module-wiring`
- base：`d6858236f1c6c602efb53dbdc5a153be95486903`
- head：`03acca96840512a59ab30498db25c757835cb73f`（單一 commit `fix(mock): accept only http(s) mock origins`，無 AI 署名，未 push）

## 修法
- `src/app/mock/start-worker.ts`：`assertMockApiBaseUrl` 在同源檢查之後、bare-origin 檢查之前加上 `url.protocol` 必須是 `http:` 或 `https:` 的檢查，否則 throw `mock mode: VITE_API_BASE_URL "<value>" must use http or https`。
- `src/app/mock/__tests__/start-worker.test.ts`：在既有的 `it.each` 負例表新增 `ftp://mock-api.test`、`ws://mock-api.test`、`wss://mock-api.test`，每個都比對 `/must use http or https/`，並 assert `start` 沒被呼叫。既有的 7 個負例與 3 個正例都保留。

## 破壞性驗證
- 用 perl 拿掉 protocol 檢查之後（grep `must use http` 為 0 筆），跑 `pnpm exec vitest run src/app/mock/__tests__/start-worker.test.ts`：ftp/ws/wss 3 個負例 fail，其餘 10 個 pass（Tests 3 failed | 10 passed）。
- 從備份還原，`cmp` 一致（CMP_OK）。
- 還原後同一個測試檔：13 passed。

## Done Command（commit 後在 HEAD 03acca9 執行）
```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3 && pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && test ! -e src/router/routes.tsx && test ! -e src/constants/sidebar.tsx && test "$(grep -o '\.use(' src/app/modules.ts | wc -l | tr -d ' ')" -eq 10 && echo DONE_COMMAND_OK
```
- exit code：0（背景執行）
- 有印出 DONE_COMMAND_OK
- vitest：Test Files 22 passed (22)；Tests 219 passed (219)
- build：built in 6.73s

## Lint / Prettier（於 commit 前的工作樹執行，內容與 commit 相同；lint-staged 在 commit 時沒有改動任何內容）
- `pnpm exec eslint "src/**/*.{ts,tsx}"` → LINT_OK
- `pnpm exec prettier --check` 兩個改動檔 → All matched files use Prettier code style

## 改動檔案
- `src/app/mock/start-worker.ts`（+5）
- `src/app/mock/__tests__/start-worker.test.ts`（+4）

## 其他
- 本棒小 spec `docs/specs/m3-fix2.spec.md` 沒有 commit，交付前已刪除；工作樹乾淨。
- 驗證層級：屬於行為驗證（vitest 單元測試 + build 的 exit 0）。沒有在瀏覽器實際啟動 MSW worker。
- DECISION：無。
- 沒有走 Stop gate 送審；Codex 複審由 chain lead 另外派。
