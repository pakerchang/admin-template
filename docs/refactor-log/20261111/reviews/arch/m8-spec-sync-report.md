# M8 spec-sync 報告

spec 已同步成實作現況，以一個只改 md 的 commit ff-only 併入 `refactor/integration`。在整合 worktree 跑 Done Command：exit 0，輸出含 `DONE_COMMAND_OK`。

## 逐條同步表（`docs/specs/fsd-module-architecture.spec.md`，除非另註）

| 來源 | spec 章節 | 改了什麼 |
|---|---|---|
| M4 fix2（§4.2/§4.3/§6.1/§6.5/§9） | §4.2 L329-333、§4.3 L381-383、§6.1 矩陣、§6.5 404 body 列、§9 M4 Touches／紅線 | 逐處確認已在 `2988875` 寫入，和實作一致，**未再改** |
| M5：`rules`→`policies`、比對順序實測 | §7.2 前言 + 程式碼 | 前言改寫成 M5 AC-1 實測結論（policies、elements first-match、policies last-match）；程式碼 `rules:` → `policies:` |
| M5：`LEGACY_PATHS` | §7.2 前言 | 一句註明 M5–M6 過渡、M6 已移除（現況沒有） |
| M5：`no-restricted-imports` 套用範圍、`no-restricted-syntax` | §7.2 程式碼 | `no-restricted-imports` 拆成獨立 block：`src/{app,shared,shells,modules}`、ignore `__tests__`（同時涵蓋 M6 的 `__tests__` 放行）。`no-restricted-syntax` 現況已上線，和原文相同，未改 |
| M5：default shell disallow `MODULE_TYPES` | §7.2 程式碼 | `disallow: { to: MODULE_ENTRY }` → `{ element: { type: MODULE_TYPES } }` |
| M5：Card 未搬 | §5.1 | Card 獨立一列 → `modules/product/ui/components/Card.tsx` |
| M5：kebab-case 檔名、DataTable 主檔 | §5.1 | `shared/ui/{paper,text-inputs,loading-page,edit-actions}.tsx`；`shared/ui/data-table/`（主檔 `data-table.tsx`） |
| M5：upload hook 落點 | §5.1 | 改寫成 `shared/ui/image-upload/image-upload-dialog.tsx` + `shared/api/upload.ts`，hook 不另拆 |
| M5：`fetcher.ts` 形狀 | §5.1 `services/api-client.ts` 列 | 註明 M5–M6 是 `apiFetch` 形狀，M7 改成 mutator，`apiFetch` 移到 `src/test/api-fetch.ts` |
| M5：`jsdom-node-abort.env.ts` 刪除 | §5.1 `test/setup*` 列 | 備註已刪除（Vitest 5 不需要） |
| M6：i18n 拆分範圍 | §5.1 `locales` 列 | 只搬了 en `users.*`；其餘列為已知限制，指向 README |
| M6：`TNavItem.label` 前綴 | §4.1 L252 註解 | 「必須」改成「目標」，現況 `dashboard.menu.*` 列為已知限制 |
| M6：adapter 落點 | §5.1 `services/mock/handlers.ts` 列 | `app/mock/legacy-adapter.ts`（M2–M5）→ `shared/api/mock/legacy-adapter.ts`（M6）→ M7 刪除 |
| M6：Navbar／Breadcrumb 落點 | §3 目錄樹 L180、§5.1 兩列 | 改為 `shared/ui/navbar/{navbar,breadcrumb,use-breadcrumb}`；AppSidebar 維持 `shells/default/app-sidebar.tsx` |
| M6：auth `requires` | §5.2 auth 列 | `—` → `users` |
| M6：`createCollection` 簽名 | §4.5 seed 列 | → `createCollection(seed, idKey, { searchField? })` |
| M6：mocks→同 module model（M7b 也未收回） | §7.2 程式碼；**CLAUDE.md** L60 | policy 加上 `SAME_MODULE("module-model")` 與過渡註解；CLAUDE.md「M7 前」改成「原定 M7 收回，現況未收回」 |
| M6：§9 Touches | §9 M6 Touches | 補列實際另動的檔案：`src/shared/api/**`、`src/shells/**`、`create-app.tsx`（只改 mount）、`CLAUDE.md` |
| M6：AC-5「14 檔」 | §9 M6 AC-5 | 改成「base 實際 33 檔」 |
| M7b DECISION 1：mutator 回 body、不剝 envelope | §4.5 共用型別列、fetcher 列；§5.1 api-client 列 | fetcher 列重寫：`includeHttpResponseReturnType: false`、回 HTTP body、不剝 `ApiEnvelope.data`（列表需要 `total`）、非 2xx throw `ApiError`、hooks 用 `.catch(nullOnApiError)` |
| M7b DECISION 2：手寫 queryKey | §4.5 fetcher 列 | 產物 `get*QueryKey` 是相對 path（AC-4 已驗）；hooks 沿用手寫 key |
| M7b「偏離」：fetcher 沒有 403 toast／401 清 session | §4.5 fetcher 列、§6.5 末段 | 註明未實作（行為紅線），403 由各 hook 原路徑處理 |
| M7b：gen script 加 prettier | §4.5 gen script 列 | 改成 `orval && prettier --write <產物> && pnpm gen:api:extract` |
| M7b：產物 lint 範圍 | §7.2 程式碼 + 產物說明 bullet | 產物只關 `import/order`，其餘規則（含 boundaries）照常檢查 |
| M8：§8.2 漏步驟 2 跑步驟 4 | §8.2 fail fast bullet | 原寫 tsc 會報錯，改為實測 tsc 不報；實際由 vitest `build()` 1.5.3 與 operations-gen 等測試擋下 |
| M8：sidebar 只有 team-members | §8.2 步驟 5；§9 M8 AC-4 | users / team-members → 只有 team-members（users 沒有 nav），`/` → `/team-members` |
| M8：§4.4 覆寫頁只用 index API | §4.4 範例後加註；§9 M8 AC-2 | orders `index.ts` 未 export hook，測試頁直接 import `model/use-order`，列為已知限制 |
| M8 DECISION 1：`FULL_INSTALL_TESTS` 明列清單 | §8.2 自動化段 | 補上 worktree 副本、grep 排除 ∪ `FULL_INSTALL_TESTS`、排除數防呆、排除檔先刪再 build |
| AC checklist | §9 M4–M8 | `[cmd]` 全部標 `[x]`；M4 AC-6、M6 AC-6 標 `[x]`（s29 行為層，owner 未親驗）；M7 AC-7、M8 AC-4 維持 `[ ]` 待驗 |

