# 專案層放行 cc-git-write（PermissionRequest hook）

> 出處：owner 裁決 2026-11-10（s15）——admin-template（主 checkout ＋所有 worktree）非受保護 branch 上的 `cc-git-write.sh commit|push|rebase` 自動放行；`pr-create` 與其他 verb 照常確認；master 保護不變。接線放**專案** `.claude/settings.json`，不動 `~/.claude`。
> 機制查證（code.claude.com/docs/en/permissions、/hooks，2026-11-10，s14 報告 §1）：專案 allow 蓋不過全域 ask；PreToolUse 回 allow 也不跳過 ask；唯 `PermissionRequest` hook 回 `decision.behavior:"allow"` 可代按允許（deny 仍優先），並以 `claude -p` 實測確認。

### User Story
As the owner, I want a project-level PermissionRequest hook to auto-approve `cc-git-write.sh commit|push|rebase` only when the command runs inside this repo (main checkout or any worktree) on a non-protected branch, so that routine git writes in admin-template chains stop prompting while other repos, other verbs, and protected branches still prompt.

### Load-bearing decisions
- D1 機制＝專案 `.claude/settings.json` 的 `PermissionRequest`（matcher `Bash`）→ `"$CLAUDE_PROJECT_DIR"/.claude/hooks/git-write-project-allow.sh`。hook 只能代按允許：任何不確定 → 無輸出 exit 0 → 對話框照跳（fail-safe＝退回確認）。
- D2 repo 判定：hook input `cwd` 的 `git-common-dir` 必須等於 `$CLAUDE_PROJECT_DIR` 的 `git-common-dir`（realpath）；涵蓋主 checkout 與所有 worktree，cwd 跑到別的 repo 不放行。`GIT_WRITE_ALLOW_REPO`（repo 路徑）可覆寫，僅供測試。兩者都取不到 → 不放行。
- D3 單一簡單指令：首 token 為 `~/.claude/scripts/cc-git-write.sh` 或其絕對路徑；整串不得含 `; & | \` $ < >` 或換行（heredoc／command substitution／process substitution／串接一律回退確認）。`( )` 刻意不禁（偏離 s14 草稿）：首 token 鎖定且無 `$` / `` ` `` / `<` 時，括號只可能是字面或 bash 語法錯誤，無法啟動其他指令；禁掉會讓本 repo `type(scope): …` commit 全數回退確認。
- D4 branch：`symbolic-ref` 取當前 branch，detached 或命中受保護清單（同 cc-git-write.sh DEFAULT_PROTECTED，尊重 `PROTECTED_BRANCHES`）→ 不放行。
- D5 push 白名單：flag 只認 `-u` / `--set-upstream` / `--force-with-lease[=…]` / `--force-if-includes`；最多 remote + 1 refspec；refspec 不得以 `+` / `:` 起頭、不得含 `*`；目標（`src:dst` 取 dst、`HEAD` 取當前、去 `refs/heads/`）不得為受保護 branch；無 refspec 以 upstream（無則當前）判定。含引號 → 不放行。
- D6 rebase 白名單：flag 只認 `--continue` / `--abort` / `--skip` / `--autostash` / `--onto <x>`；positional ≤ 1；含引號 → 不放行。
- D7 commit：除 D3 外不限參數（只落在當前 branch，D4 已擋受保護 branch；cc-git-write.sh 內建 guard 為第二道）。

### Acceptance Criteria
- [ ] AC-1 放行：主 checkout 與 worktree 的 feature branch 上 commit / push（`-u origin HEAD`、`origin feat/x`、`--force-with-lease`、無 refspec）/ rebase（`origin/master`、`--continue`）→ 輸出 allow
- [ ] AC-2 仍確認（無輸出）：pr-create / checkout / merge；別的 repo cwd；`&&`、`;`、`$(...)`、heredoc；push 到 master（`origin master`、`HEAD:master`、`+feat`、`:feat`、`-f`、`--delete`）；rebase `-i` / `--exec` / 兩個 positional；env 前綴；`CLAUDE_PROJECT_DIR` 與覆寫皆缺
- [ ] AC-3 受保護 branch：master 上 commit / push / rebase → 無輸出
- [ ] AC-4 接線：`.claude/settings.json` 的 `hooks.PermissionRequest[0]` matcher `Bash`、command 指向本 hook；專案 vitest 不受影響

### Touches
- `.claude/hooks/git-write-project-allow.sh`（新）
- `.claude/hooks/tests/test-git-write-project-allow.sh`（新）
- `.claude/settings.json`（新）
- `CLAUDE.md`「Git」段、`docs/TRAPS.md`

### Must-Not-Touch
- `~/.claude/**`（含全域 settings、cc-git-write.sh、main-commit-guard）
- `.claude/settings.local.json`

### Done Command
```bash
bash .claude/hooks/tests/test-git-write-project-allow.sh && jq -e '.hooks.PermissionRequest[0].hooks[0].command | endswith("git-write-project-allow.sh")' .claude/settings.json >/dev/null && pnpm exec vitest run && echo DONE_COMMAND_OK
```
expected: DONE_COMMAND_OK
