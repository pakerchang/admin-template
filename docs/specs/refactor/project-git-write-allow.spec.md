# 專案層放行 cc-git-write（PermissionRequest hook）

> 出處：owner 裁決 2026-11-10（s15）——admin-template（主 checkout ＋所有 worktree）非受保護 branch 上的 `cc-git-write.sh commit|push|rebase` 自動放行；`pr-create` 與其他 verb 照常確認；master 保護不變。接線放**專案** `.claude/settings.json`，不動 `~/.claude`。
> 機制查證（code.claude.com/docs/en/permissions、/hooks，2026-11-10，s14 報告 §1）：專案 allow 蓋不過全域 ask；PreToolUse 回 allow 也不跳過 ask；唯 `PermissionRequest` hook 回 `decision.behavior:"allow"` 可代按允許（deny 仍優先），並以 `claude -p` 實測確認。

### User Story
As the owner, I want a project-level PermissionRequest hook to auto-approve only an exact allowlist of `cc-git-write.sh commit|push|rebase` shapes when the command runs inside this repo (main checkout or any worktree) on a non-protected branch, so that routine git writes in admin-template chains stop prompting while anything the hook cannot fully predict — other repos, other verbs, protected branches, shell expansion, push config, inherited git env — still prompts.

### 修訂紀錄
- r2（2026-11-10，s19）：codex FAIL（commit 75f71bd：反斜線／brace expansion 讓 hook 看到的 token ≠ wrapper 實際 argv；無 refspec push 受 `remote.*.push` 左右；繼承 `GIT_DIR`／`GIT_WRITE_ALLOW_REPO` 影響 repo 比對；tag 推送放行）→ owner 裁決由黑名單改**嚴格白名單**。原則：判斷不了一律無輸出；誤擋只是多問一次，誤放不可接受。D2/D3/D5/D6/D7 改寫；r2 重審（8318313）中途另指出 `rebase --continue` 未檢查既有 todo 的 `exec`、`GIT_EDITOR` 接受任意值，一併補上（D2、D6）。舊 D5 的 `--force-with-lease`／無 refspec push、D6 的 `--onto`／`--autostash`、D7 的不限參數皆撤銷。

### Load-bearing decisions
- D1 機制＝專案 `.claude/settings.json` 的 `PermissionRequest`（matcher `Bash`）→ `"$CLAUDE_PROJECT_DIR"/.claude/hooks/git-write-project-allow.sh`。hook 只能代按允許：任何不確定 → 無輸出 exit 0 → 對話框照跳（fail-safe＝退回確認）。
- D2 repo 與環境：hook input `cwd` 的 `git-common-dir` 必須等於 `$CLAUDE_PROJECT_DIR` 的 `git-common-dir`（realpath）；涵蓋主 checkout 與所有 worktree。`GIT_WRITE_ALLOW_REPO` 只在 `GIT_WRITE_ALLOW_TEST=1` 時取代 `CLAUDE_PROJECT_DIR`（測試用），否則忽略。環境中存在任何 `GIT_*` 變數（上述兩個測試變數，以及值恰為 `true` 的 `GIT_EDITOR`——Claude Code 預設——除外）→ 不放行（`GIT_EDITOR` 為其他值時 `rebase --continue` 會執行它）：hook 雖可自行 unset，但被放行的指令執行時仍會讀到它們（如 `GIT_DIR`、`GIT_CONFIG_*`），hook 無法預判；三個例外變數 unset 後才做 repo 判定。取不到 repo → 不放行。
- D3 字元白名單 tokenizer：指令必須以 `~/.claude/scripts/cc-git-write.sh ` 或 `$HOME/.claude/scripts/cc-git-write.sh ` 開頭；其後 token 以**單一空白**分隔，每個 token 只允許 `[A-Za-z0-9._/-]`；唯一例外是緊跟 `-m` 的單引號訊息 `'…'`（內容不得含 `'`、`\`；訊息內其他字元如 `$ ( ) ; & | * { }` 皆為字面）。整串含任何控制字元（換行、CR、tab）→ 不放行。此形狀下 bash 只做引號移除、不做任何展開，hook 看到的 token 即 wrapper 收到的 argv。因此 `\`、`{ }`、`* ? [ ]`、`~`、`$`、`` ` ``、`; & | < > ( ) "`、`=`、`:`、`+` 出現在訊息以外一律退回，`refs/…`、tag、`src:dst` refspec 也因形狀不合而退回。
- D4 branch：`symbolic-ref` 取當前 branch，detached 或命中受保護清單（同 cc-git-write.sh DEFAULT_PROTECTED，尊重 `PROTECTED_BRANCHES`）→ 不放行。
- D5 push：只認 `push -u origin <B>` 與 `push origin <B>`，`<B>` 必須**完全等於**當前 branch 名（D4 已保證非受保護）。repo 有效設定（`git config --get-regexp`，含 global／system／worktree）中只要出現 `remote.*.push`、`remote.*.mirror`、`remote.*.receivepack`、`push.recurseSubmodules`、`push.followTags` 非 false、`push.default` 非 `simple|current|upstream` → 不放行（目的地或附帶推送的 ref 無法只看指令判斷）。不帶參數、`HEAD`、`src:dst`、任何 flag 一律退回。
- D6 rebase：只認 `rebase origin/master`、`rebase --continue`、`rebase --abort`、`rebase --skip`；`rebase.updateRefs=true` 時不放行（會移動其他 branch ref）。`--continue`／`--skip` 會接續執行既有 rebase 狀態：`rebase-merge/git-rebase-todo` 只允許 `pick`／`p` 行、註解、空行（含 `exec`、`break`、`edit`、`update-ref` 等任何其他指令或讀檔失敗 → 不放行），且 `rebase-merge/strategy`、`strategy_opts` 存在 → 不放行。`--abort` 不執行 todo，照放。
- D7 commit：只認 `commit` 後接一組以上的 `-m '<msg>'` 或 `-F <path>`（path 合 D3 字元、不得以 `-` 開頭）；其他任何旗標退回。chain 要自動放行 commit 必須用 `-m '…'`（見 TRAPS）。

