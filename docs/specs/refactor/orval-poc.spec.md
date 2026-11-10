# admin-template orval + MSW sandbox PoC（api chain a1）

一次性 throwaway PoC。只在 admin-template worktree 的 `poc/orval/` 實驗，結論寫到 chain scratchpad 的 `poc-orval-report.md`。不落產品程式碼。

### User Story

身為 admin-template 的 owner，我要在獨立 sandbox 實測 orval + MSW 整合的四個未驗項（msw 最新 major 相容性、tags-split + zod 目錄結構、zod-openapi bootstrap YAML、operationId → permission 中間格式 + core guard），用實際跑過的指令與 exit code 決定後續整合 milestone 的設計。

### Acceptance Criteria

- [x] AC1：orval 產出 `*.msw.ts`，在 msw/node `setupServer` 下用 vitest 打一次 request 有回應；`overrideResponse` 函式形式能接記憶體狀態。msw 用 `npm view` 查到的最新 major；不相容時記錄錯誤並用 msw 2.x 對照
- [x] AC2：orval 設 `mode: 'tags-split'`、`client: 'react-query'`、`httpClient: 'fetch'`、`mock: true`，zod 另開一個 output target；`find` 輸出的目錄樹貼進報告；`getXQueryOptions` 傳給 `queryClient.ensureQueryData` 能通過 `tsc --noEmit`
- [x] AC3：一次性 script 從 repo `src/services/schemas/`（banners list + create、users list）產出 `poc/orval/openapi.yaml`，內含 tags、operationId、信封（`code/msg/error/data/total`）、403、bearerAuth
- [x] AC4：定義 `operationId → permission` 中間格式；分別示範 module 宣告來源與 YAML `x-permission` 來源；`http.all('*')` guard 只讀中間格式，setupServer 實測 403 與 200（fall through）兩種情境
- [ ] AC5：報告寫到 scratchpad 的 `poc-orval-report.md`，含各項結論、實際指令與 exit code、實測版本、建議、未驗項；commit 到 `poc/api-orval`（不加 AI 署名、不 push）

### Touches

- `/Users/pakerchang/Documents/nf_github/sideproject/admin-template-api-orval-poc/poc/orval/**`（獨立 package.json / lockfile）
- `/private/tmp/claude-501/-Users-pakerchang-Documents-nf-github-sideproject-admin-template/1f12cade-840a-4bc2-a752-4b844e016600/scratchpad/chains/api/poc-orval-report.md`
- 本 spec 檔

### Must-Not-Touch

- worktree 的 root `package.json`、`pnpm-lock.yaml`、`src/**`
- 主 checkout `/Users/pakerchang/Documents/nf_github/sideproject/admin-template`
- `master` branch（不 commit、不 push、不開 PR）

### Done Command

```bash
cd /Users/pakerchang/Documents/nf_github/sideproject/admin-template-api-orval-poc/poc/orval && pnpm exec tsx scripts/bootstrap-openapi.ts && pnpm exec orval && pnpm exec tsx scripts/extract-permissions.ts && pnpm exec tsc --noEmit && pnpm exec vitest run && git -C .. diff --quiet master -- ../package.json ../pnpm-lock.yaml ../src && echo ALL_GREEN
```

expected: ALL_GREEN
