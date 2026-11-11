# M3 fix1 交付報告

- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3`，branch `feat/m3-module-wiring`
- HEAD：`d6858236f1c6c602efb53dbdc5a153be95486903`
- 本棒 commits（基於 `259e4c3da6cde5ccf5362a9788edc082e7a16ffa`）：
  - `08f3a53` fix(mock): normalize mock origin across start-up check and guard
  - `d685823` docs(spec): sync M3 route ids, AC-4 path and touches exceptions
- 無 AI 署名、未 push、未開 PR、未 rebase；小 spec `docs/specs/m3-fix1.spec.md` 已刪除（未 commit），worktree clean。

## C1（critical）mock origin 正規化

呼叫點盤點（grep `VITE_API_BASE_URL` / `apiBaseUrl` / `startsWith(`）：
- client `src/services/api-client.ts:53` `new URL(path, apiBaseUrl)`、handler `src/app/mock/legacy-adapter.ts:33` `new URL(path, baseUrl).href`：都經 URL 解析，**本來就產生正規化 origin**（host 小寫、去預設 port），且 path 為絕對路徑，base 的 path 被丟棄。
- 唯二用原始字串劃界的是 `start-worker.ts`（只比 origin、放過非根 path）與 `guard.ts`（`request.url.startsWith(rawBase)`）。這兩處就是 C1 根因，在這兩處修，不在各呼叫點補。

修法：
- `src/app/mock/start-worker.ts`：在同源檢查後加「必須是純 origin」：`url.href !== \`${url.origin}/\`` → throw `must be a bare origin without path, query, hash or credentials (e.g. <origin>)`。同時擋 path、query、hash、帳密。`http://MOCK-API.test:80` / `http://mock-api.test/` 的 href 正規化後等於 `origin + "/"`，會被接受。
- `src/app/mock/guard.ts`：`const origin = new URL(apiBaseUrl).origin`；每個 request `new URL(request.url).origin !== origin` 就放行，path 取 `url.pathname`。已移除 `startsWith(base)` 與 slice 算 path 的寫法。
- 回歸測試：
  - `start-worker.test.ts`：新增負例 `http://mock-api.test/api`、`http://mock-api.test/?x=1`（→ `/must be a bare origin/`）；新增正例 `http://MOCK-API.test:80`、`http://mock-api.test/`。原有負例（unset、empty、relative、same-origin root、same-origin sub-path）與正例保留，全部通過。
  - `guard.test.ts`：guard 以 `http://MOCK-API.test:80`、空 routes 建立 → `http://mock-api.test/nope` 回 404；`http://mock-api.test:8080/nope`（不同 origin）放行。

DECISION（已自行決定，不阻塞）：`src/services/api-client.ts` 的 `apiBaseUrl` 匯出值**未**改成正規化 origin。理由：(1) 它不在 M3 Touches，§9 M2/M4/M5 才列；(2) client 和 handler 都經 `new URL(path, base)` 解析，實際送出和比對用的已經是正規化 origin。加上 guard 改成比 `.origin` 之後，三方劃界一致。建議：M4 依 spec 把 base 收進 `shared/config/env` 時，直接匯出 `new URL(...).origin`。

## W1（warning）spec 同步（只改兩處）

- §9 M3 AC-4：`/users/user-list` → `/users`。
- §5.2：`banners.form` → `banners.create`、`banners.edit`；`articles.form` → `articles.create`、`articles.edit`。
- 附帶觀察（未改，超出指示範圍）：§9 M4 AC-1（spec 約 L1141）也寫 `/users/user-list`，同樣不符合現行 URL。建議 M4 棒開工前一併修正。

## 15、16

- 15：§9 M3 Touches 尾端補記「例外（main 02:33 代 owner 核准）：`vite.config.ts`（test env 的 `VITE_API_BASE_URL`）、`CLAUDE.md`（M3 狀態與路由描述）」。
- 16：`.claude/skills/add-module/SKILL.md` 的「M3 落地前」那條改為「（已過，M3 已落地，`src/modules/` 為現行結構，見下一條）：歷史規則為不建 `src/modules/`，照當時結構寫：…」，只改這一行。

## 破壞性驗證（行為層，vitest 實跑）

| mutant | 結果 | 還原 |
|---|---|---|
| guard 改回 `request.url.startsWith(原始 base)` | `scopes by normalized origin: MOCK-API.test:80 still 404s mock-api.test/nope (C1)` **失敗**；其餘通過 | `cp` 還原，`cmp` 一致（RESTORED_GUARD） |
| 拿掉 bare-origin 拒絕（條件改 `if (false)`） | `cross-origin sub-path`、`cross-origin with query` **2 failed**／24 passed | `cp` 還原，`cmp` 一致（RESTORED_SW） |

兩個 mutant 都在 commit 前操作並還原，commit 內容就是還原後的版本。

## Done Command（最終 HEAD `d685823`，背景執行）

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m3 && pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && test ! -e src/router/routes.tsx && test ! -e src/constants/sidebar.tsx && test "$(grep -o '\.use(' src/app/modules.ts | wc -l | tr -d ' ')" -eq 10 && echo DONE_COMMAND_OK
```

- exit code **0**，有印出 `DONE_COMMAND_OK`
- vitest：Test Files 22 passed，**Tests 216 passed**（M3 原為 211，本棒新增 5 個：start-worker 4、guard 1）
- `src/app/mock` 單獨跑：4 files／26 tests 全部通過（含 C1 回歸案例）

## Lint／Prettier

- `pnpm exec eslint "src/**/*.{ts,tsx}" && echo LINT_OK` → **LINT_OK**
- `prettier --check`：4 支 ts 改動檔通過。`docs/specs/fsd-module-architecture.spec.md`、`.claude/skills/add-module/SKILL.md` 有 warn，但 base `259e4c3` 的同檔用 `prettier --check` 檢查也是 rc=1（既有狀況，非本棒引入）。為維持最小 diff，未重排整份檔案。

## 改動檔案

- `src/app/mock/start-worker.ts`
- `src/app/mock/guard.ts`
- `src/app/mock/__tests__/start-worker.test.ts`
- `src/app/mock/__tests__/guard.test.ts`
- `docs/specs/fsd-module-architecture.spec.md`（4 行）
- `.claude/skills/add-module/SKILL.md`（1 行）

## 已知過渡債（M4／M6，本棒不處理，之後寫進 PR body）

1. 依賴方向過渡違規：`src/shells/default/protected-layout.tsx:5` 直接取 legacy users hook；`src/components/shared/Navbar.tsx:2` 反向依賴 shell（M4 移除角色檢查、M6 搬 pages）。
2. 正式內容區 403 未完成：`protected-layout.tsx` 對非 admin/superadmin 整頁返回 UnauthorizedPage；`forbidden.tsx` 沿用 `h-screen`（M4）。
3. 驗證限制：AC-5 manual（瀏覽器 CRUD、語系、`setupWorker` 下 vite 資源／HMR 不受 guard 影響）仍待 owner 實機驗證；本棒只有 node `getResponse` 層的行為驗證。

## 未驗證

- 瀏覽器 `setupWorker` 實機行為（含以 `MOCK-API.test:80` 這類大寫／帶 port 的 env 實際啟動 dev server）：未驗。原因是本棒只在 node 測試層驗證。

LIFECYCLE_PAUSE: true
