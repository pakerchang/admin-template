#!/usr/bin/env bash
# git-write-project-allow.sh 判定測試（spec AC-1..4）。mktemp repo + git worktree，不碰真 repo。
# 每案斷言 hook exit 0；allow 案斷言輸出恰為 allow JSON；none 案斷言輸出為空。fixture 失敗即整體失敗。
set -uo pipefail
HOOK="$(cd "$(dirname "$0")/.." && pwd)/git-write-project-allow.sh"
[ -f "$HOOK" ] || { echo "FIXTURE_FAIL: hook not found: $HOOK"; exit 1; }
T=$(mktemp -d) || { echo "FIXTURE_FAIL: mktemp"; exit 1; }; trap 'rm -rf "$T"' EXIT
CLEAN=(-u CLAUDE_PROJECT_DIR); for v in $(compgen -e); do case "$v" in GIT_*) CLEAN+=(-u "$v") ;; esac; done
g() { env "${CLEAN[@]}" git -c user.name=t -c user.email=t@t -c init.defaultBranch=master "$@" >/dev/null 2>&1 || { echo "FIXTURE_FAIL: git $*"; exit 1; }; }
g init "$T/repo"; g -C "$T/repo" commit --allow-empty -m init
g -C "$T/repo" worktree add -b feat/x "$T/wt"
g -C "$T/repo" branch feat/main-co; g -C "$T/repo" branch feat/y
g init "$T/other"; g -C "$T/other" commit --allow-empty -m init; g -C "$T/other" checkout -b feat/x
mkdir -p "$T/nogit" || { echo "FIXTURE_FAIL: mkdir"; exit 1; }
W="~/.claude/scripts/cc-git-write.sh"
ALLOW='{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}'

