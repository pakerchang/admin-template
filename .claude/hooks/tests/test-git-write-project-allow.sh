#!/usr/bin/env bash
# git-write-project-allow.sh 判定測試（spec AC-1..3）。mktemp repo + git worktree，不碰真 repo。
set -uo pipefail
HOOK="$(cd "$(dirname "$0")/.." && pwd)/git-write-project-allow.sh"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
g() { git -c user.name=t -c user.email=t@t -c init.defaultBranch=master "$@" >/dev/null 2>&1; }
g init "$T/repo" && g -C "$T/repo" commit --allow-empty -m init
g -C "$T/repo" worktree add -b feat/x "$T/wt"
g -C "$T/repo" branch feat/main-co
g init "$T/other" && g -C "$T/other" commit --allow-empty -m init && g -C "$T/other" checkout -b feat/x
mkdir -p "$T/nogit"
W="~/.claude/scripts/cc-git-write.sh"

pass=0; fail=0
run() { # run <expect allow|none> <cwd> <command> [env...]
  local exp="$1" cwd="$2" cmd="$3"; shift 3
  local out; out=$(jq -nc --arg c "$cmd" --arg d "$cwd" '{hook_event_name:"PermissionRequest",tool_name:"Bash",cwd:$d,tool_input:{command:$c}}' \
    | env -u CLAUDE_PROJECT_DIR GIT_WRITE_ALLOW_REPO="$T/repo" "$@" bash "$HOOK")
  local got=none; [[ "$out" == *'"behavior":"allow"'* ]] && got=allow
  if [ "$got" = "$exp" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL [want=${exp} got=${got}] cwd=${cwd#$T/} cmd=$cmd $*"; fi
}

# AC-1 放行（worktree feat/x）
for c in "commit -m feat:x" "commit -m a -m b" "commit -m 'chore(x): a b'" "commit -m \"fix: y z\"" "push -u origin HEAD" "push origin feat/x" "push --force-with-lease" \
         "push origin HEAD:feat/x" "push" "rebase origin/master" "rebase --continue" "rebase --onto origin/master base"; do
  run allow "$T/wt" "$W $c"
done
run allow "$T/wt" "$HOME/.claude/scripts/cc-git-write.sh commit -m x"
# AC-1 主 checkout 的 feature branch
g -C "$T/repo" checkout feat/main-co; run allow "$T/repo" "$W commit -m x"; g -C "$T/repo" checkout master
# D2：未覆寫時由 CLAUDE_PROJECT_DIR 推得（以 worktree 為 project dir 亦同 repo）
run allow "$T/wt" "$W commit -m x" GIT_WRITE_ALLOW_REPO= CLAUDE_PROJECT_DIR="$T/wt"
run allow "$T/wt" "$W commit -m x" GIT_WRITE_ALLOW_REPO= CLAUDE_PROJECT_DIR="$T/repo"

# AC-2 仍確認
for c in "pr-create --title x" "checkout -b y" "merge feat/y" "branch-delete y" \
         "push origin master" "push origin HEAD:master" "push origin +feat/x" "push origin :feat/x" "push -f" "push --force" \
         "push --delete origin feat/x" "push origin refs/heads/master" "push origin a b" "push origin 'feat/x'" \
         "rebase -i origin/master" "rebase --exec true origin/master" "rebase origin/master feat/x" "rebase --onto"; do
  run none "$T/wt" "$W $c"
done
for c in "$W commit -m x && rm -rf /" "$W commit -m x; true" "$W commit -m \$(whoami)" "$W commit -m \`id\`" \
         "$W commit -F - <<EOF" "$W commit -m a | cat" "$W commit -m x"$'\n'"true" "FOO=1 $W commit -m x" \
         "git commit -m x" "/tmp/cc-git-write.sh commit -m x" "$W"; do
  run none "$T/wt" "$c"
done
run none "$T/other" "$W commit -m x"                                           # 別的 repo
run none "$T/nogit" "$W commit -m x"                                           # 非 git cwd
run none "$T/missing" "$W commit -m x"                                         # cwd 不存在
run none "$T/wt" "$W commit -m x" GIT_WRITE_ALLOW_REPO=                        # 覆寫與 CLAUDE_PROJECT_DIR 皆缺
run none "$T/wt" "$W commit -m x" GIT_WRITE_ALLOW_REPO= CLAUDE_PROJECT_DIR="$T/other"
# tool_name 非 Bash
out=$(jq -nc --arg d "$T/wt" --arg c "$W commit -m x" '{tool_name:"Write",cwd:$d,tool_input:{command:$c}}' | GIT_WRITE_ALLOW_REPO="$T/repo" bash "$HOOK")
[ -z "$out" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL non-Bash tool allowed"; }

# AC-3 受保護 branch（主 checkout master；worktree detached）
for c in "commit -m x" "push" "push origin HEAD" "rebase origin/master"; do run none "$T/repo" "$W $c"; done
run none "$T/wt" "$W commit -m x" PROTECTED_BRANCHES="feat/x"
g -C "$T/wt" checkout --detach; run none "$T/wt" "$W commit -m x"

echo "pass=$pass fail=$fail"
[ "$fail" -eq 0 ]
