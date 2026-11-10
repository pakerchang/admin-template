# admin-template deps P3：Vitest 3 → 5

- Repo / worktree：`/Users/pakerchang/Documents/nf_github/sideproject/admin-template-deps-p3-vitest5`
- Branch：`chore/deps-p3-vitest5`，base `origin/master` = `46d13b62f6164f6fea4163208d012e1b97c3580a`
- 依據：deps-upgrade-report §5.4；https://vitest.dev/guide/migration（v5）、https://v4.vitest.dev/guide/migration（v4）、jest-dom v7.0.0 release notes

### User Story

身為 admin-template 維護者，我要在 FSD 重構推進前把測試 runner 升到 Vitest 5（連同 coverage-v8、jsdom、jest-dom 7），並移除殘留的 `@types/jest`，讓後續 milestone 都在新版 runner 下跑，不必在重構途中換 runner。

### Acceptance Criteria

- [x] AC1 `vitest` 與 `@vitest/coverage-v8` 升到同一個最新穩定 5.x 版本；coverage-v8 維持 exact pin
- [x] AC2 `jsdom` 升到最新穩定版；`@testing-library/jest-dom` 升到 7.x；補上必要 peer `@testing-library/dom`（10.x）
- [x] AC3 移除 `@types/jest`；`src/` 不再依賴 `jest.Matchers` 型別
- [x] AC4 jest-dom matcher 型別改由 `@testing-library/jest-dom/vitest` 提供；`vite.config.ts` 的型別參照改為 `/// <reference types="vitest/config" />`
- [x] AC5 升級前後 `pnpm exec vitest run` 的 files / tests 數相同（baseline 16 files / 179 tests），全部通過，無 skip、無刪測試
- [x] AC6 `vitest run --coverage` exit 0 並產出 coverage 報告
- [x] AC7 build、eslint（`--max-warnings 0`）、prettier check 全綠
- [x] AC8 單一 commit `chore(deps): upgrade to Vitest 5 and jest-dom 7`，無 AI 署名，不 push、不開 PR

### Touches

- `package.json`
- `pnpm-lock.yaml`
- `vite.config.ts`
- `src/test/setup.ts`
- `src/test/setup-test-env.d.ts`（刪除：唯一內容是 `jest.Matchers` 擴充，改由 setup.ts 的 `@testing-library/jest-dom/vitest` 提供）
- `tsconfig.test.json`（移除對上述已刪檔的 include 項）

### Must-Not-Touch

- `src/shared/**`、`src/app/**` 的源碼與測試（arch M1 產物）
- 其他任何 `src/**` 源碼與測試檔
- msw 版本與 mock 相關檔案（arch M2 範圍）
- 其他依賴版本（本棒只動 AC1–AC3 列出的套件）

### Done Command

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-deps-p3-vitest5 && \
pnpm build && \
pnpm exec vitest run && \
pnpm exec vitest run --coverage && \
pnpm exec eslint "src/**/*.{js,jsx,ts,tsx}" vite.config.ts --max-warnings 0 && \
pnpm exec prettier --check "src/**/*.{js,jsx,ts,tsx,json,css,md}" && \
echo DONE_COMMAND_OK
```

expected: exit 0；兩次 vitest 皆 `Test Files 16 passed (16)` / `Tests 179 passed (179)`；eslint 0 problems；prettier `All matched files use Prettier code style!`；最後一行 `DONE_COMMAND_OK`
