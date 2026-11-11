1. **critical — 反斜線可繞過 push／rebase 白名單。**  
   `.claude/hooks/git-write-project-allow.sh:18、34–39、48–50`

   `read -r -a` 保留反斜線，Bash 執行時則移除它；hook 檢查的參數與 wrapper 收到的參數不同。以下 PoC **均實測輸出 allow**：

   ```bash
   ~/.claude/scripts/cc-git-write.sh push \--force
   ~/.claude/scripts/cc-git-write.sh push origin \:feat/x
   ~/.claude/scripts/cc-git-write.sh push origin HEAD:ma\ster
   ~/.claude/scripts/cc-git-write.sh rebase \--exec=id
   ~/.claude/scripts/cc-git-write.sh push \--receive-pack=id origin
   ```

   Bash 分別還原為非 lease force push、刪除分支、推到 master、`--exec=id`、`--receive-pack=id`。後兩者引入命令執行能力；實際觸發仍需符合 rebase／transport 的執行條件。wrapper 第 94、100 行原樣轉交 `"$@"`，不會補上白名單檢查。

2. **critical — brace expansion 可推到 master、產生多 refspec，亦可注入 rebase 執行選項。**  
   `.claude/hooks/git-write-project-allow.sh:17–20、37–44、48–52`

   以下 PoC **均實測輸出 allow**：

   ```bash
   ~/.claude/scripts/cc-git-write.sh push origin HEAD:{master,feat/x}
   ~/.claude/scripts/cc-git-write.sh rebase {--exec=id,origin/master}
   ```

   第一條執行時展開成 `push origin HEAD:master HEAD:feat/x`，同時繞過 protected destination 與單一 refspec 限制。第二條展開成 `rebase --exec=id origin/master`，重播 commit 時可執行 `id`。

   問題不必使用 `( )`；目前 D3 禁字不足以保證參數不會經 shell 轉換。

3. **critical — 無 refspec 時，upstream 不能代表 Git 實際推送目的地。**  
   `.claude/hooks/git-write-project-allow.sh:40–44`

   PoC 前提與命令：

   ```text
   Git 設定：remote.origin.push=HEAD:refs/heads/master
   命令：~/.claude/scripts/cc-git-write.sh push origin
   ```

   hook 以 upstream／目前 feature branch 判斷安全，但 Git 使用 remote 的 push refspec，可更新 master。該設定也能指定多個 refspec 或強制更新。

   已透過唯讀的 `GIT_CONFIG_COUNT` 環境設定重現 hook 輸出 allow；未執行 push。應核實實際有效的 push 設定，或將無法確定目的地的命令退回確認。

4. **warning — repo 比對受繼承的 Git 環境影響，未必反映 cwd。**  
   `.claude/hooks/git-write-project-allow.sh:7、22–26`

   PoC：

   ```text
   繼承環境：GIT_DIR=<本 repo 的 absolute git-dir>
   hook input.cwd：/tmp
   命令：~/.claude/scripts/cc-git-write.sh commit -m x
   ```

   **實測輸出 allow**。`git -C` 不會清除 `GIT_DIR`，因此非 repo cwd 仍可通過 D2。

   `GIT_WRITE_ALLOW_REPO` 同樣沒有「僅測試」的執行期限制：繼承該變數即可改變信任的 repo。不過，被審查命令的行內環境前綴會遭拒；目前沒有證據證明真實 session 已遭不當設定。

5. **warning — 測試只比對 hook 回覆，缺少 shell 展開與設定相關案例。**  
   `.claude/hooks/tests/test-git-write-project-allow.sh:15–20、35–45`

   上述反斜線、brace expansion、remote push 設定 PoC 均未覆蓋。因此既有 57 個案例通過，不能證明 AC-2 的安全邊界成立。另測試未強制 fixture 建立成功，也未檢查 hook exit code；異常無輸出可能被負向案例當成成功。

6. **info — tag 推送目前明確會放行，D5 未限制 namespace。**  
   `.claude/hooks/git-write-project-allow.sh:39–44`；`docs/specs/project-git-write-allow.spec.md:14`

   PoC，**實測輸出 allow**：

   ```bash
   ~/.claude/scripts/cc-git-write.sh push origin HEAD:refs/tags/review-poc
   ```

   此行為符合目前 D5 的字面規則；若 owner 意圖只允許 branch，規格與實作都需增加 namespace 限制。

補充審查：未找到單靠 `( )` 啟動額外命令的有效 PoC；tab 本身也未造成切分繞過。commit 參數確實原樣交給 Git，但未確認 `--template` 或 commit 的 `-c` 本身能指定任意執行命令；既有 editor／hooks 設定仍會生效。`.claude/settings.json:5–9` 接線與 D1 一致。

驗證層級：已執行 hook 判定及以 `printf` 驗證 Bash 展開後的 argv；未執行破壞性 Git 操作。唯讀環境下未重跑需建立暫存 repo 的測試，也未寫入 `project-git-allow-codex-verdict.md`；本回覆為完整 verdict。

REVIEW_VERDICT: FAIL
REVIEWED_COMMIT: 75f71bd36bef6cd2b31501fcce004d52f1d5f901
REVIEWER: codex-oob