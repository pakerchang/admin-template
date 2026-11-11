1. **critical — `$HOME` 前綴未經 shell 字元驗證，可放行任意命令。**  
   [.claude/hooks/git-write-project-allow.sh:29](/Users/pakerchang/Documents/nf_github/sideproject/admin-template-git-allow/.claude/hooks/git-write-project-allow.sh:29)  
   **已實測 hook 與實際 Bash 行為**。繼承環境：
   ```text
   HOME=/usr/bin/true; /usr/bin/id; #
   ```
   提交命令：
   ```bash
   /usr/bin/true; /usr/bin/id; #/.claude/scripts/cc-git-write.sh commit -m 'x'
   ```
   hook exit 0 並輸出 `allow`；Bash 實際執行 `id`，exit 0。第 31 行直接信任 `$HOME` 組出的整段前綴，tokenizer 只驗證其後參數，因此前綴內的 shell 語法通過。應限制可接受的 HOME／完整 executable token，無法證明安全就退回確認。

2. **critical — 既有 `update-refs` 狀態可繞過其他 branch 的保護。**  
   [.claude/hooks/git-write-project-allow.sh:76](/Users/pakerchang/Documents/nf_github/sideproject/admin-template-git-allow/.claude/hooks/git-write-project-allow.sh:76)  
   **靜態確認，未執行 ref 寫入**。輸入：
   ```bash
   ~/.claude/scripts/cc-git-write.sh rebase --continue
   ```
   前提是目前為 feature branch、`rebase.updateRefs` 未設定或為 false、剩餘 todo 只有 pick，但 `rebase-merge/update-refs` 已記錄其他 branch 的 before／after OID，例如 `refs/heads/master`。hook 不檢查此檔，會放行；Git 完成 rebase 時會另外讀它並更新 refs，不需要剩餘 todo 再出現 `update-ref`。這也可能來自先前以 `--update-refs` 啟動、已處理部分 todo 的 rebase。[Git sequencer 原始碼](https://github.com/git/git/blob/master/sequencer.c)  
   至少應拒絕存在 `update-refs` 的狀態，不能只查目前 config。

3. **critical — push 仍可被設定導向其他目的地。**  
   [.claude/hooks/git-write-project-allow.sh:67](/Users/pakerchang/Documents/nf_github/sideproject/admin-template-git-allow/.claude/hooks/git-write-project-allow.sh:67)  
   **已實測唯讀 config harness；未實際 push**。有效設定：
   ```ini
   [remote "origin"]
       pushurl = https://example.invalid/unapproved.git
   ```
   輸入：
   ```bash
   ~/.claude/scripts/cc-git-write.sh push origin chore/project-git-write-allow
   ```
   以 shell function 對 hook 的 Git 查詢統一注入上述 `-c` 設定，hook 仍回 `allow`；相同設定下 `git remote get-url --push --all origin` 回傳上述目的地。這是設定注入測試，不是修改 repo config。

   白名單未涵蓋 `remote.*.pushurl`、URL rewrite；多個 push URL 還會推送至全部目的地。因此 literal `origin` 不足以鎖定實際目的地。[Git 設定文件](https://git-scm.com/docs/git-config#Documentation/git-config.txt-remotenamepushurl)

4. **critical — 未設定 `GIT_EDITOR` 時，任意 editor 仍可通過。**  
   [.claude/hooks/git-write-project-allow.sh:13](/Users/pakerchang/Documents/nf_github/sideproject/admin-template-git-allow/.claude/hooks/git-write-project-allow.sh:13)  
   **靜態確認，未實際執行 editor**。例如環境沒有 `GIT_EDITOR`，有效設定為：
   ```ini
   [core]
       editor = sh -c 'id; true'
   ```
   在衝突解決後需要編輯提交訊息的 rebase 中，輸入 `rebase --continue`，即使剩餘 todo 全為 pick，也可能呼叫此 editor。目前只在環境變數「存在」時驗值；不存在就直接通過，`VISUAL`／`EDITOR` 也未限制。[Git editor 設定文件](https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreeditor)  
   若依賴 Claude 的 `GIT_EDITOR=true` 保證安全，應對相關操作明確要求它存在且值完全相符。

5. **warning — 測試未涵蓋上述繞過，也未驗證恢復 rebase 的實際副作用。**  
   [.claude/hooks/tests/test-git-write-project-allow.sh:73](/Users/pakerchang/Documents/nf_github/sideproject/admin-template-git-allow/.claude/hooks/tests/test-git-write-project-allow.sh:73)  
   **靜態確認**。現有案例建立 todo／strategy 檔並檢查 JSON，沒有建立完整可恢復的 rebase，也沒有驗證完成後其他 refs、editor 或目的地。應補入上述具體輸入，並以完整 fixture 驗證恢復操作的副作用。

唯讀限制下未寫 verdict 檔，也未執行會建立 fixture 的測試套件或 Vitest。`bash -n` exit 0；工作樹保持乾淨。

REVIEW_VERDICT: FAIL
REVIEWED_COMMIT: 17d96e6951510c683b79ddc1b3faba36dd98c43f
REVIEWER: codex-oob