### Acceptance Criteria
- [ ] AC-1 放行：主 checkout 與 worktree 的 feature branch 上 `commit -m 'feat(x): y'`（訊息含 `$ ( ) ; & |` 等字面）、`commit -m 'a' -m 'b'`、`commit -F msg.txt`、`push -u origin <B>`、`push origin <B>`、`rebase origin/master|--continue|--abort|--skip`；安全 push 設定（`push.default simple`、`push.followTags false`）不影響
- [ ] AC-2 仍確認（無輸出）：codex verdict（75f71bd）全部 PoC——`push \--force`、`push origin \:feat/x`、`push origin HEAD:ma\ster`、`rebase \--exec=id`、`push \--receive-pack=id origin`、`push origin HEAD:{master,feat/x}`、`rebase {--exec=id,origin/master}`、`push origin HEAD:refs/tags/review-poc`、`remote.origin.push=HEAD:refs/heads/master`（設定檔或 `GIT_CONFIG_COUNT`）下的 push、繼承 `GIT_DIR`（cwd 非 repo）、非測試模式的 `GIT_WRITE_ALLOW_REPO`；另含 D5 列舉設定、`rebase.updateRefs`、非白名單形狀（不帶參數 push、`HEAD`、其他 branch、`--force-with-lease`、`-i`、`--onto`、`--autostash`、未加引號／雙引號／含 `'` `\` 換行 tab 的訊息、`--amend`、`--no-verify`、`-F -`、glob、brace、`~`）、`&&` `;` `|` `>` heredoc、env 前綴、雙空白、其他 verb、別的 repo / 非 git / 不存在的 cwd、repo 來源皆缺、非 Bash tool
- [ ] AC-2b rebase 狀態：todo 含 `exec`／`x`／`break`／`edit`／`reword`／`update-ref`／`label`／非 hex sha、或存在 `strategy`／`strategy_opts` → `--continue`／`--skip` 無輸出；只有 pick → 放行；`GIT_EDITOR` 非 `true` → 無輸出
- [ ] AC-3 受保護 branch：master 上 commit / push / rebase、`PROTECTED_BRANCHES` 覆寫、detached → 無輸出
- [ ] AC-4 測試誠實：fixture 建立失敗即測試失敗；每案斷言 hook exit 0；allow 案斷言輸出恰為 allow JSON、none 案斷言輸出為空；以 bash 5 與 macOS `/bin/bash` 3.2 皆通過
- [ ] AC-5 破壞性驗證：逐條放寬規則（token 字元、GIT_* 檢查、remote 設定、測試模式閘、branch 相等、rebase 形狀、`-m` 引號、updateRefs、控制字元、followTags、`-F -`、`GIT_EDITOR` 值、rebase todo 檢查、strategy 檔）時測試轉紅；還原後與原檔 `cmp` 一致
- [ ] AC-6 接線：`.claude/settings.json` 的 `hooks.PermissionRequest[0]` matcher `Bash`、command 指向本 hook；專案 vitest 不受影響

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