## 需 main 裁決

無。逐條對過 §0 的鎖定決策，沒有衝突。

## 未處理（超出差異清單，只記錄）

- §4.4 範例寫 `ordersRoutes.build(ctx, …)`，實作是 `ordersRoutes(ctx, …)`。這條不在差異清單內，所以沒改。
- 只有 M4–M8 的 AC 改成 `[x]`；M1–M3 沒動。

## Prettier

`prettier --check docs/specs/fsd-module-architecture.spec.md`：exit 1（`Code style issues found`）。base（`refactor/integration` 原檔）同樣 exit 1，原本就不過，沒有整檔重排。docs worktree 沒有 node_modules，這次用的是整合 worktree 的 prettier binary。

## Git

- commit：`a1ba484e927d73a70d242e3222a8c893fffe5fec` `docs(spec): sync architecture spec with M4–M8 implementation`，作者 pakerchang，沒有 AI trailer
- `git diff --stat refactor/integration..HEAD`（merge 前）：
  ```
   CLAUDE.md                                  |   2 +-
   docs/specs/fsd-module-architecture.spec.md | 123 ++++++++++++++++-------------
   2 files changed, 69 insertions(+), 56 deletions(-)
  ```
- integration tip：merge 前 `343a449fd14c54a47157de9656f66291e6ef3551` → merge 後 `a1ba484e927d73a70d242e3222a8c893fffe5fec`（`merge --ff-only`，Fast-forward）
- `refactor/integration` 沒有 push。
- push：`docs/m8-spec-sync -> origin/docs/m8-spec-sync`（new branch，已設 upstream）
- worktree：`git worktree remove .../admin-template-arch-m8-docs` exit 0（沒加 `--force`）；branch `docs/m8-spec-sync` 保留

## Done Command（整合 worktree，背景執行，等跑完後讀取結果）

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-integration && pnpm install --frozen-lockfile && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run && git diff --quiet && echo DONE_COMMAND_OK
```

- exit code **0**，輸出含 `DONE_COMMAND_OK`
- build `✓ built in 5.13s`；vitest **41 檔 / 354 測試全過**
- 驗證層級：行為層（runtime exit code）。這次只改文件，程式沒有任何改動。

LIFECYCLE_PAUSE: true
