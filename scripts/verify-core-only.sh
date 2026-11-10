#!/usr/bin/env bash
# D4 驗收（spec §8.2、§9 M8 AC-1）：在暫存副本刪掉所有 domain module，確認 core-only 仍能 build、core-safe 測試全綠。
#
#   bash scripts/verify-core-only.sh        # 或 pnpm verify:core-only
#
# - 副本 = `git worktree add --detach <tmp> HEAD`：只驗已 commit 的內容，工作目錄未提交的變更不納入；結束時移除
# - 不修改原工作目錄（只在副本操作）
# - build 全量（被排除的測試檔先從副本刪掉，否則 tsc -b 會因它們 import 已刪 module 失敗）；vitest 只跑 core-safe 測試（main 裁決 2026-11-10）：domain 目錄外、引用 `@/modules/<domain>`
#   或 domain route id 字面值（`"<domain>.…"`）的測試檔排除，另加 FULL_INSTALL_TESTS 明列檔；全部列出。
#   grep 命中為空或排除總數超過一半 → 失敗（防 grep 失效 / 過寬假綠）
set -euo pipefail

REPO=$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)
TMP=$(mktemp -d)
COPY="$TMP/core-only"
cleanup() {
  git -C "$REPO" worktree remove --force "$COPY" >/dev/null 2>&1 || true
  git -C "$REPO" worktree prune
  rm -rf "$TMP"
}
trap cleanup EXIT

echo "== core-only: copy HEAD $(git -C "$REPO" rev-parse --short HEAD) → $COPY"
git -C "$REPO" worktree add --quiet --detach "$COPY" HEAD
cd "$COPY"

# 依賴：pnpm store 已有 lockfile 內全部套件時離線安裝最快；失敗再走一般安裝。HUSKY=0：不動共用 git config
export HUSKY=0
pnpm install --frozen-lockfile --offline --silent ||
  pnpm install --frozen-lockfile --silent

# §8.2 步驟 1–2（domain 名單由 kind: "domain" 讀出）
DOMAINS=$(pnpm exec tsx "$REPO/scripts/core-only-strip.ts" "$COPY")
echo "== domain modules: $(echo $DOMAINS)"
# §8.2 步驟 3–4
for id in $DOMAINS; do rm -rf "src/modules/$id"; done
pnpm gen:api

# core-safe 測試篩選（main 裁決）
ALT=$(echo $DOMAINS | tr ' ' '|')
TESTS=$(find src scripts -type d -name node_modules -prune -o -type f \
  \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.spec.ts' -o -name '*.spec.tsx' \) -print | sort)
GREPPED=$(grep -lE "@/modules/($ALT)([\"'/]|$)|[\"'\`]($ALT)\.[A-Za-z]" $TESTS || true)
# 斷言「完整安裝」的測試：以 URL / 權限字串 / YAML tag 引用 domain，或斷言 module / route 數量，上面的 grep 抓不到。
# 不改這些測試（M8 Must-Not-Touch），在此明列；檔案不存在 → 失敗，避免清單過期。
FULL_INSTALL_TESTS="
src/app/__tests__/permission-structure.test.ts
src/app/__tests__/router-matching.test.ts
src/app/__tests__/write-entry-permissions.test.tsx
src/app/kernel/__tests__/grant-boundary.test.ts
src/app/kernel/__tests__/operations-yaml.test.ts
src/app/mock/__tests__/mock-handlers.test.ts
src/app/router/__tests__/forbidden-boundary.test.tsx
src/app/router/__tests__/index-redirect.test.tsx
src/shared/i18n/__tests__/module-dictionaries.test.ts
"
for f in $FULL_INSTALL_TESTS; do
  [ -f "$f" ] || { echo "core-only: listed full-install test $f does not exist" >&2; exit 1; }
done
EXCLUDED=$(printf '%s\n%s\n' "$GREPPED" "$FULL_INSTALL_TESTS" | sed '/^$/d' | sort -u)
total=$(echo "$TESTS" | sed '/^$/d' | wc -l | tr -d ' ')
grepped=$(echo "$GREPPED" | sed '/^$/d' | wc -l | tr -d ' ')
excluded=$(echo "$EXCLUDED" | wc -l | tr -d ' ')
echo "== excluded tests ($excluded / $total):"
echo "   reference domain modules (grep, $grepped):"
echo "$GREPPED" | sed '/^$/d; s/^/   - /'
echo "   full-install assertions (listed):"
echo "$FULL_INSTALL_TESTS" | sed '/^$/d; s/^/   - /'
echo "== core-safe tests: $((total - excluded))"
if [ "$grepped" -eq 0 ] || [ $((excluded * 2)) -gt "$total" ]; then
  echo "core-only: exclusion guard failed (grep matched $grepped, $excluded of $total excluded; grep must match >0 and total <= half)" >&2
  exit 1
fi

# 排除的測試檔也在 tsc -b 範圍內（tsconfig.app.json 含測試），先從副本刪掉
echo "$EXCLUDED" | sed '/^$/d' | xargs rm -f

# §8.2 步驟 5：build 全量；vitest = 副本內剩下的 core-safe 測試
pnpm build
pnpm exec vitest run

echo "core-only build: OK"
