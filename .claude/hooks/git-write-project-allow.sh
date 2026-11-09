#!/usr/bin/env bash
# PermissionRequest(Bash)：本 repo（主 checkout＋所有 worktree）非受保護 branch 上的
# cc-git-write.sh commit|push|rebase 代按允許；其他一律無輸出 → 對話框照跳（只放不擋、fail-safe）。
# spec：docs/specs/project-git-write-allow.spec.md
set -uo pipefail
DEFAULT_PROTECTED="main master develop dev staging stage uat prd prod production preprod pre-prod qa sit release demo"
REPO="${GIT_WRITE_ALLOW_REPO:-${CLAUDE_PROJECT_DIR:-}}"   # D2：GIT_WRITE_ALLOW_REPO 僅供測試
[ -n "$REPO" ] || exit 0

INPUT=$(cat)
[ "$(jq -r '.tool_name // empty' <<<"$INPUT")" = "Bash" ] || exit 0
CMD=$(jq -r '.tool_input.command // empty' <<<"$INPUT")
CWD=$(jq -r '.cwd // empty' <<<"$INPUT")
[ -n "$CMD" ] && [ -d "$CWD" ] || exit 0
# D3：( ) 不在禁字內——首 token 已鎖定、無 $ / ` / < 時括號只可能是字面或語法錯誤，
# 不能啟動其他指令；保留它才放得了 Conventional Commits 的 `type(scope): …`。
case "$CMD" in *[\;\&\|\`\$\<\>]*|*$'\n'*|*$'\r'*) exit 0 ;; esac
read -r -a TOK <<<"$CMD"
case "${TOK[0]:-}" in "~/.claude/scripts/cc-git-write.sh"|"$HOME/.claude/scripts/cc-git-write.sh") ;; *) exit 0 ;; esac
VERB="${TOK[1]:-}"; ARGS=("${TOK[@]:2}")
is_protected() { local b; for b in ${PROTECTED_BRANCHES:-$DEFAULT_PROTECTED}; do [ "$1" = "$b" ] && return 0; done; return 1; }
common_of() { local d; d=$(git -C "$1" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) && (cd "$d" && pwd -P); }

want=$(common_of "$REPO") || exit 0                                                                # D2
[ "$(common_of "$CWD")" = "$want" ] || exit 0
BRANCH=$(git -C "$CWD" symbolic-ref --short -q HEAD) || exit 0                                   # D4
is_protected "$BRANCH" && exit 0

case "$VERB" in
  commit) ;;                                                                                        # D7
  push)                                                                                             # D5
    case "$CMD" in *[\'\"]*) exit 0 ;; esac
    pos=()
    for a in "${ARGS[@]}"; do case "$a" in
      -u|--set-upstream|--force-with-lease|--force-with-lease=*|--force-if-includes) ;;
      -*) exit 0 ;; *) pos+=("$a") ;; esac; done
    [ "${#pos[@]}" -le 2 ] || exit 0
    if [ "${#pos[@]}" -eq 2 ]; then
      case "${pos[1]}" in +*|:*|*\**) exit 0 ;; esac; dst="${pos[1]##*:}"
    else
      dst=$(git -C "$CWD" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null) && dst="${dst#*/}" || dst="$BRANCH"
    fi
    [ "$dst" = "HEAD" ] && dst="$BRANCH"; dst="${dst#refs/heads/}"
    [ -n "$dst" ] || exit 0; is_protected "$dst" && exit 0 ;;
  rebase)                                                                                           # D6
    case "$CMD" in *[\'\"]*) exit 0 ;; esac
    n=0; skip=false
    for a in "${ARGS[@]}"; do
      if $skip; then skip=false; continue; fi
      case "$a" in --continue|--abort|--skip|--autostash) ;; --onto) skip=true ;; -*) exit 0 ;; *) n=$((n+1)) ;; esac
    done
    $skip && exit 0; [ "$n" -le 1 ] || exit 0 ;;
  *) exit 0 ;;
esac
echo '{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}'
