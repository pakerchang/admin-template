# M4 rebase 到 refactor/integration — 報告

結果：**成功**，沒有衝突，5 個 commit 的 exec 全部 exit 0，range-diff 全部 `=`。

## 基本資訊
- worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4`，branch `feat/m4-permission-enforcement`
- 新 head：`acd05c0ff0745b253aa8516fc2da60f99e6c694f`
- 新 base：`3c92e5ab8ec04720cb7d397b2ffc9baaf85635c9`（`refactor/integration` tip；`git fetch origin` 之後仍是 3c92e5a，沒有前進。註：這個分支只在本地，`origin/refactor/integration` 不存在）
- 舊 base／舊 head：`8458b19f7dce8be49c92184596d94e5f6014b3cb` / `66e94c0109cba1dcf5bd6b33616597116472851f`
- rebase 前 worktree 乾淨；rebase 後也乾淨
- 指令：`~/.claude/scripts/cc-git-write.sh rebase --exec 'echo "=== EXEC …" && pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run' refactor/integration` → exit 0，`Successfully rebased and updated refs/heads/feat/m4-permission-enforcement.`

## commit 新舊 sha 對照、作者與 exec 結果
| # | 舊 | 新 | 主旨 | 作者 / committer | exec |
|---|---|---|---|---|---|
| 1 | e84ac78 | 2e535a950e406f8a3b7fffe3b1d2aeb5fd91e901 | docs(spec): use current /users URL in M4 AC-1 | pakerchang / pakerchang | build ✓；vitest 24 files / 229 tests passed |
| 2 | 2ee5073 | 676488629c90c4cdb23c2e8748cc7338204882e1 | feat(permission): fail-closed mock API with session grants | pakerchang / pakerchang | build ✓；vitest 26 / 240 passed |
| 3 | 1205d63 | f9860f2bf448dc1a07737111137607198a74fab5 | feat(permission): content-area 403 and grant-filtered nav | pakerchang / pakerchang | build ✓；vitest 29 / 252 passed |
| 4 | c7b43cb | 87f71c439c3eea5d952409cd18f2e82c37ba39d9 | feat(permission): declarative row actions and form submit | pakerchang / pakerchang | build ✓；vitest 31 / 262 passed |
| 5 | 66e94c0 | acd05c0ff0745b253aa8516fc2da60f99e6c694f | docs: mark M4 permission enforcement done in CLAUDE.md | pakerchang / pakerchang | build ✓；vitest 31 / 262 passed |

作者在 rebase 前後都是 pakerchang，所以不需要 reset-author。

## range-diff（`git range-diff 8458b19..66e94c0 refactor/integration..HEAD`）
```
1:  e84ac78 = 1:  2e535a9 docs(spec): use current /users URL in M4 AC-1
2:  2ee5073 = 2:  6764886 feat(permission): fail-closed mock API with session grants
3:  1205d63 = 3:  f9860f2 feat(permission): content-area 403 and grant-filtered nav
4:  c7b43cb = 4:  87f71c4 feat(permission): declarative row actions and form submit
5:  66e94c0 = 5:  acd05c0 docs: mark M4 permission enforcement done in CLAUDE.md
```
5 個 commit 都是 `=`：內容與舊版相同，只換了 base。逐 commit 跑 build + vitest，沒有抓到和 Zod 4 的語意交互問題。

## Done Command（最終 HEAD acd05c0）
```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-arch-m4 && pnpm install --frozen-lockfile && pnpm build && pnpm exec vitest run && ! grep -rn "useUserPermissions" src && ! grep -rnE "from \"@/(app|shells)/" src/shared/permission && echo DONE_COMMAND_OK
```
- exit code **0**，輸出含 `DONE_COMMAND_OK`
- build ✓（built in 4.68s）；vitest **31 files / 262 tests passed**

## Lint
`pnpm exec eslint "src/**/*.{ts,tsx}" && echo LINT_OK` → exit **0**，`LINT_OK`

## 驗證層級
- 行為層：build + 單元測試，每個 commit 和最終 HEAD 都 exit 0
- 靜態層：eslint
- 沒有驗證：實機 UI（不在本棒範圍）

## Remote
沒有 push。`origin/feat/m4-permission-enforcement` 仍停在 `66e94c0109cba1dcf5bd6b33616597116472851f`（舊 base 上的備份）；要更新到新 head 需要 force push，交由 lead／owner 決定。沒有 merge，也沒有開 PR。

LIFECYCLE_PAUSE: true
