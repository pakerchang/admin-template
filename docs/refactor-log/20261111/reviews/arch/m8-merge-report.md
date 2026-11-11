# M8 ff-only 併入 refactor/integration — 報告

結果：**DONE**（ff-only 成功，基線 exit 0）

## 前置檢查（整合 worktree `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-integration`）
- `git status --porcelain`：空
- merge 前 `refactor/integration` = `f653b9912405e62fe69da751d8e984081a7b9103`（符合預期）
- `feat/m8-core-only-verification` = `343a449fd14c54a47157de9656f66291e6ef3551`
- `git merge-base --is-ancestor refactor/integration feat/m8-core-only-verification` → 成立（ANCESTOR_OK）

## Merge
指令：`~/.claude/scripts/cc-git-write.sh merge --ff-only feat/m8-core-only-verification`（exit 0）
```
Updating f653b99..343a449
Fast-forward
 CLAUDE.md                                       |   3 +-
 package.json                                    |   3 +-
 scripts/core-only-strip.ts                      |  78 +++++++++++++
 scripts/verify-core-only.sh                     |  80 +++++++++++++
 src/app/__tests__/core-only.test.tsx            |  89 +++++++++++++++
 src/app/__tests__/override.integration.test.tsx | 143 ++++++++++++++++++++++++
 src/app/kernel/__tests__/module-removal.test.ts |  79 +++++++++++++
 7 files changed, 473 insertions(+), 2 deletions(-)
```
- merge 後 `git rev-parse HEAD` = `343a449fd14c54a47157de9656f66291e6ef3551` ✅

## 基線（行為層級：實跑 exit code）
```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-integration && pnpm install --frozen-lockfile && pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" && pnpm build && pnpm exec vitest run && bash scripts/verify-core-only.sh && git diff --quiet && echo DONE_COMMAND_OK
```
（背景執行，外層附 `; echo "EXIT=$?"` 僅回報鏈結 exit code，未改指令本身）
- exit code：**0**；輸出含 `DONE_COMMAND_OK`
- 全量 vitest：**Test Files 41 passed (41) / Tests 354 passed (354)**
- `pnpm build`：✓ built（僅既有 >500kB chunk size warning，非錯誤）
- verify-core-only：
  - domain modules 移除：articles banners consumers orders product suppliers tags
  - `== excluded tests (14 / 32)`：reference domain modules (grep) 7 + full-install assertions (listed) 7
  - `== core-safe tests: 18` → core-only vitest **Test Files 18 passed (18) / Tests 134 passed (134)**
  - 輸出含 `core-only build: OK`
  - 暫存目錄 `/var/folders/.../tmp.nQHh6sxkQ5` 執行後已不存在（已清理）

## Lint
`pnpm exec eslint "src/**/*.{ts,tsx}" && echo LINT_OK` → `LINT_OK`（exit 0）

## 收尾狀態
- `git status --porcelain`：空（`git diff --quiet` 亦於基線鏈中通過）
- `git worktree list`：無本任務新增殘留（verify-core-only 用 tmp 複本而非 worktree；清單僅既有各 milestone/deps worktree，`admin-template-integration` 為 `343a449 [refactor/integration]`）
- `git log --oneline f653b99..HEAD`：
```
343a449 feat(scripts): add verify-core-only for D4 acceptance (M8)
d4c3057 test(app): cover page override by route id and module-removal fail-fast (M8)
```
- 未 push refactor/integration、未開 PR、未改任何檔案內容。

LIFECYCLE_PAUSE: true
