#!/usr/bin/env bash
# PermissionRequest(Bash)：本 repo（主 checkout＋所有 worktree）非受保護 branch 上，
# 符合嚴格白名單的 cc-git-write.sh commit|push|rebase 代按允許；判斷不了一律無輸出
# → 對話框照跳（只放不擋；誤擋只是多問一次，誤放不可接受）。
# spec：docs/specs/project-git-write-allow.spec.md
set -uo pipefail
DEFAULT_PROTECTED="main master develop dev staging stage uat prd prod production preprod pre-prod qa sit release demo"

# D2 環境：覆寫 repo 只在測試模式。git 執行期會讀的 GIT_* 存在 → hook 無法預判實際行為 → 退回
# （GIT_EDITOR 除外：Claude Code 自帶 GIT_EDITOR=true）。其餘一律 unset 後才做 repo 判定。
REPO="${CLAUDE_PROJECT_DIR:-}"
[ "${GIT_WRITE_ALLOW_TEST:-}" = 1 ] && REPO="${GIT_WRITE_ALLOW_REPO:-}"
for v in $(compgen -e); do case "$v" in
  GIT_EDITOR) [ "$GIT_EDITOR" = true ] || exit 0; unset GIT_EDITOR ;;   # rebase --continue 會叫編輯器
  GIT_WRITE_ALLOW_REPO|GIT_WRITE_ALLOW_TEST) unset "$v" ;;
  GIT_*) exit 0 ;;
esac; done
[ -n "$REPO" ] || exit 0

INPUT=$(cat)
[ "$(jq -r '.tool_name // empty' <<<"$INPUT")" = "Bash" ] || exit 0
CMD=$(jq -r '.tool_input.command // empty' <<<"$INPUT")
CWD=$(jq -r '.cwd // empty' <<<"$INPUT")
[ -n "$CMD" ] && [ -d "$CWD" ] || exit 0

# D3 字元白名單 tokenizer：首 token 鎖定 wrapper 路徑；其後 token 以單一空白分隔，
# 只允許 [A-Za-z0-9._/-]；唯一例外是緊跟 `-m` 的單引號訊息（內容不含 ' \ 與控制字元）。
# bash 對這種字串只做引號移除，不做任何展開，所以 hook 看到的 token ＝ wrapper 收到的 argv。
W1="~/.claude/scripts/cc-git-write.sh"; W2="$HOME/.claude/scripts/cc-git-write.sh"
case "$CMD" in *[[:cntrl:]]*) exit 0 ;; esac
case "$CMD" in "$W1 "*) rest="${CMD#"$W1 "}" ;; "$W2 "*) rest="${CMD#"$W2 "}" ;; *) exit 0 ;; esac
PLAIN='^([A-Za-z0-9._/-]+)( |$)'
QUOTED="^'[^'\\\\]*'( |\$)"
MSG="'"   # 訊息 token 的佔位（' 不可能出現在一般 token）
TOK=(); prev=
while [ -n "$rest" ]; do
  if [ "$prev" = "-m" ] && [[ "$rest" =~ $QUOTED ]]; then prev="$MSG"
  elif [[ "$rest" =~ $PLAIN ]]; then prev="${BASH_REMATCH[1]}"
  else exit 0; fi
  TOK+=("$prev"); rest="${rest:${#BASH_REMATCH[0]}}"
done
[ ${#TOK[@]} -gt 0 ] || exit 0
VERB="${TOK[0]}"; ARGS=("${TOK[@]:1}")

is_protected() { local b; for b in ${PROTECTED_BRANCHES:-$DEFAULT_PROTECTED}; do [ "$1" = "$b" ] && return 0; done; return 1; }
common_of() { local d; d=$(git -C "$1" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) && (cd "$d" && pwd -P); }

want=$(common_of "$REPO") || exit 0                                                                # D2
[ "$(common_of "$CWD")" = "$want" ] || exit 0
BRANCH=$(git -C "$CWD" symbolic-ref --short -q HEAD) || exit 0                                   # D4
is_protected "$BRANCH" && exit 0

case "$VERB" in
  commit)                                                                                           # D7：(-m '<msg>' | -F <path>)+
    [ ${#ARGS[@]} -gt 0 ] || exit 0
    for ((i = 0; i < ${#ARGS[@]}; i += 2)); do
      v="${ARGS[$((i+1))]:-}"
      case "${ARGS[$i]}" in
        -m) [ "$v" = "$MSG" ] || exit 0 ;;
        -F) case "$v" in ""|-*|"$MSG") exit 0 ;; esac ;;
        *) exit 0 ;;
      esac
    done ;;
  push)                                                                                             # D5：[-u] origin <當前 branch>
    case "${ARGS[*]-}" in "-u origin $BRANCH"|"origin $BRANCH") ;; *) exit 0 ;; esac
    # 會改變推送目的地／附帶推送其他 ref／執行遠端程式的設定存在 → 無法只看指令判斷 → 退回
    cfg=$(git -C "$CWD" config --get-regexp '^(remote\..*\.(push|mirror|receivepack)|push\.(default|followtags|recursesubmodules))$' 2>/dev/null)
    while read -r k val; do case "$k" in
      "") ;;
      push.default) case "$val" in simple|current|upstream) ;; *) exit 0 ;; esac ;;
      push.followtags) [ "$(git -C "$CWD" config --bool --get push.followtags 2>/dev/null)" = false ] || exit 0 ;;
      *) exit 0 ;;
    esac; done <<<"$cfg" ;;
  rebase)                                                                                           # D6
    case "${ARGS[*]-}" in origin/master|--continue|--abort|--skip) ;; *) exit 0 ;; esac
    [ "$(git -C "$CWD" config --bool --get rebase.updaterefs 2>/dev/null)" = true ] && exit 0
    # --continue/--skip 會執行既有 rebase 狀態：todo 只能剩 pick（無 exec 等），且未指定 merge strategy
    case "${ARGS[0]}" in --continue|--skip)
      d=$(git -C "$CWD" rev-parse --path-format=absolute --git-path rebase-merge 2>/dev/null) || exit 0
      [ -e "$d/strategy" ] || [ -e "$d/strategy_opts" ] && exit 0
      if [ -e "$d/git-rebase-todo" ]; then   # grep rc 1＝沒有非 pick 行；0（有）或 2（讀不了）→ 退回
        grep -Evq '^((pick|p) [0-9a-f]+( .*)?|#.*|[[:space:]]*)$' "$d/git-rebase-todo"; [ $? -eq 1 ] || exit 0
      fi ;;
    esac ;;
  *) exit 0 ;;
esac
echo '{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}'