pass=0; fail=0
run() { # run <allow|none> <cwd> <command> [env...]
  local exp="$1" cwd="$2" cmd="$3"; shift 3
  local out rc got
  out=$(jq -nc --arg c "$cmd" --arg d "$cwd" '{hook_event_name:"PermissionRequest",tool_name:"Bash",cwd:$d,tool_input:{command:$c}}' \
    | env "${CLEAN[@]}" GIT_WRITE_ALLOW_TEST=1 GIT_WRITE_ALLOW_REPO="$T/repo" "$@" bash "$HOOK"); rc=$?
  if [ "$rc" -ne 0 ]; then got="exit=$rc"
  elif [ "$out" = "$ALLOW" ]; then got=allow
  elif [ -z "$out" ]; then got=none
  else got="garbage"; fi
  if [ "$got" = "$exp" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL [want=${exp} got=${got}] cwd=${cwd#$T/} cmd=$cmd $*"; fi
}
cfg() { g -C "$T/wt" config "$@"; }

# ── AC-1 放行（worktree feat/x）
for c in "commit -m 'feat(x): y'" "commit -m 'a' -m 'b c'" "commit -m ''" "commit -F msg.txt" "commit -m 'a' -F .git/MSG" \
         "commit -m '中文 (x): \$HOME \`id\` ; && | < > * ? { } [ ] ~ \" ! #'" \
         "push -u origin feat/x" "push origin feat/x" \
         "rebase origin/master" "rebase --continue" "rebase --abort" "rebase --skip"; do
  run allow "$T/wt" "$W $c"
done
run allow "$T/wt" "$HOME/.claude/scripts/cc-git-write.sh commit -m 'x'"
run allow "$T/wt" "$W commit -m 'x'" GIT_EDITOR=true                            # Claude Code 自帶
g -C "$T/repo" checkout feat/main-co
run allow "$T/repo" "$W commit -m 'x'"; run allow "$T/repo" "$W push -u origin feat/main-co"
g -C "$T/repo" checkout master
# D2 非測試模式：由 CLAUDE_PROJECT_DIR 推得（worktree 或主 checkout 為 project dir 皆同 repo）
run allow "$T/wt" "$W commit -m 'x'" GIT_WRITE_ALLOW_TEST= GIT_WRITE_ALLOW_REPO= CLAUDE_PROJECT_DIR="$T/wt"
run allow "$T/wt" "$W commit -m 'x'" GIT_WRITE_ALLOW_TEST= GIT_WRITE_ALLOW_REPO= CLAUDE_PROJECT_DIR="$T/repo"
# 安全的 push 設定不影響放行
cfg push.default simple;   run allow "$T/wt" "$W push origin feat/x"; cfg --unset push.default
cfg push.followTags false; run allow "$T/wt" "$W push origin feat/x"; cfg --unset push.followTags
cfg remote.origin.url git@example.com:x/y.git; cfg remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
run allow "$T/wt" "$W push -u origin feat/x"

# ── AC-2 codex verdict PoC（75f71bd FAIL）逐條
for c in 'push \--force' 'push origin \:feat/x' 'push origin HEAD:ma\ster' 'rebase \--exec=id' 'push \--receive-pack=id origin' \
         'push origin HEAD:{master,feat/x}' 'rebase {--exec=id,origin/master}' 'push origin HEAD:refs/tags/review-poc'; do
  run none "$T/wt" "$W $c"
done
cfg remote.origin.push HEAD:refs/heads/master                                   # finding 3
run none "$T/wt" "$W push origin feat/x"; run none "$T/wt" "$W push -u origin feat/x"; run none "$T/wt" "$W push origin"
cfg --unset remote.origin.push
run none "$T/wt" "$W push origin feat/x" GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=remote.origin.push GIT_CONFIG_VALUE_0=HEAD:refs/heads/master
run none "$T/nogit" "$W commit -m 'x'" GIT_DIR="$T/repo/.git"                   # finding 4
run none "$T/wt" "$W commit -m 'x'" GIT_DIR="$T/repo/.git"
run none "$T/wt" "$W commit -m 'x'" GIT_WORK_TREE="$T/wt"
run none "$T/other" "$W commit -m 'x'" GIT_WRITE_ALLOW_TEST= GIT_WRITE_ALLOW_REPO="$T/other" CLAUDE_PROJECT_DIR="$T/repo"
run none "$T/other" "$W commit -m 'x'" GIT_WRITE_ALLOW_TEST= GIT_WRITE_ALLOW_REPO="$T/other"
run none "$T/wt" "$W commit -m 'x'" GIT_WRITE_ALLOW_TEST=yes                     # 只認字面 1 → REPO 走 CLAUDE_PROJECT_DIR（已清空）
# 其他會改變推送行為的設定
for kv in "remote.origin.mirror true" "push.default matching" "push.default nothing" "push.followTags true" "push.followTags yes" \
          "push.recurseSubmodules on-demand" "remote.origin.receivepack id" "remote.other.push refs/heads/*:refs/heads/master"; do
  set -- $kv; cfg "$1" "$2"; run none "$T/wt" "$W push origin feat/x"; cfg --unset "$1"
done
cfg rebase.updateRefs true; run none "$T/wt" "$W rebase origin/master"; cfg --unset rebase.updateRefs

# ── AC-2 非白名單形狀
for c in "push" "push origin" "push -u origin HEAD" "push origin HEAD" "push origin HEAD:feat/x" "push origin feat/x:feat/x" \
         "push origin feat/y" "push origin master" "push origin refs/heads/feat/x" "push upstream feat/x" "push -u origin feat/x extra" \
         "push --force-with-lease" "push -f origin feat/x" "push --set-upstream origin feat/x" "push origin +feat/x" "push origin :feat/x" \
         "push --delete origin feat/x" "push origin 'feat/x'" "push origin feat/*" "push --tags origin feat/x" "push origin feat/x --follow-tags" \
         "rebase" "rebase -i origin/master" "rebase origin/main" "rebase origin/master feat/x" "rebase --onto origin/master base" \
         "rebase --exec true origin/master" "rebase --autostash origin/master" "rebase --continue --exec=id" \
         "commit" "commit -m x" "commit -m \"x\"" "commit -m'x'" "commit -m 'x'y" "commit -m 'x''y'" "commit -m 'it'\\''s'" "commit -m 'a\\b'" \
         "commit -m 'x' --no-verify" "commit --amend -m 'x'" "commit -a -m 'x'" "commit -m" "commit -m 'x' -m" "commit -F" "commit -F -" \
         "commit -F --amend" "commit -F 'x'" "commit -F *.txt" "commit -F ~/x" "commit -F a{b,c}" "commit -m -m" "commit -m 'x' extra" \
         "commit -m 'x' -F" "commit -m \$'x'" "commit -m \$(id)" "commit -m \`id\`" "commit --template=x -m 'x'" "commit -c x -m 'x'" \
         "pr-create --title x" "checkout -b y" "merge feat/y" "branch-delete y" "COMMIT -m 'x'" ""; do
  run none "$T/wt" "$W $c"
done
for c in "$W commit -m 'x' && rm -rf /" "$W commit -m 'x'; true" "$W commit -m 'x' | cat" "$W commit -m 'x' > f" "$W commit -F - <<EOF" \
         "$W commit -m 'x'"$'\n'"true" "$W commit -m 'a"$'\n'"b'" "$W commit"$'\t'"-m 'x'" "$W commit -m 'a"$'\t'"b'" "$W commit -m 'x'"$'\r' \
         "$W  commit -m 'x'" "$W commit  -m 'x'" " $W commit -m 'x'" "FOO=1 $W commit -m 'x'" "git commit -m 'x'" \
         "/tmp/cc-git-write.sh commit -m 'x'" "~/.claude/scripts/cc-git-write.shx commit -m 'x'" "\\$W commit -m 'x'" "$W" "$W "; do
  run none "$T/wt" "$c"
done
run none "$T/other" "$W commit -m 'x'"                                       # 別的 repo
run none "$T/nogit" "$W commit -m 'x'"                                       # 非 git cwd
run none "$T/missing" "$W commit -m 'x'"                                     # cwd 不存在
run none "$T/wt" "$W commit -m 'x'" GIT_WRITE_ALLOW_REPO=                    # 測試覆寫為空
run none "$T/wt" "$W commit -m 'x'" GIT_WRITE_ALLOW_TEST= GIT_WRITE_ALLOW_REPO=   # 非測試模式且 CLAUDE_PROJECT_DIR 缺
run none "$T/wt" "$W commit -m 'x'" GIT_WRITE_ALLOW_TEST= GIT_WRITE_ALLOW_REPO= CLAUDE_PROJECT_DIR="$T/other"
out=$(jq -nc --arg d "$T/wt" --arg c "$W commit -m 'x'" '{tool_name:"Write",cwd:$d,tool_input:{command:$c}}' \
  | env "${CLEAN[@]}" GIT_WRITE_ALLOW_TEST=1 GIT_WRITE_ALLOW_REPO="$T/repo" bash "$HOOK"); rc=$?
[ "$rc" -eq 0 ] && [ -z "$out" ] && pass=$((pass+1)) || { fail=$((fail+1)); echo "FAIL non-Bash tool rc=$rc out=$out"; }

# ── AC-3 受保護 branch（主 checkout master；PROTECTED_BRANCHES 覆寫；worktree detached）
for c in "commit -m 'x'" "push origin master" "push -u origin master" "rebase origin/master" "rebase --continue"; do run none "$T/repo" "$W $c"; done
run none "$T/wt" "$W commit -m 'x'" PROTECTED_BRANCHES="feat/x"
g -C "$T/wt" checkout --detach; run none "$T/wt" "$W commit -m 'x'"; run none "$T/wt" "$W push origin HEAD"

echo "pass=$pass fail=$fail"
[ "$fail" -eq 0 ] && [ "$pass" -gt 0 ]
